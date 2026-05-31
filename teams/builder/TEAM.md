# TEAM.md — צוות builder (בנייה)

> מסמך-העוגן של צוות-הבנייה ב-StudiBuilder. כל סוכן קורא, לפי הסדר:
> [`../PROJECT-CONTEXT.md`](../PROJECT-CONTEXT.md) → [`../ORG.md`](../ORG.md) → קובץ זה →
> `identity.md` שלו → `memory.md` שלו → תדריך-המשימה. מעודכן: 2026-05-31.

---

## משימת-הצוות

צוות **builder** הוא זרוע-הבנייה-בפועל של StudiBuilder — 13 מומחי-תחום שמממשים את
פלטפורמת-ייצור-הקורסים בעברית (RTL, creator-gated, בסגנון Duolingo) **end-to-end**:
מהנתונים והשרת, דרך ה-pipeline של ה-AI (Gemini), ועד ה-UI, העיצוב, האנימציה
והנגישות. הצוות בונה מול **הסכמה-שבפועל** (לא מול ADR), ב-TDD-first, RTL/a11y
כאזרח-ראשון, ואפס-secrets בקוד.

**יעד-עוגן:** קורס "ממונה בטיחות בעבודה" מוכן-ללימוד לוועדת-ההסמכה של מוטי —
**2026-07-15** — וגם כזרע-המוצר-לשיווק (Phase-עתידי: Course-as-Product Factory).

**הצלחת-הצוות = פיצ'רים נכונים, נגישים, בטוחים ועמידים, שעוברים את שער-האיכות
של צוות quality, ונבנים בתוך ה-Stack המאושר (Next.js 15 + Supabase + Drizzle + Gemini)
בלי תלות-פרודקשן ב-NotebookLM ובלי תוכן-מומצא.**

---

## טבלת-חברים

| שם    | slug                     | תפקיד                                          |
| ----- | ------------------------ | ---------------------------------------------- |
| גיל   | `accessibility-i18n`     | Accessibility & i18n Engineer (RTL/a11y)       |
| עומר  | `backend-engineer`       | Backend Engineer (Next.js/Supabase)            |
| טל    | `cloud-specialist`       | Cloud / Self-Hosting Specialist                |
| שירה  | `content-writer`         | UX Writer / Content Designer                   |
| דנה   | `data-engineer`          | Data Engineer (סכמה/ETL/Drive)                 |
| מאיה  | `design-system`          | Design System Engineer                         |
| ארז   | `devops-engineer`        | DevOps Engineer (CI/CD)                        |
| ליאור | `frontend-engineer`      | Frontend Engineer (Web)                        |
| יעל   | `interaction-designer`   | Interaction Designer (אנימציה/גיימיפיקציה)     |
| איל   | `ml-engineer`            | ML Engineer (Gemini pipelines)                 |
| בר    | `notifications-engineer` | Notifications Engineer                         |
| אורי  | `ux-researcher`          | UX Researcher                                  |
| נטע   | `visual-designer`        | Visual Designer                                |

---

## גודל-הצוות

**13 סוכנים-מבצעים** + **1 ראש-צוות** = **14 חברים**.
כולם בשכבת `builder`, מודל `sonnet` (ראש-הצוות `opus`).

---

## ראש-הצוות

**יונתן** — `builder-lead` (מודל `opus`).
מרכז ומתאם את 13 המבצעים, מבקר את עבודתם מול ה-`identity.md` שלהם, מפעיל את
שער-האיכות הצוותי, מקבץ ל-[`control-report.md`](control-report.md), ומסלים למתווך.
זהותו המלאה: [`lead/identity.md`](lead/identity.md).

---

## קו-דיווח למתווך

זרימת-הדיווח (לפי [`../ORG.md`](../ORG.md)):

```
סוכן (13 המבצעים)  ──►  builder-lead (יונתן)  ──►  mediator (אמיר)  ──►  מועצה (מוטי)
   activity-log.md       control-report.md          aggregate-report.md     אישור-סופי
```

- **כל משימה:** הסוכן מתעד ב-`activity-log.md` שלו ותורם ל-[`control-report.md`](control-report.md).
- **סוף-מחזור:** יונתן מקבץ את `control-report.md` ומוסר ל-`mediator` (אמיר) ב-`aggregate-report.md`.
- **המתווך → מועצה:** אמיר מגיש למוטי מצב-כללי + הכרעות-נדרשות.
- **חריג-חירום:** הפרת red-line קריטית (secret שדלף / תוכן-מומצא שפורסם / סחף) →
  דגל מיידי דרך `comms/` BROADCAST, **עוקף את ראש-הצוות**, ישר למתווך.

ההכרעות חוזרות תמיד דרך אותו ערוץ הפוך: מועצה → מתווך → ראש-צוות → סוכן.

---

**בעלים:** `builder-lead` (יונתן) · **קבצי-צוות:** [`control-report.md`](control-report.md) ·
[`bugs-and-fixes.md`](bugs-and-fixes.md) · **מעודכן:** 2026-05-31.
