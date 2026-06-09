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

## 🟢 מנוע-תוכן NotebookLM — ממצאי-בקרה (2026-06-08) {#notebooklm-engine}

> נמצאו ע"י ענף-הבקרה (content-verifier + plan-compliance-auditor → oversight-lead) על מנוע-התוכן (ADR-015) **לפני merge**. C1–C3 תוקנו ואומתו; C4 נסגר; מינוריים = follow-up מתועד.

- **✅ C1 (קריטי) — G4 בדק את 3 חלקי-solution יחד במקום legalBackup בלבד.** `scripts/import-scenarios.ts` שיטח את כל הציטוטים (immediate+legal+engineering) והעביר ל-`verifyScenarioCitations` → תרחיש עם ציטוט-מעוגן ב-immediateAction אבל `legalBackup.citations=[]` היה עובר G4 ונכתב עם גיבוי-חוקי לא-מעוגן (בניגוד לחוזה). **פתרון:** פיצול ל-2 מעברים — `allReport` (לדו"ח + scope_refs) ו-`legalReport` (`legalBackupCitations()` · שער-G4 בלבד); `held = !legalReport.hasGroundedBackup`. + טסט-רגרסיה ב-`verify-grounding.test.ts`.
- **✅ C3 (major) — אי-התאמת seam גשר↔importer.** הגשר (`run_generation.py`) כותב מעטפת `{ref,generated_at,content:<raw>}` אבל `parseNotebookLmOutput` מצפה ל-`{batch,contentType,items}` וזרק Error. **פתרון:** `unwrapBridgeEnvelope()` ב-import-scenarios — מחלץ `.content` אם זו מעטפת, אחרת מעביר כפי-שהוא (golden/הדבקה-ידנית). seam רובסטי לשני הפורמטים.
- **✅ C4 (major · פרוטוקול) — חוסר רשומות activity-log לתוצר.** הסוכנים החזירו `activityLogLine` אך לא כתבו (מניעת-race ב-workflow). **פתרון:** רישום-מרכזי ב-`teams/*/activity-log.md` בסיום-הסשן.
- **✅ typecheck — `verify-grounding.ts:75` TS2532** (`mdLink[1]` possibly-undefined תחת noUncheckedIndexedAccess). **פתרון:** `const rel = mdLink?.[1]; if (!rel) continue;`.
- **🟡 C2 (דרישת-תכנון · לא-באג) — אין סינון `status='מאומת'` בהגשה ללומד.** **לא-תוקן בכוונה:** המודל-הקיים מגיש תוכן 'מוסקנא' (כל 554 השאלות) ו-content-verifier מקדם→'מאומת' אח"כ; סינון כאן יסתיר את כל התוכן הקיים. **Follow-up Phase-5:** להחליט אם/איך לגדר 'מוסקנא' בהגשה.
- **🟡 מינוריים (follow-up · לא-חוסם):** `MIN_QUOTE_CHARS=12` נמוך לעברית (שקול ≥20 + uniqueness) · אין `MAX_LENGTH` ב-parse-output · אין cross-check scopeHint↔scopeId שחוזר · `parseLegislationIndex` ללא ולידציית-isValidScopeId על המפתח · אין integration-test מלא ל-import-scenarios (יש smoke dry-run ידני).

## 🟢 גשר-NotebookLM — ממצאי-ריצה (2026-06-08) {#notebooklm-bridge}

> הגשר הותקן ורץ במכונה-הזו. הצטברו 5 ממצאים מעשיים (תיעוד למחשבים-הבאים + פתרון-בעיות).

- **✅ חסם-ארגוני TLS-inspection** — `uv` נכשל בהורדות (`invalid peer certificate: UnknownIssuer`) כי ה-proxy הארגוני מפענח-SSL עם root-CA שלא ב-store של uv. **פתרון:** `UV_SYSTEM_CERTS=1` (uv סומך על cert-store של Windows · ב-`setup.ps1`). לגיטימי, לא עקיפת-אבטחה.
- **✅ Chrome App-Bound Encryption חוסם cookie-extract** — `notebooklm login --browser-cookies chrome` נכשל (`RtlAdjustPrivilege`) כי Chrome 127+ מצפין cookies במפתח-מערכת (דורש admin). **פתרון:** login **אינטראקטיבי** (`--browser chrome` · GUI · פעם-אחת). הפרופיל-הפרסיסטנטי שומר session.
- **✅ קידוד .ps1** — Windows-PowerShell 5.1 קורא `.ps1` ללא-BOM כ-ANSI → עברית מתעוותת ושוברת מחרוזות. **פתרון:** לשמור `.ps1` כ-UTF-8 **עם BOM** (re-encode אחרי כל Edit).
- **✅ `notebooklm create --json`** — ה-ID **מקונן** תחת `.notebook.id` (לא `.id`). תוקן ב-`build-notebook.ps1`.
- **✅ `notebooklm ask --new`** — מבקש אישור `delete conversation? [y/N]` → **תלוי ב-non-interactive**. **פתרון:** להזין `'y'` ל-stdin (`'y' | notebooklm ask ... --new`).
- **🔑 `ask` מגבלת-אורך-קלט (הממצא-המרכזי)** — פרומפט ~793 תווים ✓ מחזיר JSON-מעוגן-מושלם; פרומפט ~7.7KB → `No parseable chunks in streaming chat response... empty` (NotebookLM-chat דוחה קלט-ארוך). **פתרון:** **פרומפט-קצר פר-תרחיש** (לולאה · המקורות מעוגנים-במחברת → א"צ להטמיע סכמה+דוגמה ענקיות). **פלט-עובד:** flat `{title,immediateAction,legalBackup,legalCitation:{scopeId,quote,section},engineeringMgmt}` + ציטוטי-מקור [N] → adapter ל-batch-format של ה-importer. ⏭️ **נותר לבנות:** מצב per-scenario ב-build-request + לולאת-generate + adapter flat→batch → ואז G1–G5.

## 🟢 גשר-NotebookLM — TLS-inspection בזמן-ריצה + פקיעת-session (2026-06-08) {#notebooklm-runtime-ssl}

> נמצא ותוקן בסשן 2026-06-08 (אוטונומי). שונה מ-[#notebooklm-bridge](#notebooklm-bridge) (חסם ה-`uv`-install) — זהו חסם **runtime** של ה-CLI עצמו, שלא נתקלנו בו קודם כי ההפקה המוכחת רצה ברשת **ללא** ה-proxy-המפענח.

- **תסמין:** `notebooklm list/ask` נכשל ב-`[SSL: CERTIFICATE_VERIFY_FAILED] unable to get local issuer certificate`.
- **שורש:** מחסנית-ה-HTTP של `notebooklm-py` היא **httpx**, שטוען את `certifi.where()` ו**מתעלם** מ-`SSL_CERT_FILE` עבור ה-trust-store שלו. מאחורי proxy-מפענח-SSL ארגוני, השרשרת חתומה-מחדש ע"י root-CA פנימי שאינו ב-certifi → כל קריאת-HTTPS נכשלת. **`UV_SYSTEM_CERTS=1` מתקן רק את ה-`uv`-installer, לא את ה-runtime.**
- **✅ פתרון (מוטמע · אוטומטי):** `tools/nblm-bridge/build-cabundle.ps1` בונה `tools/nblm-bridge/.cache-cabundle.pem` = **certifi + cert-store של Windows** (שמכיל את ה-root-CA הארגוני). httpx **כן** מכבד `SSL_CERT_FILE` כשהוא מצביע ל-bundle-על שכולל את certifi. `scripts/notebooklm/generate-scenarios.ts` (`bridgeEnv()`) מזהה את ה-bundle אוטומטית ומגדיר `SSL_CERT_FILE`/`REQUESTS_CA_BUNDLE` פר-קריאת-CLI. ה-bundle git-ignored (`tools/nblm-bridge/.cache-*.pem` · מכיל cert ארגוני · machine-local).
- **🔑 פקיעת-session (נלווה):** אחרי שה-TLS תוקן, הקריאה החזירה `Authentication expired or invalid. Run 'notebooklm login'`. ה-session של NotebookLM/Google פג מעת-לעת. **פתרון:** login-מחדש אינטראקטיבי **פעם-אחת** (דפדפן · ללא קוד) — `notebooklm login --browser chromium` עם `SSL_CERT_FILE` מוגדר. ה-`storage_state` נשמר → הרצות-עוקבות לא דורשות login נוסף (להריץ את הסקריפט שוב מספיק).
- **🟢 גם Claude-SDK נחסם ע"י אותו proxy (2026-06-09 · ADR-017):** `@anthropic-ai/sdk` (Node fetch/undici) נכשל ב-`Connection error` מאחורי ה-TLS-inspection. **✅ פתרון תכנותי (`src/lib/ai/claude.ts`):** `fetch` מותאם דרך `undici` עם `Agent({connect:{ca}})` הטוען את אותו `.cache-cabundle.pem` (או `SSL_CERT_FILE`/`NODE_EXTRA_CA_CERTS`) — עובד ב-dev-server/route/script בלי תלות ב-env, no-op בלי-bundle. **אומת חי:** Claude זיהה "נעילה ותיוג"="LOTO" (הבנה-סמנטית).
- **interactive one-liner (PowerShell · מאחורי proxy):**
  ```powershell
  $env:SSL_CERT_FILE = "<repo>\tools\nblm-bridge\.cache-cabundle.pem"
  & <repo>\tools\nblm-bridge\.venv\Scripts\python.exe -m notebooklm login --browser chromium
  ```

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
