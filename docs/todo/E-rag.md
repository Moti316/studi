# TODO · E — Phase 4 — השלמת RAG (chunker/embedder)

> שלב E ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: ⬜ פתוח · תלות: חוסם את D4 deep-explanation · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

שכבת ה-RAG (T2/T3) מושלמת end-to-end: `chunker.ts` חותך טקסט-עברי semantic עם content-hash, `embedder.ts` מטמיע batch ב-Gemini ושומר ל-pgvector (idempotent), ו-retrieval של top-k מחזיר תשובת-RAG **מצוטטת** (chunk + scope_refs + עמוד/סעיף). "סיום" = שאלת deep-explanation מחזירה הסבר מבוסס-מקור (chunk-grounded) במקום טקסט-LLM-חופשי.

## תלויות

חוסם את **D4 deep-explanation** (API deep-explanation ב-Quiz Engine תלוי ב-retrieval מצוטט). נפתח על-ידי הצינור-הקיים: `src/lib/import/{scope-tagger,map-question,upsert-questions}.ts` כבר בנויים — חסר רק `chunker`/`embedder` ושכבת-pgvector (ADR-011 §שלב-2/3, EXECUTION-PLAN §שלב-1). תלוי `GEMINI_API_KEY` + טבלת `chunks` עם עמודת `vector(N)` (ADR-010, חיצוני).

## תתי-משימות

- [ ] **E1** — `src/lib/import/chunker.ts`: semantic chunking + content-hash. חיתוך לפי גבול-משפט (`/[.!?]\s+|\n\n/`), chunks של 500–800 תווים עם overlap ~15% (~120 תווים), שמירת `pageOrSlide` ל-PDF/pptx; T3 (חוקים) = חיתוך לפי-סעיף (`\n(סעיף|פרק) \d+`) ולא ארביטררי; `contentHash = sha256(normalize(text))`. · קריטריון-קבלה: בהינתן טקסט-עברי, פלט `Chunk[]` (חתימה: `{text, sourceId, sourceOffset, pageOrSlide?, contentHash}`), כל chunk ≤800 תווים, overlap נשמר בין-עוקבים, אותו-קלט→אותו-hash (deterministic); unit-test עובר על דגימת-T2 ודגימת-T3. · ref: [ADR-002](../architecture/ADR-002-pipeline.md) · [ADR-011](../architecture/ADR-011-drive-import-pipeline.md)
- [ ] **E2** — `src/lib/import/embedder.ts`: Gemini embeddings batch → pgvector. batch של 10 chunks ל-`gemini-embedding-001` (`@google/genai`, `input_type:'document'`), `upsert` ל-`chunks` עם `onConflict:'content_hash'` (idempotent), `embedding_model_version` נשמר, rate-limit בין-batches; ממד-הוקטור ב-`vector(N)` תואם למודל-Gemini הנבחר (לאמת). · קריטריון-קבלה: `embedAndStore(chunks)` כותב embeddings ל-pgvector; הרצה-חוזרת על אותם-chunks = 0 שורות-חדשות (idempotency דרך content-hash); HNSW index `vector_cosine_ops` קיים; עלות תחת hard-cap (`maxEmbeddingTokens`/`totalUsdHardCap` מ-config). · ref: [ADR-011](../architecture/ADR-011-drive-import-pipeline.md) · [ADR-002](../architecture/ADR-002-pipeline.md)
- [ ] **E3** — deep-explanation retrieval: top-k → תשובת-RAG מצוטטת. embed של שאלת-המשתמש → דמיון-קוסינוס מול pgvector → top-k chunks → תשובה strict-context (chunk-grounded, ללא הזיה) המחזירה **citation**: scope_refs + עמוד/סעיף לכל מקור. כיבוד scope: chunks עם `in_scope=false` משמשים רק ל-"הסבר לעומק", לא ל-quiz. · קריטריון-קבלה: query עברית מחזיר top-k (k לאמת, ~3) + תשובה שכל טענה בה ניתנת-לאיתור ב-chunk המוחזר (validation chunk-grounding); כל מקור מצוטט עם `source_chunk_id`/scope_ref + עמוד-וסעיף; חוקים/תקנות מצוטטים מ-PDF (source-of-truth), חומרי-מרצה כ-reference בלבד. · ref: [ADR-002](../architecture/ADR-002-pipeline.md) · [ADR-011](../architecture/ADR-011-drive-import-pipeline.md)

## מסמכי-ייחוס (קרא לפני עבודה)

- [../architecture/ADR-011-drive-import-pipeline.md](../architecture/ADR-011-drive-import-pipeline.md) — שכבות T2/T3 (RAG context + legal sources); חתימות `chunker.ts`/`embedder.ts`; semantic-chunking 500–800 תווים overlap-15%; idempotency content-hash; T3 special-case חיתוך-סעיפים; pgvector `vector(N)`.
- [../architecture/ADR-002-pipeline.md](../architecture/ADR-002-pipeline.md) — Parse→Chunk→Embed→Topic→Lessons→Questions; pgvector + HNSW (`vector_cosine_ops`); `source_chunk_id` כקישור ל-"הסבר לעומק" + צירוף-מקור; RAG strict context + validation chunk-grounding (מניעת-הזיה).
- [../context/EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md) — §שלב-1: RAG (`chunker`/`embedder`) טרם נכתב; הצינור-הקיים = ייבוא בנק-שאלות, לא RAG-chunking; deep-explanation (RAG) נדרש ב-Quiz Engine.

## החלטות פתוחות / הערות

- **ממד-הוקטור** (`vector(N)`) של `gemini-embedding-001` — להתאים ל-`chunks.embedding` ולמודל הנבחר (ADR-001 Amendment). (לאמת)
- **k ב-top-k** — ADR-002 §4.6 נוקב ~3 chunks ל-question-generation; לאמת ערך ל-deep-explanation. (לאמת)
- **איכות-embeddings על-עברית** — `gemini-embedding-001` טרם נבדק על-עברית (ADR-011 Open Q#2); spot-check איכות-RAG. (לאמת)
- name-clean: חוקים/תקנות = נחלת-כלל ומצוטטים מ-PDF; חומרי-לימוד (T2) = reference בלבד.
