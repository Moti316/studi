# ADR-004: Dashboard Shell — BottomNav, Mock Data, Primitives, State

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: frontend-lead · content-writer · motilev8
> **Phase**: 2

---

## Context

Phase 2 מייצרת skeleton מלא ל-4 מסכים: `/dashboard`, `/courses`, `/stats`, `/settings`.
המסכים צריכים ניווט, נתוני-משתמש, ומשתני-מראה וקול — לפני שיש DB, auth אמיתי, או pipelines.

---

## Decisions

### 1. BottomNav — ניווט תחתי (לא Sidebar)

**BottomNav** במקום sidebar.

- המוצר מיועד בראש ובראשונה למובייל (StudiesGo-inspired).
- Sidebar מכניס friction ב-thumb-zone; BottomNav נגיש בין-אגודל.
- דסקטופ: BottomNav נשאר — שלב ה-responsive layout קבוע ל-Phase 9.
- ה-component: `src/components/dashboard/BottomNav.tsx`.

**נדחה**: Sidebar (נדחה — לא mobile-first).

### 2. Mock data מקומי — `src/lib/mock/`

DB queries אינם קיימים ב-Phase 2. במקומם:

- `src/lib/mock/user.ts` — נתוני משתמש קבועים (שם, XP, streak, daily goal, theme, voice).
- `src/lib/mock/courses.ts` — רשימת קורסים לדוגמה.

המסכים מייבאים ישירות מהמודולים האלה. אין API calls, אין Supabase.
המעבר לנתונים אמיתיים בשלב מאוחר יחליף את ה-imports — אפס שינוי ב-UI logic.

**נדחה**: DB queries / server actions — תלוי-schema (Phase 4+).

### 3. Primitives שנוספו

שלושה primitives של shadcn/ui נוספו לצורכי Phase 2:

| Primitive                                     | שימוש                    |
| --------------------------------------------- | ------------------------ |
| `Switch` (`src/components/ui/switch.tsx`)     | ToggleRow בהגדרות        |
| `Tabs` (`src/components/ui/tabs.tsx`)         | מסך Stats (לשונות תקופה) |
| `Progress` (`src/components/ui/progress.tsx`) | DailyProgressCard        |

**לא נוסף**: `Toast` — אין פעולות בPhase 2 שמצריכות אישור ויזואלי. Toast ייכנס עם XP/streak (Phase 6).

### 4. Theme ו-Voice כ-client state בלבד

`ThemeSelector` ו-`VoiceGrid` מנהלים מצב ב-`useState` בלבד.
לא נכתב persistence (localStorage / DB) — כי:

- Phase 2 הוא UI-only; לא ניתן לכתוב ל-DB עדיין.
- localStorage persistence ב-Phase 2 היה יוצר ציפיית-משתמש שתישבר בהמרה לDB.

המצב מתאפס ב-refresh — **ביודעין**, ומתועד כ-mock.
Persistence אמיתית ל-Phase 6+ (gamification + user prefs).

### 5. Hour prop ב-GreetingBanner — הזרקת-זמן לטסטים דטרמיניסטיים

`GreetingBanner` מקבל `hour?: number` prop במקום לקרוא `new Date().getHours()` פנימית.
כך הטסטים מזריקים שעה קבועה ("בוקר טוב" / "אחר הצהריים" / "ערב טוב") ללא תלות בשעון-הסביבה.
בפרודקשן — ה-page מעביר `new Date().getHours()`; ברירת-מחדל = שעה נוכחית.

---

## Alternatives Considered

### Sidebar במקום BottomNav

- ✅ מוכר יותר ב-desktop SaaS
- ❌ thumb-zone בעיה במובייל
- ❌ Phase 2 הוא mobile-first

### Server Components עם DB Queries

- ✅ ריאליסטי יותר
- ❌ חוסם Phase 2 על Supabase keys שעדיין לא קיימים
- ❌ מאחר Phase 3 בלי צורך

### Zustand / Context לניהול state

- ✅ מאפשר persistence בין-routes
- ❌ over-engineering לפני שיש schema מוגדר
- ❌ ייוצר אחרי Phase 4 (כשיש data model מוגדר)

---

## Consequences

### Positive

- ✅ Phase 2 מסתיים ללא Supabase keys — mock-first עובד
- ✅ BottomNav תואם מובייל ו-RTL מהיום הראשון
- ✅ `hour` prop מאפשר טסטים דטרמיניסטיים ל-GreetingBanner
- ✅ Primitives (Switch, Tabs, Progress) זמינים לכל Phase מכאן והלאה

### Negative / Trade-offs

- ❌ state מצב theme/voice מתאפס ב-refresh (מתועד, ביודעין)
- ❌ אין charts אמיתיים ב-Stats (Phase 9)
- ❌ Toast נעדר עד Phase 6

---

## References

- ADR-001 (Stack — shadcn/ui, Tailwind, Supabase)
- `docs/screens-spec/dashboard.md`
- `docs/screens-spec/settings.md`
- Phase 1 Retrospective — mock-first pattern
