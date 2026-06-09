# PROJECT-STRUCTURE — מבנה-הפרויקט: פלטפורמה ↔ קורס-instance

> **מטרה:** להגדיר את שתי-השכבות של StudiBuilder — שכבת-**הפלטפורמה** (הקוד/ה-DB הגנריים) מול
> שכבת-**הקורס** (`courses/<slug>/` — תוכן ספציפי). כאן מוגדר **חוזה תיקיית-הקורס** (אילו קבצים נושא כל
> קורס), **המיפוי** מתיקיית-קורס לטבלאות-ה-DB, ו-**checklist** להקמת קורס-עתידי. כך כל קורס-נוסף נכנס
> באותו מבנה ללא נגיעה בקוד-הפלטפורמה.
> מקור: סריקת-ריפו (2026-06-01). עוגנים: [`architecture/ADR-006-course-as-product-factory.md`](architecture/ADR-006-course-as-product-factory.md)
> · [`architecture/ADR-010-data-schema-mvp.md`](architecture/ADR-010-data-schema-mvp.md)
> · [`architecture/ADR-011-drive-import-pipeline.md`](architecture/ADR-011-drive-import-pipeline.md)
> · [`../courses/safety-officer/README.md`](../courses/safety-officer/README.md). מעודכן: 2026-06-03

## הפלטפורמה (StudiBuilder)

שכבת-הפלטפורמה היא **כל הקוד הגנרי** — אינה מכילה תוכן-קורס. קורס נכנס כ-**נתונים** (`courses/<slug>/`
→ ייבוא ל-DB), לא כקוד. תקציר תיקיות-השורש (פירוט-מלא ב-`../CLAUDE.md`):

| תיקייה            | תפקיד                                                                             | שייכות   |
| ----------------- | --------------------------------------------------------------------------------- | -------- |
| `src/app/`        | Next.js App Router — מסכי-הלומד, `/admin`, auth, API routes                       | פלטפורמה |
| `src/features/`   | יחידות-מוצר (lesson-engine, quiz, chat-tutor, scenarios) — גנריות, קורס-אגנוסטיות | פלטפורמה |
| `src/components/` | UI משותף                                                                          | פלטפורמה |
| `src/lib/db/`     | Drizzle schema + `constants/scope-refs.ts` (invariant 57 — לא לערוך)              | פלטפורמה |
| `src/lib/import/` | adapter Drive→Supabase (chunker · scope-tagger · embedder) — ראה ADR-011          | פלטפורמה |
| `src/lib/ai/`     | עטיפות Gemini (tagging · embeddings · chat-tutor · scenario-grading)              | פלטפורמה |
| `scripts/`        | `import-content.ts` + parsers — ה-CLI שמזין קורס לתוך ה-DB                        | פלטפורמה |
| `drizzle/`        | schema-snapshot + migrations                                                      | פלטפורמה |
| `tests/`          | unit (`db/scope-refs.test.ts` — invariant 57) + e2e                               | פלטפורמה |
| `docs/`           | ארכיטקטורה (ADRs), context, compliance — חוצה-קורסים                              | פלטפורמה |
| `courses/<slug>/` | **תוכן-קורס** (instance) — md + `sources/`. **כאן** נכנס כל קורס-חדש              | קורס     |

**עיקרון-הפרדה (ADR-006):** הפלטפורמה היא "מפעל-מוצר" — היא מקבלת תוכן-קורס מתוקנן ומפיקה ממנו מוצר
(שו"ת · תרחישים · מורה-AI). הוספת קורס = הוספת `courses/<slug>/` + ריצת-ייבוא; **ללא** שינוי ב-`src/`.

> ### 🚧 גבול-השכבות (red-line שענף-הבקרה אוכף)
>
> - **`src/` = פלטפורמה גנרית-קבועה** — קוד קורס-אגנוסטי בלבד. אסור שיכיל ידע-קורס (שמות-פרקים, נוסחי-חקיקה, scope-IDs ספציפיים-לקורס, תוכן-תכנית). הקבועים היחידים המותרים הם invariants-של-הפלטפורמה (למשל `scope-refs.ts` — סט-ה-scope הנעול).
> - **`courses/<slug>/` = instance-נתונים** — כל הידע הספציפי-לקורס יושב כאן בלבד (`safety-officer` = **instance #1**). קורס-נוסף = תיקייה-נוספת + ייבוא, **ללא נגיעה ב-`src/`**.
> - **הפרת-הגבול = דגל-בקרה:** ידע-קורס שמחלחל ל-`src/` (hard-coded chapter/legislation/PROGRAM) הוא **הפרת-גבול** → דגל לענף-הבקרה (`oversight` — **בהקמה, סשן-B**). זהו ה-checklist האובייקטיבי שמבקר-התכנית מצליב מול חוזה-התיקייה.

**מקרא:** פלטפורמה = קוד-גנרי משותף לכל הקורסים · קורס = נתוני-instance בתוך `courses/<slug>/`.

## קורס-instance = `courses/<slug>/`

כל קורס הוא תיקייה אחת תחת `courses/`. ה-`slug` הוא מזהה-יציב (kebab-case, למשל `safety-officer`).
**חוזה-התיקייה** — סט קבצי-ה-md שכל קורס נושא + תיקיית-`sources/`:

| קובץ                      | תוכן                                                                   | חובה?    |
| ------------------------- | ---------------------------------------------------------------------- | -------- |
| `README.md`               | שער-הקורס: יעד · מבנה-תבנית · רשימת-קבצים · כלל-זכויות                 | חובה     |
| `curriculum-<src>.md`     | עוגן-המבנה (spine) — פרקים/נושאים + מיפוי ל-scope-IDs                  | חובה     |
| `LEGISLATION-SOURCES.md`  | קורפוס-המקור המאמת (כותרת-רשמית + URL + סטטוס) — בסיס-אימות לכל שאלה   | חובה\*   |
| `LEGISLATION-COVERAGE.md` | כיסוי ה-scope ע"י חומרי-המקור (✅/🟠/🔴) + בנק-שאלות                   | חובה\*   |
| `LEARNING-MATERIALS.md`   | אינוונטר חומרי-לימוד פר-פרק (תוויות נייטרליות) + מיפוי פרק↔scope↔כיסוי | חובה     |
| `UNREAD-MEDIA.md`         | מדיה לעיבוד (אודיו/וידאו/תמונות/סרוקים) → transcription/OCR + סטטוס    | מומלץ    |
| `ATTRIBUTION.md`          | עקרון-זכויות + קבוצות-חומר (תיאור נייטרלי) + המלצת-טיפול פר-קבוצה      | חובה     |
| `COURSE-DESIGN.md`        | 3 מצבי-הלמידה + תבנית-הפלטפורמה (פרק=מיני-קורס) + מיפוי-לפרקים         | חובה     |
| `MOLSA-PROGRAM.md`        | תכנית-הרגולטור הרשמית (אם יש ועדת-הסמכה) + השוואה ל-spine/scope        | תלוי-יעד |
| `FINAL-PROJECT.md`        | מיני-קורס capstone (אם הקורס דורש עבודת-גמר)                           | תלוי-יעד |
| `sources/`                | חומרי-המקור עצמם (PDF/מדיה) — מקור-לייבוא; ראה תת-מבנה למטה            | חובה     |

> \* קורס שאינו מבוסס-חקיקה ישתמש בשמות-מקבילים (`SOURCES.md` / `COVERAGE.md`); המבנה זהה — קורפוס-מקור
> מאמת + טבלת-כיסוי מול ה-spine.

תת-מבנה `sources/` (מקור-אמת לייבוא — ADR-011):

```
courses/<slug>/sources/
  legislation/        # נוסחי-חקיקה PDF, פר-פרק → <scope-id>-<slug>.pdf
  final-project/      # פרויקט-דוגמה (reference פרטי; כפוף להכרעת-פרטיות)
  ...                 # קטגוריות-מקור נוספות לפי-קורס
```

**מקרא:** חובה = כל קורס נושא · תלוי-יעד = רק כשהיעד הוא ועדת-הסמכה/עבודת-גמר · מומלץ = כשיש מדיה גולמית.

## מיפוי תיקיית-קורס → טבלאות-DB

ה-md-ים בתיקיית-הקורס הם **שכבת-תיעוד/תכנון אנושית**; ה-**נתונים** מגיעים ל-DB דרך ייבוא חומרי-`sources/`
(`scripts/import-content.ts`, ADR-011). הסכמה עצמה ב-[`architecture/ADR-010-data-schema-mvp.md`](architecture/ADR-010-data-schema-mvp.md).
המיפוי מתיקיית-הקורס לישויות-ה-DB:

| מקור בתיקיית-הקורס                   | tier | טבלה/view ביעד                   | דרך                                                                                             |
| ------------------------------------ | ---- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `sources/**` (כל קובץ)               | —    | `content_sources`                | שורה-לקובץ; `scope_refs[]` + `in_scope` + `tier`                                                |
| בנק-שאלות (Q&A) ב-`sources/`         | T1   | `questions`                      | פירסור-מובנה `שאלה/תשובה/נימוק`; `import_source`                                                |
| חומרי-לימוד (מצגות/סיכומים)          | T2   | `chunks` (+ embedding pgvector)  | semantic-chunking → embed (Gemini)                                                              |
| נוסחי-חקיקה (`sources/legislation/`) | T3   | `chunks` (+ scope-mapping מדויק) | chunking לפי-סעיפים; scope_id משם-הקובץ (ודאות-גבוהה)                                           |
| תרחישי-תיק-מעשי                      | —    | `scenarios`                      | מודל-סימולציה מסועף (4 שלבים · עץ-בחירות · `src/features/simulation/types.ts` · ADR-016) → שורה |
| מדיה (`UNREAD-MEDIA.md`)             | T4   | `chunks` (post-deadline)         | transcription/OCR ואז chunking כ-T2                                                             |
| `scope_refs` (`scope-IDs` ב-spine)   | —    | `coverage_tracker` (VIEW)        | חישוב כיסוי פר-scope (question_count / scenario_count)                                          |

נקודות-עיגון של המיפוי:

- **`scope_refs[]`** — כל chunk/question/scenario נושא את ה-scope-IDs שלו; ה-VIEW `coverage_tracker`
  מצליב אותם מול רשימת-ה-scope הקבועה (ב-StudiBuilder: invariant 57). טבלת-הכיסוי האנושית
  (`LEGISLATION-COVERAGE.md`) היא ה-**תכנון**; ה-VIEW הוא ה-**מדידה-בפועל** מתוך ה-DB.
- **`in_scope` + `answer_status`** — שער-איכות: רק תוכן `in_scope=true` נכנס ל-quiz; `answer_status`
  (`verified`/`inferred`/`unknown`) שומר על אנטי-over-claim (ADR-005).
- **idempotency** — ייבוא לפי `content_hash`; ריצה-חוזרת לא יוצרת כפילויות (ADR-011 §Idempotency).

**מקרא:** T1 שאלות · T2 חומרי-לימוד · T3 חקיקה · T4 מדיה (דחוי post-deadline).

## checklist להקמת קורס-עתידי

1. **צור `courses/<slug>/`** עם `slug` יציב (kebab-case).
2. **`README.md`** — יעד-הקורס · מבנה-התבנית · רשימת-קבצים · כלל-זכויות (הפנה ל-`compliance/COMPLIANCE.md`).
3. **`curriculum-<src>.md`** — ה-spine: פרקים/נושאים + מיפוי ל-scope-IDs. זהו עוגן-ההקשר-הקבוע.
4. **קורפוס-מקור** — `LEGISLATION-SOURCES.md` (או `SOURCES.md`): כותרת-רשמית + URL + סטטוס לכל פריט.
5. **טבלת-כיסוי** — `LEGISLATION-COVERAGE.md` (או `COVERAGE.md`): ✅/🟠/🔴 מול ה-spine + הערת-כיול מתוארכת
   (אנטי-over-claim).
6. **`ATTRIBUTION.md`** — מפה כל קבוצת-חומר לעקרון-זכויות (חקיקה=נחלת-כלל · תקנים-בתשלום=תקצירים-מקוריים
   · חומרי-מרצה=reference+שכתוב). **name-clean מוחלט — אסור שם-אדם פרטי בשום קובץ.**
7. **`COURSE-DESIGN.md`** — 3 מצבי-הלמידה (שו"ת · תרחישים · מורה-AI) + תבנית פרק=מיני-קורס + מיפוי-לפרקים.
8. **מלא `sources/`** — חומרי-המקור הגולמיים (`legislation/`, ועוד לפי-קורס). שמות-קבצים תואמי-פרסר.
9. **רשום scope-IDs** — אם הקורס דורש סט-scope חדש, עדכן `src/lib/db/constants/scope-refs.ts` + ה-VIEW
   (ב-StudiBuilder הנוכחי 57 נעולים — invariant; קורס-נוסף יקבל החלטה-ייעודית).
10. **ייבא** — `pnpm import:<phase> --dry-run` (תקציב) → `--execute` (ADR-011). אמת ב-`coverage_tracker`.
11. **רשום את הקורס** — ב-`../CLAUDE.md` + `context/PROJECT-MAP.md` + רשומת-`context/SESSION-LOG.md`.
12. **אימות-בקרה** — **מבקר-התכנית** (ענף-`oversight` — בהקמה, סשן-B) מאמת את הקורס-החדש מול ה-**PROGRAM הרשמי**
    שלו (כיסוי spine/scope מול תכנית-הרגולטור; בקורס #1 = `MOLSA-PROGRAM.md` מול 905018) ומאשר שאין ידע-קורס
    שחלחל ל-`src/` (גבול-השכבות לעיל). חוסר-כיסוי או הפרת-גבול = דגל-בקרה.

**מקרא:** שלבים 1–8 = נתוני-קורס (תוכן) · 9–11 = שילוב-בפלטפורמה (קוד + רישום) · 12 = שער-בקרה (oversight).

## References

- [`architecture/ADR-006-course-as-product-factory.md`](architecture/ADR-006-course-as-product-factory.md)
  — הפלטפורמה כמפעל-מוצר; קורס=נתונים, לא קוד
- [`architecture/ADR-010-data-schema-mvp.md`](architecture/ADR-010-data-schema-mvp.md) — סכמת-ה-DB
  (`content_sources` · `chunks` · `questions` · `scenarios` · `coverage_tracker`)
- [`architecture/ADR-011-drive-import-pipeline.md`](architecture/ADR-011-drive-import-pipeline.md) —
  `scripts/import-content.ts`: tier-system T1–T4 · scope-filter דו-שלבי · idempotency
- [`architecture/ADR-005-notebooklm-hybrid.md`](architecture/ADR-005-notebooklm-hybrid.md) — scope-filter
  - `answer_status` (אנטי-over-claim)
- [`../courses/safety-officer/README.md`](../courses/safety-officer/README.md) — instance #1 (מימוש
  חוזה-התיקייה בפועל)
- [`../courses/safety-officer/COURSE-DESIGN.md`](../courses/safety-officer/COURSE-DESIGN.md) — תבנית
  פרק=מיני-קורס × 3-מצבים
- [`context/PROJECT-MAP.md`](context/PROJECT-MAP.md) — מפת-כל-המסמכים
