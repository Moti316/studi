# TODO · F — creator end-to-end — Upload UI + persistence

> שלב F ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: ⬜ פתוח · תלות: F1 מפעיל את צינור-הייבוא מה-UI · F2 מחליף mock-data · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

מוטי (creator) מסיים מסלול-יצירה מלא מתוך הדפדפן: מעלה מקור → מאשר נושא → בוחר עמודים → מאשר עלות → רואה עיבוד-live, וה-Dashboard מציג את הקורס שנוצר מנתוני-DB אמיתיים (לא mock). "סיום" = אשף 5-השלבים (`/create/*`) מריץ את צינור-הייבוא end-to-end עם draft נשמר-ומתאושש, וה-Dashboard קורא counters וקורסים מ-Supabase במקום מ-mock-data.

## תלויות

**חוסם את F:** קיום צינור-הייבוא (Phase 4 — parse→chunk→embed→topic→lessons→questions) וטבלאות `course_drafts`/`course_files`/`course_progress` ב-DB. **F פותח:** Phase 5 (נגן-שיעור על קורס-אמיתי), Phase 6 (gamification על counters אמיתיים), Phase 8 (credits — Step-4 כבר מצייר את ה-hold/commit). F1 (אשף) ו-F2 (persistence) משתלבים: Step-5 כותב קורס שה-Dashboard ב-F2 קורא.

## תתי-משימות

- [ ] **F1** — Upload UI ל-creator: אשף 5-שלבים `/create/*` (source→topic→select→confirm→process) · קריטריון-קבלה: (1) Step-1 — drag-drop + multiple-files + validation format/size (≤50MB; PDF/Word/PPT/Excel/תמונות) + toggle קבצים/טקסט, draft נשמר ב-`course_drafts`+`course_files` וחזרה-לאחר-סגירה ממשיכה מאותו-מצב; (2) Step-2 — זיהוי-נושא דרך Inngest+Realtime (`course_draft:{id}`), confidence<70%=warning, אפס-נושא=הודעת-retry; (3) Step-3 — `PageGrid` עם virtual-scroll טוען ≥570 פריטים תוך ≤2s, toggle-בחירה + preview-modal, בחירה persisted ל-draft; (4) Step-4 — `CostBreakdown` מתעדכן בזמן-אמת מ-toggle "צירוף-מקור", not-enough-credits חוסם יצירה, "צור" → enqueue course-build → Step-5; (5) Step-5 — `PipelineSteps` (5 שלבים) מתעדכן ≤2s אחרי-emit דרך Realtime (`course:{id}`), idempotent ל-refresh, error-בשלב=alert+retry · ref: [create-1-source](../screens-spec/create-1-source.md) · [create-2-topic](../screens-spec/create-2-topic.md) · [create-3-select](../screens-spec/create-3-select.md) · [create-4-confirm](../screens-spec/create-4-confirm.md) · [create-5-process](../screens-spec/create-5-process.md)
  - 📊 **מטא:** ⏱8h · 🤖3(frontend-engineer, interaction-designer, backend-engineer) · 💲$0 · 🟡 · ראש-צוות:builder-lead · — · אימות:Workflow
- [ ] **F2** — persistence אמיתי ל-Dashboard (החלפת mock-data) · קריטריון-קבלה: (1) header-counters (credits/XP/streak) ו-grid-הקורסים נקראים מ-Supabase (`users`,`credits`,`attempts`,`streaks`,`lessons_completed`) במקום מ-mock (כיום credits=1500 קבוע); (2) שני-המצבים — first-time (אין-קורסים) ו-with-courses (grid מקורסים-שנוצרו ב-F1) — מונעים מ-state-אמיתי; (3) counters מתעדכנים live דרך Supabase Realtime; (4) greeting לפי-שעה + streak נשבר ב-00:00 (Asia/Jerusalem) · ref: [dashboard](../screens-spec/dashboard.md) · [build-roadmap](../build-roadmap.md)
  - 📊 **מטא:** ⏱4h · 🤖2(frontend-engineer, data-engineer) · 💲$0 · 🟢 · ראש-צוות:builder-lead · — · אימות:Workflow

## מסמכי-ייחוס (קרא לפני עבודה)

- [create-1-source.md](../screens-spec/create-1-source.md) — Step-1 source-picker: states, FileDropzone, `course_drafts`/`course_files`, acceptance (draft-resume).
- [create-2-topic.md](../screens-spec/create-2-topic.md) — Step-2 topic-detection: Inngest+Realtime `course_draft:{id}`, confidence-thresholds.
- [create-3-select.md](../screens-spec/create-3-select.md) — Step-3 page-selector: `PageGrid` virtual-scroll, 570-items≤2s, select-persist.
- [create-4-confirm.md](../screens-spec/create-4-confirm.md) — Step-4 confirm-cost: `CostBreakdown`, hold/commit, enqueue course-build.
- [create-5-process.md](../screens-spec/create-5-process.md) — Step-5 processing: 5-stage `PipelineSteps`, Realtime `course:{id}`, idempotent-refresh.
- [dashboard.md](../screens-spec/dashboard.md) — שלד-Dashboard: data-dependencies (DB queries), first-time/with-courses, counters-live.
- [build-roadmap.md](../build-roadmap.md) — Phase 2 (Dashboard skeleton) ו-Phase 3 (Upload UI) + Gates A–G.

## החלטות פתוחות / הערות

- credits אמיתיים הם Phase 8 — ב-F נשמר ה-flow (hold/commit ב-Step-4) אך היתרה עשויה להישאר mock עד Phase 8 (לאמת מול EXECUTION-PLAN).
- topic-detection מסומן ב-spec כ-Claude Haiku; ה-stack-הקנוני הוא Gemini Flash לסיווג — לאמת מול CLAUDE.md/`src/lib/ai/` ולהתאים את ה-spec.
