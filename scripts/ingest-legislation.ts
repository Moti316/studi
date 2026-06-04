/**
 * scripts/ingest-legislation.ts — הטמעת קורפוס-החקיקה (RAG) ל-`chunks`.
 *
 * קורא את נוסחי-החקיקה ה-verbatim (Nevo `.md`) מ-
 * `courses/safety-officer/sources/legislation/`, מחלק ל-chunks, מטמיע דרך Gemini
 * (`gemini-embedding-001` ב-`outputDimensionality:1024` כדי להתיישר עם
 * `chunks.embedding = vector(1024)` — ללא מיגרציית-סכמה), ומכניס
 * `content_sources` + `chunks`. **אידמפוטנטי** לפי `content_hash` (אינו מטמיע-מחדש קובץ לא-משונה).
 *
 * ⚠️ הטמעה ⇒ **עולה כסף** (Gemini). הרץ רק באישור-מוטי (כלל אפס-כסף).
 *   tsx scripts/ingest-legislation.ts --probe     # מטמיע chunk-בודד, מדפיס מימד, ללא-DB
 *   tsx scripts/ingest-legislation.ts --dry-run   # chunk-בלבד, ללא embed/DB (ברירת-מחדל)
 *   tsx scripts/ingest-legislation.ts --execute   # הטמעה מלאה + כתיבה ל-DB
 */
// dotenv ראשון — db/index.ts קורא process.env.DATABASE_URL בעת-import (לכן db מיובא דינמית ב-execute).
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { chunkText } from '../src/lib/rag/chunker';
import { embedChunks, type EmbedFn } from '../src/lib/rag/embedder';
import { getGeminiClient, GeminiClientError } from '../src/lib/ai/client';

const LEGI_DIR = join(process.cwd(), 'courses', 'safety-officer', 'sources', 'legislation');
const EMBED_MODEL = process.env.GEMINI_MODEL_EMBEDDING_RAG ?? 'gemini-embedding-001';
const EMBED_DIM = 1024; // מתיישר עם chunks.embedding = vector(1024)
const SKIP_FILES = new Set(['README.md', 'INDEX.md']);

interface LegiDoc {
  driveFileId: string; // מזהה-סינתטי יציב (לא קובץ-Drive): "legislation:<relPath>"
  scopeId: string;
  title: string;
  body: string;
  contentHash: string;
  relPath: string;
  bytes: number;
}

/** מפריד frontmatter (בין שני `---`) ומחזיר {fm, body}. ניתוח-קל (ללא תלות js-yaml). */
function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fmBlock = m[1] ?? '';
  const bodyBlock = m[2] ?? '';
  const fm: Record<string, string> = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv && kv[1]) fm[kv[1]] = (kv[2] ?? '').replace(/^['"]|['"]$/g, '').trim();
  }
  return { fm, body: bodyBlock.trim() };
}

function* walkMd(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkMd(p);
    else if (e.name.endsWith('.md') && !SKIP_FILES.has(e.name)) yield p;
  }
}

function loadDocs(): LegiDoc[] {
  const docs: LegiDoc[] = [];
  for (const path of walkMd(LEGI_DIR)) {
    const raw = readFileSync(path, 'utf8');
    const { fm, body } = parseFrontmatter(raw);
    if (!body || !fm.scope_id) continue;
    const relPath = relative(LEGI_DIR, path).split(sep).join('/');
    docs.push({
      driveFileId: `legislation:${relPath}`,
      scopeId: fm.scope_id,
      title: fm.title ?? relPath,
      body,
      contentHash: createHash('sha256').update(body).digest('hex'),
      relPath,
      bytes: Buffer.byteLength(body, 'utf8'),
    });
  }
  return docs.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function l2normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

const MIN_INTERVAL_MS = 1200; // מרווח-מינימום בין קריאות (הגנת-RPM)
let lastCallMs = 0;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
function is429(err: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  const status = e?.status ?? e?.code ?? e?.cause?.status;
  return (
    status === 429 || /\b429\b|RESOURCE_EXHAUSTED|quota|rate limit/i.test(String(e?.message ?? ''))
  );
}

/** EmbedFn מבוסס-Gemini ב-1024 מימדים · throttle + retry-on-429 (backoff). עולה כסף. */
function createEmbed1024(taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'): EmbedFn {
  return async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const models = getGeminiClient().models as any;
    const maxRetries = 6;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const gap = Date.now() - lastCallMs;
      if (gap < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - gap);
      lastCallMs = Date.now();
      try {
        const res: { embeddings?: Array<{ values?: number[] }> } = await models.embedContent({
          model: EMBED_MODEL,
          contents: texts,
          config: { outputDimensionality: EMBED_DIM, taskType },
        });
        const vecs = (res.embeddings ?? []).map((e) => l2normalize(e.values ?? []));
        if (vecs.length !== texts.length) {
          throw new GeminiClientError(
            `embed count mismatch: ${vecs.length} vectors for ${texts.length} inputs (model=${EMBED_MODEL}).`,
          );
        }
        return vecs;
      } catch (err) {
        if (is429(err) && attempt < maxRetries) {
          const backoff = Math.min(60_000, 4_000 * 2 ** attempt);
          console.log(
            `  …429 rate-limit — backoff ${Math.round(backoff / 1000)}s (attempt ${attempt + 1}/${maxRetries})`,
          );
          await sleep(backoff);
          continue;
        }
        throw new GeminiClientError(`Gemini embedContent failed (model=${EMBED_MODEL})`, err);
      }
    }
    throw new GeminiClientError(`Gemini embedContent: exhausted retries (model=${EMBED_MODEL})`);
  };
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--execute')
    ? 'execute'
    : process.argv.includes('--probe')
      ? 'probe'
      : 'dry-run';
  const docs = loadDocs();
  console.log(`[ingest-legislation] mode=${mode} · model=${EMBED_MODEL} · dim=${EMBED_DIM}`);
  console.log(`[ingest-legislation] found ${docs.length} statutes in ${LEGI_DIR}`);
  if (docs.length === 0) throw new Error('no legislation .md found — check path');

  // צ'אנקינג (דטרמיניסטי · חינם)
  const chunked = docs.map((d) => ({
    doc: d,
    chunks: chunkText(d.body, { maxTokens: 512, overlapTokens: 64 }),
  }));
  const totalChunks = chunked.reduce((s, c) => s + c.chunks.length, 0);
  console.log(`[ingest-legislation] chunks: ${totalChunks} (across ${docs.length} statutes)`);

  if (mode === 'probe') {
    const first = chunked.find((c) => c.chunks.length > 0);
    const firstChunk = first?.chunks[0];
    if (!firstChunk) throw new Error('no chunks produced');
    const embed = createEmbed1024('RETRIEVAL_DOCUMENT');
    const [v] = await embed([firstChunk.text]);
    if (!v) throw new Error('probe: embed returned no vector');
    console.log(
      `[ingest-legislation] PROBE: embedded 1 chunk → dim=${v.length} (expected ${EMBED_DIM})`,
    );
    if (v.length !== EMBED_DIM) {
      console.error(
        `[ingest-legislation] ⚠️ DIM MISMATCH — model returned ${v.length}, schema expects ${EMBED_DIM}.`,
      );
      process.exitCode = 2;
    }
    return;
  }

  if (mode === 'dry-run') {
    for (const { doc, chunks } of chunked) {
      console.log(
        `  · ${doc.scopeId.padEnd(7)} ${doc.relPath} → ${chunks.length} chunks (${doc.bytes}B)`,
      );
    }
    console.log('[ingest-legislation] dry-run: no Gemini calls, no DB writes.');
    return;
  }

  // execute — db מיובא דינמית (אחרי loadEnv) כי הוא קורא env בעת-import.
  const { db, schema } = await import('../src/lib/db');
  const embed = createEmbed1024('RETRIEVAL_DOCUMENT');
  let inserted = 0;
  let skipped = 0;
  let chunkRows = 0;
  for (const { doc, chunks } of chunked) {
    const existing = await db
      .select({ id: schema.contentSources.id, hash: schema.contentSources.contentHash })
      .from(schema.contentSources)
      .where(eq(schema.contentSources.driveFileId, doc.driveFileId));
    if (existing[0]?.hash === doc.contentHash) {
      skipped++;
      continue; // לא-משונה → לא מטמיעים-מחדש (חוסך כסף)
    }
    if (existing[0]) {
      await db.delete(schema.contentSources).where(eq(schema.contentSources.id, existing[0].id)); // cascade → chunks
    }
    const scopeRefs = [{ id: doc.scopeId, confidence: 1 }];
    const [src] = await db
      .insert(schema.contentSources)
      .values({
        driveFileId: doc.driveFileId,
        title: doc.title,
        mimeType: 'text/markdown',
        sizeBytes: doc.bytes,
        tier: 'T2',
        scopeRefs,
        inScope: true,
        contentHash: doc.contentHash,
      })
      .returning({ id: schema.contentSources.id });
    if (!src) throw new Error(`insert content_source returned no row for ${doc.relPath}`);

    if (chunks.length > 0) {
      const embedded = await embedChunks(chunks, embed, { batchSize: 16, expectedDim: EMBED_DIM });
      await db.insert(schema.chunks).values(
        embedded.map((c) => ({
          sourceId: src.id,
          chunkIndex: c.chunkIndex,
          text: c.text,
          embedding: c.embedding,
          inScope: true,
          scopeRefs,
          status: 'מאומת' as const,
          tokenCount: c.tokenCount,
        })),
      );
      chunkRows += embedded.length;
    }
    inserted++;
    console.log(`  ✓ ${doc.scopeId.padEnd(7)} ${doc.relPath} (${chunks.length} chunks)`);
  }
  console.log(
    `[ingest-legislation] done: ${inserted} sources inserted/updated · ${skipped} unchanged-skipped · ${chunkRows} chunks embedded.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[ingest-legislation] FAILED:', err);
    process.exit(1);
  });
