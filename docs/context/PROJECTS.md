# PROJECTS — מפת הפרויקטים של מוטי

> 3 פרויקטים קשורים שמתערבבים. מסמך זה מונע בלבול (גם Claude התבלבל ביניהם). מעודכן: 2026-05-31.

## 1. StudiBuilder ‖ repo: `Moti316/studi` ‖ **הפרויקט הנוכחי**

- פלטפורמת AI בעברית: PDF/Word → קורסי-לימוד גיימיפיקטיביים.
- Stack: Next.js 15 + Supabase + Inngest + Claude + Voyage + ElevenLabs + Vercel.
- מקומי: `C:\Users\USER\OneDrive\שולחן העבודה\Google_Antigravity\studi`.
- מצב: ראה `STATUS.md`. דיפלוי: `studibuilder.vercel.app`.

## 2. מגן / megen / "איתן" ‖ repo: `Moti316/megen` ‖ **פרויקט-אח, נפרד**

- מערכת v1.2.0 production: סוכן-בטיחות (Claude Code subagents 🦺 מגן + 🛡️ שגיא) + **בוט-טלגרם** (Python + Gemini) + **36 מחברות NotebookLM** (44 מקורות-חקיקה).
- **תפקיד:** כלי-הלימוד-החי של מוטי לוועדה (עובד היום, מייצר ערך — **אסור לפרק**).
- **היחס ל-StudiBuilder:** מגן = curation/לימוד-חי; StudiBuilder = Quiz Engine על desktop. בעתיד (Phase 10) תוכן-מגן יהפוך לקורס-ראשון ב-StudiBuilder. ראה `docs/architecture/ADR-009-magen-integration.md`.
- **הערה:** ה-CLAUDE.md הגלובלי (`C:\Users\USER\.claude\CLAUDE.md`) מתאר את מגן, **לא** את StudiBuilder. התוכנית `recursive-swimming-moon.md` בתיקיית-התוכניות = מגן/"איתן".

## 3. chachmoni ‖ repo: Interactive-educational-game ‖ **פרויקט נפרד לגמרי**

- משחק-חינוכי אינטראקטיבי. לא קשור ל-StudiBuilder/מגן מבחינת קוד. מדיניות-git: single-branch.

## כלל-אצבע

"ממונה בטיחות / טלגרם / NotebookLM / Gemini" → **מגן**.
"קורס / Quiz / Duolingo / Next.js / Supabase" → **StudiBuilder**.
"משחק" → **chachmoni**.
