#!/usr/bin/env node
// gen-md-index.mjs — מחולל אינדקס-MD חכם, אוטומטי ותמיד-מעודכן.
// סורק את כל קבצי-ה-Markdown בריפו, מחלץ כותרת+תכלית+תגיות+עדכון-אחרון,
// ומייצר docs/context/MD-INDEX.md עם ניווט-מהיר פר-נושא + טבלאות פר-קטגוריה.
// מקור-אמת יחיד לשליפה-מהירה. נקרא ידנית (`pnpm index:md`) ואוטומטית (pre-commit hook).
//
// עיצוב-דטרמיניסטי: אותו תוכן-ריפו → אותו פלט (ללא חותמת-זמן משתנה) → רענון = no-op כשאין שינוי.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // .claude/scripts -> repo root
const OUT_REL = 'docs/context/MD-INDEX.md';

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.cache', 'logs', '.vercel', '.turbo',
]);

// 1) איסוף כל קבצי-ה-MD
function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) acc.push(full);
  }
  return acc;
}

// 2) תאריך-עדכון-אחרון פר-קובץ — מעבר-git יחיד (יעיל)
const dates = new Map();
try {
  const log = execSync('git log --pretty=format:%x00%ad --date=short --name-only', {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  let curDate = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('\x00')) curDate = line.slice(1).trim();
    else if (line.trim() && curDate) {
      const p = line.trim();
      if (!dates.has(p)) dates.set(p, curDate); // הופעה-ראשונה (log reverse-chron) = העדכון האחרון
    }
  }
} catch {
  /* offline / no-git — נשאיר '—' */
}

// 2b) קבוצת הקבצים העקובים ב-git (כולל staged) — להבחנה מיתומים-מקומיים
const tracked = new Set();
try {
  const ls = execSync('git ls-files', { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  for (const l of ls.split('\n')) {
    const p = l.trim();
    if (p) tracked.add(p);
  }
} catch {
  /* no-git — נתייחס להכל כ"בריפו" כדי לא לזהם באזהרות-שווא */
}

// 3) חילוץ מטא-דאטה פר-קובץ
const clean = (s) =>
  s
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function meta(full) {
  const rel = relative(root, full).split(sep).join('/');
  let title = '';
  let purpose = '';
  let fmName = '';
  let fmDesc = '';
  try {
    const raw = readFileSync(full, 'utf8');
    // נרמול: הסרת BOM + CRLF→LF (קבצים ישנים הם CRLF, וה-\r שובר את regex ה-frontmatter)
    const lines = (raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).replace(/\r/g, '').split('\n');
    let i = 0;
    // YAML frontmatter (קבצי-סוכנים: name/description) — מקור-תכלית מצוין
    if (lines[0] && lines[0].trim() === '---') {
      for (i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          i++;
          break;
        }
        const m = lines[i].match(/^(name|description):\s*(.+)$/);
        if (m) {
          if (m[1] === 'name') fmName = m[2].trim();
          else fmDesc = m[2].trim();
        }
      }
    }
    for (; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!title) {
        if (l.startsWith('# ')) title = clean(l.slice(2));
        continue;
      }
      // אחרי הכותרת — שורת-התכלית (blockquote או פסקה; מדלג על הערות-HTML/טבלאות)
      if (l.startsWith('>')) {
        const p = clean(l.replace(/^>+/, ''));
        if (p) {
          purpose = p;
          break;
        }
      } else if (l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|') && !l.startsWith('<!--')) {
        purpose = clean(l);
        break;
      }
    }
  } catch {
    /* unreadable */
  }
  if (!title) title = clean(fmName) || rel.split('/').pop();
  if (!purpose) purpose = clean(fmDesc);
  if (!purpose) purpose = '—';
  if (purpose.length > 110) purpose = purpose.slice(0, 109) + '…';

  // תגיות — מקטעי-נתיב משמעותיים + שנה (לשליפה ב-grep)
  const segs = rel.split('/').slice(0, -1);
  const year = (rel.match(/\b(19|20)\d{2}\b/) || [])[0];
  const tags = [...new Set([...segs.slice(-3), year].filter(Boolean))].join(' ');

  return { rel, title, purpose: purpose || '—', tags, date: dates.get(rel) || '—' };
}

// 4) קטגוריזציה (סדר ה-if קובע קדימות)
function category(rel) {
  if (!rel.includes('/')) return ['00', '🏠 שורש — קריאת-בסיס'];
  if (rel.startsWith('docs/context/')) return ['10', '🧭 הקשר-חי — docs/context'];
  if (rel.startsWith('docs/todo/')) return ['11', '✅ TODO פר-שלב — docs/todo'];
  if (rel.startsWith('docs/architecture/')) return ['12', '🏛️ ארכיטקטורה — ADR (docs/architecture)'];
  if (rel.startsWith('docs/screens-spec/') || rel.startsWith('docs/screens/') || rel.startsWith('docs/design/'))
    return ['13', '🖼️ עיצוב ומסכים — screens-spec · design · screens'];
  if (rel.startsWith('docs/sources/studiesgo')) return ['14', '🎬 StudiesGo — מקור-עיצוב'];
  if (rel.startsWith('docs/compliance/')) return ['15', '⚖️ ציות — docs/compliance'];
  if (rel.startsWith('docs/sources/')) return ['16', '📂 מקורות — docs/sources'];
  if (rel.startsWith('docs/')) return ['17', '📄 docs — כללי'];
  if (rel.startsWith('courses/') && rel.includes('/legislation/')) return ['20', '⚖️ קורפוס-חקיקה (נבו verbatim)'];
  if (rel.startsWith('courses/')) return ['21', '🎓 קורס safety-officer'];
  if (rel.startsWith('teams/oversight/')) return ['31', '🛡️ ענף-בקרה — teams/oversight'];
  if (rel.startsWith('teams/')) return ['30', '🤖 ממשל-סוכנים — teams'];
  if (rel.startsWith('.claude/')) return ['32', '⚙️ .claude — agents · skills · scripts'];
  if (rel.startsWith('comms/')) return ['33', '💬 comms — תקשורת בין-סוכנית'];
  if (rel.startsWith('src/') || rel.startsWith('scripts/')) return ['40', '🔧 src · scripts'];
  return ['90', '📦 אחר'];
}

// 5) ניווט-מהיר פר-נושא (קוּרְצִיה ידנית; מסונן לפי-קיום)
const NAV = [
  ['🚪 קריאת-בסיס (התחל כאן)', ['CLAUDE.md', 'AGENTS.md', 'USER.md', 'docs/context/PROJECT-MAP.md', 'docs/context/STATUS.md', 'TODO.md']],
  ['🧭 מצב · הקשר · החלטות', ['docs/context/SESSION-LOG.md', 'docs/context/EXECUTION-PLAN.md', 'docs/context/DECISIONS.md', 'docs/context/PROJECTS.md', 'docs/context/GOVERNANCE-V2.md', 'docs/context/MOTI-INBOX.md']],
  ['⚖️ חקיקה ו-scope', ['courses/safety-officer/sources/legislation/INDEX.md', 'courses/safety-officer/LEGISLATION-COVERAGE.md', 'docs/content-scope.md', 'docs/CONTENT-INDEX.md']],
  ['🎓 הקורס (safety-officer)', ['courses/safety-officer/curriculum-atgar.md', 'courses/safety-officer/MOLSA-PROGRAM.md', 'courses/safety-officer/COURSE-DESIGN.md', 'courses/safety-officer/FINAL-PROJECT.md', 'courses/safety-officer/REGULATORY-WATCH.md']],
  ['🖼️ עיצוב / StudiesGo', ['docs/sources/studiesgo-videos/README.md', 'docs/design/motion-specs.md', 'docs/design/mascot-brief.md', 'docs/sitemap.md', 'docs/screens/raw-frames/README.md']],
  ['🤖 ממשל-סוכנים', ['teams/ORG.md', 'teams/README.md', 'teams/PROJECT-CONTEXT.md', 'teams/HOWTO-add-agent.md', 'teams/oversight/TEAM.md', 'teams/oversight/_oversight-protocol.md']],
];

// 5b) קבצי-חובה נעוצים — חייבים מעבר בכל סשן (קוּרְציה ידנית, מסונן לפי-קיום)
const PINNED = [
  ['CLAUDE.md', 'אילוצים-קשיחים · stack · עקרונות · reading-list'],
  ['AGENTS.md', 'חוקי-על קנוניים חוצי-כלים'],
  ['USER.md', 'פרופיל motilev8 + העדפות-עבודה'],
  ['docs/context/PROJECT-MAP.md', 'דלת-כניסה אוצרת לכל ההקשר'],
  ['docs/context/STATUS.md', 'איפה אנחנו — phase · עובד · חסום'],
  ['docs/context/EXECUTION-PLAN.md', 'התוכנית end-to-end'],
  ['TODO.md', 'מקור-אמת למשימות (A–I + ממשל-v2)'],
  ['docs/context/SESSION-LOG.md', 'handoff אחרון + הצעד-הבא'],
  ['docs/context/MOTI-INBOX.md', 'הערות-מוטי אליי — לקרוא בצעד-0'],
  ['docs/context/DECISIONS.md', 'לוג-החלטות-מפתח'],
  ['docs/context/PROJECTS.md', 'StudiBuilder מול מגן — לא להתבלבל'],
];

// 6) בנייה — הפרדת קבצים-בריפו מיתומים-מקומיים
const allFiles = walk(root)
  .map(meta)
  .sort((a, b) => a.rel.localeCompare(b.rel));
// "בריפו" = עקוב ב-git; ה-OUT עצמו נחשב-בריפו (הוא התוצר). no-git → tracked ריק → הכל "בריפו".
const inRepo = tracked.size ? allFiles.filter((f) => tracked.has(f.rel) || f.rel === OUT_REL) : allFiles;
const orphans = tracked.size ? allFiles.filter((f) => !tracked.has(f.rel) && f.rel !== OUT_REL) : [];
const files = inRepo;

const buckets = new Map();
for (const f of files) {
  const [key, label] = category(f.rel);
  if (!buckets.has(key)) buckets.set(key, { label, rows: [] });
  buckets.get(key).rows.push(f);
}

const out = [];
out.push('# 🗂️ MD-INDEX — אינדקס כל מסמכי-ה-Markdown (מחולל-אוטומטית)');
out.push('');
out.push('> ⚠️ **קובץ מחולל — אל תערוך ידנית.** מקור: `.claude/scripts/gen-md-index.mjs` · רענון: `pnpm index:md`');
out.push('> (מתרענן גם אוטומטית ב-pre-commit). דלת-הכניסה לשליפה-מהירה של כל מסמך בריפו.');
out.push(
  `> **סה״כ ${files.length} קבצי-MD בריפו**${orphans.length ? ` · ⚠️ ${orphans.length} יתומים-מקומיים (ראה תחתית)` : ''} · עמודת "עודכן" = מתי הקובץ עודכן לאחרונה ב-git (לאיתור מסמכים שהתיישנו).`,
);
out.push('');
out.push('## 📌 קבצי-חובה — קרא/עבור עליהם בכל סשן (נעוץ)');
out.push('');
out.push('> אלה הקבצים הקריטיים. **אל תתחיל עבודה לפני שעברת עליהם** (בסדר-הקריאה המומלץ).');
out.push('');
out.push('| # | קובץ-חובה | למה חשוב | עודכן |');
out.push('| --- | --- | --- | --- |');
let pinIdx = 1;
for (const [p, why] of PINNED) {
  if (!existsSync(join(root, p))) continue;
  out.push(`| ${pinIdx++} | [${p}](../../${p}) | ${why} | ${dates.get(p) || '—'} |`);
}
out.push('');
out.push('---');
out.push('');
out.push('## 🚀 ניווט-מהיר — "מחפש X → קובץ Y"');
out.push('');
for (const [topic, paths] of NAV) {
  const live = paths.filter((p) => existsSync(join(root, p)));
  if (!live.length) continue;
  const links = live.map((p) => `[${p.split('/').pop()}](../../${p})`).join(' · ');
  out.push(`- **${topic}:** ${links}`);
}
out.push('');
out.push('---');
out.push('');

const orderedKeys = [...buckets.keys()].sort();
out.push('## 📚 לפי-קטגוריה');
out.push('');
out.push(orderedKeys.map((k) => `[${buckets.get(k).label}](#${slug(buckets.get(k).label)})`).join(' · '));
out.push('');

for (const key of orderedKeys) {
  const { label, rows } = buckets.get(key);
  out.push(`### ${label}  ·  ${rows.length}`);
  out.push('');
  out.push('| קובץ | תכלית | תגיות | עודכן |');
  out.push('| --- | --- | --- | --- |');
  for (const r of rows) {
    const name = r.rel.split('/').pop();
    out.push(`| [${name}](../../${r.rel}) | ${escapeCell(r.purpose)} | ${escapeCell(r.tags)} | ${r.date} |`);
  }
  out.push('');
}

// 7) סעיף יתומים-מקומיים — קבצים על הדיסק שאינם בריפו (לאיתור cruft)
out.push('---');
out.push('');
out.push('## ⚠️ יתומים מקומיים — קבצים על הדיסק שאינם בריפו');
out.push('');
if (!orphans.length) {
  out.push('> ✅ אין קבצי-MD יתומים — כל מסמך מקומי נמצא ב-git.');
} else {
  out.push('> קיימים מקומית אך **אינם ב-git** (untracked / .gitignore). מיושן → מחק; רלוונטי → הוסף לריפו. בדוק מול מצב-הפרויקט.');
  out.push('');
  out.push('| קובץ | תאריך-דיסק | סטטוס |');
  out.push('| --- | --- | --- |');
  for (const o of orphans) {
    let d = '—';
    try {
      d = statSync(join(root, o.rel)).mtime.toISOString().slice(0, 10);
    } catch {
      /* unreadable */
    }
    out.push(`| ${escapeCell(o.rel)} | ${d} | ⚠️ לא-בריפו — לבדיקה |`);
  }
}
out.push('');

function escapeCell(s) {
  return s.replace(/\|/g, '\\|');
}
function slug(label) {
  // קירוב ל-anchor של GitHub: lowercase, רווחים→מקפים, הסרת תווים מיוחדים (שומר עברית/אותיות).
  return label
    .toLowerCase()
    .replace(/[·.()]/g, '')
    .replace(/[/]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

writeFileSync(join(root, OUT_REL), out.join('\n') + '\n', 'utf8');
process.stdout.write(`✅ MD-INDEX: ${files.length} קבצים · ${orderedKeys.length} קטגוריות → ${OUT_REL}\n`);
