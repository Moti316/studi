# Create Course - Step 2: Topic Detection — `/create-c` (2/5)

> **Phase**: 4.4 (Haiku-classified) · States: loading / detected / confirm

## Purpose
AI מזהה את הנושא של החומר ומבקש מהמשתמש לאשר לפני המשך.

## States
- **loading**: Bob ניטרלי + "בודקים את המקור..." + spinner. ~10-30s
- **detected**: כרטיס עם תיאור הנושא + ביטחון % + שאלת-דוגמה
- **confirm**: 2 כפתורים "כן, זה הנושא - צור קורס" / "לא - אעלה קובץ אחר"

## Layout
```
[progress: ●●●○○ 2/5]
[Bob mascot]
"זיהינו את הנושא"
┌─ card ─────────────────────┐
│ {topic title}              │
│                            │
│ "שאלה 1: על מי חלה        │
│  האחריות לביצוע בירור?"   │
│                            │
│ [✓ ביטחון 100%]            │
└────────────────────────────┘
[כן, זה הנושא - צור קורס]
[לא - אעלה קובץ אחר]
```

## Components
- `<WizardProgress>`, `<BobMascot pose="neutral">`
- `<TopicCard>` (title, sample question, confidence badge)
- `<PrimaryButton>`, `<SecondaryButton>`

## Data
- Inngest job result: `course_drafts.detected_topic`, `detected_confidence`
- Subscribe to Supabase Realtime channel `course_draft:{id}`

## AI Pipeline
- Claude Haiku 4.5
- Prompt: `"What is the main topic of these chunks? Respond in Hebrew with topic + confidence 0-100."`
- Cost: ~$0.001 per detection

## Acceptance
- [ ] zero topic = "לא הצלחנו לזהות נושא" + retry
- [ ] confidence < 70% = warning color
- [ ] sample question must come from source (validation)

## Source
`docs/screens/create_topic_confirm.jpg`
