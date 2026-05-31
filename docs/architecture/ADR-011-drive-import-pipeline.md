# ADR-011: Drive Import Pipeline — `scripts/import-content.ts`

> **Status**: Proposed
> **Date**: 2026-05-30
> **Authors**: tech-lead · backend-engineer · motilev8
> **Phase**: 4-5 (תיאום: T1 ל-Phase 5, T2+T3 ל-Phase 4)
> **References**: ADR-005 (NotebookLM hybrid), ADR-009 (Magen integration — Drive=source-of-truth), ADR-010 (DB schema — חיצוני להחלטה זו), `docs/content-inventory.md`, `docs/content-scope.md`, `docs/mvp-plan-2026-07-15.md` §10

---

> **⚠️ עדכון 2026-05-31 — ספק-AI:** הצינור עובר ל-**Google Gemini** (ADR-001 Amendment): scope-tagging ב-**Gemini 2.5 Flash** (במקום Claude Haiku), embeddings ב-**`gemini-embedding-001`** (במקום voyage-3), SDK = **`@google/genai`** (במקום `@anthropic-ai/sdk`). דוגמאות-הקוד למטה ממחישות את ה**זרימה** — שמות-המודלים/SDK/קריאות-ה-embed יוחלפו ל-Gemini במימוש, וממד-הוקטור ב-pgvector (`vector(N)`) יתאים למודל-Gemini הנבחר. תקציבי-העלות יחושבו מחדש לפי תמחור-Gemini (זול יותר, כולל tier חינמי).

## Context

מ-ADR-009 הוחלט: **Google Drive = source-of-truth** לכל תוכן-לימוד של מוטי. סריקת-Drive (2026-05-30) זיהתה ~130 קבצים ב-2 תיקיות-שורש, ~6 GB סה"כ, מסווגים ל-4 tiers:

| Tier   | תוכן                        | קבצים | יעד ב-DB                       | קריטיות-MVP    |
| ------ | --------------------------- | ----- | ------------------------------ | -------------- |
| **T1** | שאלות-ותשובות (Quiz Source) | 18    | `questions`                    | חובה Phase 5   |
| **T2** | חומרי-לימוד (RAG Context)   | ~52   | `chunks` + pgvector            | חובה Phase 4-5 |
| **T3** | חוקים/תקנות (Legal Sources) | ~10   | `chunks` + scope-mapping מדויק | חובה Phase 4   |
| **T4** | מדיה (m4a/mp4/jpg)          | ~50   | — דחוי post-deadline           | דחוי           |

ב-MVP-plan §10 הוגדר ששבוע-1 הוא **Drive Discovery + Adapter Drive→Supabase**. ה-ADR הזה מעצב את הארכיטקטורה של ה-Adapter — `scripts/import-content.ts`.

יש 3 אילוצים-קשים:

1. **Deadline 2026-07-15**: pipeline שעובד על T1 חייב להיות up-and-running סוף-שבוע-1.
2. **Scope-filter חובה** (ADR-005 §Committee Scope Filter): כל chunk/question נושא `in_scope` + `scope_refs[]` מול 21 פריטי-חקיקה.
3. **Cost-control**: ~130 קבצים × embeddings × Claude-classify יכול להגיע מהר ל-$30-50 לייבוא-יחיד. צריך תקציב-מקסימלי.

ה-pipeline הזה איננו Phase-4 build-from-PDF pipeline (שבו משתמש-קצה מעלה PDF ומקבל קורס). זה pipeline **content-ingestion ל-creator** — מוטי, single-user, מזין pre-curated content שלו.

---

## Decision

**`scripts/import-content.ts` = Node.js script (לא Inngest function), one-shot ידני, idempotent, מחולק ל-4 phases פר-tier. גישה ל-Drive דרך Google Drive API ישיר (לא notebooklm-mcp). Scope-filtering בשתי שכבות: regex-tagging מהיר בייבוא + Claude-Haiku verification ב-batch לאחר-מכן.**

### Runtime — Node.js script, לא Inngest

| שיקול            | Node.js script                                  | Inngest function                          |
| ---------------- | ----------------------------------------------- | ----------------------------------------- |
| **ניצוח**        | `pnpm import:t1` ידני בטרמינל                   | cron יומי / webhook Drive                 |
| **לוגים**        | stdout + file (`logs/import-{timestamp}.jsonl`) | Inngest dashboard                         |
| **debug**        | פשוט (breakpoint, replay)                       | מורכב (need Inngest dev-server)           |
| **failure**      | משתמש רואה מיידית, רץ-שוב                       | retries אוטומטיים, אבל harder-to-diagnose |
| **cost-control** | לפני-כל-ריצה — `--dry-run` שמראה תקציב משוער    | קשה לעצור באמצע                           |
| **MVP fit**      | ✅ Phase 4-5 — מוטי הוא היחיד שמייבא            | ❌ over-engineering ל-single-user         |

**הכרעה**: Node.js script `scripts/import-content.ts` נקרא דרך `pnpm import:<phase>`. **Inngest dispatch** של אותו ה-pipeline נדחה ל-Phase 10 (כשיהיו paying users + scheduled-sync).

החריג היחיד: **embedding-batch של T2** (~52 קבצים × ~30-100 chunks = ~3000 chunks → ~$5-15 ב-Voyage). אם מתברר ב-Phase 4 שמוטי רוצה לרענן embeddings מדי-שבוע — wrapper Inngest סביב אותה הפונקציה בלי לשנות את ה-core. **לא** wrapping מראש.

### Drive Access — Drive API ישיר, לא notebooklm-mcp

`notebooklm-mcp` הוא Claude-Code MCP server שדורש סשן-Claude-Code פעיל (stdio). ב-StudiBuilder יש Node.js רגיל בלי Claude-Code wrapping → אי-אפשר להשתמש ב-MCP server.

**הכרעה**: Google Drive API v3 ישיר עם `googleapis` SDK. OAuth offline-token של motilev8 נשמר ב-`.env.local` (REFRESH_TOKEN). scope: `https://www.googleapis.com/auth/drive.readonly`.

**הערה חשובה**: זה מוסיף `drive.readonly` scope ל-Google account של מוטי — אבל **רק ל-server-side script**, לא ל-public OAuth של אפליקציית-StudiBuilder. ADR-003 (Auth) הגדיר את ה-public-app כ-login-only — זה לא משתנה. מה שמתווסף הוא **service-credentials נפרדים** ל-import-script, לשימוש מוטי כ-admin.

### File-format parsers — ייעודי פר-extension

| Extension | Library                          | הערות                                              |
| --------- | -------------------------------- | -------------------------------------------------- |
| PDF       | `pdf-parse`                      | קל, no-deps. fallback ל-`pdfjs-dist` אם RTL-broken |
| docx      | `mammoth`                        | מחזיר HTML/Markdown — נשמר semantic structure      |
| pptx      | `pptx2json` או `node-pptx`       | extract טקסט מ-slides                              |
| GDoc      | Drive API export → text/markdown | native Drive export, איכותי                        |
| m4a/mp4   | —                                | T4, דחוי post-deadline                             |
| jpg/png   | —                                | T4, דחוי                                           |

נכשל-לפרסר → log + skip + report-at-end. לא חוסם את שאר ה-pipeline.

### Scope-filter — שכבה דו-שלבית

**שלב 1 — Regex tagging ב-ingestion (זול, מהיר):**

לכל chunk, חיפוש keywords של 21 ה-scope-IDs בשם-הקובץ + ב-100 התווים הראשונים של ה-chunk. דוגמה:

```ts
// Naive regex match — מהיר אבל לא מדויק
const SCOPE_KEYWORDS: Record<string, string[]> = {
  '1.0': ['חוק ארגון הפיקוח', 'ארגון הפיקוח על העבודה'],
  '1.1': ['ממונים על הבטיחות', 'תקנות ארגון הפיקוח (ממונים)'],
  '2.1': ['עבודה בגובה', 'גובה 2007'],
  // ... (21 entries)
};
```

**שלב 2 — Claude Haiku 4.5 verification (batch, אחר-כך):**

אחרי שכל ה-chunks ב-DB עם `in_scope_naive: bool`, רץ batch-job שני שמעביר כל chunk עם `in_scope_naive=true` דרך Haiku עם system-prompt:

```
אתה classifier לחקיקת-בטיחות-בעבודה ישראלית.
INPUT: chunk של טקסט + רשימת 21 פריטי-חקיקה.
OUTPUT: JSON: { in_scope: bool, scope_refs: [{id, section?, confidence: 0-1}] }
```

עלות משוערת: ~3000 chunks × Haiku ≈ $0.50-1.00 לכל-הקורפוס. מתאזן מול דיוק.

**ברירת-מחדל בטוחה**: chunk שלא נמצא לו match בשני השלבים → `in_scope=false`, `status='[לא ידוע - נא לאמת בנבו]'`. **חסום מ-quiz** (כלל ADR-005).

### Idempotency — content-hash, לא file-modifiedTime

```ts
const contentHash = sha256(normalize(extractedText));
// normalize = trim + dedupe-whitespace + lower (לא לטקסט עברית, רק להאש)
```

טבלת `content_sources` (ADR-010, חיצוני) תכיל UNIQUE על `(drive_file_id, content_hash)`. ייבוא חוזר של אותו קובץ — בלי שינוי תוכן — לא יוצר row חדש. אם תוכן השתנה → row חדש + row ישן מסומן `superseded_at`.

**למה לא file-modifiedTime?** Drive מעדכן `modifiedTime` גם על rename/move ללא שינוי-תוכן. content-hash הוא הסימן-היציב.

### Sync mode — one-shot ידני (Phase 1), incremental cron (Phase 10)

- **Phase 1-3 (pre-deadline)**: ריצה-ידנית. מוטי קורא `pnpm import:t1 --dry-run` → רואה תקציב → `pnpm import:t1 --execute`.
- **Phase 10 (post-deadline)**: wrapper Inngest שרץ cron יומי עם `--incremental` (רק קבצים עם `modifiedTime > last_sync`). webhook Drive נדחה לפעם-עוד-אחת — over-engineering ל-single-creator.

### Cost-control — תקציב-מקסימלי קבוע ב-config

```ts
// scripts/import-content.config.ts
export const BUDGET = {
  maxClaudeCallsPerRun: 200, // ~$5 ב-Haiku
  maxEmbeddingTokens: 2_000_000, // ~$15 ב-Voyage 3
  maxDriveApiCalls: 5_000, // הרבה-מתחת לרייט-לימיט
  totalUsdHardCap: 25, // אם עוברים — abort
};
```

מעקב חי בלוג. אם חוצים את התקציב — script עוצר מיידית, מדפיס סטטוס, לא ממשיך.

### Error handling — skip + report, לא abort

קובץ שנכשל בפרסור / Claude-classify / embedding → log + skip. בסוף הריצה:

```
═══ Import Report ═══
T1: 18/18 succeeded, 0 failed
T2: 49/52 succeeded, 3 failed:
  - "מצגת חזרה כללית - שאדי.pdf" (26 MB) — pdf-parse OOM
  - ...
T3: 10/10 succeeded
Total cost: $4.23 (Claude) + $8.71 (Voyage) = $12.94
Hash-collision skips: 2 (duplicates dedup'd)
═══
```

חריג יחיד שעוצר את הריצה: **scope-filter detection-failure ב->10% מה-chunks** — סימן ש-keywords-list לא תואם את הקורפוס. אם זה קורה, מוטי צריך לראות לפני שהקורפוס נכנס ל-DB.

---

## Architecture — Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────┐
│  scripts/import-content.ts                                       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ 1. Discover  │ -> │ 2. Fetch &   │ -> │ 3. Parse &   │       │
│  │ Drive folders│    │ Cache locally│    │ Extract Text │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ 4. Chunk +   │ -> │ 5. Tag scope │ -> │ 6. Embed     │       │
│  │ Hash         │    │ (regex+Haiku)│    │ (Voyage)     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐                            │
│  │ 7. Upsert    │ -> │ 8. Report    │                            │
│  │ to Supabase  │    │              │                            │
│  └──────────────┘    └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 1 — Discover

קלט: 2 root folder-IDs מ-`docs/content-inventory.md`. פלט: רשימת קבצים (id, name, mimeType, modifiedTime, parents[], size).

### Stage 2 — Fetch & local-cache

הורדה ל-`./.cache/drive/{fileId}.{ext}`. cache נשמר בין ריצות (חסכון Drive API + bandwidth). cache-invalidation לפי `modifiedTime > cache.mtime`.

### Stage 3 — Parse

נתב פר-extension לפרסר מתאים. פלט: טקסט עברי + metadata (page-numbers ל-PDF, slide-numbers ל-pptx).

### Stage 4 — Chunk & Hash

T1 (questions): פירסור-מובנה לפי תבנית `שאלה / תשובה / נימוק` — בלי chunking ארביטררי, כל זוג Q&A = scenario יחיד.

T2/T3 (chunks): semantic-chunking — חתיכות של 500-800 תווים, חופף-15%, נשבר רק על גבול-משפט (split על נקודה+space או newline-double).

### Stage 5 — Tag scope

שני-שלבים (regex → Haiku) כמתואר למעלה. T3 הוא special-case: שם-קובץ של תקנה (למשל "תקנות הבטיחות בעבודה (חשמל) 1990") נותן scope_id מדויק (2.4) בוודאות-100%, בלי צורך ב-Haiku.

### Stage 6 — Embed

batch של 10 chunks → Voyage `voyage-3` (multilingual, יעיל לעברית). result נשמר כ-`vector(1024)` ב-Supabase pgvector.

T1 שאלות **לא** embed-נכנסות לוקטור — הן entities נפרדים בטבלת `questions`. אבל **כן** מקבלות text-search index (Hebrew tsvector).

### Stage 7 — Upsert to Supabase

טרנזקציה פר-קובץ:

1. INSERT/UPDATE `content_sources(drive_file_id, content_hash, ...)`.
2. INSERT chunks/scenarios/questions עם foreign-key ל-`content_sources.id`.
3. אם content-hash זהה לקיים → SKIP, log "dedup'd".

### Stage 8 — Report

JSONL log ל-`logs/import-{timestamp}.jsonl` + summary לטרמינל.

---

## Key Functions — TypeScript Signatures

```ts
// src/lib/import/drive-client.ts
export async function fetchFromDrive(fileId: string): Promise<{
  content: Buffer;
  metadata: {
    name: string;
    mimeType: string;
    modifiedTime: string;
    size: number;
    parents: string[];
  };
}> {
  // OAuth client init from .env.local refresh-token
  // GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media
  // local-cache check לפני network-call
}
```

```ts
// src/lib/import/chunker.ts
export type Chunk = {
  text: string;
  sourceId: string;
  sourceOffset: number; // index בטקסט המקורי
  pageOrSlide?: number;
  contentHash: string;
};

export function chunkText(
  content: string,
  opts: {
    maxLen?: number; // default 800
    overlap?: number; // default 120
    sourceId: string;
  },
): Chunk[] {
  // sentence-split על /[.!?]\s+|\n\n/
  // אגרגציה ל-chunks של maxLen
  // overlap-לפני כל chunk חוץ מהראשון
}
```

```ts
// src/lib/import/scope-tagger.ts
export type ScopeRef = { id: string; section?: string; confidence: number };

export async function tagWithScope(chunk: Chunk): Promise<{
  in_scope: boolean;
  scope_refs: ScopeRef[];
  status: '[מאומת]' | '[מוסקנא]' | '[לא ידוע - נא לאמת בנבו]';
}> {
  // Stage 1: regex match על SCOPE_KEYWORDS
  const naiveMatches = regexMatchScope(chunk.text);
  if (naiveMatches.length === 0) {
    return { in_scope: false, scope_refs: [], status: '[לא ידוע - נא לאמת בנבו]' };
  }
  // Stage 2: Haiku verification (batched הקריאה מבחוץ)
  const verified = await haikuVerifyScope({
    text: chunk.text.slice(0, 1500), // truncate to save tokens
    candidates: naiveMatches,
  });
  return verified;
}
```

```ts
// src/lib/import/embedder.ts
export async function embedAndStore(chunks: Chunk[]): Promise<void> {
  // batch של 10
  for (const batch of batches(chunks, 10)) {
    const texts = batch.map((c) => c.text);
    const { embeddings } = await voyage.embed({
      model: 'voyage-3',
      input: texts,
      input_type: 'document',
    });

    await supabase.from('chunks').upsert(
      batch.map((c, i) => ({
        source_id: c.sourceId,
        text: c.text,
        embedding: embeddings[i],
        content_hash: c.contentHash,
        source_offset: c.sourceOffset,
      })),
      { onConflict: 'content_hash' },
    );

    // rate-limit: max 300 req/min ל-Voyage
    await sleep(200);
  }
}
```

```ts
// scripts/import-content.ts (entrypoint)
async function main() {
  const phase = process.argv[2]; // 't1' | 't1+t3' | 'full'
  const dryRun = process.argv.includes('--dry-run');

  await assertBudgetAvailable(BUDGET);

  const files = await discoverDriveFiles(ROOT_FOLDER_IDS);
  const tierFiltered = filterByTier(files, phase);

  console.log(
    `[plan] ${tierFiltered.length} files, est. cost $${estimateCost(tierFiltered).toFixed(2)}`,
  );
  if (dryRun) return;

  const report = new ImportReport();

  for (const file of tierFiltered) {
    try {
      const { content, metadata } = await fetchFromDrive(file.id);
      const text = await parseByMimeType(content, metadata.mimeType);
      const chunks = chunkText(text, { sourceId: file.id });

      const taggedChunks = await Promise.all(chunks.map(tagWithScope));
      const inScopeChunks = chunks.filter((_, i) => taggedChunks[i].in_scope);

      await embedAndStore(inScopeChunks);
      report.success(file);
    } catch (err) {
      report.fail(file, err);
    }
  }

  report.print();
  await report.persist('logs/import-' + Date.now() + '.jsonl');
}
```

---

## Phased Rollout

### Phase 1 — T1 only (שבוע 1, ימים 1-3)

- **Scope**: רק 18 קבצי-T1 (Quiz Source).
- **Parsers**: PDF + docx.
- **Output**: רק `questions` table (ב-ADR-010). אין chunking, אין embedding, אין scope-tagging אוטומטי.
- **Scope-tagging**: **ידני** — מוטי מקבל UI פשוט (`/admin/questions/{id}/tag-scope`) שבו לכל שאלה הוא מסמן scope_id מתוך 21 (dropdown).
- **למה ידני?** 18 קבצים × ממוצע 30 שאלות = ~540 שאלות. Haiku-tagging היה עולה ~$0.20 — אבל המהירות-לוועדה דורשת שמוטי יראה מיד תוצאות. ידני = 540 קליקים = ~30 דקות. שווה.
- **Success criteria**: 540 questions ב-Supabase תוך 3 ימים, רובם עם scope_id חוקי.

### Phase 2 — T1+T3 (שבוע 2)

- מוסיף 10 קבצי-T3 (Legal Sources).
- **Scope-filter אוטומטי** — שם-קובץ → scope_id (T3 special-case, וודאות גבוהה).
- chunking של חוקים לפי **סעיפים** (regex `\n(סעיף|פרק) \d+`).
- כל chunk נכנס ל-`chunks` עם `scope_refs=[{id, section}]`.
- Voyage embeddings מתחילים פה (~5K chunks × $0.003 = $15).

### Phase 3 — T1+T2+T3 (שבוע 3+)

- מוסיף ~52 קבצי-T2 (RAG Context — מצגות, סיכומים).
- Full scope-filter (regex + Haiku).
- chunking semantic.
- T2 כולל ~52 קבצים → ~3000 chunks → ~$5-15 ב-embeddings.
- **Out-of-scope content** (חוזק חומרים, רובוטים, ריתוך וכו' — ראה `content-scope.md`) — נכנס ל-`chunks` עם `in_scope=false`. ישמש רק ל-"הסבר לעומק" אם רלוונטי.

### Phase 4 — T4 (post-deadline, Phase 7+)

- ~50 קבצי-מדיה (~5.5 GB).
- transcription דרך Whisper (OpenAI API או self-hosted).
- chunking של transcripts זהה ל-T2.
- **לא בייבוא הזה**. צריך ADR-נפרד (`ADR-014-media-transcription.md`).

---

## CLI Surface

```bash
# Dry-run (תקציב + רשימה, בלי-עשייה)
pnpm import:t1 --dry-run
pnpm import:t1+t3 --dry-run
pnpm import:full --dry-run

# Execute
pnpm import:t1
pnpm import:t1+t3
pnpm import:full

# Incremental (רק קבצים חדשים/שונים מאז last-import)
pnpm import:full --incremental

# Re-import קובץ-יחיד (debug)
pnpm import:file --id=<driveFileId>

# Scope re-classify (אחרי שינוי SCOPE_KEYWORDS)
pnpm import:rescope --all
```

---

## Alternatives Considered

### Option A — Inngest function מההתחלה

- ✅ עתידי-פרוף; cron יבוא חינם
- ❌ over-engineering ל-single-user. debug קשה. Inngest dev-server overhead.
- ❌ באג ב-Phase 1 = abort+restart מורכב (vs. Ctrl+C ב-Node script)
- **נדחה**: Phase 10 wrapping בלי לשבור core

### Option B — notebooklm-mcp לגישת-Drive

- ✅ עוקף הצורך ב-OAuth-script נפרד
- ❌ דורש Claude-Code סשן פעיל — לא קיים ב-Node.js standalone
- ❌ MCP server pinned ל-stdio — לא scalable ל-Inngest בעתיד
- **נדחה**: googleapis SDK הוא standard ובוגר

### Option C — Manual upload דרך UI ב-StudiBuilder

- ✅ אין authentication-script נדרש
- ❌ 130 קבצים × העלאה-ידנית = מעמסה זמן-מוטי-לפני-וועדה
- ❌ סותר ADR-009 (Drive = source-of-truth, לא מצב upload-driven)
- **נדחה**: לא scalable, לא תואם direction של ADR-009

### Option D — Background job ב-Vercel/Edge

- ✅ no-infra
- ❌ Vercel function timeout = 60s (Pro: 300s). ייבוא של 6GB = שעות.
- ❌ עלות-bandwidth (Drive-fetch → Vercel → Supabase) דרך-קצה
- **נדחה**: scripts/ הוא המקום הנכון

### Option E — Skip scope-filter ב-import, אכוף ב-query-time

- ✅ פשוט יותר ב-ingestion
- ❌ DB מתמלא טקסט-out-of-scope; storage cost גדל
- ❌ query-time filter דורש per-query פינוי scope_refs — איטי
- ❌ סותר ADR-005 (scope-filter ב-Import הוא מנגנון-מוגדר)
- **נדחה**: ingestion-time filter הוא הנכון

### Option F — LLM-based parsing (Claude reads PDF directly)

- ✅ עוקף PDF-parser RTL bugs
- ❌ עלות עצומה (~$0.10 per PDF × 130 = $13 רק לפרסור)
- ❌ Hebrew PDF tokenization בעיתי גם ב-Claude (נצרך multiple passes)
- ❌ Latency 10-30s per file
- **נדחה**: PDF/docx parsers ייעודיים זולים-ויעילים יותר

---

## Consequences

### Positive

- **Idempotent** — ריצה-חוזרת ללא נזק, debugging נוח
- **Cost-controlled** — hard-cap מונע runaway-API-bill
- **Phased rollout** מאפשר value-במייצור תוך 3 ימים (T1 only), לא תלוי ב-T2/T3 שלוקחים-יותר
- **Scope-filter דו-שלבי** מאזן דיוק vs. עלות
- **דרך-יחידה ל-Drive** (`fetchFromDrive` בלבד) — קל לעבור ל-mock ב-tests

### Negative / Trade-offs

- **OAuth refresh-token ב-`.env.local`** — secrets-management דורש משמעת. אם הטוקן נחשף → גישה-מלאה ל-Drive של מוטי. mitigation: scope=`drive.readonly` בלבד; rotation כל-90-יום.
- **Drive API rate-limit** (1000 req/100s) — לא חוסם בפועל כי `discoverDriveFiles` הוא ~5 קריאות + `fetchFromDrive` × 130 = ~135 קריאות. בטוח-בטוח.
- **Voyage embeddings vendor-lock** — אם נחליף ל-OpenAI/Cohere ב-עתיד, צריך re-embed של כל הקורפוס. mitigation: embedding-version נשמר בעמודה `embedding_model_version`.
- **Phase 1 scope-tagging ידני** — 30 דקות עבודה של מוטי. trade-off מודע: דחיינות-לאוטומציה עד שהקורפוס יציב.
- **Cache local** (`./.cache/drive/`) — תופס דיסק. mitigation: `.gitignore` + cleanup script `pnpm import:cache:clear`.

### Neutral

- **T4 (media) דחוי** — לא משפיע על MVP, ADR-014 ייכתב אחרי deadline
- **Inngest wrapper Phase 10** — opt-in, לא חוסם כעת

---

## Validation

- [ ] Phase 1 — `pnpm import:t1` מסיים תוך < 5 דקות על 18 קבצי-T1.
- [ ] Phase 1 — 0 errors בלוג; 100% מהקבצים מתפרסרים.
- [ ] Phase 1 — ידני tagging UI ב-`/admin/questions` עובד; מוטי משלים 540 questions תוך 30 דקות.
- [ ] Phase 2 — `pnpm import:t1+t3` מצליח להוסיף 10 קבצי-T3 בלי לפגוע ב-T1 הקיים (idempotent).
- [ ] Phase 2 — `chunks.in_scope` מדויק ב-≥95% (spot-check 30 chunks).
- [ ] Phase 3 — total cost של full-import ≤ $25 (תקציב).
- [ ] Phase 3 — duplicates dedup'd אוטומטית לפי content-hash (2 קבצי "רעש מזיק" → 1 source ב-DB).
- [ ] Re-running `pnpm import:full` יום אחרי — 0 חדשים נכנסים (idempotency check).
- [ ] Budget-cap עובד — סימולציה של `maxClaudeCallsPerRun=5` עוצרת ריצה כצפוי.

---

## Security Considerations

- **Drive OAuth token**: `.env.local`, scope `drive.readonly`, refresh-token-rotation manual כל-90-יום (TODO ב-calendar).
- **Voyage/Anthropic keys**: standard `.env.local`, לא ב-git.
- **Supabase service-role key**: נדרש לpipeline (bypass RLS לטובת admin-write). **לעולם לא ב-client code**. כאן בלבד.
- **Local cache** (`./.cache/drive/`): נשמר טקסט-מ-Drive ב-disk. במחשב-פיתוח אישי של מוטי — סביר. אם ה-script ירוץ ב-CI — חובת cleanup post-run.
- **Logs**: יכולים להכיל קטעי-טקסט מהמסמכים. עברית, לא PII כללי. נשמרים מקומית בלבד, לא נדחפים ל-Sentry/observability.

---

## Open Questions

1. **Hebrew PDF parsing fidelity** — האם `pdf-parse` נותן RTL-text תקין, או צריך `pdfjs-dist`? **בדיקה ב-Phase 1, יום-1**, על 3 קבצי T1 representative.
2. **Voyage vs. OpenAI embeddings** — Voyage נבחר ב-CLAUDE.md, אבל לא נבדק על-עברית. **בדיקת-איכות** ב-Phase 3 — אם איכות-RAG נמוכה, להחליף.
3. **Re-classification flow** — איך מבצעים rescope-של-DB-קיים כשמשנים `SCOPE_KEYWORDS`? Migration script `pnpm import:rescope --all`. detail ייקבע ב-Phase 2.
4. **Gap-IDs מ-`content-scope.md`** (8 scope-IDs חסרי-מקור) — האם import-script צריך flag-לזיהוי? **כן** — אם chunk תויג עם scope_id מ-gap-list → log-warn "covered-but-no-source-doc".

---

## References

- ADR-003 (Auth — אישור שזה לא משנה את public-OAuth)
- ADR-005 (NotebookLM Hybrid — scope-filter ב-Import)
- ADR-009 (Magen — Drive = source-of-truth)
- ADR-010 (DB schema — `content_sources`, `chunks`, `questions`, `scenarios`)
- `docs/content-inventory.md` — מיפוי 130 קבצים ל-tiers
- `docs/content-scope.md` — 21 פריטי-חקיקה, כללי scope-filter
- `docs/mvp-plan-2026-07-15.md` §10.2 — Drive Discovery (שבוע 1)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/reference)
- [`googleapis` npm](https://www.npmjs.com/package/googleapis)
- [`pdf-parse` npm](https://www.npmjs.com/package/pdf-parse)
- [`mammoth` npm](https://www.npmjs.com/package/mammoth)
- [Voyage AI embeddings](https://docs.voyageai.com/)
