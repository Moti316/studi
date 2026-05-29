# Phase 1 - Auth & Profile: Retrospective

> **Status**: ✅ Complete (mock-first; ממתין ל-Supabase keys לחיווט אמיתי) · **Date**: 2026-05-29

## מה הושלם

### שכבת-שרת

- [x] `src/lib/supabase/env.ts` — ולידציית-zod ל-public env, `isSupabaseConfigured`, `isServiceRoleConfigured`
- [x] `src/lib/supabase/client.ts` — browser client (env-gated)
- [x] `src/lib/supabase/server.ts` — server client עם cookies של Next 15 (async)
- [x] `src/lib/supabase/middleware.ts` — refresh session + הגנת-routes, **fail-closed בפרודקשן**
- [x] `src/lib/supabase/admin.ts` — service-role client (server-only) למחיקת-משתמש
- [x] `src/lib/auth/schema.ts` — סכמות zod עם הודעות בעברית
- [x] `src/lib/auth/rate-limit.ts` — 3/שעה + 60s cooldown, case-insensitive, מתועד כ-mock
- [x] `src/lib/auth/redirect.ts` — `sanitizeNext` עם הגנה מ-encoded-slashes ו-backslash tricks
- [x] `src/lib/auth/telemetry.ts` — `logError` + `maskEmail` (אפס PII בלוגים)
- [x] `src/lib/auth/server.ts` — `getUser` / `requireAuth`
- [x] `src/lib/auth/actions.ts` — server actions: Google OAuth (`openid email profile`), magic-link, signOut, deleteAccount (admin-delete + cascade TODO)
- [x] `src/middleware.ts` — matcher + הגנה
- [x] `src/app/auth/callback/route.ts` — OAuth/magic-link callback עם sanitize

### UI (עברית RTL first-class)

- [x] Primitives: `Button`, `Input`, `Label`, `Dialog` (Radix)
- [x] Auth components: `AuthCard`, `AuthModal`, `AuthLayout`, `GoogleSignInButton`,
      `MagicLinkForm`, `MagicSentView`, `BobMascot`, `SignOutButton`, `DeleteAccountModal`
- [x] Routes: `/login`, `/beta-access`, `/auth/callback`, `/dashboard` (stub מוגן),
      `/settings` (account + danger), `/terms`, `/privacy`

### בדיקות

- [x] 59 unit/component tests עוברים (13 קבצים)
- [x] coverage **78.75% lines / 82.5% functions** (מעל סף Phase 0 = 60%)
- [x] e2e ל-`/beta-access` (`tests/e2e/auth.spec.ts`) — ירוץ ב-CI

### תיעוד

- [x] `docs/screens-spec/account-delete.md` עודכן: צ'קליסט acceptance ממופה לסטטוס,
      סעיף "Retention exceptions" (backups, audit log, Sentry)
- [x] `CLAUDE.md` — סטטוס Phase 1 = `[~]`

### תשתית (חוב Phase 0 שנסגר במהלך)

- [x] מעבר ל-ESLint flat config (`eslint.config.mjs`) כדי ש-`eslint` הגולמי של
      `lint-staged` יעבוד, לא רק `next lint`
- [x] `tailwind.config.ts` — `require()` → ESM import (`no-require-imports`)
- [x] `types/tailwindcss-rtl.d.ts` (אין טיפוסים upstream)
- [x] `pnpm-lock.yaml` — נוסף ל-repo (לא היה tracked ב-Phase 0)
- [x] `@vitest/coverage-v8` נוסף ל-devDependencies (חסר ל-CI)
- [x] husky 9 — הסרת shim lines

## ביקורות שבוצעו

הופעלו 3 סוקרים במקביל לפני ה-Fix phase:

### Appsec (verdict: CONCERNS)

- **H1** — Host Header Injection ב-`getOrigin()` → תוקן: `NEXT_PUBLIC_APP_URL` נדרש בפרודקשן
- **M1** — `sanitizeNext` לא מגן מ-`%2F%2F` → תוקן: decode + מספר בדיקות
- **M2** — Middleware no-op בפרודקשן ללא env → תוקן: fail-closed על routes מוגנים
- **L2** — `next` param לא מועבר דרך OAuth → תוקן: `callbackUrl(origin, next)`
- PASS: OAuth scope, cookie flags, CSRF, PII בלוגים, secrets, email validation

### Privacy (verdict: CONCERNS)

- **HIGH-1** — מחיקה מחזירה הצלחה אחרי `signOut` בלבד → תוקן: מחיקה אמיתית
  דרך `admin.auth.admin.deleteUser`, או כישלון מפורש
- **HIGH-2** — `account-delete.md` חסר retention exceptions → תוקן: סעיף ייעודי
- **MEDIUM** — placeholder חושף אימייל מלא → תוקן: `maskEmail(userEmail)`
- **MEDIUM** — ניסוח הסכמה implicit → תוקן: "בהרשמה או התחברות"

### Bughunt + Completeness (test-engineer)

- **BUG-1** — שגיאת Google תלויה אחרי "שנה אימייל" → תוקן: `setError(null)` ב-`onChangeEmail`
- **BUG-2** — כפתור "שלח שוב" פעיל אחרי hourly-quota → תוקן: cooldown ב-`finally`
- **BUG-3** — הודעת hourly-quota חסרת זמן מדויק → תוקן: `Math.ceil(retryAfterSec/60)`
- **GAP-1** — אין טסט ל-`MagicSentView` → תוקן: 3 טסטים (display, lock, change-email)
- **GAP-2** — אין טסט ל-`GoogleSignInButton` → תוקן: 2 טסטים (success redirect, error)

## Gates

| Gate              | סטטוס | הערה                                                           |
| ----------------- | ----- | -------------------------------------------------------------- |
| A — lint          | ✅    | ESLint flat config + Prettier נקיים                            |
| B — typecheck     | ✅    | tsc --noEmit נקי                                               |
| C — unit/coverage | ✅    | 59 tests, 78.75% lines                                         |
| D — e2e           | ⏳    | קוד כתוב; ירוץ ב-CI (דפדפן חסום בסביבת-הסשן)                   |
| build             | ✅    | 9 routes, middleware פעיל                                      |
| smoke בריצה       | ✅    | RTL, ניתובי-הגנה (`/settings` → `/beta-access?next=/settings`) |

## פערים נדחו ביודעין

- **cascade-delete לטבלאות-משנה** — תלוי schema (data-engineer)
- **Audit log** — תלוי schema (ADR-003 Phase 1.4)
- **Email confirmation אחרי מחיקה** — תלוי Resend (Phase 7/9)
- **In-memory rate-limit → Redis** — Phase 8/9
- **Sentry PII scrubbing** — Phase 9
- **תוכן משפטי מלא ב-`/terms` ו-`/privacy`** — Phase 9 (content-writer + privacy-officer)

## למידות

1. **mock-first עובד מצוין** — ה-UI נטען ופועל ללא Supabase keys. ה-actions מחזירות
   מצב-שגיאה ידידותי ("ההתחברות אינה זמינה כרגע") במקום קריסה. החיווט האמיתי
   הוא הוספת keys בלבד — אפס שינוי-קוד.

2. **ביקורת מקבילה משתלמת** — 3 סוקרים במקביל זיהו 11 ממצאים שונים שכיסו זוויות
   משלימות (אבטחת-host, פרטיות-מחיקה, באגי-UX). שלב Fix אחד מאוחד טיפל בכולם.

3. **חוב-תשתית מ-Phase 0** — `.eslintrc` יישן, `pnpm-lock.yaml` לא tracked,
   `@vitest/coverage-v8` חסר — הסתתרו עד ש-`lint-staged` ו-CI ניסו להריץ אותם.
   למפיק ה-roadmap: Phase 0 צריך לכלול ריצת-CI מלאה כחלק מ-Definition-of-Done.

4. **דפוסי-טסטים ב-jsdom** — recursive timers + React state (כמו cooldown ב-`MagicSentView`)
   קשים ל-fast-forward אמין; טוב יותר לכסות ב-e2e.

## הצעד הבא

**Phase 2 — Dashboard skeleton** (frontend lead, 3 ימים):
`/dashboard`, `/courses`, `/stats`, `/settings` (UI בלבד). ה-stubs של `/dashboard`
ו-`/settings` כבר קיימים — נרחיב אותם לזרימה מלאה לפי `screens-spec/dashboard.md`,
`courses-list.md`, `stats.md`, ו-`settings.md` (סעיפי למידה/מראה/קול/נגישות/התראות).
