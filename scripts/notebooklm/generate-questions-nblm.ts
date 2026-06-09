#!/usr/bin/env tsx
/**
 * scripts/notebooklm/generate-questions-nblm.ts — מחולל שאלות רב-סוגיות דרך
 * NotebookLM מקורפוס-החקיקה (מיני-קורס שו"ת). מקביל ל-generate-scenarios.ts.
 *
 * זרימה (פר-נוסח × סוג):
 *   buildCompactQuestionPrompt(statute,{type,n}) → askNotebook (--new --yes · SSL-fix)
 *   → extractFlatMcqs/Matching/Open(stdout) → אגירה → כתיבה ל-cache.
 *
 * flags:
 *   --types mcq,matching,open   סוגים (ברירת-מחדל: שלושתם)
 *   --scope 2.3                 סנן ל-scope (prefix · ברירת-מחדל: הכל)
 *   --per N                     פריטים פר-(נוסח,סוג) (ברירת-מחדל: 3)
 *   --limit N                   עד N נוסחים
 *   --notebook <id>             NOTEBOOK (ברירת-מחדל: c3f2d80a)
 *   --out <name>                שם-פלט (ברירת-מחדל: questions-nblm)
 *
 * ⚠️ אל תריץ — המתאם מריץ אחרי בדיקה. דורש bridge+login (BUGS.md#notebooklm-bridge).
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { loadStatutes } from '../lib/load-statutes';
import { askNotebook } from '../lib/bridge';
import {
  buildCompactQuestionPrompt,
  type QuestionType,
} from '../../src/lib/notebooklm/compact-question-prompt';
import {
  extractFlatMcqs,
  extractFlatMatching,
  extractFlatOpen,
} from '../../src/lib/notebooklm/adapt-flat-questions';

const ROOT = resolve(process.cwd());
const OUTPUT_DIR = join(ROOT, '.cache', 'notebooklm', 'questions');
const REQUESTS_DIR = join(ROOT, '.cache', 'notebooklm', 'requests');
const DEFAULT_NOTEBOOK_ID = 'c3f2d80a-e5f5-4a1c-9c4b-2ae18ebc3dbc';
const THROTTLE_MS = 2500;
const ALL_TYPES: QuestionType[] = ['mcq', 'matching', 'open'];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface CacheItem {
  scopeId: string;
  type: QuestionType;
  items: unknown[];
}

function extractByType(type: QuestionType, stdout: string): unknown[] {
  if (type === 'mcq') return extractFlatMcqs(stdout);
  if (type === 'matching') return extractFlatMatching(stdout);
  return extractFlatOpen(stdout);
}

async function main(): Promise<void> {
  const types = (arg('--types') ?? ALL_TYPES.join(','))
    .split(',')
    .map((t) => t.trim())
    .filter((t): t is QuestionType => (ALL_TYPES as string[]).includes(t));
  const scopeFilter = arg('--scope');
  const per = Math.max(1, Number(arg('--per') ?? 3));
  const limitArg = arg('--limit');
  const limit = limitArg !== undefined ? Math.max(1, Number(limitArg)) : undefined;
  const notebookId = arg('--notebook') ?? process.env['NBLM_NOTEBOOK_ID'] ?? DEFAULT_NOTEBOOK_ID;
  const outName = arg('--out') ?? 'questions-nblm';
  const outputFile = join(OUTPUT_DIR, `${outName}.json`);

  let statutes = loadStatutes();
  if (scopeFilter) statutes = statutes.filter((s) => s.scopeId.startsWith(scopeFilter));
  if (limit !== undefined) statutes = statutes.slice(0, limit);

  console.log(`[gen-questions] notebook=${notebookId} · types=${types.join(',')} · per=${per}`);
  console.log(`[gen-questions] נוסחים=${statutes.length} · פלט=${outputFile}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(REQUESTS_DIR, { recursive: true });

  // resume: טען פלט-קיים (אם יש) — כל call-slot מקבל רשומה אחת (גם בכשל →
  // items ריק) לשמירת יישור-מיקום מול הלולאה הדטרמיניסטית. ריצה-חוזרת עם אותם
  // ארגומנטים ממשיכה מהיכן שעצרה במקום להתחיל מאפס.
  const slots: CacheItem[] = [];
  if (existsSync(outputFile)) {
    try {
      const prev = JSON.parse(readFileSync(outputFile, 'utf-8')) as { items?: CacheItem[] };
      if (Array.isArray(prev.items)) slots.push(...prev.items);
      if (slots.length) console.log(`[gen-questions] resume — ${slots.length} call-slots קיימים`);
    } catch {
      /* פלט פגום — מתחילים מאפס */
    }
  }

  const writeCache = (): void => {
    writeFileSync(
      outputFile,
      JSON.stringify(
        { batch: outName, generatedAt: new Date().toISOString(), items: slots },
        null,
        2,
      ),
      'utf-8',
    );
  };

  let ok = 0;
  let fail = 0;
  let skip = 0;
  const totalCalls = statutes.length * types.length;
  let call = 0;

  for (const statute of statutes) {
    for (const type of types) {
      const slot = call; // מיקום-קריאה 0-based (יישור-resume דטרמיניסטי)
      call++;
      const label = `[${call}/${totalCalls}] ${statute.scopeId} ${type}`;

      // resume: דלג רק על slot שכבר הושלם בהצלחה (items>0) ותואם scope+type.
      // slot ריק/חסר/לא-תואם → מריצים-מחדש (מתקנים כשלים קודמים).
      const existing = slots[slot];
      if (
        existing &&
        existing.scopeId === statute.scopeId &&
        existing.type === type &&
        existing.items.length > 0
      ) {
        skip++;
        console.log(`[gen-questions] ${label} — דילוג (${existing.items.length} קיימים) ↩`);
        continue;
      }

      let items: unknown[] = [];
      try {
        const prompt = buildCompactQuestionPrompt(statute, { type, n: per });
        const stdout = askNotebook(prompt, notebookId);
        items = extractByType(type, stdout);
        ok++;
        console.log(`[gen-questions] ${label} — ${items.length} פריטים ✓`);
      } catch (err) {
        fail++;
        console.error(
          `[gen-questions] ${label} — נכשל (מדולג): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      slots[slot] = { scopeId: statute.scopeId, type, items };
      writeCache(); // checkpoint אינקרמנטלי — קריסת-תהליך לא מאבדת התקדמות

      if (call < totalCalls) await sleep(THROTTLE_MS);
    }
  }

  try {
    unlinkSync(join(REQUESTS_DIR, '_tmp.txt'));
  } catch {
    /* לא קיים — לא נורא */
  }

  writeCache(); // כתיבה-סופית
  const totalItems = slots.reduce((s, c) => s + c.items.length, 0);

  console.log('\n[gen-questions] ─── סיכום ─────────────────────────────');
  console.log(`  קריאות-הצליחו: ${ok} · נכשלו: ${fail} · דילוג(resume): ${skip}`);
  console.log(`  סה"כ פריטים: ${totalItems} · פלט: ${outputFile}`);
  console.log('[gen-questions] ───────────────────────────────────────');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[gen-questions] FAILED:', err);
    process.exit(1);
  });
