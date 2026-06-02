#!/usr/bin/env tsx
/**
 * scripts/fetch-legislation.ts — A2 legislation corpus fetcher.
 *
 * Downloads the 39 public-domain Israeli legislation texts in
 * `legislation-manifest.ts` from Nevo, extracts them VERBATIM via the
 * non-generative `stripNevoHtml`, and writes clean `.md` + frontmatter under
 * `courses/safety-officer/sources/legislation/<chapter>/`.
 *
 * Usage:
 *   pnpm legislation:fetch:dry            # plan only (no network beyond cache, no writes)
 *   pnpm legislation:fetch                # download → cache → strip → write .md
 *   pnpm legislation:verify               # L2–L5 checks on existing .md (no network)
 *   tsx scripts/fetch-legislation.ts --verify-live   # verify + re-fetch token-diff (L1)
 *   tsx scripts/fetch-legislation.ts --execute --only=2.3   # one source (debug)
 *   tsx scripts/fetch-legislation.ts --execute --refresh     # ignore cache, re-fetch
 *
 * Guarantees:
 * - dotenv first (convention; this script needs no secrets — Nevo is public).
 * - AI cost = $0: extraction is deterministic, no Gemini.
 * - Per-source failure is isolated (record + continue, never abort the run).
 * - Idempotent: cached raw HTML ⇒ re-run does 0 network + byte-identical output.
 * - Verbatim: stripNevoHtml asserts L1 zero-loss internally; --verify(-live)
 *   re-checks L2–L5 (+ live token-diff) on the written corpus.
 */

// ── dotenv FIRST (convention) ──
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

import {
  LEGISLATION_SOURCES,
  fileNameFor,
  relPathFor,
  validateManifest,
} from './legislation-manifest';
import type { LegislationSource } from './legislation-manifest';
import { stripNevoHtml } from '../src/lib/import/strip-nevo-html';
import {
  verifyLegislationContent,
  splitFrontmatter,
  liveTokenDiff,
} from '../src/lib/import/verify-legislation';

// ─── Paths / constants ──────────────────────────────────────────────────
const CACHE_DIR = resolve('.cache', 'nevo');
const LOGS_DIR = resolve('logs');
const LEGISLATION_ROOT = resolve('courses', 'safety-officer', 'sources', 'legislation');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StudiBuilder/legislation-fetch (public-domain corpus)';
const EXTRACTOR_TAG = 'fetch-legislation@1';
const AUTHORITATIVE_SOURCE = 'רשומות / קובץ-התקנות';
const FETCH_DELAY_MS = 250; // be polite to Nevo between live fetches

type Mode = 'dry-run' | 'execute' | 'verify' | 'verify-live';

interface Args {
  mode: Mode;
  refresh: boolean;
  only: string | null;
}

interface ReportRecord {
  ts: string;
  scopeId: string;
  subId?: string;
  file: string;
  status: 'planned' | 'written' | 'cached' | 'skipped' | 'failed' | 'verified' | 'verify-failed';
  charset?: string;
  versionDate?: string | null;
  sectionCount?: number;
  bytes?: number;
  reason?: string;
  warnings?: string[];
}

// ─── arg parsing ──────────────────────────────────────────────────────
function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  let mode: Mode = 'dry-run';
  if (args.includes('--verify-live')) mode = 'verify-live';
  else if (args.includes('--verify')) mode = 'verify';
  else if (args.includes('--execute')) mode = 'execute';
  const onlyArg = args.find((a) => a.startsWith('--only='));
  return {
    mode,
    refresh: args.includes('--refresh'),
    only: onlyArg ? onlyArg.slice('--only='.length) : null,
  };
}

// ─── logging / report ───────────────────────────────────────────────────
let reportStream: string[] = [];
function logLine(msg: string): void {
  process.stderr.write(`[fetch-legislation] ${msg}\n`);
}
function record(rec: ReportRecord): void {
  reportStream.push(JSON.stringify(rec));
}
function flushReport(tsLabel: string): string {
  mkdirSync(LOGS_DIR, { recursive: true });
  const reportPath = join(LOGS_DIR, `fetch-legislation-${tsLabel}.jsonl`);
  writeFileSync(reportPath, reportStream.join('\n') + (reportStream.length ? '\n' : ''));
  return reportPath;
}
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── charset-aware fetch ─────────────────────────────────────────────────
function normalizeCharset(cs: string | undefined | null): string | null {
  if (!cs) return null;
  const c = cs.toLowerCase().trim();
  if (c === 'utf8' || c === 'utf-8') return 'utf-8';
  if (c === 'windows-1255' || c === 'cp1255' || c === 'iso-8859-8' || c === 'iso-8859-8-i')
    return 'windows-1255';
  return c;
}

/**
 * Density of REAL Hebrew letters (א–ת, U+05D0–U+05EA) per character — the charset
 * discriminator. A correct UTF-8 decoding of a Hebrew page is letter-dense; the
 * same bytes mis-decoded as windows-1255 turn into geresh/symbol soup (mostly
 * U+05F3 ׳, which is punctuation NOT a letter), so its א–ת density collapses.
 * Counting the whole [֐-׿] block instead would mis-count that geresh soup as
 * "Hebrew" — the bug that flipped a UTF-8 page to windows-1255.
 */
function hebrewDensity(text: string): number {
  if (text.length === 0) return 0;
  return (text.match(/[א-ת]/g) ?? []).length / text.length;
}

/**
 * Decode raw HTML bytes, picking the charset that yields the cleanest Hebrew.
 * Order of candidates: explicit hint → HTTP header → <meta charset> → utf-8 →
 * windows-1255. Winner = highest (hebrew-letter density − replacement-char
 * density); the replacement penalty is PROPORTIONAL so a single stray byte in a
 * correct UTF-8 page doesn't flip it to windows-1255.
 */
function decodeHtml(
  buf: Buffer,
  headerContentType: string | null,
  hint: string | undefined,
): { text: string; charset: string } {
  const headerCs = headerContentType?.match(/charset=([\w-]+)/i)?.[1];
  const head = new TextDecoder('latin1').decode(buf.subarray(0, 4096));
  const metaCs = head.match(/charset=["']?([\w-]+)/i)?.[1];

  const candidates = [hint, headerCs, metaCs, 'utf-8', 'windows-1255'];
  const tried = new Set<string>();
  let best: { text: string; charset: string; score: number } | null = null;
  for (const raw of candidates) {
    const cs = normalizeCharset(raw);
    if (!cs || tried.has(cs)) continue;
    tried.add(cs);
    let text: string;
    try {
      text = new TextDecoder(cs).decode(buf);
    } catch {
      continue;
    }
    const replacementDensity = (text.match(/�/g) ?? []).length / Math.max(1, text.length);
    const score = hebrewDensity(text) - replacementDensity;
    if (!best || score > best.score) best = { text, charset: cs, score };
  }
  if (!best) throw new Error('could not decode HTML with any candidate charset');
  return { text: best.text, charset: best.charset };
}

const cachePathFor = (source: LegislationSource): string =>
  join(CACHE_DIR, basename(new URL(source.url).pathname).replace(/\.html?$/i, '') + '.html');

/**
 * Return decoded HTML, fetching if missing. The cache stores RAW BYTES (not
 * decoded text) so decoding happens on every read — an improvement to the
 * charset detector applies to cached pages too, with no poisoned-cache risk.
 * dry-run never hits the network: an uncached source returns null (the caller
 * reports "would download").
 */
async function ensureHtml(
  source: LegislationSource,
  mode: Mode,
  refresh: boolean,
): Promise<{ html: string; charset: string; cached: boolean } | null> {
  const cachePath = cachePathFor(source);
  if (!refresh && existsSync(cachePath)) {
    const buf = readFileSync(cachePath); // raw bytes
    const { text, charset } = decodeHtml(buf, null, source.charsetHint);
    return { html: text, charset, cached: true };
  }
  if (mode === 'dry-run') return null;

  const res = await fetch(source.url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { text, charset } = decodeHtml(buf, res.headers.get('content-type'), source.charsetHint);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, buf); // cache RAW bytes
  await sleep(FETCH_DELAY_MS);
  return { html: text, charset, cached: false };
}

// ─── frontmatter ─────────────────────────────────────────────────────────
function yamlStr(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function buildMarkdown(
  source: LegislationSource,
  stripped: ReturnType<typeof stripNevoHtml>,
  fetchDate: string,
): string {
  const fm: string[] = ['---', `scope_id: ${yamlStr(source.scopeId)}`];
  if (source.subId) fm.push(`sub_id: ${yamlStr(source.subId)}`);
  fm.push(
    `title: ${yamlStr(stripped.title || source.officialTitle)}`,
    `source: nevo`,
    `source_url: ${yamlStr(source.url)}`,
    `version_date: ${stripped.versionDate ? yamlStr(stripped.versionDate) : 'null'}`,
    `fetch_date: ${yamlStr(fetchDate)}`,
    `license: public-domain`,
    `authoritative_source: ${yamlStr(AUTHORITATIVE_SOURCE)}`,
    `section_count: ${stripped.sectionNumbers.length}`,
    `heading_count: ${stripped.headingCount}`,
    `source_complete: ${source.knownGap ? 'false' : 'true'}`,
  );
  if (source.knownGap) fm.push(`gap_note: ${yamlStr(source.knownGap)}`);
  if (source.covers && source.covers.length) {
    fm.push(`covers: [${source.covers.map(yamlStr).join(', ')}]`);
  }
  fm.push(`extractor: ${yamlStr(EXTRACTOR_TAG)}`, '---', '');
  return `${fm.join('\n')}\n${stripped.body}\n`;
}

// ─── modes ─────────────────────────────────────────────────────────────
function selectSources(only: string | null): readonly LegislationSource[] {
  if (!only) return LEGISLATION_SOURCES;
  return LEGISLATION_SOURCES.filter((s) => s.scopeId === only || s.subId === only);
}

async function runFetch(args: Args, fetchDate: string): Promise<void> {
  const sources = selectSources(args.only);
  let written = 0;
  let planned = 0;
  let failed = 0;
  for (const source of sources) {
    const file = relPathFor(source);
    try {
      const got = await ensureHtml(source, args.mode, args.refresh);
      if (got === null) {
        planned += 1;
        record({
          ts: new Date().toISOString(),
          scopeId: source.scopeId,
          subId: source.subId,
          file,
          status: 'planned',
          reason: 'dry-run: would download (not cached)',
        });
        logLine(`plan: would download ${fileNameFor(source)} ← ${source.url}`);
        continue;
      }
      const stripped = stripNevoHtml(got.html); // throws LosslessViolationError on L1 breach
      if (args.mode === 'dry-run') {
        planned += 1;
        record({
          ts: new Date().toISOString(),
          scopeId: source.scopeId,
          subId: source.subId,
          file,
          status: 'cached',
          charset: got.charset,
          versionDate: stripped.versionDate,
          sectionCount: stripped.sectionNumbers.length,
        });
        logLine(
          `plan(cached): ${fileNameFor(source)} — ${stripped.sectionNumbers.length} sections, version ${stripped.versionDate ?? '?'}`,
        );
        continue;
      }
      const md = buildMarkdown(source, stripped, fetchDate);
      const outPath = resolve(file);
      mkdirSync(join(LEGISLATION_ROOT, source.chapterDir), { recursive: true });
      writeFileSync(outPath, md, 'utf8');
      written += 1;
      record({
        ts: new Date().toISOString(),
        scopeId: source.scopeId,
        subId: source.subId,
        file,
        status: 'written',
        charset: got.charset,
        versionDate: stripped.versionDate,
        sectionCount: stripped.sectionNumbers.length,
        bytes: Buffer.byteLength(md),
      });
      logLine(
        `wrote ${fileNameFor(source)} (${stripped.sectionNumbers.length} sections, ${got.cached ? 'cached' : got.charset})`,
      );
    } catch (err) {
      failed += 1;
      record({
        ts: new Date().toISOString(),
        scopeId: source.scopeId,
        subId: source.subId,
        file,
        status: 'failed',
        reason: errMsg(err),
      });
      logLine(`FAILED ${fileNameFor(source)}: ${errMsg(err)} — skipping.`);
    }
  }
  logLine('──────── summary ────────');
  logLine(`mode:    ${args.mode}`);
  logLine(`sources: ${sources.length}`);
  if (args.mode === 'execute') logLine(`written: ${written}`);
  else logLine(`planned: ${planned}`);
  logLine(`failed:  ${failed}`);
  logLine('AI cost: $0 (deterministic extraction)');
}

async function runVerify(args: Args): Promise<void> {
  const sources = selectSources(args.only);
  let okCount = 0;
  let failCount = 0;
  let warnCount = 0;
  for (const source of sources) {
    const outPath = resolve(relPathFor(source));
    const file = relPathFor(source);
    if (!existsSync(outPath)) {
      failCount += 1;
      record({
        ts: new Date().toISOString(),
        scopeId: source.scopeId,
        subId: source.subId,
        file,
        status: 'verify-failed',
        reason: 'file missing',
      });
      logLine(`MISSING ${fileNameFor(source)}`);
      continue;
    }
    const content = readFileSync(outPath, 'utf8');
    const result = verifyLegislationContent(content, {
      fileName: fileNameFor(source),
      officialTitle: source.officialTitle,
      expectedScopeId: source.scopeId,
    });

    // L1 live cross-check (re-fetch + token-diff).
    let liveNote = '';
    if (args.mode === 'verify-live') {
      try {
        const res = await fetch(source.url, { headers: { 'User-Agent': USER_AGENT } });
        const buf = Buffer.from(await res.arrayBuffer());
        const { text } = decodeHtml(buf, res.headers.get('content-type'), source.charsetHint);
        const { body } = splitFrontmatter(content);
        const diff = liveTokenDiff(body, text);
        liveNote = diff.identical
          ? ' | live: identical'
          : ` | live: DIVERGED @${diff.firstDivergence} (saved ${diff.savedTokenCount} vs live ${diff.liveTokenCount})`;
        await sleep(FETCH_DELAY_MS);
      } catch (err) {
        liveNote = ` | live: fetch error ${errMsg(err)}`;
      }
    }

    const failedChecks = result.checks.filter((c) => !c.ok);
    if (result.warnings.length) warnCount += 1;
    if (result.ok && !liveNote.includes('DIVERGED')) {
      okCount += 1;
      record({
        ts: new Date().toISOString(),
        scopeId: source.scopeId,
        subId: source.subId,
        file,
        status: 'verified',
        warnings: [...result.warnings],
      });
      logLine(
        `OK ${fileNameFor(source)}${result.warnings.length ? ` (warn: ${result.warnings.join('; ')})` : ''}${liveNote}`,
      );
    } else {
      failCount += 1;
      record({
        ts: new Date().toISOString(),
        scopeId: source.scopeId,
        subId: source.subId,
        file,
        status: 'verify-failed',
        reason: failedChecks.map((c) => `${c.id}: ${c.detail ?? ''}`).join(' | ') + liveNote,
        warnings: [...result.warnings],
      });
      logLine(
        `FAIL ${fileNameFor(source)}: ${failedChecks.map((c) => c.id).join(', ')}${liveNote}`,
      );
    }
  }
  logLine('──────── verify summary ────────');
  logLine(`verified ok: ${okCount}/${sources.length}`);
  logLine(`failed:      ${failCount}`);
  logLine(`with warns:  ${warnCount}`);
}

// ─── main ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const tsLabel = new Date().toISOString().replace(/[:.]/g, '-');
  const fetchDate = new Date().toISOString().slice(0, 10);
  reportStream = [];

  const manifestErrors = validateManifest();
  if (manifestErrors.length) {
    logLine(`manifest invalid:\n  ${manifestErrors.join('\n  ')}`);
    process.exit(2);
  }
  logLine(
    `mode=${args.mode} only=${args.only ?? '(all)'} refresh=${args.refresh} sources=${selectSources(args.only).length}`,
  );

  if (args.mode === 'verify' || args.mode === 'verify-live') {
    await runVerify(args);
  } else {
    await runFetch(args, fetchDate);
  }

  const reportPath = flushReport(tsLabel);
  logLine(`report: ${reportPath}`);
}

main().catch((err: unknown) => {
  logLine(`fatal: ${errMsg(err)}`);
  process.exit(1);
});
