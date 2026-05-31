# STATUS — דוח-בקרה חי

> **מקור-האמת ל"איפה אנחנו".** טבלאות ה-Phases ב-CLAUDE.md/README.md/MEMORY.md מפנות לכאן.
> מעודכן: 2026-05-31.
> **מסגרת:** build end-to-end — פלטפורמת-ייצור (creator=מוטי) + קורס-הוועדה (לימוד+שיווק). אין דחיות. ראה [EXECUTION-PLAN.md](EXECUTION-PLAN.md).

## סטטוס Phases (מאומת מול הקוד)

| Phase             | מצב         | אמת בקוד                                                                |
| ----------------- | ----------- | ----------------------------------------------------------------------- |
| 0 Foundation      | ✅ הושלם    | scaffold, CI, RTL, Vercel חי                                            |
| 1 Auth & Profile  | ✅ הושלם    | Supabase Auth (Google + Magic Link), middleware, rate-limit, ~78% טסטים |
| 2 Dashboard       | 🟡 חלקי     | UI בלבד, **mock-data**, אין persistence                                 |
| 3 Upload UI       | ❌ לא התחיל | אין `/create/*`                                                         |
| 4 Course Pipeline | ❌ לא התחיל | parsers קיימים, אבל אין Inngest/embedding/RAG/generation                |
| 5 Quiz Engine     | ⚠️ 1/5      | רק `MatchingPairs` (POC). אין `/lesson/[id]`, אין API                   |
| 6-10              | ❌ לא התחיל | gamification/TTS/credits/polish/factory                                 |

## חיבורים ותשתית (סטטוס)

- ✅ Supabase migration הורץ — 7 טבלאות + `coverage_tracker` (57 שורות).
- ✅ Google Drive — auth (loopback) + `test-drive` עוברים.
- ✅ DB connection — `test-db` עובר (DATABASE_URL תקין).
- ✅ אפליקציה רצה מקומית: `localhost:3000` (`/poc/matching` עובד).
- ✅ git: main = `415e149`. מחובר ב-2 מחשבים; במחשב הנוכחי `.env.local` הוקם ו-commit/push עובדים.

## 🔴 חוסמים פעילים

- `GEMINI_API_KEY` טרם הוגדר → ה-import pipeline + ה-AI לא ניתנים-להרצה (שדה ריק ב-`.env.local`; כנראה כבר ברשות מוטי דרך מגן).
- `node_modules` לא מותקן במחשב הנוכחי → `pnpm install` לפני הרצת scripts/dev/Drive.
- ℹ️ git-bash blocker **לא קיים במחשב הנוכחי** (husky לא מוגדר; commit/push עובדים). היה רלוונטי רק למחשב הקודם — ראה `BUGS.md#git-bash-fork`.

## הצעד הבא (priority)

1. `pnpm install` → `pnpm drive:test` (אימות חיבור-Drive + מיפוי 2 התיקיות `mainCourse`+`legacy`).
2. להגדיר `GEMINI_API_KEY` → לבנות import pipeline (ADR-011, Gemini) → Quiz Engine (Phase 5).
3. ניקוי git: מחיקת 4 ענפים. (**וידאו נשאר ב-repo** — החלטת מוטי.)
4. המשך end-to-end: Upload UI (Phase 3) → persistence (Phase 2) → Course-as-Product (Phase 10). ראה `EXECUTION-PLAN.md`.

## מה לא קיים אך התיעוד מרמז שכן

`scripts/import-content.ts` + `src/lib/import/*` (chunker/scope-tagger/embedder) — **לא נכתבו**. רק parsers + drive client. ראה `docs/implementation-gaps.md`.
