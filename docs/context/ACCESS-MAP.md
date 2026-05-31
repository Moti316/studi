# ACCESS-MAP — מפת מפתחות, שירותים וחשבונות

> ⚠️ **לא סודות כאן** — רק המפה (איזה מפתח, איפה הוא חי, מה הסטטוס). הערכים עצמם ב-`.env.local` (gitignored) וב-Vercel. מעודכן: 2026-05-31.

## שירותים חיצוניים

| שירות                         | זיהוי / חשבון                                                                                              | סטטוס מפתחות                                  | איפה                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| **Supabase**                  | project ref `nsinpdzkvvbsdthkobxu` · `studibuilder.supabase.co` · org Moti316 (Free) · region eu-central-1 | ✅ URL/anon/service_role/DATABASE_URL מוגדרים | `.env.local` + Vercel                    |
| **Google Drive**              | GCP project `studibuilder-drive` · OAuth client "StudiBuilder Drive Import" (Desktop)                      | ✅ client_id/secret/refresh_token עובדים      | `.env.local` (+ להוסיף refresh ל-Vercel) |
| **Google login**              | OAuth (Phase 1, login-only scope)                                                                          | ✅ פרודקשן                                    | Supabase Auth                            |
| **Anthropic**                 | Claude Sonnet 4.6 + Haiku 4.5                                                                              | ❌ `ANTHROPIC_API_KEY` טרם הופק               | נדרש ל-import scope-tagging              |
| **Voyage AI**                 | `voyage-3` embeddings                                                                                      | ❌ `VOYAGE_API_KEY` טרם הופק                  | נדרש ל-RAG                               |
| **ElevenLabs**                | 4 קולות (Yoav/Tali/Michal/Ori)                                                                             | ❌ טרם (Phase 7)                              | —                                        |
| **Inngest / Resend / Sentry** | async / mail / observability                                                                               | ❌ טרם                                        | —                                        |
| **Vercel**                    | project `studibuilder` · `studibuilder.vercel.app` · **Deployment-Protection פעיל**                        | ✅ פרודקשן                                    | —                                        |
| **NotebookLM**                | 36 מחברות (מאסטר `8692cad1`)                                                                               | ✅ דרך מגן/MCP                                | פרויקט מגן                               |

## תיקיות Drive (folder IDs)

- mainCourse "ממונה בטיחות 2025": `1pQQcc-PCzG5QXtPOspIGbThVDcDgfXSI`
- legacy "ממונה בטיחות": `1Cd4iydy7aqUqO6C745j9lGIsHsFXpWfH`
- learningMaterials "חומרי לימוד": `1Xr170fcoD-MUD0_3WtqMuN7Eqz6oBVbT`
- (מוגדרים ב-`src/lib/drive/client.ts`)

## פעולות-בדיקה

- `npx tsx scripts/test-drive.ts` → מאמת Drive. `npx tsx scripts/test-db.ts` → מאמת DB.
- ל-`pnpm drive:auth` (loopback) — ראה `BUGS.md` (OOB חסום).

## TODO גישות

- להוסיף `GOOGLE_REFRESH_TOKEN` ל-Vercel.
- להפיק `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY` לפני בניית ה-import pipeline.
