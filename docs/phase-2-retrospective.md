# Phase 2 — Dashboard Skeleton: Retrospective

> **Status**: ✅ Complete (mock-first; persistence ל-Phase 6+) · **Date**: 2026-05-29

## מה הושלם

### Mock data

- [x] `src/lib/mock/user.ts` — נתוני משתמש קבועים (שם, XP, streak, daily goal, theme, voice)
- [x] `src/lib/mock/courses.ts` — רשימת קורסים לדוגמה

### UI components — Dashboard

- [x] `BottomNav` — ניווט תחתי, 4 tabs, RTL-first
- [x] `GreetingBanner` — ברכה לפי שעה (`hour` prop לטסטים דטרמיניסטיים)
- [x] `UserHeaderStats` — XP, streak, daily goal
- [x] `StreakCard` — רצף ימי לימוד
- [x] `DailyProgressCard` — Progress bar יומי
- [x] `CourseCard` — כרטיס קורס עם LevelBadge
- [x] `EmptyState` — מצב ריק (אין קורסים)
- [x] `NewCourseCTA` — כפתור "צור קורס חדש"
- [x] `LevelBadge` — תג רמה

### UI components — Settings

- [x] `SettingsForm` + `SettingsSection` — מעטפת הגדרות
- [x] `ThemeSelector` — בחירת ערכת-צבעים (client state)
- [x] `VoiceGrid` — בחירת קול TTS מתוך 4 אפשרויות (client state)
- [x] `DailyGoalSelector` — בחירת יעד יומי (client state)
- [x] `ToggleRow` — שורת הפעלה/כיבוי כללית

### Primitives שנוספו

- [x] `src/components/ui/switch.tsx` — shadcn Switch
- [x] `src/components/ui/tabs.tsx` — shadcn Tabs
- [x] `src/components/ui/progress.tsx` — shadcn Progress

### Routes

- [x] `src/app/dashboard/page.tsx` — הורחב מ-stub לעמוד מלא
- [x] `src/app/courses/page.tsx` — רשימת קורסים + EmptyState
- [x] `src/app/stats/page.tsx` — לשוניות תקופה (Tabs) + placeholders
- [x] `src/app/settings/page.tsx` — הורחב: theme / voice / goal / notifications

### בדיקות

- [x] `tests/unit/components/BottomNav.test.tsx`
- [x] `tests/unit/components/GreetingBanner.test.tsx`
- [x] `tests/unit/components/UserHeaderStats.test.tsx`
- [x] `tests/unit/components/StreakCard.test.tsx`
- [x] `tests/unit/components/DailyGoalSelector.test.tsx`
- [x] `tests/unit/components/ThemeSelector.test.tsx`
- [x] `tests/unit/components/VoiceGrid.test.tsx`
- [x] `tests/unit/mock/courses.test.ts`
- [x] `tests/unit/mock/user.test.ts`

### תיעוד

- [x] `docs/architecture/ADR-004-dashboard-shell.md`

## Gates

| Gate              | סטטוס | הערה                  |
| ----------------- | ----- | --------------------- |
| A — lint          | ⏳    | טרם הורץ על branch זה |
| B — typecheck     | ⏳    | טרם הורץ על branch זה |
| C — unit/coverage | ⏳    | טרם הורץ על branch זה |
| D — e2e           | ⏳    | קוד כתוב; ירוץ ב-CI   |
| build             | ⏳    | טרם הורץ על branch זה |

## פערים נדחו ביודעין

- **Persistence (theme / voice / goal)** — client state בלבד; יועבר ל-DB עם user-prefs schema (Phase 6+)
- **Toast** — אין פעולות בPhase 2 שמחייבות אישור; ייכנס עם XP/streak (Phase 6)
- **Charts אמיתיים ב-Stats** — placeholder; נתונים אמיתיים (Phase 4+), עיצוב סופי (Phase 9)
- **BottomNav ב-desktop (responsive layout)** — Phase 9

## הצעד הבא

**Phase 3 — Upload UI** (5-step wizard):
בחירת-קובץ → validation → העלאה → confirmation → ניווט לקורס.
