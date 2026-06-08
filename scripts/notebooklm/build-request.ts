#!/usr/bin/env tsx
/**
 * scripts/notebooklm/build-request.ts — CLI לבניית prompt-הרחבה ל-NotebookLM.
 *
 * קורא את `scripts/data/committee-scenarios.json`, מריץ `buildScenarioExpansionRequest`
 * וכותב את ה-prompt ל-`.cache/notebooklm/requests/scenarios-expand.txt`.
 *
 * שימוש:
 *   tsx scripts/notebooklm/build-request.ts              # כל התרחישים
 *   tsx scripts/notebooklm/build-request.ts --limit 5   # ראשונים 5
 *
 * לאחר הרצה: העתק את הקובץ הנוצר ל-NotebookLM ידנית (אין API).
 * הפלט של NotebookLM יישמר ב-`.cache/notebooklm/scenarios/<ref>.json`
 * ויעובד ע"י `scripts/import-scenarios.ts`.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  buildScenarioExpansionRequest,
  type ScenarioRequestItem,
} from '../../src/lib/notebooklm/request';

// ── קבועים ─────────────────────────────────────────────────────────────────

const ROOT = resolve(process.cwd());
const SCENARIOS_FILE = join(ROOT, 'scripts', 'data', 'committee-scenarios.json');
const OUTPUT_DIR = join(ROOT, '.cache', 'notebooklm', 'requests');
const OUTPUT_FILE = join(OUTPUT_DIR, 'scenarios-expand.txt');

// ── arg helper (מאותו תבנית import-qa-bank) ────────────────────────────────

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. קריאת קובץ-התרחישים
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(SCENARIOS_FILE, 'utf-8'));
  } catch (err) {
    console.error(`[build-request] שגיאה בקריאת ${SCENARIOS_FILE}:`, err);
    process.exit(1);
  }

  if (
    typeof raw !== 'object' ||
    raw === null ||
    !Array.isArray((raw as Record<string, unknown>).scenarios)
  ) {
    console.error('[build-request] פורמט-שגיאה: חסר מפתח "scenarios" (מערך).');
    process.exit(1);
  }

  const allScenarios = (raw as { scenarios: Record<string, unknown>[] }).scenarios;

  // 2. הגבלת-limit
  const limitArg = arg('--limit');
  const limit = limitArg ? Math.max(1, Number(limitArg)) : undefined;
  const scenariosSlice = limit ? allScenarios.slice(0, limit) : allScenarios;

  // 3. המרה ל-ScenarioRequestItem (בדיקת שדות-חובה)
  const items: ScenarioRequestItem[] = [];
  for (const [idx, s] of scenariosSlice.entries()) {
    const title = typeof s['title'] === 'string' ? s['title'] : '';
    const background = typeof s['background'] === 'string' ? s['background'] : '';
    const task = typeof s['task'] === 'string' ? s['task'] : '';
    const solution = typeof s['solution'] === 'string' ? s['solution'] : '';

    if (!title || !background || !task) {
      console.warn(`[build-request] ⚠ תרחיש ${idx + 1} חסר שדות-חובה — מדולג.`);
      continue;
    }

    items.push({ title, background, task, solution });
  }

  if (items.length === 0) {
    console.error('[build-request] אפס תרחישים תקינים — יציאה.');
    process.exit(1);
  }

  console.log(`[build-request] בונה prompt עבור ${items.length} תרחישים...`);

  // 4. בניית ה-prompt
  const prompt = buildScenarioExpansionRequest(items);

  // 5. כתיבה לקובץ-פלט
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, prompt, 'utf-8');

  console.log(`[build-request] ✓ נכתב: ${OUTPUT_FILE}`);
  console.log(
    `[build-request] גודל: ${(prompt.length / 1024).toFixed(1)} KB · שורות: ${prompt.split('\n').length}`,
  );
  console.log('[build-request] העתק את הקובץ ל-NotebookLM. הפלט → .cache/notebooklm/scenarios/');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[build-request] FAILED:', err);
    process.exit(1);
  });
