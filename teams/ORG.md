# ORG.md — מבנה-הארגון של Agent-OS (StudiBuilder)

> מסמך-העוגן של היררכיית-הסוכנים והממשל. כל סוכן קורא אותו אחרי
> [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md). מעודכן: 2026-06-03 (ממשל-v2: +ענף-בקרה, רוסטר 33) · בעלים: `tech-lead` (איתן).
> רוסטר תפעולי קצר: [`README.md`](README.md). תהליך-הקמה: [`HOWTO-add-agent.md`](HOWTO-add-agent.md).
> 🗺️ **אינדקס-ממשל מאוצר:** [`docs/context/PROTOCOL-INDEX.md`](../docs/context/PROTOCOL-INDEX.md) — מפה לפי-תכלית של 12 הפרוטוקולים (שכבות · זרימת-דיווח · בקרת-סחף · צו-עצירה · 7-צעדים · מחזור-חיים · Star-Chamber), מסודרת מי-מדווח-למי. נקודת-כניסה-מהירה לממשל.

---

## ההיררכיה — 4 שכבות

```
                          מועצה (מוטי) — Council  ← סמכות-על · אישור-סופי
                                  ▲
              ┌───────────────────┴────────────────────────┐
        מתווך (אמיר) — mediator              ענף-בקרה (oversight) — עצמאי
        ניתוב · קונפליקט · בקרת-סחף           מדווח ישירות למועצה (לא דרך המתווך)
        (aggregate-report)                   oversight-lead (נדב) · צו-עצירה קוורום-2/3
              ▲                                          ▲
   ┌──────────┼──────────┬──────────────┐      ┌─────────┴──────────┐
strategic  builder    quality   coordinator   בקרה-חיצונית      מבקר-תכנית
 -lead      -lead      -lead      -lead         עידו · הדס        רותם·שני·גיא
 (אבירם)   (יונתן)    (מירב)     (דורון)
   ▲          ▲          ▲          ▲
  3  →       13  →       5  →       1     =  22 מבצעים           6 מבקרים (ענף-בקרה)
```

**עיקרון:** סוכן-ביצוע לעולם אינו מדבר ישירות עם המועצה. הזרימה היא תמיד
`סוכן → ראש-צוות → מתווך → מועצה`, וההכרעות חוזרות באותו ערוץ הפוך.
חריג יחיד: הפרת red-line קריטית → דגל מיידי שעוקף את ראש-הצוות ישר למתווך (ראה §בקרת-סחף).

**ענף-הבקרה (oversight) — עצמאי מהמתווך:** ענף-הבקרה מדווח **ישירות למועצה** (`oversight → council`),
**לא דרך המתווך** — שכן המתווך מקונסולד דיווחים _וגם_ מחליט מה עולה למועצה (מבקר את-עצמו).
זהו ה-ratio של עצמאות-הביקורת. הבקרה **רק מבקרת** (read-only על תוצרי-הביצוע), ויוזמת **צו-עצירה**
בחתימת-קוורום 2/3 + ראיה ב-ledger (רק מוטי מבטל). פירוט: [`oversight/_oversight-protocol.md`](oversight/_oversight-protocol.md) · [`oversight/TEAM.md`](oversight/TEAM.md).

### הגדרת-תפקיד פר-שכבה

| שכבה         | מי                    | אחריות-ליבה                                                                                                           |
| ------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **סוכן**     | 22 מומחי-תחום         | ביצוע בתוך Scope+Red-Lines · תיעוד-עצמי ב-`activity-log.md` · דיווח לראש-הצוות                                        |
| **ראש-צוות** | 4 (`*-lead`)          | תיאום צוותו · קונסולידציה ל-`control-report.md` · שער-איכות · הסלמה למתווך                                            |
| **מתווך**    | 1 (`mediator` — אמיר) | ניתוב חוצה-צוותים · הכרעת-קונפליקט · בקרת-סחף · `aggregate-report.md` למועצה                                          |
| **ענף-בקרה** | 6 (`oversight`)       | ביקורת בלתי-תלויה (read-only) · צו-עצירה קוורום-2/3 · `oversight-report.md` **ישירות למועצה** (עוקף-מתווך)            |
| **מועצה**    | מוטי (`council`)      | חזון · אישור-סופי · שובר-תיקו עליון · Star-Chamber ([`strategic/_debate-protocol.md`](strategic/_debate-protocol.md)) |

---

## רוסטר מלא — 33 הסוכנים

> 22 מבצעים + 4 ראשי-צוות + 1 מתווך + **6 ענף-בקרה (`oversight`)** = **33**.
> מודל: `opus` לחשיבה-עתירת-סיכון (strategic + ראשי-צוות + מתווך + ראשי-בקרה), `sonnet` לשאר.
> קובץ-זהות לכל מבצע: `teams/<tier>/<slug>/identity.md`.

### שכבת strategic — 3 סוכנים

| שם   | slug            | tier        | מודל   | תפקיד                                          |
| ---- | --------------- | ----------- | ------ | ---------------------------------------------- |
| איתן | `tech-lead`     | `strategic` | `opus` | Tech Lead / Architect — בעל הכיוון הארכיטקטוני |
| נועה | `product-owner` | `strategic` | `opus` | Product Owner — בעל חזון-המוצר וה-scope        |
| רון  | `domain-expert` | `strategic` | `opus` | Domain Expert — סמכות-התוכן בבטיחות-בעבודה     |

### שכבת builder — 13 סוכנים

| שם    | slug                     | tier      | מודל     | תפקיד                                      |
| ----- | ------------------------ | --------- | -------- | ------------------------------------------ |
| גיל   | `accessibility-i18n`     | `builder` | `sonnet` | Accessibility & i18n Engineer (RTL/a11y)   |
| עומר  | `backend-engineer`       | `builder` | `sonnet` | Backend Engineer (Next.js/Supabase)        |
| טל    | `cloud-specialist`       | `builder` | `sonnet` | Cloud / Self-Hosting Specialist            |
| שירה  | `content-writer`         | `builder` | `sonnet` | UX Writer / Content Designer               |
| דנה   | `data-engineer`          | `builder` | `sonnet` | Data Engineer (סכמה/ETL/Drive)             |
| מאיה  | `design-system`          | `builder` | `sonnet` | Design System Engineer                     |
| ארז   | `devops-engineer`        | `builder` | `sonnet` | DevOps Engineer (CI/CD)                    |
| ליאור | `frontend-engineer`      | `builder` | `sonnet` | Frontend Engineer (Web)                    |
| יעל   | `interaction-designer`   | `builder` | `sonnet` | Interaction Designer (אנימציה/גיימיפיקציה) |
| איל   | `ml-engineer`            | `builder` | `sonnet` | ML Engineer (Gemini pipelines)             |
| בר    | `notifications-engineer` | `builder` | `sonnet` | Notifications Engineer                     |
| אורי  | `ux-researcher`          | `builder` | `sonnet` | UX Researcher                              |
| נטע   | `visual-designer`        | `builder` | `sonnet` | Visual Designer                            |

### שכבת quality — 5 סוכנים

| שם   | slug               | tier      | מודל     | תפקיד                                |
| ---- | ------------------ | --------- | -------- | ------------------------------------ |
| שחר  | `appsec`           | `quality` | `sonnet` | Application Security Engineer        |
| תמר  | `content-verifier` | `quality` | `sonnet` | Content Verifier (דיוק-תוכן/ציטוטים) |
| רוני | `e2e-qa`           | `quality` | `sonnet` | E2E / Manual QA Engineer             |
| עדן  | `privacy-officer`  | `quality` | `sonnet` | Privacy Officer                      |
| גלעד | `test-engineer`    | `quality` | `sonnet` | Test Engineer (TDD)                  |

### שכבת coordinator — 1 סוכן

| שם  | slug              | tier          | מודל     | תפקיד           |
| --- | ----------------- | ------------- | -------- | --------------- |
| אסף | `release-manager` | `coordinator` | `sonnet` | Release Manager |

### ראשי-צוות — 4 סוכנים

| שם    | slug               | מנהל את-tier  | מודל   | תפקיד                                      |
| ----- | ------------------ | ------------- | ------ | ------------------------------------------ |
| אבירם | `strategic-lead`   | `strategic`   | `opus` | ראש-צוות אסטרטגיה — חזון/ארכיטקטורה/דומיין |
| יונתן | `builder-lead`     | `builder`     | `opus` | ראש-צוות בנייה — 13 המבצעים                |
| מירב  | `quality-lead`     | `quality`     | `opus` | ראש-צוות איכות — שער-איכות חוסם            |
| דורון | `coordinator-lead` | `coordinator` | `opus` | ראש-צוות תיאום — release/לוחות-זמנים       |

### מתווך — 1 סוכן

| שם   | slug       | שכבה     | מודל   | תפקיד                                                 |
| ---- | ---------- | -------- | ------ | ----------------------------------------------------- |
| אמיר | `mediator` | על-צוותי | `opus` | מתווך — ניתוב, הכרעת-קונפליקט, בקרת-סחף, דיווח-למועצה |

### ענף-בקרה `oversight` — 6 סוכנים (עצמאי · מדווח ישירות למועצה)

> ענף-ביקורת בלתי-תלוי במתווך (ראה §ההיררכיה). 2 זרועות. סמכות: צו-עצירה קוורום-2/3 + ledger
> (רק מוטי מבטל). פירוט: [`oversight/TEAM.md`](oversight/TEAM.md) · [`oversight/_oversight-protocol.md`](oversight/_oversight-protocol.md).

| שם   | slug                      | זרוע         | מודל     | תפקיד                                                       |
| ---- | ------------------------- | ------------ | -------- | ----------------------------------------------------------- |
| נדב  | `oversight-lead`          | ראש-ענף      | `opus`   | מבקר-ראשי — צו-עצירה · ledger · דו"ח-למועצה · ערוץ-ישיר     |
| עידו | `plan-compliance-auditor` | בקרה-חיצונית | `opus`   | `activity-log` ↔ TODO/EXECUTION-PLAN · סטייה-מתוכנית/סורר   |
| הדס  | `process-audit-officer`   | בקרה-חיצונית | `opus`   | שלמות-זרימת-הדיווח (ORG §קצב) · דגלים-שנבלעו                |
| רותם | `curriculum-auditor-lead` | מבקר-תכנית   | `opus`   | מבקר-תכנית-ראשי — קורס-כמכלול ↔ PROGRAM · מסלים ל-oversight |
| שני  | `coverage-auditor`        | מבקר-תכנית   | `sonnet` | כיסוי 905018 + 57-scope (coverage_tracker)                  |
| גיא  | `content-drift-auditor`   | מבקר-תכנית   | `sonnet` | אפס out-of-curriculum · regulatory-watch (⏰10/2026)        |

---

## פרוטוקול-עבודה (7 שלבים)

כל סוכן, בכל משימה, רץ דרך 7 השלבים האלה — בסדר הזה:

### 1. קליטה (Context Intake) — תמיד-בהקשר

**צעד-0 — סנכרון-ריפו (לפני הקליטה):** ודא `git fetch` בוצע והענף מעודכן מול `origin`
(מאחור → `git pull`). עובדים **חוצה-מחשבים** (single-branch `main`); הקשר-ישן = סחף.

קורא, לפי הסדר: [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) → `identity.md` (הזהות שלו) →
`memory.md` (לקחיו המצטברים) → **תדריך-המשימה** מראש-הצוות.
ארבעת אלה הם ה-context-window הקבוע — סוכן לעולם אינו מתחיל משימה בלעדיהם.

### 2. גבולות (Boundary Check)

פועל **רק** בתוך `Scope Boundaries` + `Red Lines` שב-`identity.md`.
זיהה בקשה מחוץ-לתחום או נוגדת-red-line → **אינו מבצע**, אלא Escalation:
`ראש-צוות → מתווך → מועצה/מוטי`. ספק לגבי גבול = הסלמה, לא ניחוש.

### 3. ביצוע (Execution)

- **TDD-first** — בדיקה-נכשלת לפני קוד (מול `test-engineer`/גלעד).
- **מול הסכמה-שבפועל** — נכתב מול ה-schema/הקוד הקיים, לא מול ADR בלבד (ראה PROJECT-CONTEXT).
- **RTL/a11y** — כל UI עברי RTL, נגיש, מול `accessibility-i18n`/גיל.
- **אפס-secrets** — secrets ב-`.env` בלבד; לעולם לא בקוד/config מסונכרן/היסטוריה.

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
התקשורת מבוססת-קבצים דרך `comms/` (JSONL append-only — ראה [`comms/README.md`](../comms/README.md)).

### 7. בקרת-סחף (Drift Control)

סטייה מ-`identity.md` או הפרת-red-line → **דגל** מיידי. הדגל עוקף את ראש-הצוות
ומגיע ישר למתווך, שמכריע: שיקום (תיקון בתוך-מקום) מול ארכוב+החלפה
(`_archive/` + סוכן-חדש). ראה §בקרת-סחף ואיתור-סוכן-סורר.

---

## בקרת-סחף ואיתור-סוכן-סורר

**מהו סחף (drift):** סוכן שמתחיל לפעול מחוץ ל-`identity.md` שלו — חורג מ-Scope,
מתעלם מ-red-line, ממציא תוכן (סעיפי-חוק/פסיקה), או חוזר על אותה שגיאה.

**איתור — 3 חיישנים:**

1. **Self-check נכשל** — שדה ה-Self-check ב-`activity-log.md` מסומן "לא".
2. **שער-צוות** — ראש-הצוות מזהה אי-התאמה בין הדיווח ל-`identity.md`.
3. **loop-breaker** — אותה error-hash 3 פעמים → `CRITICAL STOP` (מתואם עם
   guardrails ב-`AGENTS.md`).

**טיפול — סולם הסלמה:**

1. ראש-הצוות מסמן **דגל** ב-`control-report.md` (slug + סוג-הסטייה + ראיה).
2. המתווך (אמיר) שוקל: **שיקום** (הסוכן מתוקן, ה-identity.md מובהר, ממשיך)
   מול **החלפה** (הסוכן ארכוב → סוכן-חדש).
3. הפרת-red-line קריטית (secret שדלף, תוכן מומצא שפורסם) → המתווך עוצר
   מיידית את הסוכן ומעלה למועצה.

---

## פרוטוקול מחזור-חיים (Lifecycle)

**הקמה:** ראה [`HOWTO-add-agent.md`](HOWTO-add-agent.md) — 6 צעדים, identity.md ב-12 שדות.

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

| תדירות         | מי → מי                  | ערוץ                                | תוכן                                         |
| -------------- | ------------------------ | ----------------------------------- | -------------------------------------------- |
| כל משימה       | סוכן → `activity-log.md` | קובץ-עצמי                           | 6 שדות התיעוד-העצמי                          |
| כל משימה       | סוכן → ראש-צוות          | `control-report.md`                 | Outcome + Verdict + דגלים                    |
| סוף-מחזור      | ראש-צוות → מתווך         | `aggregate-report.md`               | קונסולידציית-צוות + סטטוס-דגלים              |
| סוף-מחזור / סף | מתווך → מועצה (מוטי)     | `aggregate-report.md`               | מצב-כללי + הכרעות-נדרשות + הסלמות            |
| לפי-אירוע      | סוכן → מתווך (דגל)       | `comms/` BROADCAST                  | הפרת-red-line / סחף קריטי (עוקף ראש-צוות)    |
| סוף-מחזור / סף | ענף-בקרה → מועצה (מוטי)  | `oversight-report.md`               | תמונת-בקרה בלתי-תלויה (**ישיר, עוקף-מתווך**) |
| לפי-אירוע      | ענף-בקרה → מועצה (עצירה) | `stop-orders-ledger.md` + BROADCAST | צו-עצירה קוורום-2/3 + ראיה (רק-מוטי-מבטל)    |

**עיקרון:** אין דיווח שמדלג שכבה כלפי-מעלה, פרט לדגל-חירום. ההכרעות חוזרות
תמיד דרך אותו ערוץ הפוך (מועצה → מתווך → ראש-צוות → סוכן).
