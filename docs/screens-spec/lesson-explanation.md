# Lesson - Explanation Card — `/lesson/[id]` (question type 4/4)

> **Phase**: 5 · States: default / read

## Purpose
כרטיס הסבר ללא שאלה. מציג רעיון מהחומר עם "tip" highlighting. משמש כשמגיעים לקונספט חדש לפני שאלות.

## Layout
```
[header same]
[ℹ AI notice]

[🚩] [🔊] [💡 הסבר]

┌─ explanation card ──────┐
│ ועדת בטיחות היא גוף    │
│ ארגוני הבוחן את מצב    │
│ הבטיחות במקום העבודה.  │
│ ...                     │
│                         │
│ ┌─ tip card ──────────┐ │
│ │ 💡 ועדת בטיחות היא  │ │
│ │ גורם מוסדי המשתתף   │ │
│ │ בבירור תאונות...    │ │
│ └─────────────────────┘ │
└─────────────────────────┘

[הבנתי, המשך →]
```

## Components
- אותו `<QuizHeader>`
- `<ActionsRow>`: דגל/קול/הסבר
- `<ExplanationCard>` עם `<TipHighlight>` פנימי
- `<ContinueButton>` (כחול full-width)

## Data
- Question type `"explanation"` (no answer needed)
- TTS אופציונלי - autoplay if user opted in

## Acceptance
- [ ] tap on 🔊 = TTS playback
- [ ] tap on 🚩 = report-issue modal
- [ ] click "הבנתי" = +5 XP + next question
- [ ] tip card מובלט (background מעט שונה)

## Source
`docs/screens/lesson_explanation.jpg`
