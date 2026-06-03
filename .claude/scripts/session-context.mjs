#!/usr/bin/env node
// SessionStart hook — auto-injects the current StudiBuilder state into every session,
// on any machine (reads the git-synced repo). Output goes to the session context.
// Sources of truth: PLANNING-STATE (what's next) · SESSION-LOG (last handoff) · CLAUDE.md (full reading-list + rules).
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // .claude/scripts -> repo root

const read = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

// SESSION-LOG: keep only the top entry (up to the 2nd "## " heading)
const topEntry = (text) => {
  if (!text) return '(missing)';
  const out = [];
  let headers = 0;
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      if (++headers === 2) break;
    }
    out.push(line);
  }
  return out.join('\n').trim();
};

let gitLog = '(git log unavailable)';
try {
  gitLog = execSync('git log --oneline -8', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  /* ignore */
}

// repo-sync check — THE FIRST thing every session: is local behind origin?
// StudiBuilder is built across multiple machines (single-branch main, push-after-each-task),
// so a stale local repo = stale context = drift. fetch is non-fatal: offline / no-upstream
// just prints a manual-check note and the rest of the context still gets injected.
let repoSync =
  'ℹ️ בדיקת-ריפו דילגה (offline / אין upstream) — בדוק ידנית: `git fetch && git status`';
try {
  execSync('git fetch --quiet origin', { cwd: root, timeout: 8000, stdio: 'ignore' });
  const counts = execSync('git rev-list --left-right --count HEAD...origin/main', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const [, behind] = counts.split(/\s+/).map(Number);
  repoSync =
    behind > 0
      ? `⚠️ **ריפו לא-מסונכרן — אתה מאחור ב-${behind} commits!**\n> **הפעולה-הראשונה לפני כל עבודה:** \`git pull\` · ייתכן שנעשו דברים ממחשב אחר.`
      : '✅ ריפו מסונכרן מול origin (up-to-date).';
} catch {
  /* keep the offline note above */
}

const planning = read('docs/context/PLANNING-STATE.md') ?? '(docs/context/PLANNING-STATE.md missing)';
const sessionLog = topEntry(read('docs/context/SESSION-LOG.md'));
const todo = read('TODO.md') ?? '(TODO.md missing — create it)';

// רענון אינדקס-ה-MD (חכם, תמיד-מעודכן) בכל פתיחת-סשן — עצמאי מ-git-hooks (non-fatal).
try {
  execSync('node .claude/scripts/gen-md-index.mjs', { cwd: root, stdio: 'ignore', timeout: 20000 });
} catch {
  /* offline / error — האינדקס נשאר כפי שחולל לאחרונה */
}

process.stdout.write(
  `# ⚡ StudiBuilder — אוטו-הקשר (SessionStart hook) · קרא לפני עבודה

> מקורות-אמת (git-synced): PLANNING-STATE = מה הלאה · SESSION-LOG = handoff אחרון · CLAUDE.md = reading-list מלא + כללים מוחלטים.
> אם נדרשת תמונה מלאה — קרא גם: PROJECT-MAP · STATUS · courses/safety-officer/ · docs/architecture/ADR-* · teams/.
> 🗂️ **אינדקס-הכל:** \`docs/context/MD-INDEX.md\` — ניווט-מהיר לכל מסמך בריפו (מחולל-אוטומטית; רוענן עכשיו). שלוף ממנו את הרלוונטיים.

## 🔄 סנכרון-ריפו (צעד-0 — לפני כל עבודה)
${repoSync}

## ✅ TODO — רשימת-המשימות החיה (מקור-אמת)
${todo}

## 📋 PLANNING-STATE — מה הלאה
${planning}

## 📓 SESSION-LOG — רשומה אחרונה
${sessionLog}

## 🔖 git log (8 אחרונים)
${gitLog}
`,
);
