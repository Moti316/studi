# ACCESS-MAP — מפת מפתחות, שירותים וחשבונות

> ⚠️ **לא סודות כאן** — רק המפה (איזה מפתח, איפה הוא חי, מה הסטטוס). הערכים עצמם ב-`.env.local` (gitignored) וב-Vercel. מעודכן: 2026-05-31.

## שירותים חיצוניים

| שירות                         | זיהוי / חשבון                                                                                              | סטטוס מפתחות                                  | איפה                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| **Supabase**                  | project ref `nsinpdzkvvbsdthkobxu` · `studibuilder.supabase.co` · org Moti316 (Free) · region eu-central-1 | ✅ URL/anon/service_role/DATABASE_URL מוגדרים | `.env.local` + Vercel                       |
| **Google Drive**              | GCP project `studibuilder-drive` · OAuth client "StudiBuilder Drive Import" (Desktop)                      | ✅ client_id/secret/refresh_token עובדים      | `.env.local` (+ להוסיף refresh ל-Vercel)    |
| **Google login**              | OAuth (Phase 1, login-only scope)                                                                          | ✅ פרודקשן                                    | Supabase Auth                               |
| **Google Gemini**             | 2.5 Pro (gen) + 2.5 Flash (classify) + `gemini-embedding-001`                                              | ✅ `GEMINI_API_KEY` מוגדר+מאומת ב-.env.local  | ה-AI היחיד: יצירה+סיווג+RAG (ADR-001 amend) |
| **ElevenLabs**                | 4 קולות (Yoav/Tali/Michal/Ori)                                                                             | ❌ טרם (Phase 7)                              | —                                           |
| **Inngest / Resend / Sentry** | async / mail / observability                                                                               | ❌ טרם                                        | —                                           |
| **Vercel**                    | project `studibuilder` · `studibuilder.vercel.app` · **Deployment-Protection פעיל**                        | ✅ פרודקשן                                    | —                                           |
| **NotebookLM**                | 36 מחברות (מאסטר `8692cad1`)                                                                               | ✅ דרך מגן/MCP                                | פרויקט מגן                                  |

## תיקיות Drive (folder IDs)

> **שורש אחד מאוחד** (ארגון-מחדש 2026-06-02). מוגדר ב-`src/lib/drive/client.ts` `DRIVE_FOLDERS`, scope `drive.readonly`. מפה מלאה: `docs/CONTENT-INDEX.md`.

- **root** "ממונה בטיחות 2025": `1pQQcc-PCzG5QXtPOspIGbThVDcDgfXSI`
  - **questions** "שאלות ותשובות לוועדת הסמכה" (בנקי-T1): `1Ecc8JsCW-Gs4L4Q00ClU4s5O9oicYiUl`
  - **learningMaterials** "חומרי לימוד": `1Xr170fcoD-MUD0_3WtqMuN7Eqz6oBVbT`
    - **finalProject** "פרויקט גמר": `1k1u0rFoq5gM00mNdpb_vo9i6zKtf3k0P`
    - **scaffolding** "פיגומים": `1z43_64mKTEQqIzjvxnx2rlM5lwxMYLn_`
  - **summaries** "סיכומים וחזרות": `1w9yeJW59OjVqWUelmKr3i7LdnFy3FQ_h`
  - **podcasts** "פודקסטים" (אודיו T4): `1LvsRhz56p6EEeatx4p_KAINjkkwdtXKy`
- ⚠️ legacy "ממונה בטיחות" (`1Cd4iydy7aqUqO6C745j9lGIsHsFXpWfH`) — **ריק** (התרוקן 2026-06-02; הוסר מהקוד).
- **session-logs "StudiBuilder — לוגי-סשן":** `1_GZY5fWK4z-BQRXUkySmsOUOPDnccVNw` — doc-לוג פר-סשן (MCP **כתיבה**; ה-client read-only). נוהל ב-`CLAUDE.md`.

## פעולות-בדיקה

- `npx tsx scripts/test-drive.ts` → מאמת Drive. `npx tsx scripts/test-db.ts` → מאמת DB.
- ל-`pnpm drive:auth` (loopback) — ראה `BUGS.md` (OOB חסום).

## TODO גישות

- להוסיף `GOOGLE_REFRESH_TOKEN` ל-Vercel.
- ✅ `GEMINI_API_KEY` מוגדר ומאומת ב-`.env.local`. נותר: להוסיף ל-Vercel (לפרודקשן).
