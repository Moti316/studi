# Architecture Decision Records (ADRs)

תיעוד כל ההחלטות-הארכיטקטוניות המשמעותיות לפרויקט. כל החלטה מקבלת ADR לפני implementation.

## כללי

- **ADR נכתב לפני implementation**, לא אחריו
- **מקור-אמת יחיד**: ADR > תיעוד אחר > קוד
- **לא משנים ADR שאושר** - יוצרים ADR חדש שמחליף (Superseded by)
- **שפת ה-ADR**: עברית עם מונחים אנגלית-טכנית

## טמפלט

ראה [`ADR-000-template.md`](./ADR-000-template.md).

## ADRs קיימים

| # | כותרת | סטטוס | Phase | תאריך |
|---|---|---|---|---|
| 001 | בחירת Stack - Next.js + Supabase | proposed | 0 | 2026-05-29 |
| 002 | Course pipeline - build from scratch (לא NotebookLM) | accepted | 4 | 2026-05-29 |
| 003 | Auth - Google OAuth login-only + Magic Link | accepted | 1 | 2026-05-29 |

## חלוקה לפי Phase

### Phase 0
- 001 Stack

### Phase 1
- 003 Auth

### Phase 4
- 002 Course pipeline
- (TBD) 004 RAG strategy - pgvector ראשון
- (TBD) 005 Chunking strategy

### Phase 5
- (TBD) 006 Quiz state machine

### Phase 7
- (TBD) 007 TTS provider - ElevenLabs vs Azure

### Phase 8
- (TBD) 008 Credits model

## תהליך כתיבת ADR

1. סוכן/אדם מזהה החלטה משמעותית
2. יוצר ADR כ-`docs/architecture/ADR-NNN-name.md`
3. status = `Proposed`
4. דיון בצוות (council if needed)
5. אישור → status = `Accepted`
6. ביצוע ב-PR שמצביע ל-ADR
7. אם הוחלף בהמשך → status = `Superseded by ADR-MMM`
