# ADR-002: Course Pipeline — Build From Scratch (לא NotebookLM)

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: ml-engineer · motilev8
> **Phase**: 4

---

## Context

לב המוצר הוא pipeline 5-שלבי שלוקח PDF/Word ומייצר קורס. אפשר:
1. לבנות מהיסוד עם Claude + pgvector + Voyage
2. להשתמש ב-NotebookLM API של Google (preview)
3. שילוב: NotebookLM ל-RAG + Claude ליצירת שאלות

מוטי החליט: **Build From Scratch.**

---

## Decision

נבנה pipeline משלנו מקצה-לקצה. **לא נשלב NotebookLM API.**

**Pipeline:**

```
[PDF/Word/PPT/Excel/Images] → Parse → [טקסט נקי]
                                          ↓
                                       Chunk
                                          ↓
                              [קטעי ~500 tokens עם metadata]
                                          ↓
                                      Embed
                                          ↓
                              [וקטורים 1024-dim]
                                          ↓
                                pgvector + HNSW index
                                          ↓
              ┌───────────────────────────┴────────────────┐
              ↓                                              ↓
        Topic Detection                              Lesson Generation
        (Claude Haiku 4.5)                          (Claude Sonnet 4.6)
                                                              ↓
                                                   Question Generation
                                                  (RAG context + Sonnet)
                                                              ↓
                                                  source_chunk_id ←→ source
```

**Key Design**: כל שאלה נשמרת עם `source_chunk_id` - הקישור המאפשר "הסבר לעומק" ו"צירוף מקור".

---

## Alternatives Considered

### Option A: NotebookLM API לכל ה-RAG
- ✅ Google מטפל ב-parse/chunk/embed
- ✅ איכות עברית של Gemini
- ❌ Vendor lock-in
- ❌ פחות שליטה ב-prompts
- ❌ API ב-preview, quota מוגבל
- ❌ אין access לעלות-לטיפול

### Option B: שילוב - NotebookLM ל-RAG + Claude ליצירה
- ✅ פחות לבנות ב-Phase 4
- ❌ 2 vendors להתחזק
- ❌ פחות שליטה ב-chunk granularity
- ❌ עלות כפולה

### Option C: Build from scratch (נבחר)
- ✅ שליטה מלאה
- ✅ no vendor lock-in
- ✅ aligning עם הסטאק (TS, Supabase)
- ❌ 10 ימי-עבודה מוערכים
- ❌ אחריות שלנו על איכות

---

## Implementation Details

### 4.1 Parsing (2 ימים)
- **PDF**: `pdf-parse` או `unpdf`. fallback ל-Claude Vision לעמודים-תמונה
- **Word**: `mammoth`
- **PowerPoint**: לעת עתה - חילוץ via Claude Vision לכל slide
- **Excel**: `xlsx` + heuristic ל-flatten טבלאות לטקסט
- **תמונות**: Claude Vision direct
- Output: `{ text, structure: { headings, tables, lists }, pages }`

### 4.2 Chunking (1 יום)
- Semantic - by paragraph + heading boundaries
- Target 500 tokens
- Overlap 50 tokens
- Metadata: `page`, `heading`, `section`

### 4.3 Embedding (2 ימים)
- **Voyage AI** `voyage-3` (1024-dim)
- Batch 100 chunks
- pgvector with HNSW index (`vector_cosine_ops`)

### 4.4 Topic Detection (1 יום)
- **Claude Haiku 4.5** (זול לסיווג)
- Prompt: top-10 chunks → "מה הנושא בעברית? + confidence 0-100"
- Output: `{ topic, confidence }`
- **ביטחון < 70% → אזהרה למשתמש**

### 4.5 Lesson Generation (2 ימים)
- **Claude Sonnet 4.6** + **prompt caching** (cache chunks)
- Prompt: "given these chunks, plan N lessons covering them, output JSON"
- Output: `[{ title, summary, chunk_ids, estimated_questions }]`

### 4.6 Question Generation (2 ימים)
- Per lesson, per question:
  - Retrieve top 3 chunks (RAG)
  - Claude Sonnet generates one of 4 types
  - Validate: correct answer מופיע בטקסט המקור
  - Store with `source_chunk_id`
- Types ratio: 50% MCQ-long, 25% MCQ-short, 15% matching, 10% explanation

---

## Validation

- [ ] PDF 30 עמ' מסתיים תוך < 15 דקות
- [ ] רוב הקורסים: >= 5 שיעורים, >= 20 שאלות
- [ ] איכות-תוכן: spot-check 10 שאלות, >= 80% הגיוניות
- [ ] עלות: << $1 לקורס ממוצע
- [ ] השוואה ל-StudiesGo: דומה ברמה

---

## Risk & Mitigation

| סיכון | חומרה | מיטיגציה |
|---|---|---|
| LLM ממציא עובדות | גבוה | RAG strict context + validation chunk-grounding |
| Parsing PDF ייכשל | בינוני | fallback ל-Claude Vision |
| עלות LLM מתפוצצת | בינוני | prompt caching + rate limits |
| pgvector לא scale | נמוך | תיעוד switch-plan ב-ADR-005 |

---

## References

- ADR-001 (Stack)
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Voyage AI docs](https://docs.voyageai.com/)
- [pgvector HNSW](https://github.com/pgvector/pgvector)
