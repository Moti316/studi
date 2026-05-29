# Create Course - Step 4: Confirm Cost — `/create-c` (4/5)

> **Phase**: 3 (UI) + 8 (credits live) · States: default / not-enough-credits

## Purpose

משתמש מאשר עלות-בקרדיטים ופותח הזמנה. אופציה לתוספת ("צירוף עמודי מקור").

## States

- **default**: שם-הקורס + מטריקות + עלות + יתרה + CTA "צור!"
- **not-enough-credits**: עלות מסומנת באדום, CTA חסום, כפתור "רכוש קרדיטים"

## Layout

```
[progress: ●●●●● 4/5]
[Bob happy]
"הכל מוכן! 🎉"
"בוא נוודא שהכל בסדר לפני שמתחילים"
┌────────────────────────────┐
│ שם הקורס:     [editable]  │
│                           │
│ 15      |       1         │
│ עמודים  |     קבצים       │
│                           │
│ ⚙ צרף את עמודי המקור      │
│   לשיעורים [toggle]       │
│   (+8 קרדיטים)            │
│                           │
│ עלות:         15-23 ⓘ     │
│ יתרה:         1500        │
└────────────────────────────┘
[צור את הקורס! 🚀]
[← חזרה להעלאת קבצים]
```

## Components

- `<WizardProgress>`, `<BobMascot pose="happy">`
- `<EditableTitle>`, `<MetricsRow>`
- `<ToggleWithCost>` (source-attach option)
- `<CostBreakdown>`, `<CreditBalance>`
- `<CreateCourseButton>`, `<BackButton>`

## Data

- POST `/api/courses` { draft_id, attach_source: bool }
  - validates: balance >= cost
  - deducts: credits + transaction log
  - enqueues: course-build job
  - returns: course_id

## Acceptance

- [ ] toggle "צירוף מקור" מעדכן עלות בזמן-אמת
- [ ] not-enough-credits מציג alert ולא מאפשר creation
- [ ] click "צור" → spinner → Step 5
- [ ] transaction log רושם hold + commit נפרדים

## Source

`docs/screens/create_ready_summary.jpg`
