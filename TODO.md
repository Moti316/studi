# TODO — StudiBuilder · רשימת-משימות חיה

> **מקור-אמת יחיד למשימות.** מסונכרן ב-git (כל מחשב), נטען אוטומטית בכל סשן (SessionStart hook),
> ומשתקף ב-TodoWrite בתוך הסשן. סימון: ✅ הושלם · 🔄 בתהליך · ⬜ פתוח · 🔴 חוסם · ⏰ מתוזמן.
> **מסודר לפי [EXECUTION-PLAN.md](docs/context/EXECUTION-PLAN.md)** (סדר-תלויות). מעודכן: 2026-06-02 (בוקר — דו-שכבתי).
> 📂 **פירוט תתי-משימות פר-שלב:** [docs/todo/](docs/todo/README.md) — כל שלב A–I בקובץ נפרד (קריטריוני-קבלה + מסמכי-ייחוס).

## ✅ הושלם (מאומת מול הקוד)

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

17. **H1** landing · **H2** checkout+payment (ADR-008)+Phase 8 credits · **H3** ads/marketing · **H4** אינטגרציית-מגן (ADR-009 Phase B, אם רלוונטי).

## ⬜ I · ציות ומוכנות-לאנץ' (Phase 9-10, לא-חוסם v1) · [📋 פירוט](docs/todo/I-compliance-launch.md)

18. נגישות (5568/WCAG AA + הצהרה) · פרטיות (תיקון 13) · הגנת-צרכן (ביטול 14 יום) · תשלומים (PCI/חשבונית). task-force: `docs/compliance/COMPLIANCE.md` (C1–C6).

## ⏰ מתוזמן

- **10/2026** — בדיקת רפורמות תשפ"ה-2025 (`courses/safety-officer/REGULATORY-WATCH.md`).

## 💡 עתידי (ראה `docs/IDEAS.md`)

- סקירת-gstack (adopt/skip list, ללא התקנה) · Agent-OS starter-kit כ-Skill · דשבורד-סוכנים (playground).
