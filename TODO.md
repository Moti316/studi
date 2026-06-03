# TODO — StudiBuilder · רשימת-משימות חיה

> **מקור-אמת יחיד למשימות.** מסונכרן ב-git (כל מחשב), נטען אוטומטית בכל סשן (SessionStart hook),
> ומשתקף ב-TodoWrite בתוך הסשן. סימון: ✅ הושלם · 🔄 בתהליך · ⬜ פתוח · 🔴 חוסם · ⏰ מתוזמן.
> **מסודר לפי [EXECUTION-PLAN.md](docs/context/EXECUTION-PLAN.md)** (סדר-תלויות). מעודכן: 2026-06-03 (ממשל-v2 — סכמת-TODO מורחבת).
> 📂 **פירוט תתי-משימות פר-שלב:** [docs/todo/](docs/todo/README.md) — כל שלב A–I בקובץ נפרד (קריטריוני-קבלה + מסמכי-ייחוס).
> 📊 **פירוט-מורחב** (⏱זמן · 🤖סוכנים · 💲עלות · 🟢🟡🔴סיכון · ראש-צוות · 🚩דורש-מוטי · אימות) פר תת-משימה ב-[docs/todo/](docs/todo/README.md) — הסכמה+מקרא ב-README. (ממשל-v2 / תוצר-3.)

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

- **🌙 ריצת-לילה 2026-06-04** — **אינדקס-MD חכם** ([`MD-INDEX.md`](docs/context/MD-INDEX.md) + מחולל אוטומטי · קבצי-חובה נעוצים · ניווט-מהיר · איתור-יתומים · אוטו-רענון) + תיבת-הערות [`MOTI-INBOX.md`](docs/context/MOTI-INBOX.md) · **3 תוכניות-עיצוב** ([`docs/design/`](docs/design/) A/B/C + COMPARE · Workflow · StudiesGo) → 🚩 **דורש בחירת-מוטי**.
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

## 🟠 B · M5 — הרצת-ייבוא בנק-השאלות [חסום ע"י A + אישור-בנקים] · [📋 פירוט](docs/todo/B-m5-import.md)

4. **B1** — אישור `docs/M5-discovery-curation.md` (~19 בנקים) → הוספת File-IDs ל-`T1_FILE_IDS`.
5. **B2** — `import:t1:dry` (discovery כעת **71→19**, אומת; בנקים בתיקייה-אחת "שאלות ותשובות") → החלת migration `0002` מול ה-DB.
6. **B3** — `import:t1 --execute` → **~540 שאלות** + תיוג-Gemini Flash (hard-cap $5) → report ב-`logs/`.
7. **B4** — אימות: ספירה ב-DB · `/admin/questions` · `/lesson/practice` עם תוכן-אמת.

## 🟡 C · 3 ממצאי-M6 שנדחו (החלטות-מוטי) · [📋 פירוט](docs/todo/C-m6-deferred.md)

8. **C1** MatchingPairs grading (graded↔guided-practice) · **C2** מונה-Gemini fidelity · **C3** MCQ a11y roving-tabindex · **C4** התקנת `server-only` (P3 guard).

## ⬜ D · Phase 5 — השלמת Quiz Engine · [📋 פירוט](docs/todo/D-quiz-engine.md)

9. 🔄 **D1 · `ScenarioWalkthrough`** ✅ רכיב+POC+7-טסטים (`69d6f9a`; נותר D4-eval + lesson-loop) · **D2** `ExplanationCard`.
10. **D3** routes `/lesson/practice` + `/lesson/exam` (mock-exam 30, טיימר).
11. **D4** APIs: next-question · attempts · evaluate-scenario (Gemini rubric) · deep-explanation (RAG).
12. **D5** טסטים לרכיבים החדשים · **D6** Spaced-Repetition (SM-2) + stats לפי-נושא.

> תבנית-ייחוס: `src/features/lesson-player/components/MatchingPairs.tsx`.

## ⬜ E · Phase 4 — השלמת RAG · [📋 פירוט](docs/todo/E-rag.md)

13. **E1** `chunker` + `embedder` (pgvector) ל-"הסבר לעומק" — טרם נכתב.

## ⬜ F · פלטפורמת-היצירה (creator end-to-end) · [📋 פירוט](docs/todo/F-upload-dashboard.md)

14. **F1 · Phase 3** Upload UI (`/create/*`) — מוטי מעלה מקורות → מפעיל pipeline מה-UI.
15. **F2 · Phase 2** persistence אמיתי ל-Dashboard (החלפת mock-data).

## ⬜ G · גיימיפיקציה ומדיה · [📋 פירוט](docs/todo/G-gamification-tts.md)

16. **G1 · Phase 6** gamification (XP/streak/practice-log) · **G2 · Phase 7** Hebrew-TTS על "הסבר לעומק" (קול-אחד→4).

## ⬜ H · Course-as-Product (Phase 10 / ADR-006) · [📋 פירוט](docs/todo/H-course-product.md)

17. **H1** landing · **H2** checkout+payment (ADR-008)+Phase 8 credits · **H3** ads/marketing · **H4** מגן = **השראה-בלבד (firewall)** · פרסונה ב-**HYBRID** (חילוץ-מבנה→native→parity מול committee_bank) · **לא** verbatim-copy · ADR-009 תוקן.

> **🔒 כלל-מגן (firewall) — השראה-בלבד:** ריפו-מגן (`github.com/Moti316/megen` · איתן+שגיא) = **השראה/reference בלבד** למבנה/תכנון (תרחישים פר-ענף · `study_plan_90days` · committee_bank · 4-עקרונות-הוועדה). **אסור להעתיק/לקחת** קוד · תוכן · prompts. **לעולם לא מתערבב** עם ריפו-StudiBuilder (קריאה → תיקייה נפרדת בלבד). נדרשת פרסונה? **HYBRID** — מחלצים את המבנה-המוכח כ-spec, כותבים **native** (name-clean·RAG·cache·ציטוט), מאמתים **parity** מול committee_bank. **ללא copy/coupling.** ספק → מוטי. (גובר על ADR-009 Phase B — העתקה-verbatim מבוטלת.)

## ⬜ I · ציות ומוכנות-לאנץ' (Phase 9-10, לא-חוסם v1) · [📋 פירוט](docs/todo/I-compliance-launch.md)

18. נגישות (5568/WCAG AA + הצהרה) · פרטיות (תיקון 13) · הגנת-צרכן (ביטול 14 יום) · תשלומים (PCI/חשבונית). task-force: `docs/compliance/COMPLIANCE.md` (C1–C6).

## ⏰ מתוזמן

- **10/2026** — בדיקת רפורמות תשפ"ה-2025 (`courses/safety-officer/REGULATORY-WATCH.md`).

## 💡 עתידי (ראה `docs/IDEAS.md`)

- סקירת-gstack (adopt/skip list, ללא התקנה) · **Agent-OS starter-kit כ-Skill ✅** (מומש — `.claude/skills/agent-os/`) · דשבורד-סוכנים (playground).
