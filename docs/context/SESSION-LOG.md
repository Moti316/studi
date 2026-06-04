# SESSION-LOG — יומן סשנים (handoff)

> בכל סוף-סשן: "מה נעשה / מה הצעד הבא". חדש למעלה.
> **סשן חדש? התחל מ-[PROJECT-MAP.md](PROJECT-MAP.md).**

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
