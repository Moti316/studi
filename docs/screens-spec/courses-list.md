# Courses List — `/courses`

> **Phase**: 2 (empty/loading) + 4 (populated) · States: loading / empty / list

## Purpose
רשימת כל הקורסים של המשתמש. כניסה לקורס → רשימת שיעורים.

## States
- **loading**: Bob + "עוד כמה רגעים..." (סקופן כחול)
- **empty**: Bob + "אין לך עדיין קורסים" + CTA "+ צור קורס"
- **list**: grid של כרטיסי-קורס (title, progress %, last-accessed)

## Layout
```
[header: קורסים]
[+ קורס חדש]
[grid: 2 cols mobile, 3 desktop]
  [card: title, % progress, last-accessed]
  ...
[bottom nav]
```

## Components
- `<CourseCard>`, `<EmptyState>`, `<LoadingMascot>`, `<BottomNav>`

## Data
- `SELECT * FROM courses WHERE user_id = X ORDER BY last_accessed DESC`

## Acceptance
- [ ] empty state ידידותי
- [ ] click על card → `/courses/[id]` (רשימת שיעורים)
- [ ] virtual scroll מעל 50 קורסים

## Source
`docs/screens/` - frame_003 of `06_chrome_230810`
