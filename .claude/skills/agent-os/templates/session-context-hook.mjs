#!/usr/bin/env node
// SessionStart hook — auto-injects the current {{PROJECT_NAME}} state into every session,
// on any machine (reads the git-synced repo). Output goes to the session context.
// Sources of truth: {{STATE_DOC}} (what's next) · {{HANDOFF_LOG}} (last handoff) · CLAUDE.md (full reading-list + rules).
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // .claude/scripts -> repo root

const read = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

// {{HANDOFF_LOG}}: keep only the top entry (up to the 2nd "## " heading)
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

// repo-sync check — THE FIRST thing every session: is local behind the remote?
// {{PROJECT_NAME}} is built across multiple machines (single-branch {{DEFAULT_BRANCH}}, push-after-each-task),
// so a stale local repo = stale context = drift. fetch is non-fatal: offline / no-upstream
// just prints a manual-check note and the rest of the context still gets injected.
let repoSync =
  'ℹ️ בדיקת-ריפו דילגה (offline / אין upstream) — בדוק ידנית: `git fetch && git status`';
try {
  execSync('git fetch --quiet origin', { cwd: root, timeout: 8000, stdio: 'ignore' });
  const counts = execSync('git rev-list --left-right --count HEAD...{{DEFAULT_BRANCH}}', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const [, behind] = counts.split(/\s+/).map(Number);
  repoSync =
    behind > 0
      ? `⚠️ **ריפו לא-מסונכרן — אתה מאחור ב-${behind} commits!**\n> **הפעולה-הראשונה לפני כל עבודה:** \`git pull\` · ייתכן שנעשו דברים ממחשב אחר.`
      : '✅ ריפו מסונכרן מול הרימוט (up-to-date).';
} catch {
  /* keep the offline note above */
}

const planning = read('{{STATE_DOC}}') ?? '({{STATE_DOC}} missing)';
const sessionLog = topEntry(read('{{HANDOFF_LOG}}'));
const todo = read('{{TODO_MASTER}}') ?? '({{TODO_MASTER}} missing — create it)';

process.stdout.write(
  `# ⚡ {{PROJECT_NAME}} — אוטו-הקשר (SessionStart hook) · קרא לפני עבודה

> מקורות-אמת (git-synced): {{STATE_DOC}} = מה הלאה · {{HANDOFF_LOG}} = handoff אחרון · CLAUDE.md = reading-list מלא + כללים מוחלטים.
> אם נדרשת תמונה מלאה — קרא גם: {{TEAMS_DIR}} · {{COMMS_DIR}} · docs/architecture/ADR-*.

## 🔄 סנכרון-ריפו (צעד-0 — לפני כל עבודה)
${repoSync}

## ✅ {{TODO_MASTER}} — רשימת-המשימות החיה (מקור-אמת)
${todo}

## 📋 {{STATE_DOC}} — מה הלאה
${planning}

## 📓 {{HANDOFF_LOG}} — רשומה אחרונה
${sessionLog}

## 🔖 git log (8 אחרונים)
${gitLog}
`,
);
