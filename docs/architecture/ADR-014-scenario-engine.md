# ADR-014 — מנוע-תרחישים (תרחישי-וועדה · scenario_walkthrough)

> סטטוס: **Accepted** · 2026-06-08 · מיני-קורס #1 מתוך 2 (תרחישים + פרויקט-גמר).
> קשור: [ADR-013](ADR-013-course-template.md) (תבנית-קורס) · [ADR-009](ADR-009-magen-inspiration.md) (firewall-מגן) · [ADR-011](ADR-011-import-pipeline.md) (צינור-ייבוא).

## הקשר

ועדת-ההסמכה ל"ממונה בטיחות" היא **בחינה אוֹרָלית מבוססת-תרחישים**: הנבחן מקבל מקרה
("הכיסא החם") ונדרש לנתח אותו במבנה-תשובה **3-חלקים**:

1. **פעולה-מיידית** — עצירת סכנת-חיים בשטח.
2. **גיבוי-חוקי** — ציטוט החקיקה הרלוונטית (תקנות/פקודה/סעיף).
3. **הנדסה-וניהול** — טיפול בשורש-הבעיה + מדרג-בקרות.

לכן תרחישים הם **מצב-התרגול הליבתי** לקורס, ומצדיקים סוג-שאלה ונגן ייעודיים —
נפרד מ-MCQ (שאלות-אמריקאיות) ומ-שו"ת-פתוח.

## ההחלטה

סוג-שאלה `scenario_walkthrough` + נגן `ScenarioWalkthrough`, מחווט ללולאת-השיעור.

### ארכיטקטורה

| שכבה      | קובץ                                                            | תפקיד                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **סכמה**  | `drizzle/schema.ts` → `scenarios`                               | title · background · data? · task · solution · rubric[] · scopeRefs · sourceRef · status · difficulty. CHECK: שאלת `scenario_walkthrough` חייבת `scenario_id`.                                       |
| **נגן**   | `src/features/lesson-player/components/ScenarioWalkthrough.tsx` | 3 פאזות: `work` (ניתוח-עצמי + טיוטה) → `review` (חשיפת פתרון-מומחה + סימון-מחוון) → `done` (ציון פר-קריטריון). ציון = self-assessment דטרמיניסטי (ללא LLM); עובר ב-`passThreshold` (ברירת-מחדל 0.6). |
| **טעינה** | `src/app/lesson/[id]/page.tsx` → `loadScenarios`                | join `scenario_id` → `ScenarioInput` · מפה לפי question-id · שאילתה רק כשיש שאלות-תרחיש.                                                                                                             |
| **ניתוב** | `src/features/lesson-player/LessonPlayer.tsx`                   | `case 'scenario_walkthrough'` → `ScenarioWalkthrough`; ציון-מחוון → `openGrade` → `ANSWER_OPEN` (התקדמות **בלי משוב-MCQ** · XP לפי-ציון). חוסר-נתונים → read-card fallback.                          |
| **טסטים** | `tests/unit/lesson-player/scenario-wiring.test.tsx`             | ניתוב · fallback · bypass-overlay.                                                                                                                                                                   |

**מימוש:** commit `4c91360` (חיווט). הרכיב עצמו נבנה קודם (POC · D1).

### צינור-התוכן (ייבוא + הרחבה)

1. **מקור:** קבצי-תרחישים ב-Drive (תיקיית "ממונה בטיחות 2025") — מבנה 3-חלקים.
   firewall: מוטי אישר "השראה+שימוש"; **name-clean** (אין שמות-מנטור) · **native**
   (לא copy/coupling לריפו-מגן).
2. **ייבוא:** parse → `scenarios` (rubric קבוע = 3 קריטריונים: פעולה-מיידית /
   גיבוי-חוקי / הנדסה-וניהול) + question (`scenario_walkthrough` · `scenario_id`).
3. **⚠️ הרחבה (דרישת-מוטי — "להרחיב, לא לסכם"):** כל `solution` מועשר משמעותית,
   **מעוגן-חקיקה** (RAG · `courses/safety-officer/sources/legislation/`) · ציטוט-תקנה
   פר-בקרה (אנטי-הזיה) · status='מוסקנא' עד content-verifier. דורש Gemini (מכסת
   free-tier יומית · billing=הרצה-מלאה).

## חלופות שנדחו

- **לקשר את ריפו-מגן כמנוע-ריצה** — נדחה (firewall · IP של איתן+שגיא · coupling · stack שונה). במקום: HYBRID — מחלצים מבנה-מוכח, כותבים native, name-clean.
- **לטפל בתרחישים כ-שו"ת-פתוח** (ExplanationCard) — נדחה (אובד המבנה 3-החלקים + המחוון).
- **ציון אוטומטי ב-Gemini בזמן-ריצה** — נדחה לעת-עתה (self-assessment דטרמיניסטי; Gemini-rubric = D4 עתידי, ללא שינוי-חוזה).

## השלכות

- ✅ מצב-תרגול נאמן-לוועדה (אוֹרָלי · 3-חלקים) · אפס-Gemini בזמן-ריצה (ציון דטרמיניסטי).
- ⚠️ איכות-התוכן תלויה בשלב-ההרחבה (מעוגן-חקיקה) — לא לדלג עליו.
- 🔜 מיני-קורס #2 (פרויקט-גמר · [FINAL-PROJECT.md](../../courses/safety-officer/FINAL-PROJECT.md)) ישתמש בתשתית דומה (JSA · מטריצת 4×4).
