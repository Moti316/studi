/**
 * src/lib/import/upsert-scenarios.ts — הכנסה אידמפוטנטית של תרחישים-מיובאים
 * (NotebookLM · Stage 1) לטבלת `scenarios` דרך Drizzle. clone של upsert-questions.
 *
 * ⚠️ SERVER-ONLY (מייבא `@/lib/db` שקורא DATABASE_URL ופותח חיבור-Postgres).
 * נקרא ע"י ה-orchestrator (`scripts/import-scenarios.ts`) תחת `--execute`.
 *
 * אידמפוטנטיות: `source_ref` = מפתח-מקור דטרמיניסטי (scn:<file>:<sceneIdx>).
 * `ON CONFLICT (source_ref) DO NOTHING` → הרצה-חוזרת לא מכפילה ולא דורסת תרחיש
 * שנערך-ידנית אחרי-ייבוא. תלוי ב-`idx_scenarios_source_ref` (מיגרציה 0003).
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scenarios, type NewScenario } from '../../../drizzle/schema';

/** מקס' שורות ל-INSERT (כל שורה כובלת ~10 עמודות ⇒ מרווח-בטוח מ-65535). */
const INSERT_CHUNK_SIZE = 500;

export interface UpsertScenariosResult {
  /** שורות שנכתבו בפועל (source_ref לא-קיים-קודם). */
  inserted: number;
  /** שורות שדולגו כי ה-source_ref כבר קיים (הרצה-חוזרת אידמפוטנטית). */
  skipped: number;
  /** id-ים של השורות שהוכנסו (לחיווט companion-question · FK scenario_id). */
  insertedIds: string[];
}

/**
 * הכנסת תרחישים אידמפוטנטית, מפתח-`source_ref`.
 *
 * @param rows  שורות NewScenario. כל שורה **חייבת** `sourceRef` לא-ריק (אחרת
 *              לא ניתן לדה-דופ → נדחית מוקדם · parse-not-validate).
 * @returns מונה inserted/skipped + id-ים שהוכנסו.
 */
export async function upsertScenarios(rows: NewScenario[]): Promise<UpsertScenariosResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { inserted: 0, skipped: 0, insertedIds: [] };
  }

  const missing = rows.findIndex((r) => !r.sourceRef || String(r.sourceRef).trim().length === 0);
  if (missing !== -1) {
    throw new Error(
      `upsertScenarios: row at index ${missing} has no source_ref; ` +
        'every imported scenario must carry a deterministic source_ref for idempotency.',
    );
  }

  const insertedIds: string[] = [];

  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    const batch = rows.slice(i, i + INSERT_CHUNK_SIZE);
    const returned = await db
      .insert(scenarios)
      .values(batch)
      .onConflictDoNothing({ target: scenarios.sourceRef })
      .returning({ id: scenarios.id });
    for (const r of returned) insertedIds.push(r.id);
  }

  return { inserted: insertedIds.length, skipped: rows.length - insertedIds.length, insertedIds };
}

/**
 * מחזיר את ה-id של תרחיש לפי source_ref (קיים-כבר או חדש). נחוץ לחיווט
 * companion-question: שאלת scenario_walkthrough חייבת scenario_id (CHECK
 * scenario_needs_ref). משמש כשהתרחיש דולג (כבר-קיים) ולכן insertedIds לא מכיל אותו.
 */
export async function findScenarioIdBySourceRef(sourceRef: string): Promise<string | null> {
  if (!sourceRef || sourceRef.trim().length === 0) return null;
  const rows = await db
    .select({ id: scenarios.id })
    .from(scenarios)
    .where(sql`${scenarios.sourceRef} = ${sourceRef}`)
    .limit(1);
  return rows[0]?.id ?? null;
}
