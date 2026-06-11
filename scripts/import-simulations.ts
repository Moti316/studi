#!/usr/bin/env tsx
/**
 * scripts/import-simulations.ts — ייבוא בנק-סימולציות-הוועדה ל-DB (בלוק-5 · ADR-016).
 *
 * קורא את הבנק-המחובר-והמאומת (`src/features/simulation/data/committee-sim-bank.json` ·
 * 12 סימולציות · Workflow-Claude + content-verifier) ואת קובץ-הוורדיקטים
 * (`committee-sim-bank.verify.json`), ומייבא ל-טבלת-`simulations`:
 *   - רק סימולציות-מאומתות (overallOk=true) — מדוגלות מדולגות-ומדווחות (תיקון-תוכן קודם).
 *   - idempotent: upsert על sourceRef (`committee-sim:<title>`) — בטוח-להרצה-חוזרת.
 *
 * שימוש:
 *   pnpm sim:import              # dry-run (טבלה + מונים · אפס-כתיבה)
 *   pnpm sim:import --execute    # כתיבה ל-DB
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Simulation } from '../src/features/simulation/types';

const BANK_PATH = resolve('src', 'features', 'simulation', 'data', 'committee-sim-bank.json');
const VERIFY_PATH = resolve(
  'src',
  'features',
  'simulation',
  'data',
  'committee-sim-bank.verify.json',
);

interface Verdict {
  title: string;
  branch: string;
  overallOk: boolean;
  checks: number;
}

/** מפתח-מקור יציב (idempotency) — הכותרת ייחודית בבנק. */
export function simSourceRef(title: string): string {
  return `committee-sim:${title.trim()}`;
}

/** ולידציה-מבנית מינימלית (שדות-הריצה של הנגן). */
export function isValidSimulation(s: unknown): s is Simulation {
  if (!s || typeof s !== 'object') return false;
  const sim = s as Record<string, unknown>;
  return (
    typeof sim.title === 'string' &&
    sim.title.length > 0 &&
    typeof sim.branch === 'string' &&
    typeof sim.intro === 'string' &&
    Array.isArray(sim.stages) &&
    sim.stages.length > 0 &&
    Array.isArray(sim.scoringCriteria) &&
    typeof sim.maxScore === 'number'
  );
}

async function main(): Promise<void> {
  const execute = process.argv.includes('--execute');

  const bank = JSON.parse(readFileSync(BANK_PATH, 'utf8')) as Simulation[];
  const verdicts = JSON.parse(readFileSync(VERIFY_PATH, 'utf8')) as Verdict[];
  const okTitles = new Set(verdicts.filter((v) => v.overallOk).map((v) => v.title));

  const rows: { sim: Simulation; sourceRef: string }[] = [];
  const skipped: { title: string; reason: string }[] = [];

  for (const sim of bank) {
    if (!isValidSimulation(sim)) {
      skipped.push({
        title: String((sim as { title?: unknown })?.title ?? '?'),
        reason: 'מבנה-לא-תקין',
      });
      continue;
    }
    if (!okTitles.has(sim.title)) {
      skipped.push({ title: sim.title, reason: 'מדוגל (overallOk=false) — תיקון-תוכן קודם' });
      continue;
    }
    rows.push({ sim, sourceRef: simSourceRef(sim.title) });
  }

  console.log(
    `\n📦 בנק: ${bank.length} · מאומתים-לייבוא: ${rows.length} · מדולגים: ${skipped.length}`,
  );
  for (const r of rows) console.log(`  ✅ [${r.sim.branch}] ${r.sim.title}`);
  for (const s of skipped) console.log(`  ⏭️  ${s.title} — ${s.reason}`);

  if (!execute) {
    console.log('\n(dry-run · הוסף --execute לכתיבה ל-DB)');
    return;
  }

  // ייבוא דינמי של ה-DB רק תחת execute (dry-run עובד בלי env-DB).
  const { db } = await import('../src/lib/db');
  const { simulations } = await import('../drizzle/schema');

  let written = 0;
  for (const { sim, sourceRef } of rows) {
    await db
      .insert(simulations)
      .values({
        title: sim.title,
        branch: sim.branch,
        intro: sim.intro,
        data: sim,
        scopeRefs: sim.scopeRefs ?? [],
        sourceRef,
        status: 'מאומת',
      })
      .onConflictDoUpdate({
        target: simulations.sourceRef,
        set: {
          title: sim.title,
          branch: sim.branch,
          intro: sim.intro,
          data: sim,
          scopeRefs: sim.scopeRefs ?? [],
          status: 'מאומת',
        },
      });
    written++;
  }
  console.log(`\n✅ נכתבו/עודכנו ${written} סימולציות (upsert על source_ref · idempotent).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ import-simulations failed:', err);
  process.exit(1);
});
