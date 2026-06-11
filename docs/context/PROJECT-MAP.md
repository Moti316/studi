# PROJECT-MAP — דלת-הכניסה להקשר StudiBuilder

> **קרא אותי ראשון בכל סשן.** אני האינדקס שמכוון לכל שאר קבצי-ההקשר.
> כל הקבצים כאן הם **מקור-אמת-יחיד, מסמכים-חיים**. מעודכן: 2026-06-04.
>
> 🗂️ **אינדקס-הכל המחולל:** [`MD-INDEX.md`](MD-INDEX.md) — רשימה-אוטומטית של **כל** קבצי-ה-MD בריפו (ניווט-מהיר פר-נושא · תכלית · עדכון-אחרון · איתור יתומים-מקומיים). מתעדכן ב-`pnpm index:md` / pre-commit / SessionStart. ה-PROJECT-MAP הזה = רשימת-הקריאה האוצרת; ה-MD-INDEX = הקטלוג-המלא.

## מה זה StudiBuilder (במשפט)

**פלטפורמת-ייצור-קורסים** בעברית (RTL) שהופכת PDF/Word/PPT לקורסי-לימוד גיימיפיקטיביים (Duolingo-style),
נבנית **end-to-end**. creator-gated (רק מוטי מייצר). תוצר-ראשון: קורס "ממונה בטיחות" — ללימוד-אישי
לוועדה (אבן-דרך **2026-07-15**) **וגם** כמוצר לשיווק. Repo: `Moti316/studi`.

## ⚡ רשימת קריאה-חובה לכל סשן חדש (קרא **במלואם**, לא לדלג)

> כל סשן חדש קורא את הקבצים הבאים **עד הסוף** לפני תחילת-עבודה, בסדר הזה.

**שכבת-בסיס (תמיד, מחוץ ל-context/):**

- `CLAUDE.md` — אילוצים-קשיחים + stack + עקרונות.
- `AGENTS.md` — חוקי-על קנוניים.
- `USER.md` — פרופיל motilev8 + העדפות.

**הקשר-חי (`docs/context/`, לפי סדר):**

1. **`PROJECT-MAP.md`** (כאן) — אינדקס + רשימת-קריאה.
2. **`PROJECTS.md`** — StudiBuilder מול מגן. **קרא כדי לא להתבלבל.**
3. **`STATUS.md`** — איפה אנחנו: phase, מה עובד, מה חסום.
4. **`EXECUTION-PLAN.md`** — התוכנית (end-to-end, 2 תוצרים).
5. **`TASKS.md`** _(stub)_ → הוחלף ב-**[`/TODO.md`](../../TODO.md)** (master A–I) + **[`docs/todo/`](../todo/README.md)** (קובץ פר-שלב — פירוט תתי-משימות, קריטריוני-קבלה, מסמכי-ייחוס).
6. **`BUGS.md`** — באגים שנפתרו (קרא לפני שתיתקל שוב).
7. **`DECISIONS.md`** — לוג-החלטות.
8. **`ACCESS-MAP.md`** — מפת מפתחות/שירותים (לא סודות).
9. **`SESSION-LOG.md`** — handoff הסשן האחרון + הצעד הבא.
10. **`PROTOCOL-INDEX.md`** — מפת-הממשל המאוצרת-לפי-תכלית (4 שכבות + ענף-בקרה · 12 פרוטוקולים בטבלה · זרימת-דיווח · בקרת-סחף · צו-עצירה · 7-צעדים · 12-שדות-identity · מחזור-חיים · Star-Chamber). **לא** כפילה של MD-INDEX (קטלוג-שטוח) — שכבת-הממשל בלבד, מסודרת מי-מדווח-למי.

**תוכן ו-scope (לעבודת תוכן/ייבוא):**

10. `docs/content-scope.md` — 57 פריטי-חקיקה לוועדה (scope-IDs).
11. `docs/CONTENT-INDEX.md` — מפת-Drive ↔ תוכנית-לימודים ↔ כיסוי-scope (אינדקס מאוחד).
    11a. `docs/M5-discovery-curation.md` — קוריישן ה-discovery לפני הרצת-ייבוא (71→~19 בנקי-שאלות; ⏳ אישור-מוטי).

**קורס safety-officer (`courses/safety-officer/`):**

- `curriculum-atgar` (spine 11 פרקים) · `LEGISLATION-SOURCES` (חוקים+URLs · **A2: 43 נוסחים הורדו כ-`.md`**) · `LEGISLATION-COVERAGE` (48/7/2) · `MOLSA-PROGRAM` (תכנית-משרד) · `LEARNING-MATERIALS` · `UNREAD-MEDIA` · `ATTRIBUTION` · `COURSE-DESIGN` · `FINAL-PROJECT` (capstone) · `REGULATORY-WATCH` (⏰10/2026) · `ISO-31010/31000-DRAFT` (טיוטות) · **`RISK-METHODOLOGY-INTRO`** (A1 · פתיח-מתודולוגי יחידה-ט) · `A1-A2-RESEARCH-2026-06-11` (מחקר-הכרעה).
- **`sources/legislation/`** — קורפוס-החקיקה: **43** נוסחי-נבו verbatim `.md` + **`INDEX.md`** (מפת-הקשרים מחוללת: scope↔PDF-Drive↔נבו↔עומק) + `README.md`. אומת 43/43 + מול תכנית-905018. PDF-מחייב ב-Drive "חוקים ותקנות"; 13 `source_complete:false` (תוכן-תמונה). 2.6.1 (עגורני-צריח 1966 · נוסף 2026-06-11): PDF ⏳ ממתין-להעלאת-מוטי (`drivePdfPending`).
- **`NOTEBOOKLM-ASSETS.md`** — מפת 39 מחברות-NotebookLM של מוטי (סווגו 2026-06-08): ~24 legislation (G3-grounding) · ~13 עשירות (lecturer-T2/committee-review → explanations/tutor/MCQ · name-clean) · 3 off-topic. כולל כיסוי-מול-57-scope, סדר-עיבוד, ודגלי-מגן ל"איתן" (firewall בוטל 2026-06-09 — port-מותר name-cleaned; ראה ADR-009). מזין את מנוע-התוכן (ADR-015).
- `docs/PROJECT-STRUCTURE.md` — מבנה פלטפורמה↔קורס.

**צינור-ייבוא + כלי-חקיקה (`scripts/` + `src/lib/import/`):**

- `scripts/fetch-legislation.ts` (A2 — fetch+charset+strip+frontmatter+verify) · `scripts/legislation-manifest.ts` (39 מקורות) · `src/lib/import/strip-nevo-html.ts` (חילוץ דטרמיניסטי לא-גנרטיבי, L1 zero-loss) · `src/lib/import/verify-legislation.ts` (L1–L5). פקודות: `pnpm legislation:fetch[:dry]` · `legislation:verify`.
- `scripts/import-content.ts` (T1 question-bank) · `src/lib/import/{scope-tagger,map-question,upsert-questions}.ts`.

**ציות ורעיונות:**

- `docs/compliance/COMPLIANCE.md` — חובות-ציות (נגישות/פרטיות/צרכנות/תשלומים) + task-force + משימות C1–C6.
- `docs/IDEAS.md` — backlog רעיונות/פיצ'רים/פידבק (להוסיף בחופשיות).

**ארכיטקטורה (לפי-צורך, מקור לכל בחירה גדולה):**

12. `docs/architecture/ADR-*.md` — 18 ADRs (000-template + 001-017 · **017** = LiveEngine הערכת-Claude-חיה לתשובות-חופשיות · fallback דטרמיניסטי). בעיקר **001** (stack) · **009** (מגן · firewall בוטל) · **010** (DB schema) · **011** (import pipeline) · **012** (נוהלי-פיתוח, single-branch main) · **013** (תבנית-קורס + capstone) · **014** (מנוע-תרחישים · scenario_walkthrough) · **015** (מנוע-תוכן NotebookLM · generate-offline→verify-G1–G5→serve-precomputed) · **016** (סימולציית-וועדה · 3-מפקחים · hybrid פרה-בנוי→חי).

> **מנוע-תוכן NotebookLM (ADR-015 · 2026-06-08):** `src/lib/notebooklm/{parse-output,map-scenario,request}.ts` (חוזה-JSON · mapper · בונה-בקשה) · `src/lib/import/{verify-grounding,legislation-resolver,upsert-scenarios}.ts` (שערי-G1–G5 · resolver · upsert) · `scripts/{notebooklm/build-request,import-scenarios}.ts` (CLI) · `tools/nblm-bridge/` (גשר-Python · git-ignored · `README.md` = bootstrap-מוטי) · `supabase/migrations/0003_*.sql`. צד-StudiBuilder נבדק end-to-end (dry-run · golden) — הגשר ממתין ל-bootstrap (Python+login).

> **מיני-קורס-שו"ת — שאלות NotebookLM רב-סוגיות (2026-06-09):** `src/lib/notebooklm/{extract-json,compact-question-prompt,adapt-flat-questions}.ts` · `src/lib/import/{generated-mcq,map-nblm-question,question-verification-io,semantic-verify-questions}.ts` · `scripts/{notebooklm/generate-questions-nblm,import-questions-nblm,delete-old-qa-bank,lib/load-statutes}.ts` · `scripts/workflows/verify-nblm-questions.mjs` (Workflow אימות-סמנטי · Claude · אפס-Gemini). מחליף את 540 בנק-qa הישן ב-~500 שאלות מעוגנות-חקיקה (mcq/matching/open · status='מוסקנא').

> **סימולציית-וועדה (ADR-016 · 2026-06-09):** `src/features/simulation/types.ts` (מודל-נתונים · 3-מפקחים · 4-שלבים · `SimulationEngine` transport-abstraction) · פרומפט: `src/lib/ai/prompts/committee-sim/{master,modes}.ts` (port name-cleaned ממגן). hybrid: פרה-בנוי-מסועף (Claude+פרומפט-מגן+NotebookLM · OFFLINE · אפס-runtime) → `LiveEngine` (Claude-API · עתיד). מחליף את ה-walkthrough הסטטי (ADR-014). 🧠 `committee-simulation-direction`.

**עיצוב (`docs/design/`):**

- `DESIGN-PLAN-A/B/C.md` + `DESIGN-PLANS-COMPARE.md` — 3 כיווני-עיצוב (A משחקי-תוסס · B פרימיום-נקי · C bold-modern/aurora) + השוואה+המלצה (היברידי B-led). `motion-specs.md` · `mascot-brief.md`.
- **`docs/design/mockups/`** — **5 דוגמאות-HTML מוחשיות**: `mockup-A/B/C.html` (3 הכיוונים) + `mockup-B1.html` (B+רטנשן) + `mockup-B2.html` (B+חתימה/aurora) · דשבורד+נגן-שיעור · RTL · Rubik · אינטראקטיבי · נגישות-AA מאומתת + `index.html` (דף-השוואה). נבנו 2026-06-04 (Workflows · סוכני-עיצוב+נגישות) לבחירת-כיוון. **מוטי נוטה ל-B.** ⏳ **ממתין-להכרעת-כיוון** (ראה TODO §DM).

**ממשל-סוכנים (`teams/`, רוסטר 33):**

- `teams/PROJECT-CONTEXT.md` (עוגן-הקשר) · `teams/ORG.md` (היררכיה+7-שלבים+קצב-דיווח) · `teams/README.md` (רוסטר) · `teams/HOWTO-add-agent.md`.
- **ענף-בקרה `teams/oversight/` (ממשל-v2, עצמאי):** `TEAM.md` · `_oversight-protocol.md` (צו-עצירה+read-authority+ערוץ-ישיר) · `_curriculum-audit-protocol.md` (כיסוי+drift) · `stop-orders-ledger.md` · `oversight-report.md` · `control-report.md` · 6×`<slug>/{identity,memory,activity-log}`. תוכנית-ממשל-v2 (סשן A/B/C): `GOVERNANCE-V2.md`.
- **סקיל `agent-os` (`.claude/skills/agent-os/`):** ערכה **גנרית רב-פרויקטית** לסקאפולד ארכיטקטורת-הסוכנים — `SKILL.md` + 12 תבניות (ORG · HOWTO · identity-12 · \_debate · \_oversight · TEAM · PROJECT-CONTEXT · agent-stub · comms · TODO-schema · quality-gates · session-context-hook). placeholders · firewall-מגן. תוצר-5 ממשל-v2.

## עקרון

אם מידע סותר בין קבצים — **`docs/context/` גובר** על מסמכי-תכנון ישנים (build-roadmap, mvp-plan).
`STATUS.md` הוא האמת לגבי "איפה אנחנו"; `EXECUTION-PLAN.md` לגבי "מה עושים".
