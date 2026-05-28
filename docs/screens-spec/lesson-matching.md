# Lesson - Matching Pairs — `/lesson/[id]` (question type 3/4)

> **Phase**: 5 · States: initial / pairing / all-paired / check / correct / wrong

## Purpose
התאם 3-4 מונחים ל-3-4 הגדרות בין 2 עמודות. State machine מורכב.

## States
- **initial**: 2 columns, אף item לא נבחר
- **pairing**: tap on left column item → highlights orange. tap on right = pair
- **all-paired**: כל ה-pairs מוצמדים, כפתור "בדוק תשובה" פעיל
- **check** → correct/wrong feedback

## Layout
```
[header same]

"התאם בין בעל התפקיד לתחומי אחריותו העיקריים:"

┌─ הגדרות (left) ──┬─ מונחים (right) ─┐
│ קידום תרבות      │ ממונה בטיחות     │
│ בטיחות וניהול    │                   │
│ סיכונים          │                   │
├──────────────────┼───────────────────┤
│ פיקוח על קיום    │ ועדת בטיחות      │
│ הוראות החוק      │                   │
├──────────────────┼───────────────────┤
│ אכיפת נהלי       │ מפקח עבודה       │
│ בטיחות וגיהות    │                   │
└──────────────────┴───────────────────┘

[בדוק תשובה]
```

## Components
- `<MatchingPairsBoard>` (state machine - reducer)
- `<MatchingItem>` (state: idle / selected / paired-color-1/2/3)
- `<CheckMatchingButton>` (disabled עד שכל ה-pairs מסומנים)

## Data
- Question schema:
  ```json
  {
    type: "matching",
    pairs: [
      { left: "...", right: "..." },
      ...
    ]
  }
  ```
- POST `/api/attempts` עם array of pair-IDs

## Acceptance
- [ ] tap בעמודה ימין → highlight כתום → tap בעמודה שמאל = pair
- [ ] tap על כבר-paired = ביטול
- [ ] color coding לפי-זוג (orange/blue/green)
- [ ] mobile-first - tap-friendly

## Source
`docs/screens/lesson_matching.jpg`
