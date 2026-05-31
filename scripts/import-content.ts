#!/usr/bin/env tsx
/**
 * scripts/import-content.ts — T1 content-import orchestrator.
 *
 * Pulls T1 "question-bank" files from Google Drive, parses them into questions,
 * scope-tags them (Gemini, `--execute` only), and idempotently upserts them
 * into the `questions` table.
 *
 * Usage:
 *   pnpm import:t1            # tsx scripts/import-content.ts t1 --execute
 *   pnpm import:t1:dry        # tsx scripts/import-content.ts t1 --dry-run
 *   tsx scripts/import-content.ts t1 --dry-run
 *
 * Modes:
 *   --dry-run   discover + plan + cost-estimate. NO Gemini, NO DB writes,
 *               NO downloads beyond what cache already holds (we DO parse cached
 *               files to count questions, but never reach for the network for a
 *               file already cached; uncached files are reported as "would
 *               download" only). Default if neither flag is given.
 *   --execute   full pipeline: download → cache → parse → tagScope → upsert.
 *
 * Pipeline guarantees (per backend-engineer identity + PROJECT-CONTEXT):
 * - dotenv `.env.local` is loaded FIRST, before any env-reading module.
 * - Per-file failure is isolated: it is recorded in the report and the run
 *   continues (skip, don't abort).
 * - Idempotent: deterministic source_ref per question + ON CONFLICT DO NOTHING.
 * - Budget guard: stops Gemini calls at BUDGET.maxGeminiCalls and refuses to
 *   --execute if the estimate exceeds BUDGET.totalUsdHardCap (default-deny).
 * - Zero secrets in code: every credential comes from process.env.
 * - NOT Inngest, NOT Sentry — a plain, resumable CLI.
 */

// ── 1. dotenv FIRST — before importing anything that reads process.env. ──
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  T1_FILE_IDS,
  T1_FILE_ID_SET,
  ROOT_FOLDER_ID_LIST,
  T1_PARSEABLE_MIME_TYPES,
  BUDGET,
  TIER,
} from './import-content.config';
import { listFolder, getMetadata, downloadFile, exportFile } from '../src/lib/drive/client';
import { parseDocxQA } from './parsers/parse-docx-qa';
import { parsePdfMcq } from './parsers/parse-pdf-mcq';
import type { ParsedQuestion } from './parsers/types';
import { mapQuestion } from '../src/lib/import/map-question';
// Type-only imports: erased at compile time, so importing these does NOT load
// the env-reading runtime modules (db / ai-client). The runtime values are
// dynamically imported below, in --execute only.
import type { NewQuestion } from '../drizzle/schema';
import type { upsertQuestions as UpsertQuestionsFn } from '../src/lib/import/upsert-questions';
import type { tagScope as TagScopeFn } from '../src/lib/import/scope-tagger';

// ─── Paths ────────────────────────────────────────────────────────────
const CACHE_DIR = resolve('.cache', 'drive');
const LOGS_DIR = resolve('logs');

// ─── Types ────────────────────────────────────────────────────────────
type Mode = 'dry-run' | 'execute';

/** A Drive file the pipeline considers for import. */
interface DiscoveredFile {
  id: string;
  name: string;
  mimeType: string;
  /** Whether this MIME maps to a parser (else skipped as non-T1). */
  parseable: boolean;
}

/** One JSONL report record. */
interface ReportRecord {
  ts: string;
  fileId: string;
  name?: string;
  mimeType?: string;
  status: 'parsed' | 'skipped' | 'failed' | 'upserted';
  questionsFound?: number;
  inserted?: number;
  skipped?: number;
  geminiCalls?: number;
  reason?: string;
}

// ─── arg parsing ──────────────────────────────────────────────────────
function parseArgs(argv: string[]): { tier: string; mode: Mode } {
  const args = argv.slice(2);
  const tier = (args.find((a) => !a.startsWith('-')) ?? 't1').toLowerCase();
  const mode: Mode = args.includes('--execute') ? 'execute' : 'dry-run';
  return { tier, mode };
}

// ─── MIME routing ─────────────────────────────────────────────────────
function isParseableMime(mime: string): boolean {
  return (
    mime === T1_PARSEABLE_MIME_TYPES.pdf ||
    mime === T1_PARSEABLE_MIME_TYPES.docx ||
    mime === T1_PARSEABLE_MIME_TYPES.googleDoc
  );
}

/** File extension for the local cache, by MIME. */
function cacheExtForMime(mime: string): 'pdf' | 'docx' {
  // Google Docs are exported as DOCX; PDFs stay PDF.
  return mime === T1_PARSEABLE_MIME_TYPES.pdf ? 'pdf' : 'docx';
}

// ─── Deterministic provenance key ───────────────────────────────────────
/**
 * Stable, collision-resistant source_ref for one question: short sha-256 of
 * `${fileId}#${index}`. Deterministic ⇒ re-import yields the same key ⇒
 * ON CONFLICT (source_ref) makes the whole pipeline idempotent.
 */
function sourceRefFor(fileId: string, index: number): string {
  const h = createHash('sha256').update(`${fileId}#${index}`).digest('hex').slice(0, 16);
  return `t1:${fileId}:${index}:${h}`;
}

// ─── Discovery ──────────────────────────────────────────────────────────
/**
 * Discover candidate files: list every root folder (non-recursive per call; we
 * also descend one level into sub-folders) + always include the curated T1 IDs.
 * Filters the listed set to parseable MIME types; the curated IDs are fetched by
 * metadata so they survive even if they live in an un-listed sub-folder.
 */
async function discover(): Promise<DiscoveredFile[]> {
  const byId = new Map<string, DiscoveredFile>();

  // (a) Curated T1 allow-list — fetch metadata for each (authoritative seed).
  for (const entry of T1_FILE_IDS) {
    try {
      const meta = await getMetadata(entry.id);
      const mime = meta.mimeType ?? '';
      byId.set(entry.id, {
        id: entry.id,
        name: meta.name ?? entry.label,
        mimeType: mime,
        parseable: isParseableMime(mime),
      });
    } catch (err) {
      // A bad/curated ID must not kill discovery — record a placeholder so the
      // report shows it failed, and continue.
      byId.set(entry.id, {
        id: entry.id,
        name: entry.label,
        mimeType: '',
        parseable: false,
      });
      logLine(`discover: metadata failed for curated ${entry.id}: ${errMsg(err)}`);
    }
  }

  // (b) Folder scan — list each root folder and descend one level into
  // sub-folders (Drive is organised by lecturer; T1 banks live one level down).
  for (const folderId of ROOT_FOLDER_ID_LIST) {
    let files: Awaited<ReturnType<typeof listFolder>> = [];
    try {
      files = await listFolder(folderId);
    } catch (err) {
      logLine(`discover: listFolder failed for ${folderId}: ${errMsg(err)}`);
      continue;
    }
    for (const f of files) {
      if (!f.id) continue;
      const mime = f.mimeType ?? '';
      if (mime === 'application/vnd.google-apps.folder') {
        // Descend one level.
        try {
          const sub = await listFolder(f.id);
          for (const sf of sub) addListed(byId, sf);
        } catch (err) {
          logLine(`discover: sub-listFolder failed for ${f.id}: ${errMsg(err)}`);
        }
        continue;
      }
      addListed(byId, f);
    }
  }

  return [...byId.values()];
}

function addListed(
  byId: Map<string, DiscoveredFile>,
  f: { id?: string | null; name?: string | null; mimeType?: string | null },
): void {
  if (!f.id) return;
  const mime = f.mimeType ?? '';
  const parseable = isParseableMime(mime);
  // Only keep listed files that are parseable OR already in the curated set.
  if (!parseable && !T1_FILE_ID_SET.has(f.id)) return;
  if (byId.has(f.id)) return;
  byId.set(f.id, { id: f.id, name: f.name ?? f.id, mimeType: mime, parseable });
}

// ─── Download + cache ─────────────────────────────────────────────────
/**
 * Return the local cache path for a file, downloading/exporting if missing.
 * In dry-run we never hit the network: if uncached we return null (the caller
 * reports "would download").
 */
async function ensureCached(file: DiscoveredFile, mode: Mode): Promise<string | null> {
  const ext = cacheExtForMime(file.mimeType);
  const cachePath = join(CACHE_DIR, `${file.id}.${ext}`);
  if (existsSync(cachePath)) return cachePath;
  if (mode === 'dry-run') return null;

  mkdirSync(CACHE_DIR, { recursive: true });
  let buf: Buffer;
  if (file.mimeType === T1_PARSEABLE_MIME_TYPES.googleDoc) {
    // Export native Google Doc → DOCX.
    buf = await exportFile(file.id, T1_PARSEABLE_MIME_TYPES.docx);
  } else {
    buf = await downloadFile(file.id);
  }
  writeFileSync(cachePath, buf);
  return cachePath;
}

// ─── Parse routing ──────────────────────────────────────────────────────
async function parseFile(file: DiscoveredFile, cachePath: string): Promise<ParsedQuestion[]> {
  const ext = cacheExtForMime(file.mimeType);
  const result = ext === 'pdf' ? await parsePdfMcq(cachePath) : await parseDocxQA(cachePath);
  return result.questions;
}

// ─── Logging / report ───────────────────────────────────────────────────
let reportStream: string[] = [];
function logLine(msg: string): void {
  process.stderr.write(`[import-content] ${msg}\n`);
}
function record(rec: ReportRecord): void {
  reportStream.push(JSON.stringify(rec));
}

function flushReport(tsLabel: string): string {
  mkdirSync(LOGS_DIR, { recursive: true });
  const reportPath = join(LOGS_DIR, `import-${tsLabel}.jsonl`);
  writeFileSync(reportPath, reportStream.join('\n') + (reportStream.length ? '\n' : ''));
  return reportPath;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const { tier, mode } = parseArgs(process.argv);
  const tsLabel = new Date().toISOString().replace(/[:.]/g, '-');
  reportStream = [];

  logLine(`tier=${tier} mode=${mode} (target tier ${TIER})`);
  if (tier !== 't1') {
    logLine(`only 't1' is implemented; got '${tier}'. Aborting.`);
    process.exit(2);
  }

  // Lazily pull in the DB-touching module ONLY for --execute, so --dry-run does
  // not require DATABASE_URL (the db module throws at import without it).
  let upsertQuestions: typeof UpsertQuestionsFn | null = null;
  let tagScope: typeof TagScopeFn | null = null;

  if (mode === 'execute') {
    ({ upsertQuestions } = await import('../src/lib/import/upsert-questions'));
    ({ tagScope } = await import('../src/lib/import/scope-tagger'));
  }

  // 1. Discover.
  logLine('discovering Drive files…');
  const discovered = await discover();
  const parseable = discovered.filter((f) => f.parseable);
  logLine(`discovered ${discovered.length} files (${parseable.length} parseable T1).`);

  // 2. Pre-flight cost estimate + budget guard (default-deny).
  // We don't know question counts until we parse, so estimate against the
  // runaway cap to bound the worst case for the budget gate.
  const worstCaseCalls = parseable.length * BUDGET.maxQuestionsPerFile;
  const cappedCalls = Math.min(worstCaseCalls, BUDGET.maxGeminiCalls);
  const estUsd = cappedCalls * BUDGET.estUsdPerGeminiCall;
  logLine(
    `budget: maxGeminiCalls=${BUDGET.maxGeminiCalls}, ` +
      `est worst-case spend ≤ $${(BUDGET.maxGeminiCalls * BUDGET.estUsdPerGeminiCall).toFixed(2)}, ` +
      `hardCap=$${BUDGET.totalUsdHardCap}.`,
  );
  if (
    mode === 'execute' &&
    BUDGET.maxGeminiCalls * BUDGET.estUsdPerGeminiCall > BUDGET.totalUsdHardCap
  ) {
    logLine(
      `ABORT: configured maxGeminiCalls would exceed totalUsdHardCap ` +
        `($${(BUDGET.maxGeminiCalls * BUDGET.estUsdPerGeminiCall).toFixed(2)} > $${BUDGET.totalUsdHardCap}). ` +
        'Lower BUDGET.maxGeminiCalls or raise the cap intentionally.',
    );
    process.exit(3);
  }

  // 3. Per-file: download/cache → parse → map → (execute) tag + upsert.
  let geminiCallsUsed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalQuestions = 0;
  let filesParsed = 0;
  let filesFailed = 0;

  for (const file of parseable) {
    try {
      const cachePath = await ensureCached(file, mode);
      if (cachePath === null) {
        // dry-run, uncached: plan only.
        record({
          ts: new Date().toISOString(),
          fileId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          status: 'skipped',
          reason: 'dry-run: would download (not cached)',
        });
        logLine(`plan: would download ${file.name} (${file.id})`);
        continue;
      }

      const parsed = await parseFile(file, cachePath);
      const capped = parsed.slice(0, BUDGET.maxQuestionsPerFile);
      totalQuestions += capped.length;
      filesParsed += 1;

      record({
        ts: new Date().toISOString(),
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        status: 'parsed',
        questionsFound: capped.length,
      });
      logLine(`parsed ${capped.length} questions from ${file.name}`);

      if (mode === 'dry-run') continue;

      // ── execute: map → tagScope → upsert ──
      const rows: NewQuestion[] = [];
      let fileGeminiCalls = 0;

      for (let i = 0; i < capped.length; i += 1) {
        const pq = capped[i]!;
        const ref = sourceRefFor(file.id, i);
        const row = mapQuestion(pq, ref);

        // Scope-tag (Gemini) only while under the global call budget.
        if (tagScope && geminiCallsUsed < BUDGET.maxGeminiCalls) {
          try {
            const tag = await tagScope(pq.rawText ?? pq.question, file.name);
            geminiCallsUsed += 1;
            fileGeminiCalls += 1;
            row.scopeRefs = tag.scope_refs;
            row.inScope = tag.in_scope;
            row.status = tag.status;
          } catch (err) {
            // tagScope is designed not to throw, but be defensive: keep the
            // default-deny mapping and continue.
            logLine(`tagScope error on ${file.id}#${i}: ${errMsg(err)}`);
          }
        }
        rows.push(row);
      }

      const { inserted, skipped } = await upsertQuestions!(rows);
      totalInserted += inserted;
      totalSkipped += skipped;

      record({
        ts: new Date().toISOString(),
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        status: 'upserted',
        questionsFound: capped.length,
        inserted,
        skipped,
        geminiCalls: fileGeminiCalls,
      });
      logLine(`upserted ${file.name}: +${inserted} inserted, ${skipped} skipped (idempotent).`);
    } catch (err) {
      // Per-file failure → record + continue (do NOT abort the whole run).
      filesFailed += 1;
      record({
        ts: new Date().toISOString(),
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        status: 'failed',
        reason: errMsg(err),
      });
      logLine(`FAILED ${file.name} (${file.id}): ${errMsg(err)} — skipping.`);
    }
  }

  // 4. Report + summary.
  const reportPath = flushReport(tsLabel);
  logLine('──────── summary ────────');
  logLine(`mode:           ${mode}`);
  logLine(`files parseable:${parseable.length}`);
  logLine(`files parsed:   ${filesParsed}`);
  logLine(`files failed:   ${filesFailed}`);
  logLine(`questions found:${totalQuestions}`);
  if (mode === 'execute') {
    logLine(`inserted:       ${totalInserted}`);
    logLine(`skipped:        ${totalSkipped}`);
    logLine(`gemini calls:   ${geminiCallsUsed}/${BUDGET.maxGeminiCalls}`);
    logLine(`est. spend:     ~$${(geminiCallsUsed * BUDGET.estUsdPerGeminiCall).toFixed(4)}`);
  } else {
    logLine(`(dry-run: no Gemini calls, no DB writes — est worst-case ~$${estUsd.toFixed(2)})`);
  }
  logLine(`report:         ${reportPath}`);
  logLine('─────────────────────────');
}

main().catch((err: unknown) => {
  logLine(`fatal: ${errMsg(err)}`);
  process.exit(1);
});
