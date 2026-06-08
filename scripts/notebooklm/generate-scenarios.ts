#!/usr/bin/env tsx
/**
 * scripts/notebooklm/generate-scenarios.ts — מחולל תרחישים דרך NotebookLM CLI.
 *
 * זרימה (פר-תרחיש):
 *   1. קרא committee-scenarios.json
 *   2. buildCompactScenarioPrompt → כתוב ל-.cache/notebooklm/requests/_tmp.txt
 *   3. execFileSync venvPy -m notebooklm ask --prompt-file <tmp> -n <nbid>
 *   4. extractFlatJson(stdout) → adaptFlatToItem(flat, source)
 *   5. throttle ~2500ms בין קריאות
 *   6. buildBatch(items) → כתוב ל-.cache/notebooklm/scenarios/<out>.json
 *
 * flags:
 *   --limit N        עד N תרחישים (ברירת-מחדל: הכל)
 *   --notebook <id>  NOTEBOOK ID (ברירת-מחדל: NBLM_NOTEBOOK_ID | c3f2d80a-...)
 *   --out <name>     שם-קובץ-הפלט (ברירת-מחדל: scenarios-expand)
 *
 * ⚠️ אל תריץ — המתאם מריץ אחרי בדיקה ידנית.
 */

import { readFileSync, mkdirSync, writeFileSync, writeSync, openSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

import { buildCompactScenarioPrompt } from '../../src/lib/notebooklm/compact-prompt';
import { extractFlatJson, adaptFlatToItem, buildBatch } from '../../src/lib/notebooklm/adapt-flat';
import type { ScenarioSource } from '../../src/lib/notebooklm/adapt-flat';
import type { ParsedScenarioItem } from '../../src/lib/notebooklm/parse-output';

// ── קבועים ────────────────────────────────────────────────────────────────────

const ROOT = resolve(process.cwd());
const SCENARIOS_FILE = join(ROOT, 'scripts', 'data', 'committee-scenarios.json');
const OUTPUT_DIR = join(ROOT, '.cache', 'notebooklm', 'scenarios');
const REQUESTS_DIR = join(ROOT, '.cache', 'notebooklm', 'requests');
const TMP_PROMPT_FILE = join(REQUESTS_DIR, '_tmp.txt');

const DEFAULT_NOTEBOOK_ID = 'c3f2d80a-e5f5-4a1c-9c4b-2ae18ebc3dbc';
const VENV_PYTHON = join(ROOT, 'tools', 'nblm-bridge', '.venv', 'Scripts', 'python.exe');
const THROTTLE_MS = 2500;

// ── arg helper ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// ── sleep ─────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── ממשק-מקור ─────────────────────────────────────────────────────────────────

interface CommitteeScenariosFile {
  source: string;
  scenarios: ScenarioSource[];
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. פרסור flags
  const limitArg = arg('--limit');
  const limit = limitArg !== undefined ? Math.max(1, Number(limitArg)) : undefined;

  const notebookId = arg('--notebook') ?? process.env['NBLM_NOTEBOOK_ID'] ?? DEFAULT_NOTEBOOK_ID;

  const outName = arg('--out') ?? 'scenarios-expand';
  const outputFile = join(OUTPUT_DIR, `${outName}.json`);

  console.log(`[generate-scenarios] notebook: ${notebookId}`);
  console.log(`[generate-scenarios] פלט: ${outputFile}`);

  // 2. קריאת committee-scenarios.json
  let fileData: CommitteeScenariosFile;
  try {
    const raw = readFileSync(SCENARIOS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as Record<string, unknown>)['scenarios'])
    ) {
      throw new Error('חסר מפתח "scenarios" (מערך)');
    }
    fileData = parsed as CommitteeScenariosFile;
  } catch (err) {
    console.error(`[generate-scenarios] שגיאה בקריאת ${SCENARIOS_FILE}:`, err);
    process.exit(1);
  }

  const allScenarios = fileData.scenarios;
  const scenariosSlice = limit !== undefined ? allScenarios.slice(0, limit) : allScenarios;

  console.log(
    `[generate-scenarios] עיבוד ${scenariosSlice.length} תרחישים (מתוך ${allScenarios.length})`,
  );

  // 3. הכן תיקיות
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(REQUESTS_DIR, { recursive: true });

  // 4. לולאת-עיבוד
  const items: ParsedScenarioItem[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < scenariosSlice.length; i++) {
    const source = scenariosSlice[i];
    if (!source) continue;

    const label = `[${i + 1}/${scenariosSlice.length}] "${source.title}"`;
    console.log(`\n[generate-scenarios] ${label} — מתחיל...`);

    try {
      // 4a. בנה prompt קצר
      const prompt = buildCompactScenarioPrompt({
        title: source.title,
        background: source.background,
        task: source.task,
      });

      // 4b. כתוב לקובץ-זמני (UTF-8)
      writeFileSync(TMP_PROMPT_FILE, prompt, 'utf-8');

      // 4c. הפעל CLI
      const stdout = execFileSync(
        VENV_PYTHON,
        ['-m', 'notebooklm', 'ask', '--prompt-file', TMP_PROMPT_FILE, '-n', notebookId],
        {
          encoding: 'utf-8',
          env: { ...process.env, PYTHONUTF8: '1' },
          // timeout 90s per call
          timeout: 90_000,
        },
      );

      // 4d. חלץ JSON flat
      const flat = extractFlatJson(stdout);

      // 4e. מזג → ParsedScenarioItem
      const item = adaptFlatToItem(flat, source);
      items.push(item);
      successCount++;
      console.log(`[generate-scenarios] ${label} — הצליח ✓`);
    } catch (err) {
      failCount++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[generate-scenarios] ${label} — נכשל (מדולג): ${msg}`);
    }

    // 4f. throttle (אל תשלח קריאות רצופות מהר מדי)
    if (i < scenariosSlice.length - 1) {
      await sleep(THROTTLE_MS);
    }
  }

  // 5. ניקוי קובץ-זמני
  try {
    unlinkSync(TMP_PROMPT_FILE);
  } catch {
    // אם לא קיים — לא נורא
  }

  // 6. כתוב פלט
  const batch = buildBatch(items);
  writeFileSync(outputFile, JSON.stringify(batch, null, 2), 'utf-8');

  // 7. סיכום
  console.log('\n[generate-scenarios] ─── סיכום ───────────────────────────────');
  console.log(`  הצליח:  ${successCount} תרחישים`);
  console.log(`  נכשל:   ${failCount} תרחישים`);
  console.log(`  פלט:    ${outputFile}`);
  console.log('[generate-scenarios] ─────────────────────────────────────────');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[generate-scenarios] FAILED:', err);
    process.exit(1);
  });
