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

const planning = read('docs/context/PLANNING-STATE.md') ?? '(docs/context/PLANNING-STATE.md missing)';
const sessionLog = topEntry(read('docs/context/SESSION-LOG.md'));
const todo = read('TODO.md') ?? '(TODO.md missing — create it)';

process.stdout.write(
  `# ⚡ StudiBuilder — אוטו-הקשר (SessionStart hook) · קרא לפני עבודה

> מקורות-אמת (git-synced): PLANNING-STATE = מה הלאה · SESSION-LOG = handoff אחרון · CLAUDE.md = reading-list מלא + כללים מוחלטים.
> אם נדרשת תמונה מלאה — קרא גם: PROJECT-MAP · STATUS · courses/safety-officer/ · docs/architecture/ADR-* · teams/.

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
