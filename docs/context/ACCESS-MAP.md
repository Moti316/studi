# ACCESS-MAP — מפת מפתחות, שירותים וחשבונות

> ⚠️ **לא סודות כאן** — רק המפה (איזה מפתח, איפה הוא חי, מה הסטטוס). הערכים עצמם ב-`.env.local` (gitignored) וב-Vercel. מעודכן: 2026-06-04.

## שירותים חיצוניים

| שירות                         | זיהוי / חשבון                                                                                              | סטטוס מפתחות                                                           | איפה                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| **Supabase**                  | project ref `nsinpdzkvvbsdthkobxu` · `studibuilder.supabase.co` · org Moti316 (Free) · region eu-central-1 | ✅ ב-`.env.local` · ב-Vercel: anon/URL ✅ · **`DATABASE_URL` 🔴 לאמת** | `.env.local` · Vercel (ראה צ'קליסט)         |
| **Google Drive**              | GCP project `studibuilder-drive` · OAuth client "StudiBuilder Drive Import" (Desktop)                      | ✅ client_id/secret/refresh_token עובדים                               | `.env.local` (+ להוסיף refresh ל-Vercel)    |
| **Google login**              | OAuth (Phase 1, login-only scope)                                                                          | ✅ פרודקשן                                                             | Supabase Auth                               |
| **Google Gemini**             | 2.5 Pro (gen) + 2.5 Flash (classify) + `gemini-embedding-001`                                              | ✅ `GEMINI_API_KEY` מוגדר+מאומת ב-.env.local                           | ה-AI היחיד: יצירה+סיווג+RAG (ADR-001 amend) |
| **ElevenLabs**                | 4 קולות (Yoav/Tali/Michal/Ori)                                                                             | ❌ טרם (Phase 7)                                                       | —                                           |
| **Inngest / Resend / Sentry** | async / mail / observability                                                                               | ❌ טרם                                                                 | —                                           |
| **Vercel**                    | project `studibuilder` · `studibuilder.vercel.app` · **Deployment-Protection פעיל**                        | ✅ פרודקשן                                                             | —                                           |
| **NotebookLM**                | 36 מחברות (מאסטר `8692cad1`)                                                                               | ✅ דרך מגן/MCP                                                         | פרויקט מגן                                  |

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

## ✅ צ'קליסט Vercel — env לפרודקשן (Settings → Environment Variables → Production)

> ⚠️ שינוי-env **לא** נכנס לפריסה קיימת → חובה **Redeploy** אחרי הוספה. הערכים מועתקים מ-`.env.local`.
> 🔎 **בדיקה אמפירית באתר-החי:** דשבורד נטען = Supabase-keys ✓ · שיעור טוען שאלות = `DATABASE_URL` ✓ · "הסבר לעומק" מחזיר טקסט = `GEMINI_API_KEY` ✓.

| משתנה                                                        | נדרש ל                            | סטטוס Vercel                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` | התחברות (Auth)                    | ✅ (התחברות עובדת בפרודקשן)                                                                                                                                                                                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | פעולות-שרת (creator-gate/admin)   | ⚠️ לאמת                                                                                                                                                                                                                                              |
| `DATABASE_URL`                                               | **טעינת-שיעור (שאלות/chunks)**    | ✅ **קיים ב-Vercel** (מ-29.5, Prod+Preview) — אך שיעור נכשל (2026-06-04). חשד: **חיבור-serverless** (Session/Direct=IPv6 לא-נגיש מ-Vercel) → להחליף ל-**Transaction Pooler 6543** (Supavisor/IPv4 · הקוד `prepare:false`). לאמת מול **Vercel Logs**. |
| **`GEMINI_API_KEY`** + `GEMINI_MODEL_CLASSIFICATION`         | **"הסבר לעומק" (RAG · Flash)**    | 🔴 **חסר ב-Vercel** (אומת בצילום 2026-06-04) → **להוסיף** (Add Environment Variable). gemini-2.5-pro חסום free-tier → Flash.                                                                                                                         |
| `GEMINI_MODEL_GENERATION` · `GEMINI_EMBEDDING_MODEL`         | אופציונלי (יש defaults)           | —                                                                                                                                                                                                                                                    |
| `GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN`                      | ייבוא-Drive (creator · רץ מקומית) | לא-נדרש לזמן-ריצה-web                                                                                                                                                                                                                                |
| `NEXT_PUBLIC_APP_URL` = `https://studibuilder.vercel.app`    | קישורים/redirect                  | ⚠️ לאמת                                                                                                                                                                                                                                              |
| ElevenLabs / Inngest / Resend / Sentry                       | פיצ'רים-עתידיים                   | ❌ טרם                                                                                                                                                                                                                                               |

> **Supabase Auth redirect** (אם Google-login נשבר בפרודקשן): Supabase → Authentication → URL Configuration → הוסף `https://studibuilder.vercel.app/auth/callback`.

## TODO גישות

- 🔴 **GEMINI_API_KEY ל-Vercel** (חסר → חוסם הסבר-לעומק) + **DATABASE_URL → Transaction Pooler 6543** (קיים אך חיבור-serverless נכשל → טעינת-שיעור) + Redeploy. לאמת מול **Vercel Logs**.
- להוסיף `GOOGLE_REFRESH_TOKEN` ל-Vercel (לייבוא מ-Vercel — לא-קריטי, רץ מקומית).
- billing-tier ל-Gemini (free-tier חוסם Pro + מגביל embeddings).
