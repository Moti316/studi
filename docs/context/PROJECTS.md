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

> **✅ כלל-מגן (firewall) — בוטל 2026-06-09 (REVERSED):** כלל-ה-firewall הקודם (השראה-בלבד · אסור-להעתיק · HYBRID-ככלל) **בוטל** בהכרעת-מוטי. מוטי בעל-שני-הריפו → **אפס-licensing**; כעת **מותר לפורט** את פרומפט-המאסטר של מגן (חיבור-תרחישי-וועדה / סימולציה) ל-StudiBuilder, **name-cleaned** (להסיר מגן/שגיא/Telegram/מזהי-בעלים · לשמור 4-עקרונות · Zero-Harm · common-pitfalls · 3-מצבי-תשובה). ריפו-מגן (`github.com/Moti316/megen`) **נשאר מבודד** — clone לתיקייה-סמוכה · read-only · **תוכן-פרומפט בלבד** (לא מנוע-Python). זרימה: NotebookLM מעגן חוק/תקנה (verbatim · G3) → פרומפט-מגן מחבר (Gemini-API · offline) → אימות-סמנטי → ייבוא. מקור: [`../architecture/ADR-009-magen-integration.md`](../architecture/ADR-009-magen-integration.md) (תיקון 2026-06-09).
>
> ~~**🔒 כלל-מגן (firewall) — השראה-בלבד:** ריפו-מגן (`github.com/Moti316/megen` · איתן+שגיא) = השראה/reference בלבד למבנה/תכנון (תרחישים פר-ענף · `study_plan_90days` · committee_bank · 4-עקרונות-הוועדה). אסור להעתיק/לקחת קוד · תוכן · prompts. לעולם לא מתערבב עם ריפו-StudiBuilder (קריאה → תיקייה נפרדת בלבד). נדרשת פרסונה? HYBRID — מחלצים את המבנה-המוכח כ-spec, כותבים native (name-clean·RAG·cache·ציטוט), מאמתים parity מול committee_bank. ללא copy/coupling. ספק → מוטי. (גובר על ADR-009 Phase B — העתקה-verbatim מבוטלת.)~~ — **בוטל 2026-06-09, ראה ADR-009.**

- **הערה:** ה-CLAUDE.md הגלובלי (`C:\Users\USER\.claude\CLAUDE.md`) מתאר את מגן, **לא** את StudiBuilder. התוכנית `recursive-swimming-moon.md` בתיקיית-התוכניות = מגן/"איתן".

## כלל-אצבע

"ממונה בטיחות / טלגרם / NotebookLM / Gemini" → **מגן**.
"קורס / Quiz / Duolingo / Next.js / Supabase / פלטפורמת-ייצור" → **StudiBuilder**.

> הערה: כל פרויקט אחר של מוטי (למשל משחקים) **אינו קשור** ל-StudiBuilder ולא משויך אליו בשום צורה.
