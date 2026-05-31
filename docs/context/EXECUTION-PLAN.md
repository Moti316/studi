# EXECUTION-PLAN — התוכנית המאוחדת בפועל

> **התוכנית האחת והאוטוריטטיבית.** מאחדת את build-roadmap (10 phases), קיצוצי-ה-MVP
> (mvp-plan-2026-07-15), והמצב-בפועל (implementation-gaps). גובר על מסמכי-התכנון הישנים.
> מעודכן: 2026-05-31 · deadline ועדה: **2026-07-15**.

## אסטרטגיה (שני מסלולים)

- **Stream A — לימוד לוועדה:** דרך **מגן** (Telegram + NotebookLM). עובד היום, אסור לפרק. זה ה-priority האמיתי עד 2026-07-15.
- **Stream B — StudiBuilder:** carve-out צר — **רק Quiz Engine** שמריץ את בנק-שאלות-הוועדה על desktop. Phase 3/4/6-10 דחויים אחרי הוועדה.
- **קו-אדום:** אם StudiBuilder גוזל זמן-לימוד נטו → קופאים ל-100% מגן.

## ה-Roadmap המלא (10 phases) — סטטוס אמיתי

| Phase | תיאור                     | סטטוס   | הערה                                     |
| ----- | ------------------------- | ------- | ---------------------------------------- |
| 0     | Foundation                | ✅      | —                                        |
| 1     | Auth & Profile            | ✅      | בפרודקשן                                 |
| 2     | Dashboard skeleton        | 🟡      | UI+mock; persistence נדחה                |
| 3     | Upload UI                 | ⏸️ דחוי | מוטי הוא ה-creator; לא צריך wizard ל-MVP |
| 4     | Course Pipeline           | 🎯 חלקי | parsers ✅; **import pipeline חסר**      |
| 5     | Quiz Engine (5 types)     | 🎯 1/5  | **לב ה-MVP**                             |
| 6     | Gamification              | ⏸️      | scope-cut ל-practice-log                 |
| 7     | TTS                       | ⏸️      | קול-אחד ל-S3 בלבד                        |
| 8     | Credits                   | ⏸️      | אין paying users                         |
| 9     | Polish & Launch           | ⏸️      | internal-tool                            |
| 10    | Course-as-Product Factory | ⏸️      | post-deadline                            |

🎯 = המוקד לוועדה.

## מסלול-הביצוע בפועל (לפי סדר)

### שלב 0 — תשתית-הקשר + ניקוי (הסשן הנוכחי)

- ✅ context architecture (`docs/context/`).
- ⏳ ניקוי git (4 ענפים, וידאו) — **חסום ע"י git-bash** (ראה STATUS/BUGS).

### שלב 1 — Content Import (Drive → Supabase) ‖ ADR-011

**חוסם את כל השאר.** דורש: `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY`, ובניית ~6 קבצים שלא קיימים:

- `scripts/import-content.ts` (אורקסטרטור) + פקודות `import:t1/full`
- `src/lib/import/{chunker,scope-tagger,embedder,report}.ts`
- T1 ראשון (18 קבצי-שאלות) → טבלת `questions`; scope-tagging ידני ב-MVP (ADR-011 §Phase-1).

### שלב 2 — Quiz Engine (Phase 5) ‖ לב ה-MVP

- 4 הסוגים החסרים: `MCQLong`, `MCQShort`, `ExplanationCard`, **`ScenarioWalkthrough`** (type-5, קריטי — הוועדה scenario-based).
- route `/lesson/[id]` + `/lesson/practice` + `/lesson/exam` (mock-exam 30 שאלות, טיימר).
- API: next-question, attempts, evaluate-scenario (Claude rubric), deep-explanation (RAG).
- תבנית-ייחוס: `src/features/lesson-player/components/MatchingPairs.tsx`.

### שלב 3 — Should-have (אם זמן, 4+ שעות/יום)

- Spaced-Repetition (SM-2; שדות כבר ב-schema) · Stats לפי-נושא · Hebrew-TTS על "הסבר לעומק" (קול-אחד).

### שלב 4+ — Freeze מ-~2026-07-03

- קוד-קפוא, רק תרגול ו-mock-exams. שום פיצ'ר חדש.

## Definition of Done (לוועדה)

- ≥5 mock-exams ב-StudiBuilder, ממוצע ≥85%.
- כל פריט ב-bank נחשף ≥3 פעמים.
- מגן ללא regression.
- 0 P1 bugs.

## תלויות-מפתח

מפתחות Anthropic+Voyage → import pipeline → Quiz Engine עם תוכן-אמיתי → mock-exams.
git-bash שבור חוסם commit/push — לפתור לפני עבודת-פיתוח רציפה.
