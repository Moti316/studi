# Lesson - MCQ Short / Fill-in-Blank — `/lesson/[id]` (question type 2/4)

> **Phase**: 5 · States: question / selected / correct / wrong

## Purpose

משפט עם מילה חסרה (**\_**) + 4 תשובות-מילה-בודדת ב-grid 2×2.

## Layout

```
[header same as MCQ long]

"ממונה בטיחות הוא הגורם המקצועי
האחראי על _____ נהלי הבטיחות בארגון."

┌─────────┬─────────┐
│  ניסוח  │  פרסום  │
├─────────┼─────────┤
│  אכיפת  │  מימון  │
└─────────┴─────────┘
```

## Components

- אותו `<QuizHeader>`, `<AiNotice>`
- `<FillBlankText>` (משפט עם markup ל-**\_**)
- `<MCQShortOption>` x 4 ב-grid 2×2
- `<CheckAnswerButton>`

## Acceptance

- [ ] קוורם מסומן בצבע-בחירה (כתום StudiesGo)
- [ ] grid 2×2 במובייל, 4×1 בדסקטופ רחב
- [ ] צבע ירוק/אדום על correct/wrong

## Source

`docs/screens/lesson_explanation.jpg` (similar layout)
