# TEAM.md — ענף-הבקרה `oversight`

> מסמך-העוגן של ענף-הבקרה העצמאי ב-StudiBuilder. נקרא אחרי
> [`../PROJECT-CONTEXT.md`](../PROJECT-CONTEXT.md) ו-[`../ORG.md`](../ORG.md), עם [`_oversight-protocol.md`](_oversight-protocol.md).
> מעודכן: 2026-06-03 · בעלים: `oversight-lead` (נדב).

---

## משימת-הענף

ענף-הבקרה הוא **המבקר הבלתי-תלוי** של StudiBuilder: גוף-ביקורת שמדווח **ישירות למועצה** (מוטי),
**מקביל למתווך** ולא כפוף לו — כי המתווך מקונסולד דיווחים _וגם_ מחליט מה עולה למועצה (מבקר את-עצמו).
הענף שובר את הלולאה הזו. הוא **רק מבקר** — אינו מבצע קוד/תוכן/ניתוב.

שתי זרועות-בקרה משלימות:

- **בקרה-חיצונית ("מבט-על")** — האם הביצוע נאמן לתוכנית-העבודה ולזרימת-הדיווח?
- **מבקר-תכנית-לימודים** — האם הקורס-כמכלול מכסה את התכנית-הרשמית, ללא תוכן out-of-curriculum?

הסמכות החתומה המרכזית: **צו-עצירה** (קוורום 2/3 + ראיה ב-`stop-orders-ledger.md`; עוצר מסלול עד אישור-מועצה; **רק מוטי מבטל**).

---

## חברי-הענף

### זרוע א' — בקרה-חיצונית (3 סוכנים) ✅

| שם   | slug                      | מודל   | מיקוד                                                                |
| ---- | ------------------------- | ------ | -------------------------------------------------------------------- |
| נדב  | `oversight-lead`          | `opus` | ראש-ענף — יוזם צו-עצירה · מנהל ledger · דו"ח-למועצה · ערוץ-ישיר-מוטי |
| עידו | `plan-compliance-auditor` | `opus` | מצליב `activity-log` ↔ TODO/EXECUTION-PLAN · מזהה סטייה-מתוכנית/סורר |
| הדס  | `process-audit-officer`   | `opus` | שלמות-זרימת-הדיווח (ORG §קצב) · מאתר דגלים-שנבלעו ע"י המתווך         |

### זרוע ב' — מבקר-תכנית-לימודים (3 סוכנים) ✅

| שם   | slug                      | מודל     | מיקוד                                                                          |
| ---- | ------------------------- | -------- | ------------------------------------------------------------------------------ |
| רותם | `curriculum-auditor-lead` | `opus`   | מבקר-תכנית-ראשי — מתאם · חותם · מסלים ל-`oversight-lead`                       |
| שני  | `coverage-auditor`        | `sonnet` | כיסוי כל נושאי-905018 + 57 scope (מול LEGISLATION-COVERAGE + coverage_tracker) |
| גיא  | `content-drift-auditor`   | `sonnet` | אפס תוכן out-of-curriculum ב-quiz/lessons · regulatory-watch (⏰10/2026)       |

**ראש-הענף:** נדב (`oversight-lead`, `opus`) — מרכז את שתי הזרועות ל-`oversight-report.md` יחיד למועצה.
**ראש זרוע-ב':** רותם (`curriculum-auditor-lead`, `opus`) — מסלים ל-`oversight-lead`.

**גודל:** 6 סוכנים (4 opus + 2 sonnet), ב-tier `oversight`.

---

## קו-דיווח (עצמאי — לא דרך המתווך)

```
חברי-הענף (5)  →  oversight-lead (נדב)  →  מועצה (מוטי)   [ערוץ-ישיר, עוקף-מתווך by-design]
                       ▲
       זרוע-ב' מסלימה דרך curriculum-auditor-lead (רותם)
```

- כל מבקר מתעד-עצמית ב-`<slug>/activity-log.md` ומדווח ל-`oversight-lead` (זרוע-ב' דרך רותם).
- `oversight-lead` מאחד ל-[`control-report.md`](control-report.md) → [`oversight-report.md`](oversight-report.md) **ישירות למועצה**.
- **צו-עצירה:** קוורום 2/3 → [`stop-orders-ledger.md`](stop-orders-ledger.md) → `<<BROADCAST>>` → עוצר מסלול עד אישור-מועצה.
- **אי-תלות במתווך:** הבקרה קוראת את תוצרי-המתווך (read-only) אך אינה מדווחת דרכו.

פרוטוקולים: [`_oversight-protocol.md`](_oversight-protocol.md) (סמכויות-הבקרה) · [`_curriculum-audit-protocol.md`](_curriculum-audit-protocol.md) (בדיקת-התכנית).
