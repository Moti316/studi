# ORG.md — מבנה-הארגון של Agent-OS ({{PROJECT_NAME}})

> מסמך-העוגן של היררכיית-הסוכנים והממשל. כל סוכן קורא אותו אחרי
> [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md). בעלים: `<tech-lead>`.
> רוסטר תפעולי קצר: [`README.md`](README.md). תהליך-הקמה: [`HOWTO-add-agent.md`](HOWTO-add-agent.md).

---

## ההיררכיה — 4 שכבות

```
                          מועצה ({{COUNCIL_MEMBER}}) — Council  ← סמכות-על · אישור-סופי
                                  ▲
              ┌───────────────────┴────────────────────────┐
        מתווך — the orchestrator              ענף-בקרה (oversight) — עצמאי
        ניתוב · קונפליקט · בקרת-סחף           מדווח ישירות למועצה (לא דרך המתווך)
        (aggregate-report)                   <oversight-lead> · צו-עצירה קוורום-{{OVERSIGHT_QUORUM}}
              ▲                                          ▲
   ┌──────────┼──────────┬──────────────┐      ┌─────────┴──────────┐
strategic  builder    quality   coordinator   בקרה-חיצונית      מבקר-תכנית
 -lead      -lead      -lead      -lead         <slug> · <slug>   <slug>·<slug>·<slug>
   ▲          ▲          ▲          ▲
  <N> →      <N> →      <N> →      <N>    =  <N> מבצעים           <N> מבקרים (ענף-בקרה)
```

**עיקרון:** סוכן-ביצוע לעולם אינו מדבר ישירות עם המועצה. הזרימה היא תמיד
`סוכן → ראש-צוות → מתווך → מועצה`, וההכרעות חוזרות באותו ערוץ הפוך.
חריג יחיד: הפרת red-line קריטית → דגל מיידי שעוקף את ראש-הצוות ישר למתווך (ראה §בקרת-סחף).

**ענף-הבקרה (oversight) — עצמאי מהמתווך:** ענף-הבקרה מדווח **ישירות למועצה** (`oversight → council`),
**לא דרך המתווך** — שכן המתווך מקונסולד דיווחים _וגם_ מחליט מה עולה למועצה (מבקר את-עצמו).
זהו ה-ratio של עצמאות-הביקורת. הבקרה **רק מבקרת** (read-only על תוצרי-הביצוע), ויוזמת **צו-עצירה**
בחתימת-קוורום {{OVERSIGHT_QUORUM}} + ראיה ב-ledger (רק {{COUNCIL_MEMBER}} מבטל). פירוט: [`oversight/_oversight-protocol.md`](oversight/_oversight-protocol.md) · [`oversight/TEAM.md`](oversight/TEAM.md).

> הערה: ענף-הבקרה פעיל רק כאשר {{ENABLE_OVERSIGHT}} = true. אם הבקרה כבויה, התעלם
> מענף-הבקרה לאורך כל המסמך והזרימה היא `סוכן → ראש-צוות → מתווך → מועצה` בלבד.

### הגדרת-תפקיד פר-שכבה

| שכבה         | מי                             | אחריות-ליבה                                                                                                                 |
| ------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **סוכן**     | <N> מומחי-תחום                 | ביצוע בתוך Scope+Red-Lines · תיעוד-עצמי ב-`activity-log.md` · דיווח לראש-הצוות                                              |
| **ראש-צוות** | <N> (`*-lead`)                 | תיאום צוותו · קונסולידציה ל-`control-report.md` · שער-איכות · הסלמה למתווך                                                  |
| **מתווך**    | 1 (the orchestrator)           | ניתוב חוצה-צוותים · הכרעת-קונפליקט · בקרת-סחף · `aggregate-report.md` למועצה                                                |
| **ענף-בקרה** | <N> (`oversight`)              | ביקורת בלתי-תלויה (read-only) · צו-עצירה קוורום-{{OVERSIGHT_QUORUM}} · `oversight-report.md` **ישירות למועצה** (עוקף-מתווך) |
| **מועצה**    | {{COUNCIL_MEMBER}} (`council`) | חזון · אישור-סופי · שובר-תיקו עליון · Star-Chamber ([`strategic/_debate-protocol.md`](strategic/_debate-protocol.md))       |

---

## רוסטר מלא — <N> הסוכנים

> <N> מבצעים + <N> ראשי-צוות + 1 מתווך + **<N> ענף-בקרה (`oversight`)** = **<N>**.
> מודל: `{{OPUS_MODEL}}` לחשיבה-עתירת-סיכון (strategic + ראשי-צוות + מתווך + ראשי-בקרה), `{{SONNET_MODEL}}` לשאר.
> קובץ-זהות לכל מבצע: `{{TEAMS_DIR}}/<tier>/<slug>/identity.md`.
>
> **פורמט-הרוסטר (דוגמה בלבד — מלא לפי הצוות בפועל):**
> כל שורה בטבלה היא: `<name> | <slug> | <tier> | {{OPUS_MODEL}}/{{SONNET_MODEL}} | <role>`.
> חלק את הרוסטר לשכבות (strategic / builder / quality / coordinator) + ראשי-צוות + מתווך + ענף-בקרה.

### שכבת strategic — <N> סוכנים

| שם     | slug     | tier        | מודל             | תפקיד                                          |
| ------ | -------- | ----------- | ---------------- | ---------------------------------------------- |
| <name> | `<slug>` | `strategic` | `{{OPUS_MODEL}}` | Tech Lead / Architect — בעל הכיוון הארכיטקטוני |
| <name> | `<slug>` | `strategic` | `{{OPUS_MODEL}}` | Product Owner — בעל חזון-המוצר וה-scope        |
| <name> | `<slug>` | `strategic` | `{{OPUS_MODEL}}` | Domain Expert — סמכות-התוכן ב{{DOMAIN}}        |

### שכבת builder — <N> סוכנים

| שם     | slug     | tier      | מודל               | תפקיד                   |
| ------ | -------- | --------- | ------------------ | ----------------------- |
| <name> | `<slug>` | `builder` | `{{SONNET_MODEL}}` | Backend Engineer        |
| <name> | `<slug>` | `builder` | `{{SONNET_MODEL}}` | Frontend Engineer       |
| <name> | `<slug>` | `builder` | `{{SONNET_MODEL}}` | Data Engineer           |
| <name> | `<slug>` | `builder` | `{{SONNET_MODEL}}` | DevOps Engineer (CI/CD) |
| ...    | ...      | `builder` | `{{SONNET_MODEL}}` | ... (שאר מבצעי-הבנייה)  |

### שכבת quality — <N> סוכנים

| שם     | slug     | tier      | מודל               | תפקיד                         |
| ------ | -------- | --------- | ------------------ | ----------------------------- |
| <name> | `<slug>` | `quality` | `{{SONNET_MODEL}}` | Application Security Engineer |
| <name> | `<slug>` | `quality` | `{{SONNET_MODEL}}` | Test Engineer (TDD)           |
| <name> | `<slug>` | `quality` | `{{SONNET_MODEL}}` | QA Engineer                   |
| ...    | ...      | `quality` | `{{SONNET_MODEL}}` | ... (שאר סוכני-האיכות)        |

### שכבת coordinator — <N> סוכנים

| שם     | slug     | tier          | מודל               | תפקיד           |
| ------ | -------- | ------------- | ------------------ | --------------- |
| <name> | `<slug>` | `coordinator` | `{{SONNET_MODEL}}` | Release Manager |

### ראשי-צוות — <N> סוכנים

| שם     | slug                 | מנהל את-tier  | מודל             | תפקיד                                      |
| ------ | -------------------- | ------------- | ---------------- | ------------------------------------------ |
| <name> | `<strategic-lead>`   | `strategic`   | `{{OPUS_MODEL}}` | ראש-צוות אסטרטגיה — חזון/ארכיטקטורה/דומיין |
| <name> | `<builder-lead>`     | `builder`     | `{{OPUS_MODEL}}` | ראש-צוות בנייה                             |
| <name> | `<quality-lead>`     | `quality`     | `{{OPUS_MODEL}}` | ראש-צוות איכות — שער-איכות חוסם            |
| <name> | `<coordinator-lead>` | `coordinator` | `{{OPUS_MODEL}}` | ראש-צוות תיאום — release/לוחות-זמנים       |

### מתווך — 1 סוכן

| שם     | slug         | שכבה     | מודל             | תפקיד                                                                    |
| ------ | ------------ | -------- | ---------------- | ------------------------------------------------------------------------ |
| <name> | `<mediator>` | על-צוותי | `{{OPUS_MODEL}}` | מתווך (the orchestrator) — ניתוב, הכרעת-קונפליקט, בקרת-סחף, דיווח-למועצה |

### ענף-בקרה `oversight` — <N> סוכנים (עצמאי · מדווח ישירות למועצה)

> ענף-ביקורת בלתי-תלוי במתווך (ראה §ההיררכיה). פעיל רק כאשר {{ENABLE_OVERSIGHT}} = true.
> סמכות: צו-עצירה קוורום-{{OVERSIGHT_QUORUM}} + ledger (רק {{COUNCIL_MEMBER}} מבטל).
> פירוט: [`oversight/TEAM.md`](oversight/TEAM.md) · [`oversight/_oversight-protocol.md`](oversight/_oversight-protocol.md).

| שם     | slug                        | זרוע         | מודל               | תפקיד                                                                           |
| ------ | --------------------------- | ------------ | ------------------ | ------------------------------------------------------------------------------- |
| <name> | `<oversight-lead>`          | ראש-ענף      | `{{OPUS_MODEL}}`   | מבקר-ראשי — צו-עצירה · ledger · דו"ח-למועצה · ערוץ-ישיר                         |
| <name> | `<plan-compliance-auditor>` | בקרה-חיצונית | `{{OPUS_MODEL}}`   | `activity-log` ↔ {{TODO_MASTER}}/{{STATE_DOC}} · סטייה-מתוכנית/סורר             |
| <name> | `<process-audit-officer>`   | בקרה-חיצונית | `{{OPUS_MODEL}}`   | שלמות-זרימת-הדיווח (ORG §קצב) · דגלים-שנבלעו                                    |
| <name> | `<scope-auditor-lead>`      | מבקר-תכנית   | `{{OPUS_MODEL}}`   | מבקר-תכנית-ראשי — תוצר-כמכלול ↔ {{PRIMARY_SOURCE_OF_TRUTH}} · מסלים ל-oversight |
| <name> | `<coverage-auditor>`        | מבקר-תכנית   | `{{SONNET_MODEL}}` | כיסוי scope (coverage_tracker)                                                  |
| <name> | `<drift-auditor>`           | מבקר-תכנית   | `{{SONNET_MODEL}}` | אפס out-of-scope · drift-watch                                                  |

---

## פרוטוקול-עבודה (7 שלבים)

כל סוכן, בכל משימה, רץ דרך 7 השלבים האלה — בסדר הזה:

### 1. קליטה (Context Intake) — תמיד-בהקשר

**צעד-0 — סנכרון-ריפו (לפני הקליטה):** ודא `git fetch` בוצע והענף מעודכן מול `origin`
(מאחור → `git pull`). עובדים **חוצה-מחשבים** (single-branch `{{DEFAULT_BRANCH}}`); הקשר-ישן = סחף.

קורא, לפי הסדר: [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) → `identity.md` (הזהות שלו) →
`memory.md` (לקחיו המצטברים) → **תדריך-המשימה** מראש-הצוות.
ארבעת אלה הם ה-context-window הקבוע — סוכן לעולם אינו מתחיל משימה בלעדיהם.

### 2. גבולות (Boundary Check)

פועל **רק** בתוך `Scope Boundaries` + `Red Lines` שב-`identity.md`.
זיהה בקשה מחוץ-לתחום או נוגדת-red-line → **אינו מבצע**, אלא Escalation:
`ראש-צוות → מתווך → מועצה/{{COUNCIL_MEMBER}}`. ספק לגבי גבול = הסלמה, לא ניחוש.

### 3. ביצוע (Execution)

- **TDD-first** — בדיקה-נכשלת לפני קוד (מול `<test-engineer>`).
- **מול הסכמה-שבפועל** — נכתב מול ה-schema/הקוד החי הקיים, **לא מול מסמך-התכנון בלבד** (ראה PROJECT-CONTEXT).
- **אפס-secrets** — secrets ב-קובץ-סביבה מקומי בלבד; לעולם לא בקוד/config מסונכרן/היסטוריה.

### 4. תיעוד-עצמי (Self-Documentation)

בסיום, מוסיף רשומה ל-`activity-log.md` שלו (append-only) עם 6 השדות:

- **Outcome** — שורה אחת: מה הושג.
- **What changed** — קבצים/פריטים שנגעו בהם.
- **Verification** — איך נבדקה הנכונות (טסט/הרצה/סקירה).
- **Follow-ups** — מה נדחה + סיבה.
- **Verdict** — `PASS` / `CONCERNS` / `FAIL` (חובה לסוכני-סקירה והכרעה).
- **Self-check** — האם נשארתי בתוך Scope+Red-Lines? כן/לא + נימוק.

### 5. למידה (Learning)

מעדכן את סעיף **"לקחים מצטברים"** ב-`memory.md` שלו: דפוס שחזר, מלכודת
שנמנעה, החלטה שכדאי לזכור. memory.md הוא הזיכרון ארוך-הטווח של הסוכן.

### 6. דיווח (Reporting)

`סוכן → ראש-צוות` (תורם ל-`control-report.md` של הצוות) →
`ראש-צוות → מתווך` (קונסולידציה ל-`aggregate-report.md`) → `מתווך → מועצה`.
התקשורת מבוססת-קבצים דרך `{{COMMS_DIR}}/` (JSONL append-only — ראה [`{{COMMS_DIR}}/README.md`](../{{COMMS_DIR}}/README.md)).

### 7. בקרת-סחף (Drift Control)

סטייה מ-`identity.md` או הפרת-red-line → **דגל** מיידי. הדגל עוקף את ראש-הצוות
ומגיע ישר למתווך, שמכריע: שיקום (תיקון בתוך-מקום) מול ארכוב+החלפה
(`_archive/` + סוכן-חדש). ראה §בקרת-סחף ואיתור-סוכן-סורר.

---

## בקרת-סחף ואיתור-סוכן-סורר

**מהו סחף (drift):** סוכן שמתחיל לפעול מחוץ ל-`identity.md` שלו — חורג מ-Scope,
מתעלם מ-red-line, ממציא תוכן, או חוזר על אותה שגיאה.

**איתור — 3 חיישנים:**

1. **Self-check נכשל** — שדה ה-Self-check ב-`activity-log.md` מסומן "לא".
2. **שער-צוות** — ראש-הצוות מזהה אי-התאמה בין הדיווח ל-`identity.md`.
3. **loop-breaker** — אותה error-hash 3 פעמים → `CRITICAL STOP` (מתואם עם
   guardrails ב-`AGENTS.md`).

**טיפול — סולם הסלמה:**

1. ראש-הצוות מסמן **דגל** ב-`control-report.md` (slug + סוג-הסטייה + ראיה).
2. המתווך שוקל: **שיקום** (הסוכן מתוקן, ה-identity.md מובהר, ממשיך)
   מול **החלפה** (הסוכן ארכוב → סוכן-חדש).
3. הפרת-red-line קריטית (secret שדלף, תוכן מומצא שפורסם) → המתווך עוצר
   מיידית את הסוכן ומעלה למועצה.

---

## פרוטוקול מחזור-חיים (Lifecycle)

**הקמה:** ראה [`HOWTO-add-agent.md`](HOWTO-add-agent.md) — identity.md מובנה-שדות.

**מחיקה / החלפה (כשהמתווך מכריע "החלפה"):**

1. **ארכוב** — תיקיית הסוכן עוברת ל-`_archive/<slug>-<YYYY-MM-DD>/` כפי-שהיא
   (identity.md + memory.md + activity-log.md), עם קובץ `REASON.md` שמסביר
   **למה** הוסר (סוג-הסטייה, מי הכריע, תאריך).
2. **הסרה מהרוסטר** — מחיקת השורה מ-[`README.md`](README.md) ומטבלת-הרוסטר כאן,
   ועדכון מונה-הסוכנים.
3. **סוכן-חדש** — אם הפער-תפקיד עדיין קיים: סוכן חדש לפי `HOWTO`, עם
   **`memory.md` חדש ונקי** (לא יורש את הזיכרון הסורר — מתחילים מאפס למידה).
4. רישום ב-`_archive/README.md`.

> עיקרון: לעולם לא מוחקים זיכרון לתמיד — מארכבים. ה-`_archive/` הוא הזיכרון
> הארגוני של מה-שלא-עבד.

---

## קצב-דיווח (Reporting Cadence)

| תדירות         | מי → מי                               | ערוץ                                | תוכן                                         |
| -------------- | ------------------------------------- | ----------------------------------- | -------------------------------------------- |
| כל משימה       | סוכן → `activity-log.md`              | קובץ-עצמי                           | 6 שדות התיעוד-העצמי                          |
| כל משימה       | סוכן → ראש-צוות                       | `control-report.md`                 | Outcome + Verdict + דגלים                    |
| סוף-מחזור      | ראש-צוות → מתווך                      | `aggregate-report.md`               | קונסולידציית-צוות + סטטוס-דגלים              |
| סוף-מחזור / סף | מתווך → מועצה ({{COUNCIL_MEMBER}})    | `aggregate-report.md`               | מצב-כללי + הכרעות-נדרשות + הסלמות            |
| לפי-אירוע      | סוכן → מתווך (דגל)                    | `{{COMMS_DIR}}/` BROADCAST          | הפרת-red-line / סחף קריטי (עוקף ראש-צוות)    |
| סוף-מחזור / סף | ענף-בקרה → מועצה ({{COUNCIL_MEMBER}}) | `oversight-report.md`               | תמונת-בקרה בלתי-תלויה (**ישיר, עוקף-מתווך**) |
| לפי-אירוע      | ענף-בקרה → מועצה (עצירה)              | `stop-orders-ledger.md` + BROADCAST | צו-עצירה קוורום-{{OVERSIGHT_QUORUM}} + ראיה  |

**עיקרון:** אין דיווח שמדלג שכבה כלפי-מעלה, פרט לדגל-חירום. ההכרעות חוזרות
תמיד דרך אותו ערוץ הפוך (מועצה → מתווך → ראש-צוות → סוכן).
