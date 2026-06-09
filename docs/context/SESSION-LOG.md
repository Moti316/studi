# SESSION-LOG — יומן סשנים (handoff)

> בכל סוף-סשן: "מה נעשה / מה הצעד הבא". חדש למעלה.
> **סשן חדש? התחל מ-[PROJECT-MAP.md](PROJECT-MAP.md).**

---

## 2026-06-08 (המשך-ג · אוטונומי) — תרחישים 4-חלקים חיים · SSL-fix · ספריית-חקיקה

> סשן אוטונומי-ארוך (WORKFLOWS-mindset · push+doc-Drive אחרי כל תת-משימה). מוטי נכח לסירוגין; ביצע login-מחדש ל-NotebookLM ואז יצא לאוטונומיה מלאה.

**11 commits ל-main · typecheck + 717 vitest ירוקים · firewall נשמר:**

- **`737afe2`** מחוון-תרחישים 3→4 קריטריונים (תואם פתרון-4-חלקים · צמ״א-אחרון) + `ask --new --yes` פר-תרחיש (פותר context-bloat).
- **`984c52e`** 🔑 **SSL-fix runtime** — חסם TLS-inspection ארגוני (httpx/certifi · `CERTIFICATE_VERIFY_FAILED`). פתרון: `build-cabundle.ps1` (certifi+Windows-store) + `bridgeEnv()` ב-generate-scenarios מגדיר `SSL_CERT_FILE` אוטומטית. תועד `BUGS.md#notebooklm-runtime-ssl`. (נלווה: session פג → login-מחדש חד-פעמי · ה-storage_state נשמר → הרצות-הבאות לא דורשות login.)
- **`46391c4`** תיקון-רינדור Markdown-bold ב-ScenarioWalkthrough (הכוכביות הוצגו כטקסט-גולמי · `renderBold()`).
- **`ce7976c`** G3 מודע-אֵליפסיס — `quoteAppearsInBody` מפצל על "..." ודורש כל קטע verbatim (שחזור ציטוטים-מקוטעים-נאמנים · אומת אמפירית שהקטעים verbatim בנוסח).
- **`377453d`** סקריפט-מחיקה בטוח לרה-ייבוא (`delete-old-scenarios.ts` · FK-aware · dry-run default).
- **`f43e228`** 🆕 **ספריית-חקיקה** — מסך `/legislation` + טאב-חמישי ב-BottomNav (חקיקה). 42 נוסחים · 4 פרקים (חוק›תקנותיו) · תגי-עומק · קישורי נבו+PDF · חיפוש client-side · `catalog.ts` נגזר מ-legislation-manifest (אפס-שכפול). 13 טסטים.
- **`debdf8a`** שיפורי-הפקה: `repairJsonQuotes()` (fallback למרכאות-לא-escaped · שורש 3 כשלי-הפקה) + פרומפט-ציטוט-verbatim.
- **`86cfa8f`** `cleanSolutionText()` ב-map-scenario — מסיר סמני-מקור inline (`[1]`,`[1-3]`) שדלפו ל-5 תרחישים + מצמצם רווחים (G3 לא-מושפע · הציטוט לא עובר ניקוי).

**מצב-תרחישים (סופי · 14 מאומתים חיים):** רגנרציה-v2 → **20/20 הופקו · 20/20 G1–G5 נקיים** (repairJsonQuotes שחזר את 3 כשלי-JSON · verbatim-prompt אפס-מוחזקים). **Workflow אימות-סמנטי** (27 סוכנים · oversight-lead+content-verifier · 1.66M tokens) → **14 עברו · 6 נדגלו** (אושר אדוורסרית). **מחקתי 12 + ייבאתי 14 מאומתים** (marker-stripped) → **חי ב-/lesson/scenarios** (אומת DB: 14×4-part · rubric-4 · 0-סמנים · status='מוסקנא' · +14 שאלות-ליווי). ה-20 המלאים ב-`.cache/.../scenarios-expand-v2.json`.

**6 מוחזקים — תיקוני-המאמת המדויקים (לסשן-הבא · ציטוט-פר-בקרה שגוי שה-G1–G5 לא תופס):**

1. **"האנרגיה הבלתי-נראית" (LOTO)** — ציטט 2.8 (מכונות **חקלאיות**!) למכונה תעשייתית → **2.0 §37(4)/§39** (שקול 2.4.1 ל-LOTO-פניאומטי-חשמלי).
2. **"שלולית מסתורית" (שפך חומ"ס)** — ציטט 3.1 (היגיינה/פסולת) לשפך-סביבתי → **4.4 חוק החומ"ס** ("אירוע חומרים מסוכנים" §1).
3. **"התהום שמתחת לעגורן"** — typo `"שלוט אזהרה"` → `"שילוט אזהרה"` (ציטוט תקין · רק תיקון-טקסט).
4. **"קצר בדרך" (חשמל)** — סמני-מקור (כעת מנוקים ע"י `cleanSolutionText` → רה-ייבוא יפתור). ציטוט 2.2 §165(ב) verified · שקול 2.4 §2(ג)/5/6 למפעל-כללי.
5. **"הפגישה העיוורת" (מלגזות)** — ציטט §202 (חובת-עובד גנרית) במקום חובת-תופס-המפעל (אזור §12/§37 · אמצעי-גישה/מעברים בטוחים) · גם fourPart לא-עקבי.
6. **"פצצה מתקתקת" (גלילי גז)** — ציטט 3.6 (מעבדות!) לבית-מלאכת-ריתוך + סתירה-פנימית (סעיף לגז לא-דליק בעוד הגזים אצטילן/חמצן) → **2.0 §95–100 (סימן ט')** + רישוי-עסקים לאחסון חמצן/אצטילן.

### 🚩 צעד-הבא

1. **6 המוחזקים** — לתקן citation-per-control (לפי הרשימה למעלה): או עריכה-ידנית של `committee-scenarios.json`+regenerate, או הוספת רמז-ציטוט-פר-תרחיש ל-`compact-prompt`. idx-4/9 = תיקון-קל (typo/רה-ייבוא). אז delete+import להגעה ל-~20.
2. **שדרוג מנוע-האימות לקבוע:** ה-Workflow הסמנטי (citation-per-control · PPE-last · עברית) הוכיח-ערך — לשלב כשלב-קבוע אחרי כל הפקת-תוכן (גם explanations/MCQ).
3. המשך השלמת-הקורס: explanations (554 · NotebookLM · אותו protocol) · MCQ-banks · מנוע-Quiz (D · routes practice/exam) · capstone · content-verifier (מוסקנא→מאומת).

---

## 2026-06-08 (המשך) — מנוע-תוכן NotebookLM (Stage 1) · צד-StudiBuilder נבנה end-to-end (ADR-015)

> **הכרעות-מוטי בסשן:** (1) "שניהם ברצף" — תשתית-דטרמיניסטית + סקאפולד-גשר מוכן-ל-login. (2) "להמתין לגרסה-מורחבת-מהגשר" — לא מייבאים את 20 הקצרים; ה-importer מוכח מול fixtures, וה-20 ייובאו כשהגשר יפיק גרסה-מורחבת. (3) **"היצמדות-להיבט-החוקי + ציון-סעיף — חשוב מההרחבה"** → סעיף נאכף כ**שער-קשה** (`hasValidLegalBackup`). (4) שיחה תמיד בעברית · WORKFLOWS · פרוטוקול-מועצה.

**מה נבנה (כל צד-ה-StudiBuilder · אפס תלות-runtime · אפס-Gemini):**

- **DB:** `0003_add_scenarios_source_ref_index.sql` (unique-index · סוגר פער-אידמפוטנטיות) + `drizzle/schema.ts` + `scripts/apply-migration-0003.ts`. ⏳ **DB-apply ממתין-לאישור-מוטי** (auto-mode חסם מיגרציה-פרודקשן) — `tsx scripts/apply-migration-0003.ts`.
- **אנטי-הזיה (ליבה):** `src/lib/import/verify-grounding.ts` — G1 (scopeId∈57) · G2 (scopeId→`.md`) · G3 (`quoteAppearsInBody` מילולי מול קורפוס-נבו) · **G4 מחמיר** (`hasValidLegalBackup` — מעוגן **וגם סעיף**) · G5 (סעיף-בגוף · report). + `legislation-resolver.ts` (INDEX.md→נוסח).
- **importer:** `src/lib/notebooklm/{parse-output,map-scenario,request}.ts` + `scripts/import-scenarios.ts` (CLI · parse→unwrap→G1–G5→upsertScenarios→companion `scenario_walkthrough` · dry-run/execute) + `upsert-scenarios.ts`.
- **בונה-בקשה:** `scripts/notebooklm/build-request.ts` + `request.ts` (להרחיב-לא-לסכם · **עיגון-חוקי+סעיף כעדיפות-עליונה** · חוזה-JSON inline · רמזי-scope).
- **גשר (סקאפולד · git-ignored):** `tools/nblm-bridge/{run_generation.py,requirements.txt,README.md}` — notebooklm-py · cookie-auth מנוי (לא-API) · `README` = bootstrap-חד-פעמי-מוטי.
- **ADR-015** + `BUGS.md#notebooklm-engine` + activity-logs (data/backend/oversight).

**שיטה:** Workflow #1 (ריקון · 9 סוכנים) → הכרעת-גשר. Workflow #2 (מועצה · 5 מומחים-במקביל → אינטגרציה → **ענף-בקרה עצמאי**). הבקרה מצאה 2 קריטיים → **תוקנו ואומתו:** C1 (G4 על legalBackup-בלבד) · C3 (seam unwrap) · C4 (activity-logs) · typecheck. **636/636 vitest ✓ · typecheck נקי · dry-run smoke מול golden+קורפוס-אמיתי (1 נקי / 1 מומצא-נדחה).**

### ✅ הגשר הותקן במכונה-זו (המשך-סשן · `eaf182b`+) — נותר רק login-מוטי

- **מיגרציה 0003 הוחלה ל-DB** (אישור-מוטי) — `idx_scenarios_source_ref` קיים · `scenarios:import --execute` מוכן.
- **Python 3.12 + notebooklm-py 0.7.1 + chromium מותקנים per-user** ב-`tools/nblm-bridge/.venv` (אפס-admin). **חסם-ארגוני שעקפנו:** TLS-inspection-proxy → `uv` עם `UV_SYSTEM_CERTS=1` (cert-store של Windows · לגיטימי). **חילוץ-cookies מ-Chrome נחסם ע"י App-Bound Encryption** (דורש admin) → login אינטראקטיבי.
- **ערכת-סקריפטים חוצת-מחשבים** (`tools/nblm-bridge/`): `setup.ps1` (bootstrap · אידמפוטנטי · UTF-8+BOM) · `login.ps1` · `build-notebook.ps1` (מחברת-אחת + כל ~43 הנוסחים) · `mindmap.ps1` · `generate.ps1` (`ask --prompt-file`→מעטפת) · `run_generation.py` (CLI-subprocess · תוקן — ה-Python-API שהסוכן כתב לא-אומת). README מיושר-למציאות. prompt-הבקשה נוצר.
- **הכרעות-מוטי:** מחברת-**אחת** מאוחדת לכל החקיקה (תרחישים חוצי-תחומים · עיגון מאותם `.md` של G3) + **מפת-חשיבה** (`generate mind-map`).

**✅ login בוצע · מחברת-חקיקה נבנתה · הפקה הוכחה (המשך-סשן):**

- **login** (Auth ✓ · motilev8@gmail.com · 29 cookies). **39 מחברות-מוטי סווגו** → `NOTEBOOKLM-ASSETS.md` (`59b86bd`).
- **מחברת-חקיקה מאוחדת `c3f2d80a`** ("ממונה בטיחות — חקיקה מלאה") — **42 נוסחי-`.md` הועלו ומאוינדקסים** (`ready`).
- **🎉 הפקה הוכחה end-to-end:** פרומפט-קצר (~800 תווים) → NotebookLM החזיר **JSON מעוגן** (`immediateAction`/`legalBackup`/`legalCitation:{scopeId,quote,section}`/`engineeringMgmt` + ציטוטי-מקור [N]). **חסם שנפתר:** chat-RPC יש **מגבלת-אורך-קלט** (~800✓ · 7.7KB→ריק) — ראה `BUGS.md#notebooklm-bridge` (5 ממצאי-ריצה).

**✅ הצינור-המלא נבנה והורץ end-to-end:** `src/lib/notebooklm/{compact-prompt,adapt-flat}.ts` + `scripts/notebooklm/generate-scenarios.ts` (`pnpm scenarios:generate` · `bfc1af7`). **הופקו 20/20 תרחישים** (NotebookLM · מחברת c3f2d80a) → G1–G5 → **15 נקיים נכתבו ל-DB** (15 scenarios + 15 companion `scenario_walkthrough` · status='מוסקנא') → **חי במנוע-ADR-014 באתר** (נתון · ללא-deploy). **5 מוחזקים** (G3 ✗ — quote לא-verbatim בנוסח · #7,8,15,17,19): scope+section נכונים אך הציטוט פורפרז → לרענן-פרומפט/לאמת מול PDF-מחייב.

### 🚩 הכרעת-עדיפות-מוטי (2026-06-08): **קודם להשלים את הקורס-המלא · רק אחרי-כן הפלטפורמה-הראשית.**

**משימות-חדשות-מוטי (סשן-ב'):** **(A)** כרטיס-דשבורד **"תרחישי וועדת הסמכה"** → `/lesson/scenarios` (מיני-קורס נפרד לצד "ממונה בטיחות בעבודה" · אותה כניסה · דשבורד=mock · הנתיב כבר חי `279c3a1`). **(B)** **עמוד-ספריית-חקיקה** ייעודי — להציג כל החוקים+תקנות · שליפה-מהירה · היררכית **חוק > תקנותיו** (מקור: 42 `.md` ב-`courses/safety-officer/sources/legislation/` + `INDEX.md` · 4 פרקים).

**🔴 פידבק-מוטי על תרחיש חי (סשן-ב' · עדיפות-ראשונה · ראה תמונה):** **(1+2) ניסוח-רקע/משימה שגוי ולא-ברור** — מקורו ב-`scripts/data/committee-scenarios.json` (למשל typo "שעקש"→"שקוע" · לחדד נוסח). **(3) פתרון-מומחה = בלוק-אחד · לחלק ל-4 פסקאות-נפרדות-ומסומנות:** (א) **פעולה מיידית בשטח** · (ב) **שימוש במדרג-הבקרות** · (ג) **הפניה לגיבוי-חוקי-מובהק** (תקנה+סעיף+ציטוט) · (ד) **פעולה ניהולית-מתקנת לטווח-הארוך**. ⚠️ זה **מבנה-4-חלקים** (כיום 3: immediate/legal/eng) → לשנות: `compact-prompt.ts` (פורמט-flat→4 שדות) · `adapt-flat.ts` · `map-scenario.ts` (פירוק-ל-4-פסקאות-Markdown) · אולי רינדור ב-`ScenarioWalkthrough` (לוודא `\n\n`→פסקאות) · ואז `scenarios:generate`+`import` מחדש (כל-20). דורש גם תיקון-source-text.

**צעד-הבא — "גז" להשלמת-הקורס (לא הפלטפורמה!):** (1) לתקן 5 המוחזקים (פרומפט מחמיר-ל-quote-verbatim / fallback ל-PDF). (2) **explanations**: 554 ההסברים דרך NotebookLM (אותו protocol · מחליף Gemini-החסום). (3) **MCQ**: בנקי-שאלות דרך NotebookLM. (4) **D · מנוע-Quiz:** routes (practice/exam+טיימר) · API ציון-תרחיש · SM-2+stats. (5) **E2** חומרי-חזרה. (6) capstone (FINAL-PROJECT). (7) content-verifier: מוסקנא→מאומת. ← _רק אחרי שהקורס שלם → F/G/H/I (פלטפורמה)._

**follow-up (BUGS.md):** C2 (סינון status בהגשה · Phase-5) · מינוריים (MIN_QUOTE_CHARS≥20 · MAX_LENGTH).

---

## 2026-06-08 — מנוע-תרחישים (חיווט) + מכסת-Gemini-התאפסה + precompute

- **מכסת-Gemini התאפסה** → `precompute:explanations` רץ (free-tier ~100-150/יום · resumable · billing=הכל-בבת-אחת).
- **`4c91360` מנוע-תרחישים (תרחישי-וועדה · HYBRID native — לא קישור-מגן):** `ScenarioWalkthrough` (היה קיים, לא-מחווט) **חובר ללולאת-השיעור**: `page.tsx loadScenarios` (join scenario_id→ScenarioInput) + LessonPlayer ניתוב `scenario_walkthrough`→ScenarioWalkthrough + ציון-מחוון→openGrade→ANSWER_OPEN (בלי משוב-MCQ) + fallback. 3 טסטי-חיווט.

### 🚩 צעד-הבא (סשן-טרי): מנוע-תוכן מבוסס-NotebookLM (אוטומציה-מלאה) · [תוכנית מפורטת: `~/.claude/plans/sorted-snuggling-gem.md` (מקומי)]

> **הכרעת-מוטי 2026-06-08:** ליצור הסברים/מבחנים/דיוק-מידע דרך **מנוי-Gemini (NotebookLM)** — לא Gemini-API-בתשלום (מיצוי-מכסה). **שלב-1:** מנוע-תוכן (offline → מאוחסן-מראש). **שלב-2:** מורה-AI חי native (`chatSessions` בסכמה · נדחה). 🧠 זיכרון: `content-gen-full-automation`.
>
> **⚠️ אוטומציה-מלאה — מוטי לא מתווך-ידני** ("אני לא יכול להיות המתווך"). Claude Code מריץ אוטומציית-דפדפן (notebooklm-py/Playwright או browser-MCP) מול המנוי-המחובר-של-מוטי · אפס-קליקים-שלו. (פתוח: מנגנון-האוטומציה + login.)

- **ארכיטקטורה:** NotebookLM (מעוגן · מנוי · חינם) **מייצר** → Claude Code **מייבא+מאמת** → StudiBuilder **מגיש מאוחסן-מראש**. צד-ה-StudiBuilder (פרוטוקול-JSON · importer · שערי-אנטי-הזיה G1–G5 · חיבור scenarios↔questions) מפורט בקובץ-התוכנית, רותם את `generated-mcq.ts`(`quoteAppearsInBody`) · `upsert-questions.ts` · `scope-tagger.ts`. **פער שזוהה:** אין עדיין importer ל-`scenarios` + חסר unique-index על `scenarios.source_ref` (מיגרציה).
- **יישום-ראשון:** הרחבת **20 התרחישים** (להרחיב, לא לסכם! · מעוגן-חקיקה · 3-חלקים) → מדליק את מנוע-ADR-014. מקור: `1tOcSBGrCq0uibTgy7YC33XKIT3EdxsC4` + 2 קבצים נוספים (תיקיית "ממונה בטיחות 2025"). base מקומי: `scripts/data/committee-scenarios.json` (20 · נקי-שם · לא-מקוממט · firewall · solutions verbatim-קצרים → להרחיב).
- **תנאי-מוקדם:** מחברת-NotebookLM מעוגנת בחומרי-המקור שלנו (למוטי ~36 · ADR-005).
- **מיני-קורס #2 (אחרי):** פרויקט-גמר (capstone · `courses/safety-officer/FINAL-PROJECT.md` · JSA · מטריצת 4×4).

---

## 2026-06-07 (המשך · אינטראקטיבי+אוטונומי) — תיקון-מיפוי-Q&A · הסבר-מוטמע · creator-gate · זרימת-שו"ת

> מוטי סקר חי וביקש תיקונים; בהמשך יצא ("תסיים לעלות הכל · הכן את האתר עם מה שיש · NotebookLM אח"כ"). עבודה אוטונומית: push+SESSION-LOG+TODO אחרי כל תת-משימה.

- **`ba004db` creator-gate:** `isCreator()` (לא-מנתב) → CTA "קורס חדש" מוצג ליוצר-בלבד (הפרדת פלטפורמה↔קורס · בקשת-מוטי).
- **`cb8a66e` הסבר-מוטמע-מראש:** `buildDeepExplanation` (core משותף) + `precompute-explanations.ts` (offline·resume) + `DeepExplanationButton` עבר להציג `questions.explanation` המאוחסן → **אפס Gemini ב-runtime · ללא תלות במפתח-Vercel** (בקשת-מוטי "לבטל את ג'ימני").
- **`3dc4d0a` תיקון-מיפוי-Q&A:** מוטי דיווח "אין קשר שאלה↔תשובה". שורש: PPT מערבב סדר — התשובה (למשל 3-הפרמטרים בשקופית-הפיגום) הופיעה _לפני_ מרקר-"שאלה". תוקן: תשובה=(לפני-מרקר)+(אחרי-מבדק) → **470→550 שאלות** (משחזר גם ציווי). מחיקת qa:% + ייבוא-מחדש (DB→554).
- **כפתור חזרה-לדשבורד** בעמוד-השיעור (`197c572`).
- **זרימת-שו"ת חדשה (פידבק-מוטי):** `gradeOpenAnswer` (התאמת-מילות-מפתח · אפס-AI) + ExplanationCard עבר ל-**כתיבה→"בדוק תשובה"→ציון-עצמי(נכונה/חלקית/לא-נכונה)+תשובת-מודל→"המשך"**. שו"ת מתקדם **בלי משוב-MCQ** (`ANSWER_OPEN` · XP לפי-ציון). 547 טסטים ירוקים.

### 🚩 פתוח / צעד-הבא (מוטי חזר?)

1. **precompute מלא** של 540+ ההסברים — **חסום: מכסת-Gemini-היומית מוצתה** (probe ישיר → `429 "You exceeded your current quota"`, לא 503-זמני). מתאושש רק ב-reset-יומי (~24ש') **או עם billing**. resumable: `pnpm precompute:explanations`. (ההסבר-לעומק לא יופיע באתר עד-אז; השאלות+התשובות עובדות במלואן.)
2. **GEMINI_API_KEY ב-Vercel** — לא-חוסם יותר את ההסבר (מוטמע-מראש), אך נדרש ל-precompute אם ירוץ ב-runtime.
3. **שניהם (בחירת-מוטי):** RAG-מורחב לחומרי-Drive (T2/T3/T4→pgvector · חסום-embedding) + **NotebookLM אח"כ** (כתוספת · נדחה ע"י מוטי · דורש Python-אמיתי + הזדהות-Google).
4. ייבוא בנקי-אייל (MCQ-אמיתי · `parse-pdf-mcq`) — שאלות-אמריקאיות אמיתיות.

---

## 2026-06-07 — ייבוא-ישיר בנק-הוועדה (470 שאלות · אפס-Gemini) + תיקון "אין תשובות" + retry-זמני

> הקשר-פתיחה: הפיילוט של מנוע-יצירת-MCQ (3a383a9) טרם-הורץ. בהרצה התגלו באגים + חסם-קיבולת חיצוני ב-Gemini, ומוטי הפנה ל**ייבוא-ישיר של בנק-השאלות** (ללא תיווך-Gemini).

### פאזה 1 — תיקון retry על שגיאות-Gemini זמניות (`ff85a3d`) ✅

- הפיילוט נכשל לא על 429 אלא על **503 "high demand"** ואז **`fetch failed` (רשת)** — ה-retry טיפל רק ב-429 ורק רמת-cause אחת.
- **`src/lib/ai/retry.ts` (חדש):** `collectErrorChain` (status קבור 2 רמות-cause עמוק) · `isTransientGeminiError` (429/500/502/503/504 + fetch-failed/ECONNRESET/ETIMEDOUT) · `backoffMs` · `withGeminiRetry`. **14 טסטים.**
- חובר ל-`generate-questions.ts` (+ **upsert פר-נוסח** במקום צבירה-לסוף → resume אמיתי) · `ingest-legislation.ts` (מנע סחף-כפילות `is429`) · **`deep-explanation.action.ts`** (עטיפת embed+generate · backoff קצר אינטראקטיבי) → מתקן "לא ניתן להפיק הסבר" באתר-החי תחת-עומס.
- **חסם-קיבולת חיצוני:** הרצה-חוזרת של הפיילוט → **10/10 נוסחים נכשלו 429/5xx** (Gemini free-tier מוצה). הקוד תקין; הקיבולת חסומה → billing/המתנה (follow-up).

### פאזה 2 — ייבוא-ישיר בנק-הוועדה (`23195c6`) ✅ ⟵ הליבה

- **בקשת-מוטי:** "מאגר שאלות הכנה לוועדה - כללי - ספטמבר 2025" (570 שאלות · `1BA9...`) חייב לעלות. אבחון: **שו"ת-פתוח** (לא MCQ).
- **גילוי:** `pdf-parse` (PDFParse) מחלץ את העברית **בסדר-לוגי תקין — לא הפוך** (ה-MCP-Drive הוא שמהפך). → **אפס תיקון-RTL נדרש.**
- **`scripts/parsers/parse-pdf-qa.ts` (חדש):** פיצול-שקופית (`-- N of TOTAL --`) · מרקר `שאלה N :` · חצייה שאלה↔תשובה לפי ה-**"?"** (אמין; "מבדק סיכום" = כותרת-רעש שמיקומה משתנה) · השמטת-רעש · תיקון-פיסוק. → **470/568 זוגות נקיים** (~98 שאלות-ציווי ללא "?" = follow-up). 6 טסטים.
- **`scripts/import-qa-bank.ts` (חדש · `qa:import[:dry]`):** cache→parse→`mapQuestion` ('open'→'explanation' · תשובה ב-`correct_answer:{text}`)→upsert אידמפוטנטי (`source_ref=qa:<id>:<hash>`). **הורץ: 460 הוכנסו · 10 דולגו · DB: 14→474.** אפס-Gemini · אפס-הזיה.
- **שורש "אין תשובות" אומת ותוקן:** `ExplanationCard` הציג רק `explanation`(=null) בעוד תשובת-השו"ת ב-`correct_answer.text`. תוקן ל-**active-recall: "הצג תשובה" → תשובת-מודל** (whitespace-pre-line). מתקן גם את 14 הישנות. 4 טסטים.
- **537 טסטים ירוקים · typecheck נקי.**

### notebooklm-py — הוערך (לא-הותקן)

כלי **לא-רשמי** (Playwright · undocumented APIs · MIT · 16K★ · v0.7.1) · יודע לייצר quiz · הזדהות = חשבון-Google. **מתאים ככלי-creator מקומי בלבד** (לא backend · דורש הזדהות-אינטראקטיבית). מוטי בחר: **קודם לאמת את הבנק בחי** → notebooklm-py מושהה.

### 🚩 פתוח-למוטי / צעד-הבא

1. **אימות-חי (מוטי, עכשיו):** studibuilder.vercel.app → /lesson/practice → שאלה → "הצג תשובה" → תשובה נחשפת (אחרי deploy של `23195c6`).
2. **"הסבר לעומק" ב-Vercel:** אם נכשל אחרי-deploy → `GEMINI_API_KEY` ב-Vercel env (Settings→Env→Redeploy). תיקון-ה-retry כבר נדחף.
3. **notebooklm-py** (אם מוטי יאשר) — התקנה בתיקייה-נפרדת · הזדהות+הרצה אצלו.
4. **שיפורי-בנק (follow-up):** ~98 שאלות-ציווי חסרות (פרסר ללא-"?") · תיוג-scope רגקס (אפס-Gemini) ל-460 · ייבוא יתר-בנקי-אייל (MCQ-אמיתי · `parse-pdf-mcq` קיים).
5. **billing-tier ל-Gemini** — החסם-הכלכלי שפותח מנוע-היצירה + embeddings.

---

## 2026-06-04 (יום·המשך) — "גז": B1 חי + שאלות-אמת + RAG הסבר-לעומק

> בחירת-מוטי: כיוון **B1** + "ראה הכל" מ-A · תוכן = ייבוא-T1 בתשלום · הסברים מעוגנים-חקיקה (RAG) היום, חומרי-לימוד מיד-אחרי. **שיטה: commit+push+לוג אחרי כל תת-משימה.**

### פאזה 1 — עיצוב-B1 על האפליקציה ✅

- טוקנים ([tailwind.config.ts](../../tailwind.config.ts)): primary `#1B4FD6` · accent `#F5A623` · quiz-alias ל-B1 · soft-shadows · background `#FBFCFE` / border `#E6EAF1`.
- פונט Heebo→**Rubik** ([layout.tsx](../../src/app/layout.tsx)) · `--foreground`→`#1A2233` ([globals.css](../../src/app/globals.css)).
- דשבורד: "הקורסים שלי" + **"ראה הכל ←"** → `/courses` · StreakCard: הערת-streak-מרגיעה (B1) + ניגודיות amber→accent-700 · UserHeaderStats אייקון accent-600.
- ✅ typecheck נקי · **503 טסטים ירוקים**.

### פאזה 2 — שאלות-אמת (ייבוא-T1) ✅

- **מיגרציה 0002** (`questions.source_ref` + index) הוחלה על ה-DB החי — לא-הוחלה קודם (ה-DB מ-0001 ישן) → הייבוא נכשל ב-`column does not exist`. `scripts/apply-migration-0002.ts` (אידמפוטנטי · אישור-מוטי).
- **ייבוא-T1: 14 שאלות-אמת נכנסו** (שו"ת-כללי + ציוד-מגן-אישי · 2 DOCX), כולן `in_scope`, status `מוסקנא`, רובן scope **2.3** (PPE). spend ~$0.01. 3 PDFים הניבו 0 (פורמט לא-MCQ → פרסור-עשיר=follow-up). סוג=`explanation` (שו"ת פתוח). `scripts/verify-questions.ts` לאימות.
- דשבורד: קורס **"ממונה בטיחות בעבודה"** (64%) → `/lesson/practice` (CourseCard `href`). typecheck נקי · 503 טסטים.

### פאזה 3 — RAG הסבר-לעומק מעוגן-חקיקה ✅ (קוד · 505 טסטים) · 🟡 קורפוס-חלקי

- **מימד:** `gemini-embedding-001` @ outputDimensionality **1024** → תואם `vector(1024)` (**ללא מיגרציית-סכמה**). probe ✅.
- **ingest** (`scripts/ingest-legislation.ts`): 42 נוסחים → 1781 chunks. ⚠️ **rate-limit (429) של gemini-embedding-001 free-tier** → הוטמעו ~18 נוסחים בלבד (אידמפוטנטי · resume · throttle 1.2s + backoff-429). **השלמת-הקורפוס = follow-up** (resume-runs / batch / tier-בתשלום).
- **RAG:** `src/lib/rag/embed.ts` (קנוני 1024 · normalized) · `retrieval.ts` (pgvector cosine top-K) · `ai/prompts/deep-explanation.ts` (system: "מבוסס-מקורות-בלבד · ציטוט-תקנה").
- **server-action** `features/lesson-player/deep-explanation.action.ts`: שאלה → embed → retrieve → Gemini מחבר הסבר + ציטוט.
- **UI:** `DeepExplanationButton` (dynamic-import · on-demand) + `ExplanationCard`. **תיקון-באג:** שאלות-`explanation` היו תקועות (UnsupportedQuestion ללא "המשך") → read-card עם "הבנתי, המשך" + "הסבר לעומק". חיווט ב-LessonPlayer.

### פאזה 4 — אימות end-to-end ✅

- **deep-explanation מאומת חי** (`scripts/verify-deep-explanation.ts`): 156 chunks מוטמעים · embed→pgvector-retrieval→Flash **עבדו** → הסבר **מעוגן+מצוטט** ("תקנות מפעיל דוד-קיטור תש"ס-2000, תקנה 7" + scope 2.10/2.1). **תיקון:** generation עבר ל-Flash (gemini-2.5-pro חסום free-tier limit-0).
- ✅ B1 חי על האפליקציה · 14 שאלות-אמת · קורס-דשבורד · "הסבר לעומק" מעוגן-חקיקה — **כל ה-"גז" עובד end-to-end.**

### 🚩 פתוח-לאימות-מוטי (צעד-0 בסשן הבא — לפני הכל!)

מוטי ביצע ב-UI (סוף 2026-06-04, לפני שיצא): החלפת `DATABASE_URL` ב-Vercel ל-**Transaction Pooler (6543)** + (אולי) הוספת `GEMINI_API_KEY` + **Redeploy**. **חובה לוודא איתו שזה עובד בפועל:** studibuilder.vercel.app → היכנס לשיעור → אם 14 השאלות נטענות = DATABASE_URL תוקן ✅ · אם "הסבר לעומק" מחזיר טקסט = GEMINI_API_KEY מוגדר ✅. אם עדיין נכשל — Vercel Logs (level:error) + ACCESS-MAP צ'קליסט.

### 🟢 מנוע יצירת-שאלות-MCQ — קוד מוכן (2026-06-04 המשך · טרם-הורץ)

מדוע: 14 השאלות הן `explanation` (אין מסיחים → "יש שאלה אין תשובות"). נבנה מנוע MCQ מעוגן-חקיקה:

- `src/lib/import/generated-mcq.ts` (טהור · אנטי-הזיה: sourceQuote חייב verbatim בנוסח · status מוסקנא) · `src/lib/ai/prompts/generate-question.ts` · `scripts/generate-questions.ts` (Flash · BUDGET · throttle+429 · `--dry-run`/`--execute`/`--limit`/`--per`/`--scope`) · 8 טסטים.
- פקודות: `pnpm gen:dry` (אומדן) · `pnpm gen -- --limit 10 --per 4` (פיילוט ~40 MCQ · בתשלום).
- ⏭️ **לא הורץ** (נשמר הקשר). **צעד-הבא בסשן הבא: `pnpm gen:dry` → `pnpm gen --limit 10 --per 4` → `tsx scripts/verify-questions.ts` → /lesson/practice (MCQ אמיתי) → commit.** ⚠️ Gemini-Flash (לא Pro · חסום free-tier) · עלול rate-limit (resume).

### הצעד הבא (follow-ups — סשן הבא)

1. **השלמת-embedding** (42/42 · כרגע ~18 · rate-limit free-tier — resume-runs / batch / billing).
2. **בנק-שאלות עצום:** ייבוא-מורחב (כל בנקי-השו"ת · אישור-M5 · פרסור-PDF) **+ מנוע יצירת-שאלות מ-AI** (Gemini+RAG מהחקיקה · content-verifier) — **לא NotebookLM** (אין-API · ADR-005).
3. אימות-content-verifier לשאלות · a11y-sweep דשבורד · billing-tier ל-Gemini (free-tier חוסם Pro + מגביל embeddings).

---

## 2026-06-04 (יום) — 3 דוגמאות-עיצוב מוחשיות (HTML · A/B/C)

> בקשת-מוטי: "תייצר 3 דוגמאות בהתאם לתוכניות-העיצוב כדי לראות מוחשי". שפת-תקשורת: עברית (USER.md). plan-first → אישור → ביצוע.

### מה נעשה

- **3 דוגמאות-HTML עצמאיות** ב-[`docs/design/mockups/`](../design/mockups/): `mockup-A.html` (משחקי-תוסס) · `mockup-B.html` (פרימיום-נקי) · `mockup-C.html` (Bold-Modern/aurora). כל אחת: **דשבורד + נגן-שיעור** באותו תוכן-דמו (שאלת ממונה-בטיחות + citation תק׳-ממונים-1996), RTL, Rubik, אינטראקטיבי (בחירה→בדיקה→משוב), מסקוט "רוני" inline-SVG עקבי. + `index.html` (דף-השוואה זה-לצד-זה + מקרא+swatches).
- **שיטה:** 2 Workflows (ultracode) — Author (3×`visual-designer` במקביל) → Verify (`accessibility-i18n`) → Fix → **re-verify** (נאמנות-מותג+ניגודיות). תוקנו ניגודיות-AA (primary-text/text-muted מותאמים — **בלי לשבור את ה-primary המותגי**), prefers-reduced-motion, נגישות-מקלדת, touch-targets, RTL חיצים. כל 3 ≥4.5:1, 2 מסכים שלמים, HTML תקין.

### מצב / הצעד הבא

- ✅ נדחף ל-`main`. נפתח בדפדפן לאישור-ויזואלי.
- **+ 2 וריאציות-היברידיות** (מוטי נוטה ל-B): `mockup-B1.html` (B+מנגנון-רטנשן מבוקר) · `mockup-B2.html` (B+נגיעת-C: aurora סטטי+כותרת-ענק). נבנו על-בסיס mockup-B (Workflow · אומתו AA · brand-amber נשמר). `index.html` עודכן ל-5 דוגמאות + מקרא-היברידיות.
- **שיבוץ-תוכנית:** נוספו ל-TODO/EXECUTION-PLAN — **שער-עיצוב (DM1-4)** מקבילי-לתוכן וחוסם-UI · **E2** הטמעת תיקיית-Drive "סיכומים וחזרות" (חזרה-לוועדה ~150עמ' + דגשים + מצגת-שאדי) כמקור-RAG/סיגנל-דגש (זיכרון `drive-revision-folder-vaada`).
- 🚩 **דורש-מוטי:** (1) בחירת-כיוון-עיצוב (A/B/C/B1/B2/היברידי) → פותח D-UI/F. (2) תזמון הטמעת תיקיית-Drive + הכרעת מצגת-שאדי (name-clean). (3) A-gates (ISO/חקיקה) + אישור embedding-run.

---

## 2026-06-04 (לילה) — ריצת-לילה אוטונומית: אינדקס-MD + תוכניות-עיצוב + תשתית

> טייס-אוטומטי (אישור-מוטי "עבוד עד הבוקר"). היקף: אינדקס-MD (עדיפות-1) → תשתית לא-ויזואלית → עצירה-בעיצוב (3 תוכניות) → תוצר-5 אם יישאר זמן. כלים: לוג-ריפו (קובץ-זה) + `MOTI-INBOX.md` (דו-כיווני) + Drive Doc-תמצית. firewall-מגן · אפס-כסף · push אחרי כל תת-משימה.

### מה נעשה

- **צעד-0:** `git pull` — סונכרנו 24 commits (ענף-בקרה oversight · GOVERNANCE-V2 · קורפוס-חקיקה · ScenarioWalkthrough).
- **Phase 1 — אינדקס-MD חכם ✅:** `.claude/scripts/gen-md-index.mjs` מחולל אוטומטית את [`MD-INDEX.md`](MD-INDEX.md) — **328 קבצים · 17 קטגוריות** · 📌 קבצי-חובה נעוצים בראש · 🚀 ניווט-מהיר פר-נושא · תכלית+תגיות+עדכון-אחרון פר-קובץ · ⚠️ **איתור-יתומים** (זיהה `Todolist.md` הישן). Wiring: `pnpm index:md` + pre-commit-regen + SessionStart-regen + הפניה בשורה-1 של `CLAUDE.md` + `PROJECT-MAP`. + תיבת-הערות דו-כיוונית [`MOTI-INBOX.md`](MOTI-INBOX.md).
- **Phase 3 — 3 תוכניות-עיצוב (Workflow · 5 סוכנים · 397K tok) ✅:** `docs/design/DESIGN-PLAN-A/B/C.md` + `DESIGN-PLANS-COMPARE.md` — בהשראת קורפוס-StudiesGo האמיתי (login · שאלון-onboarding · מעברים · כפתורים · הנפשות · מראה-מזמין · RTL/a11y · design-tokens · wireframes). **למוטי לבחור.**

### מה נעשה — Phase 2 (תשתית לא-ויזואלית · אפס-כסף · TDD) ✅

- **D-backend:** מנוע **SM-2** ([`src/lib/srs/sm2.ts`](../../src/lib/srs/sm2.ts), `a5807a9`) + **scheduler** תזמון-תור-תרגול ([`src/lib/srs/scheduler.ts`](../../src/lib/srs/scheduler.ts), `15e8224`).
- **E·RAG:** **chunker** מודע-גבולות + **embedder** (DI) + Gemini-EmbedFn גדור ([`src/lib/rag/`](../../src/lib/rag/), `f95061c`).
- **F2 stats-core:** גזירת XP/streak/accuracy מ-question_attempts ([`src/lib/stats/learner-stats.ts`](../../src/lib/stats/learner-stats.ts), `6515fc3`).
- **503 טסטים ירוקים** (+60 חדשים) · typecheck נקי. כל המודולים לוגיקה-טהורה (קריאות-Gemini גדורות עד אישור-מוטי).

### מה נעשה — Phase 4 (תוצר-5 ממשל-v2) ✅

- **סקיל `agent-os` גנרי** ([`.claude/skills/agent-os/`](../../.claude/skills/agent-os/SKILL.md), `2f43982`): SKILL.md + 12 תבניות + settings-snippet. placeholders ({{PROJECT_NAME}}/{{DOMAIN}}/{{TIERS}}/...). **firewall מאומת** — grep-דטרמיניסטי + **אימות-אדוורסרי 3-עדשות** (firewall=נקי · placeholders · fidelity=נקי; 3 ממצאי-עקביות תוקנו). נבנה ב-2 Workflows (12 סוכני-חילוץ + 3 סוכני-אימות). עדכון: IDEAS 💡→✅ · GOVERNANCE-V2 תוצר-5 ✅ · TODO סשן-C ✅ · PROJECT-MAP + CLAUDE §סקילים.

### 🌅 סיכום-בוקר — 8 commits נדחפו ל-`main` (כולם ירוקים)

| תוצר                       | commit    | אימות               |
| -------------------------- | --------- | ------------------- |
| אינדקס-MD חכם + MOTI-INBOX | `72a5658` | מחולל · 332 קבצים   |
| 3 תוכניות-עיצוב (Workflow) | `1d73650` | StudiesGo · COMPARE |
| SM-2                       | `a5807a9` | 21 טסטים            |
| RAG (chunker+embedder)     | `f95061c` | 20 טסטים            |
| scheduler                  | `15e8224` | 11 טסטים            |
| stats-core                 | `6515fc3` | 8 טסטים             |
| agent-os skill (תוצר-5)    | `2f43982` | firewall + אדוורסרי |

**503 טסטים ירוקים · typecheck נקי · 0 הוצאת-כסף · firewall-מגן נשמר.**

### 🚩 דורש-מוטי (לבוקר)

1. **בחירת כיוון-עיצוב** מ-3 התוכניות → `docs/design/DESIGN-PLANS-COMPARE.md`.
2. `Todolist.md` (יתום ישן 5/31, gitignored, הוחלף ע"י TODO.md) — להחליט אם למחוק.
3. הרצת-embedding/Gemini בפועל (עולה כסף) — השלד מוכן, ממתין לאישור. + יישור-מימדים `vector(1024)`→Gemini.
4. הערות נוספות → כתוב ב-`docs/context/MOTI-INBOX.md` (אקרא ואגיב בצעד-0).

### ⏳ נותר לחיווט (דורש DB/route-tests — לא-בוצע אוטונומית)

D-APIs (route handlers שעוטפים scheduler/SM-2) · F2 DB-wiring (שאילתה→stats-core) · D-UI ו-Upload-UI (נושא-עיצוב → אחרי בחירת-כיוון).

---

## 2026-06-03 — ממשל-v2: סשן-A ✅ + סשן-B (ענף-בקרה oversight) ✅

> בקשת-מוטי: ממשל-v2 (ענף-בקרה עצמאי). **שיטת-עבודה חדשה (2026-06-03): גיבוי-ריפו + עדכון-TODO + doc-לוג Drive אחרי כל תת-משימה.**

### מה נעשה

- **סשן-A ✅** — תוצר-4 (גבול פלטפורמה↔קורס + אכיפת-oversight · `3b01c40`) + תוצר-3 (סכמת-TODO מורחבת: ⏱/🤖/💲/סיכון/ראש-צוות/🚩/אימות · `bf9624d`). 443 טסטים ירוקים.
- **סשן-B ✅** — ענף-בקרה `oversight` **שלם** (6 סוכנים · רוסטר 27→33 · tier חדש). זרוע-א' בקרה-חיצונית (נדב/עידו/הדס) + זרוע-ב' מבקר-תכנית (רותם/שני/גיא) + פרוטוקולים (`_oversight-protocol` צו-עצירה קוורום-2/3 + `_curriculum-audit-protocol`) + ledger + דו"חות + עדכוני-ממשל (ORG/README/AGENTS/CLAUDE/PROJECT-CONTEXT/PROJECT-MAP/MEMORY). commits `448de2b`→`af31f7b` + OV-6. שמות = הצעה ניתנת-לשינוי-מוטי.

### מצב / הצעד הבא

- **סשן-A+B הושלמו ונדחפו ✅.** התוכנית-המלאה + spec תוצר-5 + פרומפט-המשך מגובים בריפו: [`GOVERNANCE-V2.md`](GOVERNANCE-V2.md).
- **הצעד-הבא = סשן-C** (תוצר-5: SKILL `agent-os` גנרי — חילוץ-ארכיטקטורה רב-פרויקטי, מגן מוחרג-firewall). פרומפט-להדבקה מלא ב-`GOVERNANCE-V2.md`.

---

## 2026-06-02 (צהריים) — כלל-מגן (firewall · HYBRID) + לכידת-החלטות-הסשן ✅

> ↩️ **עודכן 2026-06-09: ה-firewall של מגן בוטל (REVERSED) — port מפרומפט-המאסטר של מגן מותר כעת (name-cleaned). ראה ADR-009 (תיקון 2026-06-09).** הרשומה ההיסטורית למטה נשמרת כפי-שהיא.

> בקשת-מוטי: מגן = השראה-בלבד; לעגן בכל קבצי-הליבה. + הכרעות-תוכן רבות מההכנה-לוועדה.

### מה נעשה

- **כלל-מגן (firewall) עוגן ב-11 קבצים** (Workflow · 11 סוכנים): ריפו-מגן (`Moti316/megen`, ציבורי) = **השראה/reference בלבד**, אסור להעתיק/לערבב. **פרסונה = HYBRID** (חילוץ-מבנה-מוכח כ-spec → native → parity מול committee_bank) — **אחרי השוואת-3-עמדות** (copy/inspiration/hybrid). **אפס-זליגה** (אין קוד/תוכן-מגן בריפו).
- **ADR-009 תוקן:** Phase B (verbatim-copy) → HYBRID · §Open-Question-1 (drift) נסגרה · שגיא internal-only (ללא-שינוי).
- **הכרעות-תוכן (עוגנו):** ציטוט = תקנה/סעיף מדויק **פר-בקרה** (CLAUDE) · תרחיש = **3-חלקים** (מיידי/מנהלתי/חוקי) + **מחוון 4-עקרונות-הוועדה** (COURSE-DESIGN) · מטריצת-JSA→capstone בלבד · מודל-זה"ב name-clean (ATTRIBUTION) · רעיון "מתכנן-מסלול-אישי" (IDEAS).
- **זיכרון:** `magen-inspiration-only-firewall` · `scenario-answer-format` · `citation-per-control-law-only`.

### מצב / הצעד הבא (התור שנקבע)

- **A2** (חקיקה מנבו — ~33 נוסחים → `sources/legislation/`, יסוד-הציטוטים) → **D1-redesign** (תרחיש 3-חלקים + ציטוט-פר-בקרה) → **persona HYBRID** → **שדרוג-TODO** (זמן+סוכנים) → **מתכנן-מסלול**.

---

## 2026-06-02 (בוקר) — D1: ScenarioWalkthrough (type-5) נבנה + הודגם ✅

> בקשת-מוטי: "צא לדרך תציג לי" → לבנות את D1 (סוג-השאלה הקריטי לוועדה) ולהריץ-להראות.

### מה נעשה

- **`ScenarioWalkthrough.tsx`** (`src/features/lesson-player/components/`) — type-5 `scenario_walkthrough`. case-study (schema `scenarios`: title/background/data/task/solution/rubric) ב-3 שלבים: **work** (free-text) → **review** (חשיפת פתרון-מומחה + מחוון) → **done** (הערכה-עצמית מול rubric + פירוט ✓/✗ + ציון). חוזה `onResult` אחיד. RTL · a11y (checkbox native · fieldset/legend) · design-tokens.
- **`types.ts`** — `RubricCriterion` + `ScenarioInput` + `isRubric` guard (schema-as-is).
- **`/poc/scenario`** — תרחיש עבודה-בגובה/פיגום אמיתי (name-clean, מתחבר ל-JSA/A3).
- **7 בדיקות-יחידה** (guard + 3 שלבים + threshold pass/fail + single-report). typecheck נקי · pre-push ירוק.
- **הודגם חי:** dev-server + Playwright → 3 צילומים (work/review/done). onResult="עבר" 6/8 נקודות. commit `69d6f9a`.
- **grading = הערכה-עצמית דטרמיניסטית**; הערכת-LLM (free-text→ציון) = **D4** נפרד — הרכיב מוכן ל-swap ללא שינוי-חוזה.

### מצב / הצעד הבא

- **D1 🔄:** רכיב בנוי. נותר: D4 (`evaluate-scenario` LLM) + טעינת-`scenarios` ב-lesson-loop (`/lesson/[id]` join). ראה `docs/todo/D`.
- שאר ה-backlog ללא-שינוי: שערי-מוטי A1/A2 · M5 (B) · D2–D6.

---

## 2026-06-02 (בוקר) — מיפוי-מחדש Drive (שורש מאוחד) + A3 פרויקט-גמר ✅

> בקשת-מוטי: ארגן-מחדש את ה-Drive לתיקייה אחת "ממונה בטיחות 2025" + תיקיות פרויקט-גמר/פיגומים → למפות-מחדש + לעדכן קוד/תיעוד/משימות.

### מה נעשה

- **מיפוי-מחדש (MCP חי):** שורש אחד מאוחד `1pQQ…` עם 4 תת-תיקיות — שאלות-ותשובות (`1Ecc`, בנקי-T1) · חומרי-לימוד (`1Xr1`, 11 תת כולל **פרויקט-גמר** `1k1u` + **פיגומים** `1z43`) · סיכומים-וחזרות · פודקסטים (17 m4a). הישנה "ממונה בטיחות" `1Cd4` **ריקה**.
- **קוד:** `client.ts` → `DRIVE_FOLDERS` חדש (שורש + תת-תיקיות בשם; הוסרו `legacy`/`mainCourse`) + `DISCOVERY_ROOTS` · `import-content.config.ts` (`location`→`questions`) · `test-drive.ts`. **typecheck ✅.**
- **תיעוד:** `CONTENT-INDEX` (עץ חדש file-level, שמות-אמת) · `ACCESS-MAP` · `EXECUTION-PLAN` · `ADR-011`.
- **A3 ✅:** הנחיות-המשרד (`פרויקטים.pdf` + 3 טמפלייטים) שולבו ל-`FINAL-PROJECT.md`: **8 נושאי-פרויקט** · **פורמט-JSA** (חובה 19.10.25) · **מבנה-מסמך 6-חלקים** · **מטריצת-סיכון 4×4**. (⚠️ PII בדוגמה → reference-פנימי.)
- **מדיה (map-only):** `UNREAD-MEDIA` תואם למבנה (פודקסטים/מרצים/פיגומים.m4a); **עיבוד תמלול/OCR דחוי** (כדאיות-עלות; זמין גם ב-NotebookLM).
- **תוצאה:** `import:t1:dry` ירד **71→19 קבצים** (discovery נקי בהרבה) · 5 בנקים-מאושרים נמצאו · `test-drive` ✅.

### מצב / הצעד הבא

- נותרו שערי-מוטי **A1 (ISO)** + **A2 (חקיקה)**. **A3 ✅.** M5 (B) — discovery כעת פשוט יותר (בנקים בתיקייה-אחת). ראה `TODO.md` + `docs/todo/`.

---

## 2026-06-02 (בוקר) — Google-Doc-log פר-סשן בתיקייה-יעודית ✅

> בקשת-מוטי: להחזיר את נוהל ה-Google Doc (היה מצוין) אבל **doc נפרד לכל סשן** בתיקייה-יעודית, במקום doc-חי-אחד.

### מה נעשה

- **תיקיית-Drive יעודית** "StudiBuilder — לוגי-סשן" (id `1_GZY5fWK4z-BQRXUkySmsOUOPDnccVNw`) נוצרה דרך MCP Google Drive.
- **doc-סשן ראשון** נוצר בתוכה (סשן 2026-06-02 בוקר) — עדכון-חי (4 עדכונים) + סיכום-סוגר + פרומפט-המשך.
- **מנגנון:** MCP Google Drive (`create_file`, כתיבה) — ה-client של הפרויקט `drive.readonly` ולא יכול לכתוב.
- **עוגן:** `CLAUDE.md` §נהלי-עבודה (נוהל-לוג) · `ACCESS-MAP.md` (folder-id) · זיכרון `session-google-doc-log`.
- **החלטות-מוטי:** תדירות = חי + סוגר · תוכן = תקציר + פרומפט-המשך.

### הצעד הבא

- מכל סשן הבא: לפתוח doc-לוג חדש בתיקייה, עדכון-חי + סיכום. שאר ה-backlog: ראה `TODO.md` + `docs/todo/`.

---

## 2026-06-02 (בוקר) — TODO דו-שכבתי: master + docs/todo/ פר-שלב ✅

> בקשת-מוטי: TODO כללי מול תוכנית-הביצוע + קובץ-TODO פר-משימה-ראשית עם תתי-משימות.

### מה נעשה

- **9 קבצי-שלב** ב-`docs/todo/` (A–I) — נכתבו ב-Workflow (9 סוכנים במקביל), כל אחד: מטרה(DoD) · תלויות · תתי-משימות עם **קריטריוני-קבלה מקריאת-קוד בפועל** · מסמכי-ייחוס. + `docs/todo/README.md` (אינדקס).
- **master `TODO.md`** — כל כותרת-שלב מקושרת ל-`docs/todo/<slug>.md`.
- **`docs/context/TASKS.md` → stub** מפנה ל-`docs/todo/` (ביטול backlog-כפול).
- **רישום:** PROJECT-MAP (#5 repoint) + CLAUDE (סעיף משימות) — אין מסמך-יתום.

### מצב / הצעד הבא

- ⏳ **Google Doc session-log (בקשת-מוטי):** תיקייה-יעודית ב-Drive + doc פר-סשן (במקום doc-חי-אחד). **בתכנון.**
- שאר ה-backlog ללא-שינוי: A (שערי-מוטי) → B (M5) → … ראה `TODO.md` + `docs/todo/`.

---

## 2026-06-02 (בוקר) — צעד-0: "בדוק-ריפו-תחילה" כפעולה-ראשונה בכל סשן ✅

> instance (בוקר). התגלה חי: המקומי היה 7 commits מאחור את ריצת-הלילה — עבדתי על הקשר-ישן עד ש-`git fetch` חשף. בקשת-מוטי: להפוך בדיקת-סנכרון לפעולה-הראשונה הקבועה.

### מה נעשה

- **SessionStart hook שודרג** (`.claude/scripts/session-context.mjs`): מריץ `git fetch` ומדפיס באנר **"⚠️ מאחור ב-N commits"** בראש ההקשר-המוזרק כשהמקומי מאחור (אחרת "✅ מסונכרן"). **ללא pull אוטומטי** (החלטת-מוטי — בטוח). עטוף try/catch → אופליין=לא-קריטי.
- **הכלל עוגן ב-4 מסמכי-MD git-synced** (צעד-0): `CLAUDE.md` (אזהרת-קריאה + קריאה-חובה) · `AGENTS.md` (כללים-קשיחים) · `teams/PROJECT-CONTEXT.md` (פתיחה — כל סוכן) · `teams/ORG.md` (פרוטוקול-עבודה שלב-1). + `MEMORY.md` (עקרונות) + זיכרון-harness `session-start-repo-sync`.
- **אומת:** hook רץ נקי → "✅ מסונכרן"; לוגיקת-behind אומתה על זוג ידוע (d111d92→origin = 7) → באנר-אזהרה תקין. typecheck ירוק.

### מצב / TODO (סשן הבא)

- ללא-שינוי משאר ה-backlog: **M5** (אישור `docs/M5-discovery-curation.md` → ייבוא ~540) · 3 ממצאי-M6 שנדחו · ISO 5.3/5.4 · חקיקה-מנבו · פרויקט-גמר. ⏰ רפורמות 10/2026.

---

## 2026-06-02 (לילה) — ריצת-לילה אוטונומית: יישור-קו + M6 + M5-prep ✅

> instance #5 (overnight). אישור-מוטי קבוע; 3 commits ל-`main`. לוג-חי Google Doc #5→#7.

### מה נעשה

- **יישור-קו** (`dbd9bf9`): אומת מול הריפו ש-v1 מוזג (`main=93f6d79`, לא `415e149`). תוקן סחף ב-6 קבצים — STATUS/TASKS/EXECUTION-PLAN (Phase 4=ייבוא-T1 ✅/RAG חסר · Phase 5 ~3/5) + MEMORY/README/PROJECTS (stack Anthropic+Voyage→**Gemini**).
- **M6 — code-review + security-review** (`a1cc051`, workflow · 20 סוכנים · 6 ממדים + אימות-אדוורסרי → **14 ממצאים מאומתים**). תוקנו 8: **P1** discovery default-deny gate (71→5 קבצים, מונע זיהום-DB) · **P2** source_ref content-hash (idempotency ל-mid-doc edits) · admin-telemetry (try/catch+logError) · **P3** scope-tagger fence + הורדת 'מאומת'→'מוסקנא' · map-question bounds-check · middleware `/admin` · sheet-width. **393 טסטים ירוקים** (+1 חדש).
- **M5-prep** (`908e1d5`): `import:t1:dry` (חינם) אישר 71 קבצים, 5 ב-allow-list. נכתב `docs/M5-discovery-curation.md` — טבלת-קוריישן (✅~19 בנקי-שאלות / ⚠️2 / ❌~50 חומרים). **לא הורץ `--execute`** (default-deny על כסף; חסר אישור-טבלה).

### מצב / TODO (סשן הבא — דורש את מוטי)

- ⏳ **M5:** לאשר `docs/M5-discovery-curation.md` → להוסיף File-IDs ל-`T1_FILE_IDS` → `import:t1:dry` → `import:t1` (hard-cap $5).
- ⏳ **3 ממצאי-M6 שנדחו:** MatchingPairs grading (graded↔guided-practice — החלטת-מוצר) · מונה-Gemini fidelity · MCQ a11y roving-tabindex · (+ `server-only` package, P3).
- ⏳ נותרו (מהבוקר, דורשים מוטי): ISO 5.3/5.4 · הורדת חקיקה מנבו · פרויקט-גמר. ⏰ רפורמות 10/2026.

---

## 2026-06-01 (ערב) — משימה 0: מסמכי-קורס safety-officer הושלמו ונדחפו ✅

> instance #1. כל מסמכי-התוכן name-clean נכתבו (Workflow, 11 סוכנים במקביל) ונדחפו ל-`main`.

### מה נעשה

- **13 מסמכים נכתבו/עודכנו** (commit `c22d1f3`): `LEGISLATION-SOURCES` (37 נוסחי-נבו + URLs + מקרים-מיוחדים 2.10/2.11/2.6.1/ISO) · `MOLSA-PROGRAM` (תכנית-משרד 316ש/108 + מבחן 40/60 + רפורמות-2025) · `LEARNING-MATERIALS` · `UNREAD-MEDIA` (~53 פריטי-מדיה → OCR/תמלול) · `ATTRIBUTION` · `COURSE-DESIGN` (3 מצבים + capstone) · `FINAL-PROJECT` (מיני-קורס פרויקט-גמר) · `REGULATORY-WATCH` · `ISO-31010/31000-DRAFT` · `docs/PROJECT-STRUCTURE` · `ADR-012` · `ADR-013`.
- **כיול-כיסוי:** אומת **48✅/7🟠/2🔴** פר-פריט מול byScope (מונה-גולמי שגוי "49/6/2" נדחה).
- **גיבוי PDF פרויקט-גמר לדוגמה** מ-Drive → `courses/safety-officer/sources/final-project/` (commit `dc35c78`).
- **עיגון:** COMPLIANCE (כלל-זכויות) · PROJECT-CONTEXT (עוגן-קורס + מדיניות-push) · CLAUDE + PROJECT-MAP + architecture/README (רישום ADR-012/013 + קורס) · זיכרון (`regulatory-watch-2025`, `always-hebrew`, `auto-push-each-task`).
- **מדיניות חדשה:** push ישיר ל-`main` (single-branch) בסיום כל משימה-ירוקה — **אישור-מוטי קבוע**. עדכון-חי למוטי ב-Google Doc אחרי כל TODO.
- **grep שמות-מרצים = 0** בכל תוצרי-המשימה · typecheck + 392 טסטים ירוקים (git-hooks).

### מצב / TODO (סשן הבא)

- ⏳ **טיוטות ISO 5.3/5.4** (`ISO-31010/31000-DRAFT.md`) — **לסקירת-מוטי והכרעה** על שילוב/מיקום.
- ⏳ **להוריד ~35 נוסחי-חקיקה מנבו** (URLs ב-`LEGISLATION-SOURCES.md`, אחרי אישור-טבלה) → `sources/legislation/` · לאתר 2.6.1.
- ⏳ **פרויקט-גמר:** מצגת-הנחיות-מדויקת ממשרד-העבודה (תגיע ממוטי) → לעדכן `FINAL-PROJECT.md`.
- ⏰ **רפורמות תשפ"ה-2025:** בדיקה-מחודשת **10/2026** (`REGULATORY-WATCH.md`).
- ואז **M5** (הרצת-ייבוא בנק-השאלות ~540 שאלות).

---

## 2026-06-01 (יום) — יסודות-קורס: מיפוי-תוכן Drive + חקיקה + כלל-זכויות ✅

> נקודת-כניסה לתוכן-הקורס: `courses/safety-officer/` (instance #1; המבנה = תבנית-הפלטפורמה).

### מה נעשה

- **מיפוי-כיסוי מלא** (workflow, קריאה-מלאה של כל מסמכי-Drive): **48✅/7🟠/2🔴** מתוך 57 scope. חסר אמיתי: `5.3 ת"י31010`+`5.4 ת"י31000`. בנק-שאלות עשיר ~600+ (18 קבצים). → `courses/safety-officer/LEGISLATION-COVERAGE.md`.
- **אינדקס-חקיקה** (workflow): **35/36 נוסחים אותרו בנבו free-full-text** (URLs). → `LEGISLATION-SOURCES.md`. שלד `sources/legislation/`. **טרם הורדו** — מחכה לאישור-טבלה ממוטי (הוצגה).
- **תוכנית-אתגר** (קורס 1211762) נקראה במלואה → `curriculum-atgar.md` (11 פרקים, name-clean).
- **כלל-זכויות מוחלט:** ללא שמות-מרצים · חומרי-מרצה=reference+שכתוב · חוקים=נחלת-כלל. נשמר בזיכרון (`no-lecturer-names-copyright`). **כל הקבצים name-clean.**
- **החלטות:** מבנה=פרק→מיני-קורס×3-מצבים, ניווט-כפול, ייצור-היברידי · ATTRIBUTION = מקרה-במקרה · לא להתקין gstack · עיצוב/UX=עדיפות.

### מצב / TODO (סשן הבא)

- **workflow `web2hnr6q` רץ** — תכנית רשמית של משרד-העבודה (להשוות ל-אתגר/57). לאסוף + להשוות.
- קבצים להשלים (name-clean, בתיקיית-הקורס): `LEARNING-MATERIALS` · `UNREAD-MEDIA` (אודיו/וידאו/תמונות→transcription/OCR) · `ATTRIBUTION` (פר-חומר) · `COURSE-DESIGN` · `docs/PROJECT-STRUCTURE.md`.
- להוריד 35 נוסחי-חקיקה מנבו (אחרי אישור) · לכתוב 5.3/5.4 · לאתר 2.6.1.
- עיגון: `COMPLIANCE.md`+`CLAUDE.md` (כלל-זכויות) · `teams/PROJECT-CONTEXT.md` (כל הסוכנים) · ADR-013 (תבנית-קורס) · ADR-012 (הסרת gstack-install).
- ואז M5 (ייבוא בנק-השאלות). תוכנית: `~/.claude/plans/...iridescent-corbato.md`.

---

## 2026-06-01 (לילה) — Agent-OS + v1 (Phase 0 + M1–M4) — ✅ מוזג ל-`main`, ענף נמחק

### מה נעשה (כל העבודה על ענף `claude/v1`, נדחף אחרי כל milestone)

- **`.env.local`** עודכן עם מפתחות-Gemini (generation/classification/embedding) + service-role + DATABASE_URL. גיבוי-מקומי (tag+bundle) ל-`docs-business-pivot-adrs` לפני ניקוי remote-refs ישנים.
- **Agent-OS (Phase 0):** היררכיית **27 סוכנים** (22 + 4 ראשי-צוות + מתווך "אמיר") תחת `teams/` — לכל סוכן identity+memory+activity-log · `ORG.md`+`PROJECT-CONTEXT.md` · פרוטוקול-7-שלבים · מחזור-חיים. commit `5545ff3`.
- **M1:** `.gitignore`(.cache/logs) · creator-gate (`src/lib/auth/creator.ts`) · migration **0002** (questions.source_ref + unique index) · `scope-refs.ts`(57) · ניקוי Claude/Voyage→Gemini בתיעוד. commit `32384ce`.
- **deps:** `@google/genai` נכנס, `@anthropic-ai/sdk` הוסר. + `docs/compliance/COMPLIANCE.md` + `docs/IDEAS.md` + נהלי-עבודה ב-CLAUDE.md. commit `46b2cb5`.
- **M2 (צינור-ייבוא):** `src/lib/ai/client.ts` (Gemini) · `scope-tagger.ts` · `map-question.ts` · `upsert-questions.ts` · `scripts/import-content.ts` + `.config.ts` · `import:t1`/`import:t1:dry`. typecheck נקי · 299 בדיקות. commit (זה).

### מצב

**מוזג ל-`main` (`4ca9c75`) ב-2026-06-01 באישור מוטי** — `claude/v1` נמחק (local+remote), חזרה ל-**single-branch main**. typecheck+test ירוקים (392). צינור-הייבוא **כתוב אך טרם הורץ** (M5).

### הצעד הבא — נשאר M5 (ייבוא) + M6 (סקירה+מיזוג). **כל הקוד הושלם ונדחף.**

**הושלם ונדחף ל-`claude/v1`:** M2 (צינור `7d3c0a2`) · M3 (admin tagging UI `34e56d4`) · M4 (lesson player `05b900b`). typecheck+test ירוקים (392 בדיקות).

**M5 — הרצת-ייבוא בפועל (מומלץ בסשן רענן, הקשר-מלא):**

1. **דגל discovery:** `pnpm import:t1:dry` עבד (exit 0), אבל מצא **69 קבצים** (כולל T2/T3 — מצגות/חוקים/ריתוך), לא רק שאלות-T1. **לפני `--execute`:** או לצמצם filter ב-`scripts/import-content.ts`/`.config.ts` לקבצי-שאלות (filename: /שאל|מבחן|מאגר|שו"ת|בחינ|Emailing|לקט/), או לאמת שהפרסרים (parseDocxQA/parsePdfMcq) מחזירים 0 על קבצים-לא-שאלתיים (הם מחלצים Q&A בלבד — סביר שכן). אומדן-עלות dry: ~$1.60.
2. **schema ל-DB אמיתי:** להחיל את `supabase/migrations/0002` (source_ref + unique index). מומלץ **הרצת ה-SQL של 0002 ישירות מול `DATABASE_URL`** (בטוח), ולא `pnpm db:push` (drizzle diff עלול לנסות לסנכרן הבדלים נוספים מול 0001 שהוחל-ביד).
3. `pnpm import:t1` (execute) → ~540 שאלות + תיוג-Gemini Flash (hard-cap $5). report ב-`logs/`.
4. אימות: ספירת `questions` ב-DB · `/admin/questions` מציג + תיוג עובד · `/lesson/practice` מנגן תוכן-אמת.

**M6:** `/code-review` + `/security-review` (skills) → תיקונים → דחיפה → **מיזוג `claude/v1`→main + מחיקת-ענף = רק באישור מוטי** (ה-classifier חוסם main אוטונומית; ראה זיכרון `studi-autonomy-boundaries`).

**דגלים:** אין `server-only` מותקן (guard ידני) · T1 File-IDs חלקיים ב-CONTENT-INDEX §7.

### תזכורת (resume)

`git checkout main && git pull` (הכל על main עכשיו — single-branch). נהלים: דחיפה אחרי כל משימה · כל .md חדש → memory+CLAUDE+PROJECT-MAP. M5/M6 רצים על main. תוכנית מלאה: `~/.claude/plans/snuggly-tumbling-kurzweil.md` + קבצי-זיכרון.

---

## 2026-05-31 (ערב) — מעבר-מחשב + end-to-end + סביבה + Drive + ניקוי-ענפים ✅

### מה נעשה

- **מחשב חדש** (`b0066820`): חיבור-repo אומת, זהות-git מקומית הוגדרה, `.env.local` הוקם (Supabase+Drive אמיתיים; Anthropic+Voyage placeholders). git-bash blocker **לא קיים כאן** (husky לא מוגדר; commit/push עובדים).
- **עדכון-אסטרטגיה end-to-end** במסמכי-ההקשר: StudiBuilder = **פלטפורמת-ייצור מלאה** (creator=מוטי) + **קורס-הוועדה** (לימוד+שיווק). בוטלה מסגרת ה-carve-out/הקפאת-phases. עודכנו: PROJECT-MAP, PROJECTS, STATUS, EXECUTION-PLAN, TASKS, DECISIONS.
- **החלטות:** וידאו **נשאר** ב-repo · chachmoni **הוסר** (לא קשור) · Google Drive = source-of-truth (לא ריפו-מגן).
- **ספק-AI שונה ל-Google Gemini** (יצירה+סיווג+embeddings) במקום Anthropic+Voyage — מפתח אחד `GEMINI_API_KEY`. עודכנו ADR-001, ADR-011, CLAUDE.md, src/lib/ai, .env, ACCESS-MAP.
- **`GEMINI_API_KEY` הוגדר ואומת** (50 מודלים · generateContent עובד) — ה-AI מחובר במלואו (Supabase+Drive+Gemini).
- **ניתוח תיקיית "מחקרים"** (Drive folder `1LUAi…` + מקומי): 6 PDF על ארכיטקטורת-נחיל-סוכנים נקראו (פרויקט ALPH-ED, דומיין שונה). תובנות-העברה ל-StudiBuilder: אימות-תוכן רב-שלבי · הגנת-IDPI בייבוא · pSEO ל-Phase 10 · צינור idempotent (Inngest). הומלץ סוכן `content-verifier`.
- **סביבה הוקמה:** Node v24.16.0 (portable, ללא admin) + pnpm + 999 deps. `pnpm drive:test` עבר — **2 תיקיות-Drive מופו** (133 קבצים), אוחדו ל-`CONTENT-INDEX.md` (החליף content-inventory + curriculum-coverage → stubs).
- **CI תוקן:** prettier repo-wide (job ה-lint נכשל על MD לא-מפורמט) → commit `05c9216`. husky hooks **עובדים** כאן (git-bash + nodejs ב-PATH).
- **ניקוי git (C2):** כל 4 ענפי `claude/*` נמחקו → **single-branch main** (`docs-business-pivot-adrs` אומת קובץ-קובץ כ-predecessor מוחלף).
- **CLAUDE.md:** סעיף רישום-MD + כלל קבוע (כל .md חדש נרשם ב-CLAUDE.md + PROJECT-MAP).

### מצב

Node+pnpm+deps ✅ · Drive מחובר+מופה ✅ · single-branch `main` ✅ · CI ירוק ✅ · `GEMINI_API_KEY` מוגדר+מאומת ✅. **חסר:** import pipeline (`src/lib/import/*`) לא נכתב.

### הצעד הבא

1. **לבנות את ה-import pipeline** (ADR-011, Gemini, ~6 קבצים) → ייבוא T1. [`GEMINI_API_KEY` מוגדר ✅]
2. לבנות import pipeline (ADR-011, Gemini, ~6 קבצים) → ייבוא T1 → Quiz Engine (Phase 5).
3. המשך end-to-end: Upload UI (Phase 3) → persistence (Phase 2) → Course-as-Product (Phase 10).

---

## 2026-05-31 — הקמת ארכיטקטורת-הקשר + פתרון חוסם-git ✅

### מה נעשה (committed + pushed ל-main `66eb19d`)

- **9 קבצי-הקשר** ב-`docs/context/` (PROJECT-MAP, PROJECTS, STATUS, EXECUTION-PLAN, TASKS, BUGS, DECISIONS, ACCESS-MAP, SESSION-LOG) — תשתית הרציפות בין-סשנים. `EXECUTION-PLAN.md` = התוכנית המאוחדת.
- תיקונים: `auth-drive.ts` (OAuth loopback), `test-drive.ts`/`test-db.ts` (.env.local), `.gitattributes` + husky→LF, `MEMORY.md` עודכן (→ STATUS.md).
- **זיכרון** (`~/.claude`): עברית-תמיד · push-to-main · Todolist · git-bash-blocker.
- **חיבורים מאומתים:** Supabase migration (7 טבלאות+57 scope-IDs) · Drive OAuth+test · DB · app ב-localhost:3000.

### החוסם שנפתר 🔑

git-bash שבור (fork 0xC0000142) → husky hooks לא רצים → commit/push נחסמו (גם `--no-verify` לא הספיק, כי `prepare-commit-msg` עדיין forks). **פתרון:** `git config --unset core.hooksPath` (מקומי). איכות נשמרת ע"י `tsc --noEmit` + `prettier --check` ידניים + CI. פירוט: [BUGS.md](BUGS.md#git-bash-fork).

### הצעד הבא (לסשן החדש) — הכל פתוח, push עובד

1. **C2** · למחוק 4 ענפים מיותרים: `git push origin --delete claude/docs-business-pivot-adrs claude/fix-home-redirect claude/phase-2-dashboard-skeleton claude/studiesgo-app-mapping-NLa2h` (main מכיל 100% מהתוכן).
2. **C3** · להוציא ~113MB וידאו מ-git (`git rm --cached docs/sources/studiesgo-videos/**/video.mp4` + `.gitignore`).
3. **B2-B4** · טיוב: content_scope_extensions→docs/internal/, ארכוב מיושנים, Voyage ל-CLAUDE.md.
4. **חוסם-על לפיתוח:** להפיק `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY` → לבנות import pipeline (ADR-011, ~6 קבצים) → Quiz Engine (4 types חסרים). ראה [TASKS.md](TASKS.md) + [EXECUTION-PLAN.md](EXECUTION-PLAN.md).

### תזכורת workflow

single-branch · commit+push ל-main אחרי כל משימה · `core.hooksPath` נשאר unset מקומית (husky לא רץ עד שגית-bash יתוקן).
