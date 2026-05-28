# Dashboard — `/dashboard`

> **Phase**: 2 (skeleton) + 6 (gamification live) · States: first-time / with-courses

## Purpose

מסך-הבית של משתמש מחובר. נקודת-התחלה לכל פעולה: יצירת קורס, המשך לימוד, סטטיסטיקה.

## States

### first-time (משתמש חדש)
- header counters: credits=X (mock 1500), XP=0, streak=0
- CTA: "+ קורס חדש" (כחול בולט)
- Bob mascot שמח
- streak card: "אין רצף עדיין - למד היום כדי להתחיל!"
- weekly calendar (7 ימים) - היום מסומן בכחול
- XP today: 0/20 - "עוד 20 XP"
- lessons today: 0/1 - "עוד אחד!"
- level: "מתחיל" (placeholder badge)

### with-courses
- grid של קורסים פעילים (cards)
- toggle "כל הקורסים" / "סטטיסטיקות"
- streak פעיל (להבה צהובה + מספר)

## Layout

```
┌─────────────────┐
│ [1500] [0⚡] [0🔥] ערב טוב  │
│ היי מוטי לוי!               │
│                              │
│ ┌─ Bob + "בוא נתחיל ─┐      │
│ │  ללמוד היום!"      │      │
│ │  [+ קורס חדש]      │      │
│ └────────────────────┘      │
│                              │
│ [כל הקורסים] [סטטיסטיקות]   │
│                              │
│ ┌─ streak card ──────┐       │
│ │ אין רצף עדיין      │       │
│ │ ש ו ה ד ג ב א       │       │
│ │ 30 29 [28] 27 ...   │       │
│ └────────────────────┘       │
│                              │
│ [XP 0/20]  [lessons 0/1]    │
│                              │
│ [level badge]                │
│                              │
│ ─────────────────            │
│ הגדרות | סטטיסטיקות         │
│ קורסים | בית                │
└─────────────────┘
```

## Components

- `<UserHeaderStats>` (3 counters)
- `<GreetingBanner>` time-aware
- `<NewCourseCTA>`
- `<ViewToggle>` (courses/stats)
- `<StreakCard>` עם calendar
- `<DailyProgressCard>` x 2
- `<LevelBadge>`
- `<BottomNav>` (4 tabs)

## Data dependencies

- DB queries:
  - `users` (name)
  - `credits` (balance)
  - `attempts` aggregate (XP today)
  - `streaks` (current, last_active)
  - `lessons_completed` aggregate
- Realtime: credits/XP changes

## Acceptance

- [ ] greeting משתנה לפי שעה (בוקר/צהריים/ערב טוב)
- [ ] counters מתעדכנים live (Supabase Realtime)
- [ ] streak נשבר נכון ב-00:00 (Asia/Jerusalem)
- [ ] mobile-first: 1 column, desktop: 2 columns
- [ ] axe-core 0 violations, Lighthouse a11y >= 95

## Related

- ↗ `auth-modal.md`
- ↘ `create-1-source.md` (via "+ קורס חדש")
- ↘ `lesson-mcq-long.md` (via course card)
- ↘ `settings.md`, `stats.md`, `courses-list.md` (via bottom nav)

## Source

`docs/screens/dashboard.jpg`
