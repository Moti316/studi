# TODO — StudiBuilder · רשימת-משימות חיה

> **מקור-אמת יחיד למשימות.** מסונכרן ב-git (כל מחשב), נטען אוטומטית בכל סשן (SessionStart hook),
> ומשתקף ב-TodoWrite בתוך הסשן. סימון: ✅ הושלם · 🔄 בתהליך · ⬜ פתוח · 🔴 חוסם · ⏰ מתוזמן.
> **מסודר לפי [EXECUTION-PLAN.md](docs/context/EXECUTION-PLAN.md)** (סדר-תלויות). מעודכן: **2026-06-09 (cont-d)** — **יישור-מול-קוד** (Workflow-אודיט · 7 סטיות תוקנו: S1/S2.2/D1/D2 שכבר נבנו סומנו ✅; הפערים-האמיתיים הובלטו). כיוון-פעיל: בנק-שאלות-NotebookLM + סימולציית-וועדה.
> 📂 **פירוט תתי-משימות פר-שלב:** [docs/todo/](docs/todo/README.md) — כל שלב A–I בקובץ נפרד (קריטריוני-קבלה + מסמכי-ייחוס).
> 📊 **פירוט-מורחב** (⏱זמן · 🤖סוכנים · 💲עלות · 🟢🟡🔴סיכון · ראש-צוות · 🚩דורש-מוטי · אימות) פר תת-משימה ב-[docs/todo/](docs/todo/README.md) — הסכמה+מקרא ב-README. (ממשל-v2 / תוצר-3.)

## 🌙 ריצת-לילה אוטונומית (2026-06-10) — דחיפה רחבה [הכרעת-מוטי · 4 must]

> מצב-אוטונומי (auto-accept · Workflows · סוכני-בקרה כשער-איכות). כל 4 היעדים = **must**.
> דלג-NotebookLM (login) → יצירת-תוכן ב-Claude-Workflow מעוגן-קורפוס. עיצוב-נועז ישיר. commit+push פר-בלוק.

- ✅ **בלוק-0** — הסרת כפתור "קורס חדש" (שייך לפלטפורמה-עתידית · `5ee116d`).
- ✅ **בלוק-1 ★** — סימולציה-פתוחה `LiveEngine` (ADR-018): `claude.ts` (prompt-caching + `claudeConverse`) · `committee-sim/{live,grounding}.ts` · `respond-live.action` (3 שערים) · `live-engine` reducer · `InspectorBubble` + `LiveSimulationPlayer` · `/preview/simulation-live` · **28 טסטים ✅** · typecheck נקי. ⏳ אימות-חי (dev-server) נותר.
- ⬜ **בלוק-2** — מהפכת-עיצוב StudiesGo (נועז · ישיר על האפליקציה · דשבורד/קורס/שיעור/סימולציה · motion+depth).
- ⬜ **בלוק-3** — פרויקט-גמר `capstone` (route + JSA-builder + מטריצת-4×4 + משוב-AI · state-מקומי) [Workflow-רקע בונה].
- ⬜ **בלוק-4** — מורה-פרטי AI על התשובות (`TutorChat` + `tutor-explain.action` · reuse claude.ts).
- 🔄 **בלוק-5** — בנק-תרחישים pre-bake (Workflow · **12 תרחישי-ענף חוברו+אומתו** content-verifier · staging→import).
- ⬜ **בלוק-6** — טיוטות ISO 5.3/5.4 + סגירה (TODO/STATUS/SESSION-LOG · לוג-Drive · דו"ח-בוקר).

> תיעוד-בעיות: `docs/context/BUGS.md` · עדכון-MD שוטף (MD-INDEX אוטו-רענון ב-pre-commit) · לוג-Drive פר-בלוק+סשן.

## 🔥 כיוון-פעיל (2026-06-09) — שני מיני-קורסים מעוגנים [DECISIONS · ADR-016 · 🧠 committee-simulation-direction]

> **מחליף את הכיוון-הישן** של מיני-הקורסים. שאלות = NotebookLM (אפס-Gemini). תרחישים = **סימולציית-וועדה** (לא walkthrough סטטי). יעד: לעדכן את האתר — שאלות-חדשות + תרחישים-חדשים חיים.

### S1 · מיני-קורס שו"ת — בנק-שאלות NotebookLM (~500 · מחליף 540 qa)

- ✅ **תשתית נדחפה** (`8436f09`+`5eb01c7`): generation checkpoint+resume · `question-verification-io` (13 טסטים) · sidecar `.built.json`+`--exclude` · תיקון scopeId-כפול · **Workflow אימות `verify-nblm-questions.mjs`** (Claude · אפס-Gemini).
- ✅ **ייצור-מלא NotebookLM** (`0b01ae9`): 42×mcq/matching/open · per=6 → **636 פריטים** (checkpoint+resume · crash-safe).
- ✅ **import + אימות-סמנטי** (Workflow content-verifier · 37 נוסחים · Grep-מהמקור) — תפס **14 הזיות-ציטוט** + 25 הזיות-verbatim נפלו → **429 נכנסו** (`--exclude <held>`).
- ✅ **`qa:delete`** — 540 הישן נמחק → **444 שאלות-NotebookLM מעוגנות-G3 חיות**. ⚠️ אימות-ספירה-ב-DB מומלץ (כרגע טענת-SESSION-LOG; לא-מאומת-מקוד).
- ⬜ **שחזור scopes 4.3–4.5** (עגורני-צריח · נפלו ב-timeout · resumable: `questions:generate --per 6 --types "mcq,matching,open"` → import אידמפוטנטי).

### S2 · מיני-קורס תרחישים — סימולציית-וועדה אינטראקטיבית (ADR-016 · מחליף 14 walkthroughs)

- ✅ **ADR-016 + מודל-נתונים** (`src/features/simulation/types.ts` · 3-מפקחים · 4-שלבים · `SimulationEngine` transport-abstraction · hybrid פרה-בנוי→חי).
- ✅ **`PrebakedEngine` + `SimulationPlayer` + route** (`390a7b0`+`040794b`) — מהלך-עץ טהור · נגן-צ'אט RTL (3-מפקחים · ציון 0-100) · `/preview/simulation`. 7 טסטים (`engine.test.ts`).
- 🔄 **צינור-חיבור** (`scripts/workflows/author-simulation.mjs` + פרומפט-מגן `committee-sim/master.ts` · **אפס-Gemini**) — **slice-LOTO חובר**; הרחבה ל-20 הזרעים טרם.
- 🔄 **vertical-slice** — slice-LOTO קיים ב-`/preview/simulation` בלבד → ⬜ **הטמעה ב-`/lesson/scenarios`** → 🚩 **אישור-מוטי** → הרחבה לכל → `scenarios:delete` (14 walkthroughs).
- ⏸️ **לו"ז-לימוד-אישי** (אינטייק→תוכנית · פיצ'ר-נלווה · אחרי-slice · 🚩 דורש-מוטי).
- ⬜★ **סימולציה-פתוחה (`LiveEngine`)** — 🚩 **הכרעת-מוטי (2026-06-09):** כל תור-מפקח = textarea חופשי → Claude (פרומפט-מגן) מעריך+מגיב כמפקח (משוב+ציון פר-תור · ADR-017). תשתית `claude.ts`+`evaluate-open-answer` **קיימת**; **חיבור-לסימולציה טרם מומש**. כולל הוזלת-Claude (prompt-caching · max_tokens · skip-תשובות-קצרות). [📐 תוכנית-מימוש מוכנה]

## 🏛️ ממשל-v2 — ענף-בקרה עצמאי (סשן רב-שלבי) · [גיבוי-תוכנית: docs/context/GOVERNANCE-V2.md](docs/context/GOVERNANCE-V2.md)

> 3 הכרעות-מוטי נעולות: ענף-`oversight` עצמאי מקביל-למתווך · צו-עצירה קוורום-2/3 + ledger (רק-מוטי-מבטל) · הכל-ברצף.
> **שיטת-עבודה (מוטי 2026-06-03):** **גיבוי-ריפו (commit+push) + עדכון-TODO + doc-לוג Drive אחרי כל תת-משימה.**

- ✅ **סשן-A** — תוצר-4 (גבול פלטפורמה↔קורס · `3b01c40`) + תוצר-3 (סכמת-TODO מורחבת · `bf9624d`).
- ✅ **סשן-B** — ענף-בקרה `oversight` שלם (6 סוכנים · רוסטר 27→33 · tier חדש `oversight`):
  1. ✅ **OV-1** בקרה-חיצונית — `oversight-lead`(נדב) · `plan-compliance-auditor`(עידו) · `process-audit-officer`(הדס) — 3×3 קבצים + 3 stubs.
  2. ✅ **OV-2** קבצי-ענף — `_oversight-protocol` · `stop-orders-ledger` · `oversight-report` · `control-report` · `TEAM`.
  3. ✅ **OV-3** מבקר-תכנית — `curriculum-auditor-lead`(רותם) · `coverage-auditor`(שני) · `content-drift-auditor`(גיא) — 3×3 + 3 stubs.
  4. ✅ **OV-4** `_curriculum-audit-protocol` + עדכון-`TEAM` (זרוע-ב' → ✅).
  5. ✅ **OV-5** עדכוני-ממשל — ORG · README · AGENTS · CLAUDE · PROJECT-CONTEXT · MEMORY · PROJECT-MAP → רוסטר 33.
  6. ✅ **OV-6** גיבוי תוכנית-ממשל-v2 בריפו (`docs/context/GOVERNANCE-V2.md`) + פרומפט סשן-C.
  - 🚩 **שמות-עבריים** (נדב/עידו/הדס · רותם/שני/גיא) = **הצעה, ניתן-לשינוי-מוטי** (ההצעה המקורית אורי/יעל/אסף/מאיה התנגשה עם הרוסטר הקיים).
- ✅ **סשן-C** — תוצר-5: SKILL `agent-os` גנרי ב-[`.claude/skills/agent-os/`](.claude/skills/agent-os/SKILL.md) — SKILL + 12 תבניות · placeholders · **firewall-מגן מאומת** (grep + אימות-אדוורסרי) · 2026-06-04.

## ✅ הושלם (מאומת מול הקוד)

- **🟢 מנוע-תוכן NotebookLM (Stage 1 · ADR-015 · 2026-06-08)** — צד-StudiBuilder נבנה ונבדק end-to-end (636 טסטים · dry-run מול קורפוס-אמיתי): שערי-G1–G5 (`verify-grounding.ts` · **G4 מחמיר = עיגון-מילולי+סעיף-חובה**) · importer (`src/lib/notebooklm/*` + `scripts/import-scenarios.ts`) · מיגרציה 0003 · גשר-Python (`tools/nblm-bridge/` · git-ignored). **בקרה-עצמאית** (oversight) → 2 קריטיים תוקנו (C1/C3) · BUGS.md#notebooklm-engine. ✅ **הופעל end-to-end (2026-06-08 המשך-ג):** מיגרציה-0003 הוחלה · גשר מותקן+login · SSL-fix-runtime (`BUGS.md#notebooklm-runtime-ssl`) · הופקו 20 → **12 תרחישי-4-חלקים חיים ב-/lesson/scenarios** (מחוון-4 · רינדור-bold · G3-אֵליפסיס · `repairJsonQuotes`). 🔄 רגנרציה-v2 לטעינת-יתר ל-~17.
- **🟢 ספריית-חקיקה (2026-06-08 · `f43e228`)** — מסך `/legislation` + טאב-חמישי BottomNav (חקיקה). 42 נוסחים · 4 פרקים (חוק›תקנותיו) · תגי-עומק · קישורי נבו+PDF · חיפוש · `src/lib/legislation/catalog.ts` (נגזר מ-manifest). 13 טסטים.
- **🌙 ריצת-לילה 2026-06-04** — **אינדקס-MD חכם** ([`MD-INDEX.md`](docs/context/MD-INDEX.md) + מחולל אוטומטי · קבצי-חובה נעוצים · ניווט-מהיר · איתור-יתומים · אוטו-רענון) + תיבת-הערות [`MOTI-INBOX.md`](docs/context/MOTI-INBOX.md) · **עיצוב: 3 תוכניות (A/B/C+COMPARE) + 5 דוגמאות-HTML מוחשיות** ([`docs/design/mockups/`](docs/design/mockups/) — A/B/C + B1/B2 היברידיות · דשבורד+נגן-שיעור · RTL · נגישות-AA) → 🚩 **דורש בחירת-כיוון** (ראה "שער-עיצוב" למטה).
  - **Phase-2 תשתית (אפס-כסף · TDD · 503 טסטים):** SM-2 + scheduler ([`src/lib/srs/`](src/lib/srs/)) · RAG chunker+embedder ([`src/lib/rag/`](src/lib/rag/)) · stats-core ([`src/lib/stats/`](src/lib/stats/)). נותר חיווט-DB/API/UI (D/E/F).
- **Phase 0/1** — Foundation + Auth (בפרודקשן, ~78% טסטים) · **Agent-OS** (27 סוכנים).
- **Phase 4 (חלקי)** — צינור-ייבוא-שאלות T1 בנוי (`scripts/import-content.ts` + `src/lib/import/{scope-tagger,map-question,upsert-questions}.ts`): idempotent · default-deny · hard-cap $5. **טרם הורץ.**
- **Phase 5 (~3/5)** — `MatchingPairs` · `MCQShort` · `MCQLong` · `McqQuestion` · `LessonHeader` · `/lesson/[id]` · admin-תיוג `/admin/questions`. **393 טסטים**, ב-`main`.
- **M6** — code-review + security-review (workflow · 14 ממצאים מאומתים; **8 תוקנו** → `a1cc051`; 3 נדחו למוטי → C).
- **תוכן-קורס safety-officer** — 13 מסמכים · כיסוי-scope 48/7/2 · אינדקס-חקיקה (37 נוסחים) · טיוטות ISO.
- **יישור-קו** (STATUS/TASKS/MEMORY/EXECUTION-PLAN/README/PROJECTS → מציאות, `dbd9bf9`).
- **צעד-0 repo-sync** — SessionStart hook (fetch+אזהרה) + עיגון ב-CLAUDE/AGENTS/PROJECT-CONTEXT/ORG (`149bf76`).
- **TODO דו-שכבתי** — master + `docs/todo/` פר-שלב (A–I).
- **מיפוי-מחדש Drive** (שורש מאוחד "ממונה בטיחות 2025") + **A3 פרויקט-גמר** (הנחיות שולבו ל-FINAL-PROJECT) — `9cf7332`.

## 🔴 A · שערי-מוטי — לסגור תכנון לפני M5 (נותרו A1+A2; A3 ✅) ⟵ הצעד-הבא · [📋 פירוט](docs/todo/A-moti-gates.md)

1. **A1 · ISO** — סקירת `ISO-31010/31000-DRAFT` עם מוטי → מיקום סופי.
2. **A2 · חקיקה** — אישור טבלת-37-נוסחים → הורדת ~35 מנבו → `courses/safety-officer/sources/legislation/` (לאתר 2.6.1 — עגורני-צריח, תקנות-עגורנאים 1992 תקנה 65).
3. ✅ **A3 · פרויקט-גמר** — הנחיות-המשרד שולבו ל-`FINAL-PROJECT.md` (8 נושאים · פורמט-JSA · מבנה-6-חלקים · מטריצת-4×4). נותר: מימוש capstone בקוד (שלב D).

## 🎨 DM · שער-עיצוב — בחירת-כיוון [חוסם את ה-UI של D/F/G · **מקבילי** למסלול-התוכן A/B] · [docs/design/](docs/design/)

> אינו תלוי בתוכן — אפשר להכריע במקביל ל-A/B. הבחירה פותחת את שכבת-ה-UI של D (נגן/quiz), F (Upload/Dashboard) ו-G (גיימיפיקציה).

- ✅ **DM1** — 3 תוכניות (A/B/C) + COMPARE + **5 דוגמאות-HTML מוחשיות** (`docs/design/mockups/` · A/B/C + B1/B2 · דשבורד+נגן-שיעור · RTL · נגישות-AA מאומתת · `index.html` להשוואה).
- ✅ **DM2** — **מוטי בחר B1** (Premium+רטנשן) + טיפול-קורסים מ-A ("ראה הכל →"). נעול: תוכן=ייבוא-T1 בתשלום · embedding=768/text-embedding-004 · timing=הבסיס-החוקי-היום.
- 🔄 **DM3** — החלת-B1 על האפליקציה (token-driven): `tailwind.config` (primary `#1B4FD6` · accent `#F5A623` · quiz-alias · soft-shadows) + Rubik (`layout`) + "ראה הכל" (`dashboard`). **[בביצוע — היום]**
- ⬜ **DM4** — החלת-B1 מלאה: נגן/quiz · F1 Upload-UI · F2 Dashboard · G גיימיפיקציה. (+ עדכון `ADR-007-brand-identity`.)

> **שיטת-עבודה (מוטי 2026-06-04):** commit+push + עדכון-לוג (SESSION-LOG) **אחרי כל תת-משימה** — שוטף במהלך ובסיום.

## 🟠 B · M5 — הרצת-ייבוא בנק-השאלות [חסום ע"י A + אישור-בנקים] · [📋 פירוט](docs/todo/B-m5-import.md)

4. **B1** — אישור `docs/M5-discovery-curation.md` (~19 בנקים) → הוספת File-IDs ל-`T1_FILE_IDS`.
5. **B2** — `import:t1:dry` (discovery כעת **71→19**, אומת; בנקים בתיקייה-אחת "שאלות ותשובות") → החלת migration `0002` מול ה-DB.
6. **B3** — `import:t1 --execute` → **~540 שאלות** + תיוג-Gemini Flash (hard-cap $5) → report ב-`logs/`.
7. **B4** — אימות: ספירה ב-DB · `/admin/questions` · `/lesson/practice` עם תוכן-אמת.

## 🟡 C · 3 ממצאי-M6 שנדחו (החלטות-מוטי) · [📋 פירוט](docs/todo/C-m6-deferred.md)

8. **C1** MatchingPairs grading (graded↔guided-practice) · **C2** מונה-Gemini fidelity · **C3** MCQ a11y roving-tabindex · **C4** התקנת `server-only` (P3 guard).

## ⬜ D · Phase 5 — השלמת Quiz Engine · [📋 פירוט](docs/todo/D-quiz-engine.md)

9. ✅ **D1 · `ScenarioWalkthrough`** (רכיב+POC+7-טסטים · `69d6f9a`) · ✅ **D2 · `ExplanationCard`** (active-recall + Claude-eval + keyword-match fallback · ADR-017 · `b962a75`). נותר: חיווט eval-API (D4) + lesson-loop.
10. 🔄 **D3** — תרגול `/lesson/[id]` קיים · ⬜ `/lesson/exam` (mock-exam 30 + טיימר) **טרם**.
11. **D4** APIs: next-question · attempts · evaluate-scenario (Gemini rubric) · deep-explanation (RAG).
12. **D5** טסטים לרכיבים החדשים · **D6** Spaced-Repetition (SM-2) + stats לפי-נושא.

> תבנית-ייחוס: `src/features/lesson-player/components/MatchingPairs.tsx`.

## ⬜ E · Phase 4 — השלמת RAG + מקורות-תוכן · [📋 פירוט](docs/todo/E-rag.md)

13. **E1** `chunker` + `embedder` (pgvector) ל-"הסבר לעומק" — **שלד נבנה בריצת-לילה** (`src/lib/rag/`, לוגיקה-טהורה · DI). נותר: wiring ל-pgvector + **הרצת-embeddings בפועל** (💲 אישור-מוטי + יישור-מימדים `vector(1024)`→Gemini).
14. **E2 · הטמעת חומרי-חזרה (Drive "סיכומים וחזרות")** — קריאת 4 הקבצים (`חזרה-לוועדה` ~150עמ' · `דגשים` · `סיכום-אחרון` · `מצגת-שאדי`) → **reference name-clean** ב-`courses/safety-officer/revision-materials/` (T2/T3) → הזנה ל-RAG/מורה-AI + **סיגנל-דגש** (מה הוועדה מדגישה) ל-quiz-generation + **cross-check כיסוי** מול 57-scope (`coverage-auditor`). ⚠️ **מצגת-"שאדי" = name-clean/reference-בלבד** (כלל-זכויות + firewall · אישור-מוטי). רישום ב-`CONTENT-INDEX`. (זיכרון `drive-revision-folder-vaada`.) 🚩 **דורש-מוטי:** תזמון (עכשיו / עם-E) + הכרעת-שאדי.

## ⬜ F · פלטפורמת-היצירה (creator end-to-end) · [📋 פירוט](docs/todo/F-upload-dashboard.md)

14. **F1 · Phase 3** Upload UI (`/create/*`) — מוטי מעלה מקורות → מפעיל pipeline מה-UI.
15. **F2 · Phase 2** persistence אמיתי ל-Dashboard (החלפת mock-data).

## ⬜ G · גיימיפיקציה ומדיה · [📋 פירוט](docs/todo/G-gamification-tts.md)

16. **G1 · Phase 6** gamification (XP/streak/practice-log) · **G2 · Phase 7** Hebrew-TTS על "הסבר לעומק" (קול-אחד→4).

## ⬜ H · Course-as-Product (Phase 10 / ADR-006) · [📋 פירוט](docs/todo/H-course-product.md)

17. **H1** landing · **H2** checkout+payment (ADR-008)+Phase 8 credits · **H3** ads/marketing · **H4** מגן = **port-permitted** (firewall בוטל 2026-06-09) · פורט פרומפט-המאסטר **name-cleaned** · megen מבודד · ADR-009 (תיקון 06-09).

> **🔓 מגן — port-permitted (עודכן 2026-06-09 · ה-firewall בוטל):** ריפו-מגן (`github.com/Moti316/megen`) — **מותר לפורט את פרומפט-המאסטר** (לחיבור-תרחישי-וועדה / סימולציה), **name-cleaned** (להסיר "מגן"/"שגיא"/Telegram/מזהי-בעלים · לשמור 4-עקרונות · Zero-Harm · common-pitfalls · 3-מצבי-תשובה). מוטי בעל-שני-הריפו → **אפס-licensing**. megen **מבודד** (clone לתיקייה-סמוכה · read-only · רק **תוכן-פרומפט** · לא מנוע-ה-Python). שימוש: NotebookLM מעגן חוק/תקנה → פרומפט-מגן מחבר (Gemini-API · offline). ⛔ ~~כלל-מגן (firewall) — השראה-בלבד · אסור-להעתיק · HYBRID~~ (בוטל). ראה `docs/architecture/ADR-009-magen-integration.md` (תיקון 2026-06-09).

## ⬜ I · ציות ומוכנות-לאנץ' (Phase 9-10, לא-חוסם v1) · [📋 פירוט](docs/todo/I-compliance-launch.md)

18. נגישות (5568/WCAG AA + הצהרה) · פרטיות (תיקון 13) · הגנת-צרכן (ביטול 14 יום) · תשלומים (PCI/חשבונית). task-force: `docs/compliance/COMPLIANCE.md` (C1–C6).

## ⏰ מתוזמן

- **10/2026** — בדיקת רפורמות תשפ"ה-2025 (`courses/safety-officer/REGULATORY-WATCH.md`).

## 💡 עתידי (ראה `docs/IDEAS.md`)

- סקירת-gstack (adopt/skip list, ללא התקנה) · **Agent-OS starter-kit כ-Skill ✅** (מומש — `.claude/skills/agent-os/`) · דשבורד-סוכנים (playground).
