# Lesson - Wrong Answer Feedback — `/lesson/[id]` (feedback state)

> **Phase**: 5 · States: showing-feedback / deep-explanation-loading / continue

## Purpose

מסך פידבק אחרי תשובה שגויה. מציג מה היה שגוי, מה הנכון, והסבר. אופציה ל"הסבר לעומק" (LLM call).

## Layout

```
[progress: dim/blue dots - השאלה הזו מסומנת אדום]

┌─ Bob mascot - neutral ─┐
│ 🤖 "תשובה לא נכונה"   │
└────────────────────────┘

ההתאמות שלך:
┌──────────────────────────┐
│ ממונה בטיחות → פיקוח על  │
│   קיום הוראות החוק       │
│ ❌ התשובה הנכונה:        │
│   אכיפת נהלי בטיחות      │
└──────────────────────────┘
┌──────────────────────────┐
│ ועדת בטיחות → קידום ✓    │
│   תרבות בטיחות           │
└──────────────────────────┘
┌──────────────────────────┐
│ מפקח עבודה → אכיפת...    │
│ ❌ הנכון: פיקוח על קיום  │
│    הוראות החוק           │
└──────────────────────────┘

┌─ explanation ─────────┐
│ 💡 התפקידים מוגדרים  │
│ לפי סמכויותיהם:       │
│ • ממונה בטיחות → אכיפה│
│ • ועדת בטיחות → תרבות │
│ • מפקח עבודה → פיקוח  │
└───────────────────────┘

[✨ הסבר לעומק]  [המשך →]
```

## Components

- `<BobMascot pose="neutral">`
- `<FeedbackHeader>` ("תשובה לא נכונה")
- `<MatchingResultRow>` x N (your-pair → correct-pair, with ✓/❌)
- `<ExplanationBox>` (highlighted)
- `<DeepExplanationButton>` (לחיצה → modal עם LLM call)
- `<ContinueButton>`

## Data

- Already have `attempt` result from POST
- POST `/api/explanations/deep` { question_id, attempt_id } → Claude LLM call עם RAG-context
- ה-source_chunk_id הוא הקישור!

## Deep Explanation Flow

```
User clicks "הסבר לעומק"
   ↓
GET source chunks for question (via source_chunk_id)
   ↓
LLM prompt: "המשתמש בחר X, נכון Y. הסבר בהרחבה על-בסיס: [chunk]"
   ↓
Stream response → modal
```

## Acceptance

- [ ] feedback מוצג תוך 500ms (אין delay)
- [ ] "הסבר לעומק" סופג עלות (~$0.01 LLM call)
- [ ] deep explanation streamed (אפילו אם איטי, רואים progress)
- [ ] "המשך" = next question + צבעים מתאפסים

## Source

`docs/screens/lesson_wrong_answer.jpg`
