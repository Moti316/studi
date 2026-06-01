# STATUS — דוח-בקרה חי

> **מקור-האמת ל"איפה אנחנו".** טבלאות ה-Phases ב-CLAUDE.md/README.md/MEMORY.md מפנות לכאן.
> מעודכן: 2026-06-02 (יישור-קו אחרי מיזוג v1).
> **מסגרת:** build end-to-end — פלטפורמת-ייצור (creator=מוטי) + קורס-הוועדה (לימוד+שיווק). אין דחיות. ראה [EXECUTION-PLAN.md](EXECUTION-PLAN.md).

## סטטוס Phases (מאומת מול הקוד — `main=93f6d79`)

| Phase             | מצב         | אמת בקוד                                                                          |
| ----------------- | ----------- | --------------------------------------------------------------------------------- |
| 0 Foundation      | ✅ הושלם    | scaffold, CI, RTL, Vercel חי                                                      |
| 1 Auth & Profile  | ✅ הושלם    | Supabase Auth (Google + Magic Link), middleware, rate-limit, ~78% טסטים           |
| 2 Dashboard       | 🟡 חלקי     | UI בלבד, **mock-data**, אין persistence                                            |
| 3 Upload UI       | ❌ לא התחיל | אין `/create/*`                                                                   |
| 4 Course Pipeline | 🟡 חלקי     | **צינור-ייבוא-שאלות T1 ✅** (`scripts/import-content.ts` + `src/lib/import/*`: map-question/scope-tagger/upsert). חסר: RAG chunker/embedder/generation. CLI במקום Inngest (מכוון) |
| 5 Quiz Engine     | 🟡 ~3/5     | `MatchingPairs`+`MCQShort`+`MCQLong`+`LessonPlayer`+`/lesson/[id]` ✅ · admin-תיוג `/admin/questions` ✅. חסר: `ScenarioWalkthrough` (type-5), `ExplanationCard`, `/lesson/practice`+`/exam`, APIs |
| 6-10              | ❌ לא התחיל | gamification/TTS/credits/polish/factory                                           |

## חיבורים ותשתית (סטטוס)

- ✅ Supabase migration הורץ — 7 טבלאות + `coverage_tracker` (57 שורות).
- ✅ Google Drive — auth (loopback) + `test-drive` עוברים.
- ✅ DB connection — `test-db` עובר (DATABASE_URL תקין).
- ✅ אפליקציה רצה מקומית: `localhost:3000` (`/poc/matching` עובד).
- ✅ git: main = `93f6d79`. **v1 (Agent-OS + צינור-ייבוא + admin-תיוג + נגן-שיעור) נמזג ל-main** + תוכן-קורס safety-officer. single-branch; commit/push עובדים. 392 טסטים ירוקים (43 קבצים).

## 🔴 חוסמים פעילים

- ✅ `GEMINI_API_KEY` מוגדר ומאומת (50 מודלים זמינים · generateContent עובד). **אין חוסמים טכניים** — הצינור בנוי; M5 חסום-תכנונית בלבד (אישורי מוטי 1→3 + צמצום discovery).
- ℹ️ Node v24.16.0 + pnpm + deps מותקנים; husky hooks **עובדים** כאן (git-bash + nodejs ב-PATH). מחשב קודם בלבד: ראה `BUGS.md#git-bash-fork`.

## הצעד הבא (priority) — ראה `TODO.md` (מקור-אמת למשימות)

תלות-קריטית 1→3 דורשים את מוטי, פותחים את M5:

1. **ISO** — סקירת `ISO-31010/31000-DRAFT` עם מוטי → מיקום סופי.
2. **חקיקה** — אישור טבלת-37-נוסחים → הורדת ~35 מנבו → `sources/legislation/`.
3. **פרויקט-גמר** — מצגת-הנחיות ממוטי → עדכון `FINAL-PROJECT.md`.
4. **M5** — הרצת-ייבוא בנק-השאלות (~540) + תיוג-Gemini Flash (hard-cap $5; **לצמצם discovery** — dry-run מצא 69 קבצים, רחב-מדי).
5. **M6** — `code-review` + `security-review` → תיקונים.

> ✅ הושלם: v1 מוזג ל-main · תוכן-קורס safety-officer (13 מסמכים) · יישור-קו · SessionStart hook · Drive מחובר+מופה · single-branch `main`.

## מה לא קיים (פערים אמיתיים שנותרו)

- **RAG מלא** — chunker/embedder (pgvector) ל-"הסבר לעומק" עדיין לא נכתב (הצינור הנוכחי = ייבוא בנק-שאלות מוכן, לא RAG-chunking). ראה `docs/implementation-gaps.md`.
- **Quiz type-5** — `ScenarioWalkthrough` + `ExplanationCard` + routes `/lesson/practice`+`/exam` + APIs (next-question/attempts/evaluate-scenario/deep-explanation).
- **persistence** ל-Dashboard (Phase 2 עדיין mock-data) · Upload UI (Phase 3).
