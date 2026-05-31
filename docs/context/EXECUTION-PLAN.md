# EXECUTION-PLAN — התוכנית המאוחדת בפועל

> **התוכנית האחת והאוטוריטטיבית.** מאחדת את build-roadmap (10 phases), ADR-006 (Course-as-Product Factory),
> ואת המצב-בפועל (implementation-gaps). גוברת על מסמכי-התכנון הישנים (build-roadmap / mvp-plan).
> מעודכן: 2026-05-31 · אבן-דרך ראשונה (קורס-הוועדה): **2026-07-15**.

## מטרה — build end-to-end (בלי דחיות)

StudiBuilder נבנה **מקצה-לקצה** כפלטפורמת-ייצור-קורסים מלאה. **אין** scope-cut ל-"Quiz Engine בלבד".
שני התוצרים:

1. **הפלטפורמה הראשית לייצור קורסים** — creator-gated: **רק מוטי** מייצר קורסים (single-creator/admin).
   כוללת את כל הצינור end-to-end: ייבוא-תוכן → RAG → יצירת-שאלות → Quiz Engine (5 types) →
   gamification → פרסום כמוצר.
2. **קורס "ממונה בטיחות"** — מיוצר דרך הפלטפורמה, ומשרת שתי מטרות במקביל:
   - **לימוד אישי** של מוטי לקראת הוועדה (אבן-דרך: 2026-07-15).
   - **מוצר לשיווק** — landing + checkout + פרסום (ADR-006 Course-as-Product Factory).

תאריך-הוועדה הוא **אבן-דרך לקורס-הראשון** — לא סיבה לקצץ את הפלטפורמה.
מגן (Telegram + NotebookLM) נשאר ככלי-לימוד-חי **משלים** של מוטי, אך אינו מחליף את בניית-הפלטפורמה.

## ה-Roadmap המלא (10 phases) — הכל in-scope

| Phase | תיאור                     | סטטוס         | הערה                                         |
| ----- | ------------------------- | ------------- | -------------------------------------------- |
| 0     | Foundation                | ✅            | —                                            |
| 1     | Auth & Profile            | ✅            | בפרודקשן                                     |
| 2     | Dashboard                 | 🟡 חלקי       | UI+mock → להוסיף persistence                 |
| 3     | Upload UI (creator)       | ⬜ בתוכנית    | כלי-היצירה של מוטי (creator-gated)           |
| 4     | Course Pipeline           | 🎯 בבנייה     | parsers ✅; **import pipeline חסר**          |
| 5     | Quiz Engine (5 types)     | 🎯 1/5        | MatchingPairs ✅; **לב חוויית-הלימוד**       |
| 6     | Gamification              | ⬜ בתוכנית    | XP/streak/practice-log                       |
| 7     | TTS (קולות עברית)         | ⬜ בתוכנית    | —                                            |
| 8     | Credits                   | ⬜ בתוכנית    | למוצר המסחרי                                 |
| 9     | Polish & Launch           | ⬜ בתוכנית    | —                                            |
| 10    | Course-as-Product Factory | ⬜ בתוכנית 🎯 | **מטרה מפורשת** — landing+checkout+ads לקורס |

🎯 = מוקד מיידי לקורס-הוועדה. שאר ה-phases נבנים end-to-end לפי סדר-התלויות — **לא נדחים**.

## מסלול-הביצוע (לפי סדר תלויות)

### שלב 0 — תשתית + ניקוי (הסשן הנוכחי)

- ✅ context architecture (`docs/context/`).
- ✅ `.env.local` הוקם במחשב הנוכחי (Supabase+Drive+`GEMINI_API_KEY` — מוגדרים ומאומתים).
- ⬜ ניקוי git: מחיקת 4 ענפים מיותרים.
- ✅ **וידאו: נשאר ב-repo/git** (החלטת מוטי 2026-05-31 — מבטל את ההחלטה הקודמת להוציאו).
- ℹ️ חוסם git-bash **לא קיים במחשב הנוכחי** (husky לא מוגדר) — commit/push עובדים.

### שלב 1 — Content Import (ADR-011) — חוסם את שאר הצינור

דורש: `GEMINI_API_KEY` (יצירה+סיווג+embeddings), ובניית ~6 קבצים שלא קיימים:

- `scripts/import-content.ts` (אורקסטרטור) + פקודות `import:t1`/`import:full`.
- `src/lib/import/{chunker,scope-tagger,embedder,report}.ts`.
- ייבוא T1 (18 קבצי-שאלות) → טבלת `questions`; scope-tagging ידני ב-MVP (ADR-011 §Phase-1).
- מקור-התוכן: Google Drive (2 תיקיות — `mainCourse` + `legacy`, מוגדרות ב-`src/lib/drive/client.ts`).

### שלב 2 — Quiz Engine (Phase 5) — לב חוויית-הלימוד

- 4 הסוגים החסרים: `MCQLong`, `MCQShort`, `ExplanationCard`, **`ScenarioWalkthrough`** (type-5, קריטי — הוועדה scenario-based).
- routes `/lesson/[id]` + `/lesson/practice` + `/lesson/exam` (mock-exam 30 שאלות, טיימר).
- API: next-question, attempts, evaluate-scenario (Claude rubric), deep-explanation (RAG).
- תבנית-ייחוס: `src/features/lesson-player/components/MatchingPairs.tsx`.

### שלב 3 — השלמת פלטפורמת-היצירה (creator end-to-end)

- Phase 3 — Upload UI ל-creator (מוטי מעלה מקורות → מפעיל את ה-pipeline מתוך ה-UI).
- Phase 2 — persistence אמיתי ל-Dashboard (החלפת mock-data).
- Phase 6 — gamification (XP/streak/practice-log) · Phase 7 — Hebrew-TTS על "הסבר לעומק".

### שלב 4 — Course-as-Product (Phase 10 / ADR-006)

- landing-page + checkout (ADR-008 payment) + ads לקורס "ממונה בטיחות".
- אינטגרציית-מגן (ADR-009 Phase B, אם רלוונטי): personas (מגן/שגיא) + committee_bank.

## Definition of Done

- **פלטפורמה:** מוטי מייצר קורס end-to-end דרך ה-UI (ייבוא → שאלות → lessons → publish).
- **קורס-הוועדה (לימוד):** ≥5 mock-exams · ממוצע ≥85% · כל פריט ב-bank נחשף ≥3 פעמים.
- **קורס-הוועדה (מוצר):** landing + checkout פעילים לקורס-הראשון.
- מגן ללא regression · 0 P1 bugs.

## תלויות-מפתח

מפתח Gemini → import pipeline → Quiz Engine + תוכן-אמיתי → mock-exams + פרסום-כמוצר.
