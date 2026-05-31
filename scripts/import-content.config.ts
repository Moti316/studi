/**
 * scripts/import-content.config.ts — declarative config for the content-import
 * pipeline (`scripts/import-content.ts`).
 *
 * ⚠️ SERVER-ONLY (consumed by the tsx import script). No secrets here — only
 * Drive File-IDs (public-within-the-account identifiers, not credentials) and
 * budget caps. Actual credentials (GOOGLE_*, GEMINI_API_KEY, DATABASE_URL) come
 * from `.env.local` via process.env at runtime.
 *
 * Sources:
 * - T1 File-IDs → docs/CONTENT-INDEX.md §7 ("קבצי-T1 לייבוא ראשון").
 * - ROOT_FOLDER_IDS → src/lib/drive/client.ts DRIVE_ROOT_FOLDERS (single
 *   source-of-truth; re-exported, NOT re-typed, so the two never drift).
 *
 * Design notes (per backend-engineer identity + PROJECT-CONTEXT):
 * - The pipeline DISCOVERS files by listing ROOT_FOLDER_IDS (recursively, in the
 *   orchestrator) and filters to T1. T1_FILE_IDS is the curated allow-list of
 *   known-good question banks to start from; discovery may surface more, but the
 *   allow-list lets `--dry-run` plan deterministically and lets us cap cost.
 * - BUDGET is a hard guard: the orchestrator MUST stop calling Gemini once
 *   `maxGeminiCalls` is reached, and MUST refuse to start `--execute` if the
 *   estimated spend exceeds `totalUsdHardCap`. Default-deny on budget overrun.
 */

import { DRIVE_ROOT_FOLDERS } from '../src/lib/drive/client';

/** Re-export the canonical Drive root folders (single source-of-truth). */
export const ROOT_FOLDER_IDS = DRIVE_ROOT_FOLDERS;

/** Convenience: root folders as a flat list for discovery iteration. */
export const ROOT_FOLDER_ID_LIST: readonly string[] = Object.values(DRIVE_ROOT_FOLDERS);

/** A single curated T1 source from CONTENT-INDEX §7. */
export interface T1FileEntry {
  /** Google Drive File ID. */
  readonly id: string;
  /** Human label (Hebrew) — for the plan/report only, never load-bearing. */
  readonly label: string;
  /** Where it lives in Drive (root folder key) — for the report. */
  readonly location: keyof typeof DRIVE_ROOT_FOLDERS;
}

/**
 * Curated T1 (Quiz-source) File-IDs from `docs/CONTENT-INDEX.md` §7.
 *
 * Only IDs that are fully spelled-out in §7 are listed here. The table shows two
 * groups with truncated IDs ("4× שאלות אייל הסמכה" → `1qbmxVzFHmhqffDyn...`,
 * "5× מבחני-שיעור אייל פלטק" → `1oH0Co...`); those are NOT listed (a truncated
 * ID is not a usable File-ID). The orchestrator's Drive discovery (listing the
 * `legacy` + `mainCourse` folders and filtering to question-bank MIME types) is
 * what surfaces the rest — this list is the deterministic seed, not the full set.
 */
export const T1_FILE_IDS: readonly T1FileEntry[] = [
  {
    id: '1CdpnnRPdsV02H474nbl0er480qr12SJr',
    label: 'Emailing שאלות סימולציה ערוך',
    location: 'legacy',
  },
  {
    id: '19ZP5YxWIa2e-72VPeTgSHMP97JXQ6GOB',
    label: 'לקט שאלות ותשובות (docx)',
    location: 'legacy',
  },
  {
    id: '1-9TTVJDSPoOWuPgYxmvPisBepjMBIlic',
    label: 'שאלות לבחינת וועדה (PDF)',
    location: 'legacy',
  },
  {
    id: '1BA9XpSDVNx-MVbiyQZCndeyMVROTZ0aG',
    label: 'מאגר שאלות הכנה ספט׳2025 (PDF)',
    location: 'mainCourse',
  },
  {
    id: '1RP2F2x-GwqX5sybXBWUORgtbO7VPFNLP',
    label: 'שו"ת ציוד מגן אישי (docx)',
    location: 'mainCourse',
  },
] as const;

/** Flat list of curated T1 IDs (for fast membership checks). */
export const T1_FILE_ID_SET: ReadonlySet<string> = new Set(T1_FILE_IDS.map((f) => f.id));

/**
 * MIME types we route to a parser. Anything else discovered in a folder is
 * skipped (T2/T3/T4/audio/video — not part of the T1 question import).
 */
export const T1_PARSEABLE_MIME_TYPES = {
  /** PDF → parsePdfMcq. */
  pdf: 'application/pdf',
  /** DOCX (uploaded) → parseDocxQA. */
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  /** Google Doc (native) → exported as DOCX, then parseDocxQA. */
  googleDoc: 'application/vnd.google-apps.document',
} as const;

/**
 * Budget guard for the import run. Defaults are conservative; the orchestrator
 * treats these as HARD caps (default-deny on overrun).
 *
 * Cost model is intentionally rough — Gemini Flash classification is cheap, so
 * the cap exists mainly to bound a runaway loop (e.g. a malformed PDF producing
 * thousands of phantom questions), not to track spend to the cent.
 */
export const BUDGET = {
  /** Hard cap on total Gemini calls in one run (one tagScope = up to one call). */
  maxGeminiCalls: 2000,
  /** Hard USD ceiling for the run. Abort `--execute` if the estimate exceeds it. */
  totalUsdHardCap: 5,
  /**
   * Rough per-Gemini-call cost estimate (USD), used only for the pre-flight
   * estimate and the budget check. Flash classification on a ~1.5k-char prompt.
   */
  estUsdPerGeminiCall: 0.0008,
  /** Max questions accepted from a single file (runaway-parse guard). */
  maxQuestionsPerFile: 1500,
} as const;

/** Tier this config targets. */
export const TIER = 'T1' as const;
