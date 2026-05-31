# STATUS — דוח-בקרה חי

> **מקור-האמת ל"איפה אנחנו".** טבלאות ה-Phases ב-CLAUDE.md/README.md/MEMORY.md מפנות לכאן.
> מעודכן: 2026-05-31.

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
- ✅ git: main = `ec77020` (מכיל 100% מהתוכן).

## 🔴 חוסמים פעילים

- **git-bash שבור** (`fork: Resource temporarily unavailable`, 0xC0000142) → **כל commit/push מקומי חסום** כי husky מריץ hooks דרך git-bash. ראה `BUGS.md#git-bash-fork`. → git-writes נעשים דרך GitHub web עד שזה ייפתר.
- `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY` טרם הופקו → ה-import pipeline לא ניתן-להרצה.

## הצעד הבא (priority)

1. **להחליט על מנגנון-commit** (לאור git-bash השבור): לתקן git-bash / לאשר `--no-verify` + בדיקות-ידניות / לעבוד דרך GitHub. ראה `SESSION-LOG.md`.
2. ניקוי git שאושר: מחיקת 4 ענפים, הוצאת וידאו (ממתין למנגנון-commit/push).
3. בניית ה-import pipeline (אחרי מפתחות Anthropic+Voyage). ראה `EXECUTION-PLAN.md`.

## מה לא קיים אך התיעוד מרמז שכן

`scripts/import-content.ts` + `src/lib/import/*` (chunker/scope-tagger/embedder) — **לא נכתבו**. רק parsers + drive client. ראה `docs/implementation-gaps.md`.
