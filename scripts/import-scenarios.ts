#!/usr/bin/env tsx
/**
 * scripts/import-scenarios.ts — אינטגרטור end-to-end לייבוא תרחישים מ-NotebookLM.
 *
 * קורא קובץ-cache שנכתב ע"י tools/nblm-bridge (run_generation.py), מאמת כל תרחיש
 * מול קורפוס-החקיקה (G1–G5), כותב ל-DB (תחת --execute) ומדווח מונים.
 *
 * זרימה:
 * 1. קרא .cache/notebooklm/scenarios/<file>.json → parseNotebookLmOutput.
 * 2. resolver = createDefaultBodyResolver() (fs-cache — פתיחה פעם-אחת).
 * 3. פר item: verifyScenarioCitations(allCitations, resolver).
 *    G4: !hasGroundedBackup → "מוחזק" (דלג גם ב-execute).
 *    scopeRefs = groundedCitations ייחודיים.
 * 4. mapScenario(item, sourceRef, scopeRefs) → NewScenario.
 * 5. companion question (scenario_walkthrough) מוכן אך scenarioId יוגדר אחרי-insert.
 * 6. dry-run: טבלת G1–G5 פר-item + רשימת-מוחזקים + סיכום.
 * 7. execute: upsertScenarios → לכל item: scenarioId + upsertQuestions.
 *
 * שימוש:
 *   tsx scripts/import-scenarios.ts                              # dry-run
 *   tsx scripts/import-scenarios.ts --dry-run                   # dry-run (מפורש)
 *   tsx scripts/import-scenarios.ts --execute                   # כתיבה ל-DB
 *   tsx scripts/import-scenarios.ts --file my-batch --limit 5   # קובץ + הגבלה
 *
 * ⚠️ אל תריץ ישירות — נדרש .cache/notebooklm/scenarios/<file>.json מהגשר.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parseNotebookLmOutput } from '../src/lib/notebooklm/parse-output';
import { mapScenario } from '../src/lib/notebooklm/map-scenario';
import { createDefaultBodyResolver } from '../src/lib/import/legislation-resolver';
import { verifyScenarioCitations, hasValidLegalBackup } from '../src/lib/import/verify-grounding';
import type { CitationInput } from '../src/lib/notebooklm/parse-output';
import type { Citation } from '../src/lib/import/verify-grounding';
import type { CitationGate } from '../src/lib/import/verify-grounding';
import type { NewQuestion } from '../drizzle/schema';

// ---------------------------------------------------------------------------
// קבועים
// ---------------------------------------------------------------------------

const CACHE_DIR = resolve('.cache', 'notebooklm', 'scenarios');
const DEFAULT_FILE = 'scenarios-expand';

// ---------------------------------------------------------------------------
// עזרי-CLI
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// ---------------------------------------------------------------------------
// עזרי-ציטוט
// ---------------------------------------------------------------------------

/** ממיר CitationInput (מהפרסר) ל-Citation (של verify-grounding). */
function toCitation(c: CitationInput): Citation {
  return { scopeId: c.scopeId, quote: c.quote, section: c.section };
}

/**
 * מסיר את מעטפת-הגשר ומחזיר את ה-content הגולמי ל-parseNotebookLmOutput.
 * הגשר (tools/nblm-bridge/run_generation.py · save_response) כותב מעטפת-provenance
 * `{ ref, generated_at, content: "<פלט-המודל>" }`, בעוד הפרסר מצפה ל-batch-מובנה
 * `{ batch, contentType, items }`. תיקון-seam (C3): אם הקובץ הוא מעטפת — חלץ את
 * `content` (פלט-המודל · JSON עם/בלי fences). אם הוא כבר batch-ישיר (golden/הדבקה-
 * ידנית · יש `items`) או לא-JSON — החזר כפי-שהוא והפרסר יטפל (כולל הסרת-fences).
 */
function unwrapBridgeEnvelope(rawJson: string): string {
  try {
    const obj: unknown = JSON.parse(rawJson);
    if (
      obj !== null &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      typeof (obj as Record<string, unknown>).content === 'string' &&
      !('items' in (obj as Record<string, unknown>))
    ) {
      return (obj as { content: string }).content;
    }
  } catch {
    // לא-JSON — תן ל-parseNotebookLmOutput לטפל (כולל הסרת-fences).
  }
  return rawJson;
}

/** אוסף את כל הציטוטים מ-4 חלקי-solution לרשימה שטוחה (לדו"ח + scope_refs). */
function collectCitations(solution: {
  immediateAction: { citations: CitationInput[] };
  controlsHierarchy: { citations: CitationInput[] };
  legalBackup: { citations: CitationInput[] };
  managerialAction: { citations: CitationInput[] };
}): Citation[] {
  return [
    ...solution.immediateAction.citations.map(toCitation),
    ...solution.controlsHierarchy.citations.map(toCitation),
    ...solution.legalBackup.citations.map(toCitation),
    ...solution.managerialAction.citations.map(toCitation),
  ];
}

/**
 * רק ציטוטי-`legalBackup` — לשער-G4. הגיבוי-החוקי **עצמו** חייב ≥1 ציטוט-מעוגן
 * (חוזה verify-grounding). ציטוט-מעוגן ב-immediateAction/engineeringMgmt אינו
 * "מציל" legalBackup-ריק — אחרת תרחיש נכתב עם גיבוי-חוקי לא-מעוגן (באג C1).
 */
function legalBackupCitations(solution: {
  legalBackup: { citations: CitationInput[] };
}): Citation[] {
  return solution.legalBackup.citations.map(toCitation);
}

/** מחזיר רשימת scopeRef-ים ייחודיים מציטוטים-מעוגנים (confidence=1). */
function uniqueScopeRefs(
  groundedCitations: CitationGate[],
): Array<{ id: string; confidence: number }> {
  const seen = new Set<string>();
  const result: Array<{ id: string; confidence: number }> = [];
  for (const g of groundedCitations) {
    if (!seen.has(g.scopeId)) {
      seen.add(g.scopeId);
      result.push({ id: g.scopeId, confidence: 1 });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// פורמט דו"ח dry-run
// ---------------------------------------------------------------------------

/** מדפיס טבלת G1–G5 פר-item. */
function printGroundingReport(
  index: number,
  sourceRef: string,
  title: string,
  gates: CitationGate[],
  held: boolean,
): void {
  const status = held ? '[מוחזק]' : '[נקי]  ';
  console.log(`\n  #${index} ${status} ${sourceRef} — ${title}`);
  if (gates.length === 0) {
    console.log('    (אין ציטוטים)');
    return;
  }
  for (const g of gates) {
    const g1 = g.g1 ? '✓' : '✗';
    const g2 = g.g2 ? '✓' : '✗';
    const g3 = g.g3 ? '✓' : '✗';
    const g5 = g.g5 === true ? '✓' : g.g5 === false ? '✗' : '—';
    const grnd = g.grounded ? '✓ מעוגן' : '✗ לא-מעוגן';
    console.log(`    ציטוט [${g.scopeId}]  G1:${g1} G2:${g2} G3:${g3} G5:${g5}  → ${grnd}`);
    console.log(`      ${g.detail}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  const fileArg = arg('--file') ?? DEFAULT_FILE;
  const limitArg = arg('--limit');
  const limit = limitArg ? Math.max(1, Number(limitArg)) : undefined;

  // ── שלב 1: קרא קובץ-cache ──
  const cachePath = join(CACHE_DIR, `${fileArg}.json`);
  if (!existsSync(cachePath)) {
    console.error(
      `[import-scenarios] קובץ-cache לא נמצא: ${cachePath}\n` +
        `  הרץ את הגשר תחילה:\n` +
        `    cd tools/nblm-bridge\n` +
        `    python run_generation.py --ref ${fileArg}\n` +
        `  ולאחר מכן נסה שוב.`,
    );
    process.exit(1);
  }

  const rawJson = readFileSync(cachePath, 'utf8');
  let batch: ReturnType<typeof parseNotebookLmOutput>;
  try {
    batch = parseNotebookLmOutput(unwrapBridgeEnvelope(rawJson));
  } catch (err) {
    console.error(
      `[import-scenarios] פרסור JSON נכשל:\n  ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  let items = batch.items;
  if (limit) items = items.slice(0, limit);

  console.log(
    `[import-scenarios] mode=${mode} · file=${fileArg} · items=${items.length}` +
      (limit ? ` (limit=${limit})` : ''),
  );

  // ── שלב 2: resolver חקיקה ──
  const resolveBody = createDefaultBodyResolver();

  // ── שלב 3+4: עיבוד פר-item ──
  type ProcessedItem = {
    index: number;
    sourceRef: string;
    gates: CitationGate[];
    held: boolean; // G4 נכשל — !hasGroundedBackup
    scenario: ReturnType<typeof mapScenario> | null;
    companionSourceRef: string;
    taskPrompt: string;
  };

  const processed: ProcessedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const sourceRef = item.sourceRef ?? `scn:${fileArg}:${i}`;
    const companionSourceRef = `scnq:${fileArg}:${i}`;

    // כל-הציטוטים — לדו"ח-G1–G5 ולחישוב scope_refs (כל 3 החלקים יכולים לתרום תגיות-scope מעוגנות).
    const allReport = verifyScenarioCitations(collectCitations(item.solution), resolveBody);
    // שער-G4 מחמיר — על legalBackup בלבד (באג-C1): הגיבוי-החוקי חייב ≥1 ציטוט
    // מעוגן-מילולית **וגם נושא סעיף** (דרישת-מוטי: היצמדות-לחוק כולל ציון-סעיף).
    const legalReport = hasValidLegalBackup(legalBackupCitations(item.solution), resolveBody);

    const gates = allReport.gates;
    const held = !legalReport.ok;
    const scopeRefs = uniqueScopeRefs(allReport.groundedCitations);

    let scenario: ReturnType<typeof mapScenario> | null = null;
    if (!held) {
      try {
        scenario = mapScenario(item, sourceRef, scopeRefs);
      } catch (err) {
        console.error(
          `[import-scenarios] mapScenario נכשל עבור ${sourceRef}:\n  ` +
            `${err instanceof Error ? err.message : String(err)}`,
        );
        // מטפל בכשל-map כמו held — לא כותב
      }
    }

    processed.push({
      index: i,
      sourceRef,
      gates,
      held: held || scenario === null,
      scenario,
      companionSourceRef,
      taskPrompt: item.task ?? item.title,
    });
  }

  // ── שלב 6: dry-run — הדפסה ──
  const clean = processed.filter((p) => !p.held);
  const heldItems = processed.filter((p) => p.held);

  if (mode === 'dry-run') {
    console.log('\n──── דו"ח עיגון G1–G5 ────');
    for (const p of processed) {
      printGroundingReport(p.index, p.sourceRef, processed[p.index]!.taskPrompt, p.gates, p.held);
    }

    if (heldItems.length > 0) {
      console.log('\n──── תרחישים מוחזקים (G4: legalBackup ללא ציטוט מעוגן-מילולית-עם-סעיף) ────');
      for (const p of heldItems) {
        console.log(`  · ${p.sourceRef}`);
      }
    }

    console.log(
      `\n[import-scenarios] dry-run סיכום: ` +
        `${items.length} items · ${clean.length} נקיים · ${heldItems.length} מוחזקים · 0 נכתבו ל-DB.`,
    );
    return;
  }

  // ── שלב 7: execute — כתיבה ל-DB ──
  if (clean.length === 0) {
    console.log('[import-scenarios] אין תרחישים נקיים לכתיבה.');
    return;
  }

  const { upsertScenarios, findScenarioIdBySourceRef } =
    await import('../src/lib/import/upsert-scenarios');
  const { upsertQuestions } = await import('../src/lib/import/upsert-questions');

  const scenarioRows = clean.map((p) => p.scenario!);
  const { inserted: scnInserted, skipped: scnSkipped } = await upsertScenarios(scenarioRows);

  console.log(`[import-scenarios] תרחישים: inserted=${scnInserted} · skipped=${scnSkipped}`);

  // ── בנה companion questions עם scenarioId ──
  // גישה בטוחה ואידמפוטנטית: fetch ל-DB פר-item דרך findScenarioIdBySourceRef.
  // Postgres RETURNING לא מבטיח סדר-קלט → לא משתמשים ב-insertedIds לאינדוקס.
  // N queries אך N קטן (batch אחד, בד"כ ≤ כמה עשרות). ניתן לאופטימיזציה בעתיד.
  const qRows: NewQuestion[] = [];
  for (const p of clean) {
    let scenarioId: string | null = null;
    try {
      scenarioId = await findScenarioIdBySourceRef(p.sourceRef);
    } catch (err) {
      console.error(
        `[import-scenarios] findScenarioIdBySourceRef נכשל עבור ${p.sourceRef}: ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!scenarioId) {
      console.warn(
        `[import-scenarios] לא נמצא scenarioId עבור ${p.sourceRef} — מדלג על companion question.`,
      );
      continue;
    }

    const scopeRefs = p.scenario?.scopeRefs ?? [];
    const qRow: NewQuestion = {
      type: 'scenario_walkthrough',
      prompt: p.taskPrompt,
      scenarioId,
      scopeRefs,
      inScope: true,
      status: 'מוסקנא',
      sourceRef: p.companionSourceRef,
      // אין options/correctAnswer/explanation ל-scenario_walkthrough (תשובה = solution).
      options: null,
      correctAnswer: null,
      explanation: null,
      difficulty: undefined,
    } as NewQuestion;

    qRows.push(qRow);
  }

  if (qRows.length > 0) {
    const { inserted: qInserted, skipped: qSkipped } = await upsertQuestions(qRows);
    console.log(
      `[import-scenarios] companion questions: inserted=${qInserted} · skipped=${qSkipped}`,
    );
  } else {
    console.log('[import-scenarios] אין companion questions לכתיבה.');
  }

  if (heldItems.length > 0) {
    console.log(
      `[import-scenarios] מוחזקים (לא נכתבו — G4): ${heldItems.length} · refs: ` +
        heldItems.map((p) => p.sourceRef).join(', '),
    );
  }

  console.log(
    `[import-scenarios] done: ${items.length} items processed · ` +
      `${scnInserted} תרחישים נכתבו · ${scnSkipped} דולגו · ` +
      `${heldItems.length} מוחזקים.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[import-scenarios] FAILED:', err);
    process.exit(1);
  });
