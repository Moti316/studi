# Create Course - Step 3: Page Selector — `/create-c` (3/5)

> **Phase**: 3 (UI) + 4 (data wired) · States: 0-selected / N-selected / all-selected

## Purpose

משתמש בוחר אילו עמודים/פריטים מהמקור לכלול בקורס. ב-StudiesGo ראיתי 570 שאלות בקובץ אחד.

## States

- **0 selected**: כל פריט עם circle ריק. "0 / 570 נבחרו". CTA "בחר הכל" אפור
- **N selected**: לפחות 1 ✓. CTA "בטל הכל". אופציה ל-MVP: סינון לפי-קטגוריה
- **all selected**: כולם ✓. CTA "בטל הכל" כתום-בולט

## Layout

```
[progress: ●●●●○ 3/5]
[Bob mascot]
[file chip: Emailing.pdf · 570 עמ' · 1.7 MB]
"בחר אילו עמודים לכלול בקורס"
[ 0 / 570 נבחרו ] [בחר הכל]
[grid: 3 cols mobile, 5-6 desktop]
  [card: "מבדק סיכום" שאלה #1 ⓘ ●1]
  [card: ...]
  ...
[המשך →]
```

## Components

- `<WizardProgress>`, `<FileChipReadonly>`
- `<SelectionToolbar>` (count + select-all)
- `<PageGrid>` עם virtual scroll
- `<PageCard>` (number badge, type, preview, checkbox)

## Data

- `course_drafts.parsed_pages` (after Phase 4.1)
- POST `/api/courses/draft/select-pages` { pageIds: [...] }

## Acceptance

- [ ] 570 פריטים נטענים תוך 2s (virtual scroll)
- [ ] click on card = toggle selection
- [ ] click on ⓘ = preview modal
- [ ] selection persisted to draft

## Source

`docs/screens/create_select_pages.jpg`
