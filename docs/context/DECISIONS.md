# DECISIONS — לוג החלטות

> החלטות-מפתח שורה-בשורה (מעבר ל-ADRs הפורמליים). חדש למעלה. מעודכן: 2026-05-31.

## 2026-05-31

- **ארכיטקטורת-הקשר:** 9 קבצים ב-`docs/context/` (שמות אנגלית, תוכן עברית). מחליפים את הפיזור הקיים.
- **git workflow:** single-branch — commit+push ל-`main` בסיום כל משימה. נמחקים כל הענפים מלבד main.
- **שפה:** כל השיחה בעברית. (נשמר ל-memory)
- **Todolist:** לתחזק `Todolist.md` גלוי (gitignored), משימות שהושלמו ✅ נשארות לעין.
- **וידאו:** ~113MB mp4 יוצאים מ-git (untrack + .gitignore); כיווץ-היסטוריה נדחה.
- **טיוב:** Quick-wins בלבד (לא איחוד עמוק של content docs כעת).
- **git-bash שבור:** הוחלט לא לעקוף hook (`--no-verify`) באופן אוטונומי — ממתין להחלטת מוטי.
- **autocrlf=false** + `.gitattributes` (LF ל-husky/sh) — לתיקון בעיית-CRLF ב-hooks.

## 2026-05-30

- **שימוש-חוזר בפרויקט GCP הקיים** (`studibuilder-drive`) ל-Drive, לא חדש.
- **OAuth client חדש "StudiBuilder Drive Import"** (Desktop); הישן "StudiBuilder Drive Reader" — למחיקה.
- **DATABASE_URL = Session pooler** (תומך prepared statements; Transaction pooler ישבור drizzle).
- **migration הורץ ידנית** ב-Supabase SQL Editor (7 טבלאות + coverage_tracker).

## רקע (מסשנים קודמים — מתועד ב-ADRs)

- AI pipeline = build-from-scratch (לא NotebookLM כ-engine). ADR-002/005.
- Google login-only (בלי Drive scope ב-public app); Drive scope רק ל-import script. ADR-003/011.
- Course-as-Product Factory (Phase 10). ADR-006.
- מגן integration: Phased Convergence (side-by-side עד הוועדה). ADR-009.
- Drive = source-of-truth לתוכן (לא megen-repo). ADR-009/011.
