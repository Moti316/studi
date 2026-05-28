# Lesson - MCQ Long — `/lesson/[id]` (question type 1/4)

> **Phase**: 5 · States: question / selected / correct / wrong

## Purpose
שאלת רב-ברירה עם 4 תשובות-משפט-מלא בעמודה אחת. הסוג השכיח ביותר.

## States
- **question**: 4 cards לא-מסומנים
- **selected**: 1 card highlighted בכחול
- **correct**: card נכון ירוק + XP+10 animation
- **wrong**: card שגוי אדום + card נכון ירוק + feedback screen

## Layout
```
[header: שיעור - {course_title}]
[progress dots: ●●●●○○○○○○○○○○]
[XP: 30] [streak: 3🔥]
[ℹ המידע נוצר על-ידי AI ועלול להכיל שגיאות]

{question_text - 1-2 משפטים}

[ option 1 ─────────────────── ]
[ option 2 ─────────────────── ]
[ option 3 ─────────────────── ]
[ option 4 ─────────────────── ]
```

## Components
- `<QuizHeader>` (title, progress, XP, streak)
- `<AiNotice>` (קבוע)
- `<QuestionText>`
- `<MCQOption>` x 4 (state: idle/selected/correct/wrong)
- `<CheckAnswerButton>` (מופיע אחרי בחירה)

## Data
- GET `/api/lessons/[id]/next-question` → question object
- POST `/api/attempts` { question_id, answer }
- Response: `{ correct: bool, correct_index, explanation, source_chunk_id, xp_earned }`

## Acceptance
- [ ] cards touch-friendly (גובה >= 56px במובייל)
- [ ] keyboard nav: 1/2/3/4 = בחירה, Enter = שליחה
- [ ] animation על תשובה נכונה: spring scale + XP +N
- [ ] click on "ℹ" = preview source chunk

## Related
- ↗ `dashboard.md`
- ↘ `lesson-feedback.md` (אם שגוי)
- ↘ next question או `lesson-complete.md`

## Source
`docs/screens/lesson_mcq.jpg`
