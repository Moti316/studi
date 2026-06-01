# PROJECTS — מפת הפרויקטים של מוטי

> 2 פרויקטים קשורים שמתערבבים. מסמך זה מונע בלבול (גם Claude התבלבל ביניהם). מעודכן: 2026-05-31.

## 1. StudiBuilder ‖ repo: `Moti316/studi` ‖ **הפרויקט הנוכחי**

- **פלטפורמת-ייצור-קורסים** מלאה בעברית (PDF/Word → קורסי-לימוד גיימיפיקטיביים), נבנית **end-to-end**.
- creator-gated: **רק מוטי** מייצר קורסים. תוצר ראשון: קורס "ממונה בטיחות" — ללימוד-אישי לוועדה **וגם** כמוצר לשיווק.
- Stack: Next.js 15 + Supabase + Inngest + **Google Gemini** (gen/classify/embeddings) + ElevenLabs + Vercel.
- מקומי: clone לפי-מחשב (מוטי עובד מכמה מחשבים). נוכחי: `C:\Users\b0066820\Desktop\Antigravity\studi`.
- מצב: ראה `STATUS.md`. תוכנית: `EXECUTION-PLAN.md`. דיפלוי: `studibuilder.vercel.app`.

## 2. מגן / megen / "איתן" ‖ repo: `Moti316/megen` ‖ **פרויקט-אח, נפרד**

- מערכת v1.2.0 production: סוכן-בטיחות (Claude Code subagents 🦺 מגן + 🛡️ שגיא) + **בוט-טלגרם** (Python + Gemini) + **36 מחברות NotebookLM** (44 מקורות-חקיקה).
- **תפקיד:** כלי-הלימוד-החי של מוטי לוועדה (עובד היום, מייצר ערך — **אסור לפרק**).
- **היחס ל-StudiBuilder:** מגן = curation/לימוד-חי; StudiBuilder = Quiz Engine על desktop. בעתיד (Phase 10) תוכן-מגן יהפוך לקורס-ראשון ב-StudiBuilder. ראה `docs/architecture/ADR-009-magen-integration.md`.
- **הערה:** ה-CLAUDE.md הגלובלי (`C:\Users\USER\.claude\CLAUDE.md`) מתאר את מגן, **לא** את StudiBuilder. התוכנית `recursive-swimming-moon.md` בתיקיית-התוכניות = מגן/"איתן".

## כלל-אצבע

"ממונה בטיחות / טלגרם / NotebookLM / Gemini" → **מגן**.
"קורס / Quiz / Duolingo / Next.js / Supabase / פלטפורמת-ייצור" → **StudiBuilder**.

> הערה: כל פרויקט אחר של מוטי (למשל משחקים) **אינו קשור** ל-StudiBuilder ולא משויך אליו בשום צורה.
