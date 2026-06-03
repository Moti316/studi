# PROJECT-MAP — דלת-הכניסה להקשר StudiBuilder

> **קרא אותי ראשון בכל סשן.** אני האינדקס שמכוון לכל שאר קבצי-ההקשר.
> כל הקבצים כאן הם **מקור-אמת-יחיד, מסמכים-חיים**. מעודכן: 2026-06-02.

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

**תוכן ו-scope (לעבודת תוכן/ייבוא):**

10. `docs/content-scope.md` — 57 פריטי-חקיקה לוועדה (scope-IDs).
11. `docs/CONTENT-INDEX.md` — מפת-Drive ↔ תוכנית-לימודים ↔ כיסוי-scope (אינדקס מאוחד).
    11a. `docs/M5-discovery-curation.md` — קוריישן ה-discovery לפני הרצת-ייבוא (71→~19 בנקי-שאלות; ⏳ אישור-מוטי).

**קורס safety-officer (`courses/safety-officer/`):**

- `curriculum-atgar` (spine 11 פרקים) · `LEGISLATION-SOURCES` (37 חוקים+URLs · **A2: 39 נוסחים הורדו כ-`.md`**) · `LEGISLATION-COVERAGE` (48/7/2) · `MOLSA-PROGRAM` (תכנית-משרד) · `LEARNING-MATERIALS` · `UNREAD-MEDIA` · `ATTRIBUTION` · `COURSE-DESIGN` · `FINAL-PROJECT` (capstone) · `REGULATORY-WATCH` (⏰10/2026) · `ISO-31010/31000-DRAFT` (טיוטות).
- **`sources/legislation/`** — קורפוס-החקיקה: 42 נוסחי-נבו verbatim `.md` + **`INDEX.md`** (מפת-הקשרים מחוללת: scope↔PDF-Drive↔נבו↔עומק) + `README.md`. אומת 42/42 + מול תכנית-905018. PDF-מחייב ב-Drive "חוקים ותקנות"; 12 `source_complete:false` (תוכן-תמונה).
- `docs/PROJECT-STRUCTURE.md` — מבנה פלטפורמה↔קורס.

**צינור-ייבוא + כלי-חקיקה (`scripts/` + `src/lib/import/`):**

- `scripts/fetch-legislation.ts` (A2 — fetch+charset+strip+frontmatter+verify) · `scripts/legislation-manifest.ts` (39 מקורות) · `src/lib/import/strip-nevo-html.ts` (חילוץ דטרמיניסטי לא-גנרטיבי, L1 zero-loss) · `src/lib/import/verify-legislation.ts` (L1–L5). פקודות: `pnpm legislation:fetch[:dry]` · `legislation:verify`.
- `scripts/import-content.ts` (T1 question-bank) · `src/lib/import/{scope-tagger,map-question,upsert-questions}.ts`.

**ציות ורעיונות:**

- `docs/compliance/COMPLIANCE.md` — חובות-ציות (נגישות/פרטיות/צרכנות/תשלומים) + task-force + משימות C1–C6.
- `docs/IDEAS.md` — backlog רעיונות/פיצ'רים/פידבק (להוסיף בחופשיות).

**ארכיטקטורה (לפי-צורך, מקור לכל בחירה גדולה):**

12. `docs/architecture/ADR-*.md` — 14 ADRs (000-template + 001-013). בעיקר **001** (stack) · **009** (מגן) · **010** (DB schema) · **011** (import pipeline) · **012** (נוהלי-פיתוח, single-branch main) · **013** (תבנית-קורס + capstone).

## עקרון

אם מידע סותר בין קבצים — **`docs/context/` גובר** על מסמכי-תכנון ישנים (build-roadmap, mvp-plan).
`STATUS.md` הוא האמת לגבי "איפה אנחנו"; `EXECUTION-PLAN.md` לגבי "מה עושים".
