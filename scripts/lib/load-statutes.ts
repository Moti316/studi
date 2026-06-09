/**
 * scripts/lib/load-statutes.ts — טעינת נוסחי-החקיקה (42 .md) כ-StatuteSource[].
 *
 * מקור-אמת משותף ל-generate-questions.ts (Gemini) ו-generate-questions-nblm.ts
 * (NotebookLM) — אפס-שכפול. קורא frontmatter (scope_id/title/depth) + גוף-הנוסח.
 *
 * ⚠️ סקריפט בלבד (fs) — לא לייבא לאפליקציה.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { StatuteSource } from '../../src/lib/import/generated-mcq';

export const LEGI_DIR = join(process.cwd(), 'courses', 'safety-officer', 'sources', 'legislation');
const SKIP_FILES = new Set(['README.md', 'INDEX.md']);

/** מפריד frontmatter-YAML (key: value) מהגוף. */
export function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of (m[1] ?? '').split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv && kv[1]) fm[kv[1]] = (kv[2] ?? '').replace(/^['"]|['"]$/g, '').trim();
  }
  return { fm, body: (m[2] ?? '').trim() };
}

function* walkMd(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.name.endsWith('.md') && !SKIP_FILES.has(e.name)) yield p;
  }
}

/** טוען את כל נוסחי-החקיקה (עם frontmatter תקין) ממוינים לפי scope. */
export function loadStatutes(): StatuteSource[] {
  const out: StatuteSource[] = [];
  for (const path of walkMd(LEGI_DIR)) {
    const { fm, body } = parseFrontmatter(readFileSync(path, 'utf8'));
    if (!body || !fm.scope_id) continue;
    out.push({
      scopeId: fm.scope_id,
      title: fm.title ?? relative(LEGI_DIR, path).split(sep).join('/'),
      depth: fm.depth,
      body,
      path: relative(process.cwd(), path).split(sep).join('/'),
    });
  }
  return out.sort((a, b) => a.scopeId.localeCompare(b.scopeId, undefined, { numeric: true }));
}
