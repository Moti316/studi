# ADR-005: NotebookLM Hybrid — Content Curation + Claude Pipeline

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: ml-engineer · domain-expert · motilev8
> **Phase**: 4 (pre-implementation)
> **Supersedes**: חלק מ-ADR-001 (שדחה NotebookLM)

---

## Context

ב-ADR-001 (Stack) דחינו את NotebookLM ובחרנו **Build from scratch** עם Claude + pgvector — כדי לקבל שליטה מלאה על prompts, איכות ופורמט.

מאז התברר כי:

1. מוטי הוא **ה-creator** של הקורסים (לא משתמש-עולה-PDF סטנדרטי) — חלק י"ב בתוכנית-העל
2. יש לו כבר **NotebookLM Workspace קיים** עם curated content לקורס ממונה-בטיחות
3. **Source-grounding קריטי** לתחום-רגולציה: תשובות שגויות = כשלון-בחינה למשתמש
4. NotebookLM מצטיין ב-source-grounded citation — Claude טוב יותר ב-presentation

המסקנה: הבחירה לא צריכה להיות "או-או" אלא **היבריד**.

---

## Decision

**NotebookLM משמש כ-content curator. Claude משמש כ-content generator.**

### גבולות-אחריות

| שלב                        | אחראי                                      | מה הוא עושה                                                    |
| -------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| 1. **Source ingestion**    | NotebookLM                                 | קולט PDFs/מסמכים מ-Drive, מבנה אינדקס פנימי                    |
| 2. **Q&A curation**        | NotebookLM                                 | מוטי שואל שאלות, NotebookLM משיב עם ציטוטים — מוטי מאשר/דוחה   |
| 3. **Export**              | Manual (Phase 4.0) / Automated (Phase 4.5) | JSON structured: `{question, answer, source_citations[]}`      |
| 4. **Import to our stack** | Our backend                                | פרסור JSON → טבלאות `chunks`, `qa_pairs` ב-Supabase + pgvector |
| 5. **Lesson generation**   | Claude Sonnet 4.6                          | מקבל chunks + qa_pairs כ-context → יוצר שיעורים בעברית         |
| 6. **Question variation**  | Claude Sonnet 4.6                          | מקבל qa אחד → יוצר 3-4 וריאציות (MCQ/matching/explanation)     |
| 7. **Deep explanations**   | Claude Sonnet 4.6                          | אם משתמש טועה → Claude מסביר על-בסיס המקור המקורי              |
| 8. **Voice (TTS)**         | ElevenLabs (Phase 7)                       | בלי שינוי מ-ADR-001                                            |

### Data Contract — NotebookLM Export → Our Import

```jsonc
{
  "course_id": "betichut-v1",
  "source_documents": [{ "id": "doc-1", "title": "תקנות בטיחות בעבודה", "url": "drive://..." }],
  "qa_pairs": [
    {
      "id": "qa-1",
      "question": "מתי חייב להיערך מינוי-בטיחות?",
      "answer": "...",
      "citations": [{ "doc_id": "doc-1", "page": 14, "quote": "..." }],
      "approved_by_human": true,
    },
  ],
  "chunks": [{ "id": "chunk-1", "doc_id": "doc-1", "page": 14, "text": "...", "topic_tags": [] }],
}
```

### Phase Plan

- **Phase 4.0 (manual sync)**: מוטי מייצא JSON מ-NotebookLM ידנית (copy-paste), מעלה ל-admin route → backend מפרסר. מספיק ל-MVP.
- **Phase 4.5 (semi-automated)**: NotebookLM API (אם יושק על-ידי Google) או scraping מבוקר עם cron-job.

---

## Alternatives Considered

### Option A: NotebookLM-only

- ✅ הכי source-grounded
- ❌ אין שליטה על פורמט/UX/voice. NotebookLM ממשק קבוע
- ❌ אין gamification (XP/streak)

### Option B: Claude-only (ADR-001 המקורי)

- ✅ שליטה מלאה
- ❌ סיכון-הזיות בתחום-רגולציה
- ❌ מאבדים את ההשקעה של מוטי ב-NotebookLM workspace

### Option C: היבריד (זה) ← **נבחר**

- ✅ מקבלים את הטוב משני העולמות
- ✅ מנצלים את ה-curation הקיים של מוטי
- ❌ תלות בכלי-צד-ג׳ (Google) שמופסק לפעמים
- ❌ ייצוא ידני בהתחלה = friction

---

## Consequences

### Positive

- כל question מיוצר מ-source-citation אמיתי → אמינות גבוהה
- מוטי שומר על role של "מומחה-תחום" (curator), Claude עושה את ה-heavy lifting
- ניתן להחליף NotebookLM ב-RAG עצמאי בעתיד (Voyage embeddings + pgvector) בלי לשבור את ה-data contract

### Negative

- Phase 4.0 דורש workflow ידני של מוטי לכל קורס חדש (~2-4 שעות פר קורס)
- אם Google משנה את NotebookLM — נצטרך plan-B
- שני מערכות-איכות-בקרה לעקוב אחריהן

### Neutral

- ADR-001 מתעדכן (לא נמחק) — Claude נשאר LLM יחיד אצלנו, NotebookLM הוא pre-processing

---

## Validation

- [ ] Phase 4.0: ייצוא ידני של 50 qa-pairs לוקח < 4 שעות
- [ ] Import script מפרסר JSON בלי שגיאות על 100% מ-pairs
- [ ] שאלות שנוצרו מ-qa-pairs שעברו human-review מקבלות ≥ 9/10 ב-spot-check (domain-expert)
- [ ] Deep explanation כוללת citation בפועל מהמקור (לא הזיה)

---

## References

- ADR-001 (Stack — Claude+pgvector)
- ADR-006 (Course-as-Product Factory)
- NotebookLM docs: https://notebooklm.google.com/
- חלק י"ב בתוכנית-העל: Course-as-Product Factory
