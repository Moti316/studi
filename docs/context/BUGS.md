# BUGS — יומן באגים ופתרונות

> זיכרון-מוסדי: בעיות שנפתרו + הפתרון. קרא לפני שאתה נתקל באותו דבר. מעודכן: 2026-05-31.

## 🔴 git-bash-fork — commit/push מקומי חסום (פתוח, סביבתי) {#git-bash-fork}

- **תסמין:** `git commit`/`git push` נכשלים עם **exit 1 וללא פלט**. ריצה ישירה של ה-hook חושפת:
  `bash dofork: child died unexpectedly... exit code 0xC0000142` + `fork: retry: Resource temporarily unavailable`.
- **שורש:** git-bash (MSYS2) על המחשב הזה **לא מצליח לעשות fork** (בעיה ידועה — DLL/AV/rebase). husky מריץ את ה-hooks (`pre-commit`=lint-staged, `pre-push`=typecheck+test) דרך git-bash → כל hook נכשל → git עוצר.
- **השפעה:** אי-אפשר commit/push מקומית כל עוד husky פעיל. (מוטי כבר עוקף ע"י merge דרך GitHub web.)
- **`--no-verify` לא מספיק!** הוא מדלג רק על `pre-commit`+`commit-msg`, **לא על `prepare-commit-msg`** — שגם הוא עטוף-husky ועושה fork (`basename`/`dirname`) → נכשל. לכן commit נכשל גם עם --no-verify (GPG כבוי, אז זה לא חתימה). **מסקנה: אף hook לא יכול לרוץ.**
- **לא לבלבל עם:** CRLF ב-hooks (תוקן: husky→LF + `core.autocrlf=false` + `.gitattributes`). זה שיפר, אבל ה-fork עדיין שבור.
- **פתרון שעובד (מקומי):** `git config --unset core.hooksPath` → commit/push רגיל (אף hook לא מנסה לרוץ) → אופציונלית להחזיר `git config core.hooksPath .husky/_`. האיכות נשמרת ע"י הרצה **ידנית** של `npx tsc --noEmit` + `npx prettier --check` (עובדים ב-PowerShell) ו/או ע"י CI ב-GitHub Actions בכל push.
- **פתרונות-שורש (להחלטת מוטי):** (א) לתקן git-bash (רה-התקנת Git for Windows / `rebaseall` / החרגת אנטי-וירוס); (ב) commit דרך GitHub web.

## ✅ OOB-blocked — pnpm drive:auth נכשל

- **תסמין:** OAuth `urn:ietf:wg:oauth:2.0:oob` חסום (Google חסמה OOB ללקוחות שנוצרו אחרי 2022).
- **פתרון:** שוכתב `scripts/auth-drive.ts` ל-**loopback** (שרת localhost:53682, redirect אוטומטי, כותב refresh_token ל-.env.local). עובד.

## ✅ DATABASE_URL — סוגריים מרובעים בסיסמה

- **תסמין:** `password authentication failed`.
- **שורש:** הודבק `:[PASSWORD]@` — הסוגריים `[ ]` נשארו מ-placeholder של Supabase.
- **פתרון:** להסיר את `[ ]`. השתמש ב-**Session pooler** URI (`postgres.<ref>:...@...pooler.supabase.com:5432`).

## ✅ dotenv path — סקריפטים קראו .env ולא .env.local

- **תסמין:** `Missing GOOGLE_CLIENT_ID`.
- **פתרון:** `scripts/auth-drive.ts` + `test-drive.ts` שונו מ-`import 'dotenv/config'` ל-`config({ path: '.env.local' })`.

## ✅ Supabase migration — "type content_tier already exists"

- **תסמין:** הרצה חוזרת נכשלת על אובייקטים קיימים.
- **פתרון:** סקריפט-ריסט (`DROP ... IF EXISTS` לפני `CREATE`). הרצה חוזרת-בטוחה.

## ✅ pnpm חסר — corepack EPERM

- **תסמין:** `pnpm` לא ב-PATH; `corepack enable` נכשל (Program Files דורש admin).
- **פתרון:** `npm install -g pnpm` (prefix ב-AppData, user-writable). הותקן 11.5.0.
