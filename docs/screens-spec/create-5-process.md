# Create Course - Step 5: Processing — `/create-c` (5/5)

> **Phase**: 4 (full pipeline) · States: each of 5 stages + done

## Purpose

מציג את 5 שלבי העיבוד באופן live, ETA, ואפשרות לסגור הדפדפן והכל ממשיך ברקע.

## States (5 שלבים סדורים)

1. **Parsing** - חילוץ תוכן מהקבצים
2. **Chunking** - חלוקה לקטעי לימוד
3. **RAG** - אינדוקס סמנטי של החומר
4. **יצירת יחידות ושיעורים** - LLM call
5. **יצירת שאלות ותרגולים** - LLM call

לכל שלב: spinner + "מעבד..." / ✓ "הושלם" / ⏸ "ממתין..."

## Layout

```
[progress: ●●●●● 5/5]
[Bob mascot]
"🚀 בונה את הקורס שלך"
"שב בנוח, אני מטפל בהכל!"
┌────────────────────────────┐
│ ①  Parsing - מעבד...      │
│ ②  Chunking - ממתין...    │
│ ③  RAG indexing - ממתין.  │
│ ④  שיעורים - ממתין...     │
│ ⑤  שאלות - ממתין...       │
└────────────────────────────┘

ההתקדמות שלי: ▓▓░░░░░░ 5%
מעלה קבצים לשרתים...
⏱ כ-15 דקות

[📖 צפה בקורס]  [⏳ מעלה...]

ℹ העיבוד ממשיך ברקע - אפשר לסגור את הדפדפן
```

## Components

- `<WizardProgress>`, `<BobMascot pose="neutral">`
- `<PipelineSteps>` (5 שורות עם status)
- `<OverallProgressBar>` + ETA
- `<BackgroundNotice>`
- `<ViewCourseButton>` (פעיל כשמתחיל שלב 4)

## Data

- Supabase Realtime: `course:{id}` channel
- Each Inngest stage emits event:
  ```json
  { course_id, stage: "parsing", progress: 20, eta_seconds: 720 }
  ```
- DB: `course_progress` (course_id, stage, progress_pct, updated_at)

## Acceptance

- [ ] progress updates < 2s after backend emit
- [ ] משתמש סוגר tab → email notification בסיום
- [ ] error in stage X → רואה אלרט + retry
- [ ] idempotent: refresh page = ממשיך מאותו מצב

## Related

- ↘ `dashboard.md` (after success)

## Source

`docs/screens/create_processing.jpg`
