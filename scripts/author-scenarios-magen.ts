#!/usr/bin/env tsx
/**
 * scripts/author-scenarios-magen.ts — שלב-החיבור (Phase 2): לוקח תרחישים-מעוגנים
 * (NotebookLM · legalCitation מאומת-G3) ומחבר-מחדש כל אחד באיכות-וועדה דרך
 * פרומפט-המאסטר (committee-sim · name-cleaned) ב-Gemini-API **offline** (לא-runtime).
 *
 * זרימה (פר-תרחיש):
 *   seed{title,background,task} + grounding (legalBackup.citations · statuteTitle מ-loadStatutes)
 *   → buildScenarioAuthoringPrompt + COMMITTEE_SIM_MASTER → geminiGenerateJSON (FlatScenario)
 *   → adaptFlatToItem(flat, source) → buildBatch → .cache/.../scenarios/<out>.json
 * אז: scenarios:import:dry/--execute (G1–G5 מאמת מחדש · משמר רק מעוגן).
 *
 * שימוש:
 *   tsx scripts/author-scenarios-magen.ts                 # קלט scenarios-expand-v2 · פלט scenarios-expand-magen
 *   tsx scripts/author-scenarios-magen.ts --in X --out Y --limit 3
 *
 * ⚠️ דורש GEMINI_API_KEY. offline (creator-side). אצווה ~20 · free-tier resumable.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { loadStatutes } from './lib/load-statutes';
import {
  adaptFlatToItem,
  buildBatch,
  type FlatScenario,
  type ScenarioSource,
} from '../src/lib/notebooklm/adapt-flat';
import type { ParsedScenarioItem } from '../src/lib/notebooklm/parse-output';
import {
  COMMITTEE_SIM_MASTER,
  buildScenarioAuthoringPrompt,
  type GroundedCitation,
} from '../src/lib/ai/prompts/committee-sim/master';

const CACHE_DIR = resolve('.cache', 'notebooklm', 'scenarios');
const FLAT_SCENARIO_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    immediateAction: { type: 'string' },
    controlsHierarchy: { type: 'string' },
    legalBackup: { type: 'string' },
    legalCitation: {
      type: 'object',
      properties: {
        scopeId: { type: 'string' },
        quote: { type: 'string' },
        section: { type: 'string' },
      },
      required: ['scopeId', 'quote', 'section'],
    },
    managerialAction: { type: 'string' },
  },
  required: [
    'title',
    'immediateAction',
    'controlsHierarchy',
    'legalBackup',
    'legalCitation',
    'managerialAction',
  ],
} as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface GroundedScenarioItem {
  title: string;
  background: string;
  data?: string | null;
  task: string;
  solution: {
    legalBackup?: { citations?: Array<{ scopeId: string; quote: string; section?: string }> };
  };
  rubric: Array<{ criterion: string; points: number }>;
}

async function main(): Promise<void> {
  const inName = arg('--in') ?? 'scenarios-expand-v2';
  const outName = arg('--out') ?? 'scenarios-expand-magen';
  const limitArg = arg('--limit');
  const limit = limitArg !== undefined ? Math.max(1, Number(limitArg)) : undefined;
  // Flash בכוונה (Pro חסום ב-free-tier · limit:0). מתעלם מ-GEMINI_MODEL_GENERATION
  // ב-.env.local (שמצביע ל-Pro). override: --model.
  const model = arg('--model') ?? 'gemini-2.5-flash';

  const inPath = join(CACHE_DIR, `${inName}.json`);
  if (!existsSync(inPath)) {
    console.error(`[author-magen] קובץ-קלט לא נמצא: ${inPath} (הרץ NotebookLM-grounding תחילה).`);
    process.exit(1);
  }

  const batch = JSON.parse(readFileSync(inPath, 'utf8')) as { items: GroundedScenarioItem[] };
  let items = Array.isArray(batch.items) ? batch.items : [];
  if (limit !== undefined) items = items.slice(0, limit);

  const titleByScope = new Map<string, string>();
  for (const s of loadStatutes()) titleByScope.set(s.scopeId, s.title);

  const { geminiGenerateJSON } = await import('../src/lib/ai/client');
  const { withGeminiRetry } = await import('../src/lib/ai/retry');

  console.log(`[author-magen] קלט=${inName} · תרחישים=${items.length} · פלט=${outName}`);

  const out: ParsedScenarioItem[] = [];
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    const label = `[${i + 1}/${items.length}] "${it.title}"`;
    try {
      const grounding: GroundedCitation[] = (it.solution.legalBackup?.citations ?? []).map((c) => ({
        scopeId: c.scopeId,
        quote: c.quote,
        section: c.section ?? '',
        statuteTitle: titleByScope.get(c.scopeId) ?? c.scopeId,
      }));

      const flat = await withGeminiRetry(
        () =>
          geminiGenerateJSON<FlatScenario>({
            system: COMMITTEE_SIM_MASTER,
            prompt: buildScenarioAuthoringPrompt(
              { title: it.title, background: it.background, task: it.task },
              grounding,
            ),
            schema: FLAT_SCENARIO_SCHEMA,
            model,
          }),
        { maxRetries: 5, baseMs: 4_000, capMs: 60_000 },
      );

      const source: ScenarioSource = {
        title: it.title,
        background: it.background,
        data: it.data ?? null,
        task: it.task,
        rubric: it.rubric,
      };
      out.push(adaptFlatToItem(flat, source));
      ok++;
      console.log(`[author-magen] ${label} — חובר ✓`);
    } catch (err) {
      fail++;
      console.error(
        `[author-magen] ${label} — נכשל (מדולג): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (i < items.length - 1) await sleep(1500);
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(
    join(CACHE_DIR, `${outName}.json`),
    JSON.stringify(buildBatch(out, outName), null, 2),
    'utf-8',
  );

  console.log(
    `\n[author-magen] סיכום: חובר ${ok} · נכשל ${fail} · פלט ${join(CACHE_DIR, outName)}.json`,
  );
  console.log('[author-magen] הצעד-הבא: pnpm scenarios:import:dry --file ' + outName);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[author-magen] FAILED:', err);
    process.exit(1);
  });
