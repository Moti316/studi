# EXECUTION-PLAN — התוכנית המאוחדת בפועל

> **התוכנית האחת והאוטוריטטיבית.** מאחדת את build-roadmap (10 phases), ADR-006 (Course-as-Product Factory),
> ואת המצב-בפועל (implementation-gaps). גוברת על מסמכי-התכנון הישנים (build-roadmap / mvp-plan).
> מעודכן: 2026-06-02 (יישור-קו אחרי מיזוג v1, `main=93f6d79`) · אבן-דרך ראשונה (קורס-הוועדה): **2026-07-15**.

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

| Phase | תיאור                     | סטטוס         | הערה                                                                                     |
| ----- | ------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| 0     | Foundation                | ✅            | —                                                                                        |
| 1     | Auth & Profile            | ✅            | בפרודקשן                                                                                 |
| 2     | Dashboard                 | 🟡 חלקי       | UI+mock → להוסיף persistence                                                             |
| 3     | Upload UI (creator)       | ⬜ בתוכנית    | כלי-היצירה של מוטי (creator-gated)                                                       |
| 4     | Course Pipeline           | 🟡 חלקי       | צינור-ייבוא-שאלות T1 ✅; RAG chunker/embedder חסר                                        |
| 5     | Quiz Engine (5 types)     | 🟡 ~3/5       | MatchingPairs+MCQShort+MCQLong+נגן+`/lesson/[id]` ✅; חסר סימולציית-וועדה (ADR-016)/exam |
| 6     | Gamification              | ⬜ בתוכנית    | XP/streak/practice-log                                                                   |
| 7     | TTS (קולות עברית)         | ⬜ בתוכנית    | —                                                                                        |
| 8     | Credits                   | ⬜ בתוכנית    | למוצר המסחרי                                                                             |
| 9     | Polish & Launch           | ⬜ בתוכנית    | —                                                                                        |
| 10    | Course-as-Product Factory | ⬜ בתוכנית 🎯 | **מטרה מפורשת** — landing+checkout+ads לקורס                                             |

🎯 = מוקד מיידי לקורס-הוועדה. שאר ה-phases נבנים end-to-end לפי סדר-התלויות — **לא נדחים**.

## מסלול-הביצוע (לפי סדר תלויות)

### שלב 0 — תשתית + ניקוי (הסשן הנוכחי)

- ✅ context architecture (`docs/context/`).
- ✅ `.env.local` הוקם במחשב הנוכחי (Supabase+Drive+`GEMINI_API_KEY` — מוגדרים ומאומתים).
- ⬜ ניקוי git: מחיקת 4 ענפים מיותרים.
- ✅ **וידאו: נשאר ב-repo/git** (החלטת מוטי 2026-05-31 — מבטל את ההחלטה הקודמת להוציאו).
- ℹ️ חוסם git-bash **לא קיים במחשב הנוכחי** (husky לא מוגדר) — commit/push עובדים.

### שלב 1 — Content Import (ADR-011) — ✅ צינור בנוי; נותרה הרצה (M5)

- ✅ `scripts/import-content.ts` (אורקסטרטור) + `import-content.config.ts` + פקודות `import:t1` / `import:t1:dry`.
- ✅ `src/lib/import/{scope-tagger,map-question,upsert-questions}.ts` (idempotent, default-deny, hard-cap $5).
- 🔴 **M5 — הרצת-ייבוא בפועל** (`--execute`): חסום — discovery רחב-מדי (dry-run מצא 69 קבצים, לצמצם ל-allow-list) + תלוי אישורי מוטי 1→3.
- ⬜ **RAG (טרם נכתב):** `chunker`/`embedder` (pgvector) ל-"הסבר לעומק" — הצינור הנוכחי = ייבוא בנק-שאלות מוכן, לא RAG-chunking.
- מקור-התוכן: Google Drive — **תיקייה אחת מאוחדת** "ממונה בטיחות 2025" עם תת-תיקיות (`DRIVE_FOLDERS` ב-`src/lib/drive/client.ts`; ארגון-מחדש 2026-06-02). בנקי-T1 מרוכזים ב-"שאלות ותשובות".
- ⬜ **חומרי-חזרה (T2/T3) — תיקיית Drive "סיכומים וחזרות"** (`חזרה-לוועדה` ~150עמ' · `דגשים` · `סיכום-אחרון` · `מצגת-שאדי`): מקור ל-RAG/מורה-AI + **סיגנל-דגש** (מה הוועדה מדגישה) ל-quiz-generation + cross-check כיסוי. ⚠️ name-clean (מצגת-שאדי=reference-בלבד). ראה TODO §E2 + זיכרון `drive-revision-folder-vaada`.

### שלב 1.5 — שער-עיצוב (מקבילי לתוכן; חוסם UI)

- 3 כיווני-עיצוב (A/B/C) + COMPARE + **5 דוגמאות-HTML מוחשיות** (`docs/design/mockups/`, A/B/C + B1/B2). 🚩 **בחירת-כיוון מוטי** (נוטה ל-B) → עיגון design-system/tokens (`ADR-007`) → החלה על UI של Quiz Engine, Upload ו-Dashboard. **אינו תלוי בתוכן** — מתבצע במקביל ל-שלב 1. ראה TODO §DM.

### שלב 2 — Quiz Engine (Phase 5) — ליבה בנויה; נותרו סימולציית-וועדה + מצבים

- ✅ קיים: `MCQLong`, `MCQShort`, `McqQuestion`, `LessonPlayer`, `LessonHeader`, route `/lesson/[id]`, admin `/admin/questions`.
- ⬜ חסר: `ExplanationCard`, **סימולציית-וועדה אינטראקטיבית** (ADR-016 · 3 מפקחים · 4 שלבים opening→branch→law→cruel · ציון 0-100 · מנוע hybrid פרה-בנוי→LiveEngine — מחליפה את ה-`ScenarioWalkthrough` הסטטי של ADR-014; `src/features/simulation/types.ts`).
- ⬜ routes `/lesson/practice` + `/lesson/exam` (mock-exam 30 שאלות, טיימר).
- ⬜ API: next-question, attempts, ציון-סימולציה דטרמיניסטי (פרה-בנוי · אפס-Gemini · authoring דרך Workflow רב-סוכני של Claude), deep-explanation (RAG).
- מקור-השאלות: בנק-NotebookLM רב-סוגי (~500 · mcq/matching/open מקורפוס-החקיקה · status=מוסקנא · אפס-Gemini) — מחליף את בנק-qa הישן (~540).
- תבנית-ייחוס: `src/features/lesson-player/components/MatchingPairs.tsx`.

### שלב 3 — השלמת פלטפורמת-היצירה (creator end-to-end)

- Phase 3 — Upload UI ל-creator (מוטי מעלה מקורות → מפעיל את ה-pipeline מתוך ה-UI).
- Phase 2 — persistence אמיתי ל-Dashboard (החלפת mock-data).
- Phase 6 — gamification (XP/streak/practice-log) · Phase 7 — Hebrew-TTS על "הסבר לעומק".

### שלב 4 — Course-as-Product (Phase 10 / ADR-006)

- landing-page + checkout (ADR-008 payment) + ads לקורס "ממונה בטיחות".
- אינטגרציית-מגן (ADR-009, תוקן 2026-06-09 — firewall בוטל, **port-מותר**): פורט פרומפט-המאסטר (חיבור-תרחישים/סימולציה) ל-StudiBuilder name-cleaned (להסיר מגן/שגיא/Telegram · לשמור 4-עקרונות · Zero-Harm · 3-מצבי-תשובה) + committee_bank כ-parity. megen נשאר מבודד (clone-סמוך · read-only · תוכן-פרומפט בלבד). ראה ADR-009.

### שלב 5 — ציות ומוכנות-לאנץ' (Phase 9-10, pre-launch — לא חוסם v1)

חובות-ציות חלות על **כל השירות לציבור**, לא רק דף-המכירה. נגישות (ת"י 5568/WCAG AA + הצהרת-נגישות) · פרטיות (מדיניות + תיקון 13) · הגנת-צרכן (ביטול 14 יום + גילוי) · תשלומים (PCI/חשבונית). פירוט מלא + task-force (privacy-officer מוביל) + משימות C1–C6: [`docs/compliance/COMPLIANCE.md`](../compliance/COMPLIANCE.md). ⚖️ בדיקה משפטית לפני מכירה.

## Definition of Done

- **פלטפורמה:** מוטי מייצר קורס end-to-end דרך ה-UI (ייבוא → שאלות → lessons → publish).
- **קורס-הוועדה (לימוד):** ≥5 mock-exams · ממוצע ≥85% · כל פריט ב-bank נחשף ≥3 פעמים.
- **קורס-הוועדה (מוצר):** landing + checkout פעילים לקורס-הראשון.
- מגן ללא regression · 0 P1 bugs.

## תלויות-מפתח

מפתח Gemini → import pipeline → Quiz Engine + תוכן-אמיתי → mock-exams + פרסום-כמוצר.
