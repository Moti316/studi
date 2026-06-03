# TODO · I — ציות ומוכנות-לאנץ׳ (Phase 9-10)

> שלב I ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: ⬜ פתוח (לא-חוסם v1) · תלות: חל על כל-השירות לציבור · בדיקה משפטית לפני מכירה · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

כל השירות-לציבור (התחברות · דשבורד · שיעורים · checkout) עומד בחובות-הציות בישראל לפני מכירה מסחרית: נגישות AA מאומתת + הצהרת-נגישות, מדיניות-פרטיות + תנאי-שימוש פעילים, זרימת ביטול-14-יום + גילוי-מלא בעמוד-מכירה, סליקה דרך ספק נושא-PCI עם חשבונית, בידוד service-role מאומת, וזכויות-נושא-מידע (עיון/ייצוא/מחיקה) מסופקות. ⚖️ בדיקה משפטית מקצועית (פרטיות + צרכנות + נגישות) הושלמה לפני מכירה.

## תלויות

חוסם: **מכירה מסחרית לציבור** — אסור לגבות תשלום בלי I3/I4/I2. **לא חוסם** את v1 (לימוד-אישי/אדמין). פותח: השקה כמוצר (Phase 10 — landing+checkout+ads). C5/I4 תלוי ב-Phase 8 (Credits) ובספק-סליקה. I1 נשען על בסיס-a11y הקיים (ARIA/מקלדת/ניגודיות) שכבר נבנה מהיסוד.

## תתי-משימות

- [ ] **I1** — נגישות: עמידה ב-ת"י 5568 (≈WCAG 2.0 AA) + הצהרת-נגישות · קריטריון-קבלה: audit axe ב-CI עובר ללא הפרות AA על כל מסך-ציבורי · Lighthouse a11y ≥90 (Gate-E) · עמוד `/accessibility` (הצהרת-נגישות) חי · FAB-נגישות פעיל · (לאמת: סף רכז-נגישות) · ref: [COMPLIANCE.md C2](../compliance/COMPLIANCE.md) · [build-roadmap Phase 9](../build-roadmap.md)
  - 📊 **מטא:** ⏱4h · 🤖2(accessibility-i18n, e2e-qa) · 💲$0 · 🟡 · ראש-צוות:quality-lead · — · אימות:Workflow
- [ ] **I2** — פרטיות: מדיניות-פרטיות + תיקון-13 (2025) · קריטריון-קבלה: עמוד `/privacy` חי + באנר/הסכמה לפני איסוף · אבטחה-לפי-רגישות (תקנות אבטחת-מידע 2017) · נוהל אירוע-אבטחה מתועד · (אם EU — עמידת GDPR · לאמת) · ref: [COMPLIANCE.md C3](../compliance/COMPLIANCE.md) · [EXECUTION-PLAN §שלב-5](../context/EXECUTION-PLAN.md)
  - 📊 **מטא:** ⏱3h · 🤖2(privacy-officer, content-writer) · 💲$0 · 🟡 · ראש-צוות:quality-lead · 🚩דורש-מוטי (משפטי) · אימות:solo
- [ ] **I3** — הגנת-צרכן: זכות-ביטול 14 יום + גילוי-נאות · קריטריון-קבלה: זרימת ביטול-עסקה (14 יום, תקנות מכר-מרחוק) ממומשת ובדוקה · גילוי-מלא בעמוד-מכירה (מחיר כולל מע"מ + זהות-עוסק) · עמוד תנאי-שימוש חי · ref: [COMPLIANCE.md C4](../compliance/COMPLIANCE.md) · [build-roadmap Phase 10](../build-roadmap.md)
  - 📊 **מטא:** ⏱3h · 🤖2(privacy-officer, content-writer) · 💲$0 · 🟡 · ראש-צוות:quality-lead · 🚩דורש-מוטי (משפטי) · אימות:solo
- [ ] **I4** — תשלומים: PCI/חשבונית · קריטריון-קבלה: סליקה דרך ספק נושא-רוב-נטל-PCI (Stripe/Cardcom/Tranzila) — ללא אחסון פרטי-כרטיס מקומי · הפקת חשבונית/מע"מ + רישום-עוסק · (תלוי Phase 8/10 · לאמת ספק) · ref: [COMPLIANCE.md C5](../compliance/COMPLIANCE.md) · [build-roadmap Phase 10](../build-roadmap.md)
  - 📊 **מטא:** ⏱3h · 🤖2(backend-engineer, appsec) · 💲$0 · 🔴 · ראש-צוות:quality-lead · 🚩דורש-מוטי · אימות:Workflow
- [ ] **I5** — service-role isolation (חופף C1 מ-M6) · קריטריון-קבלה: `SUPABASE_SERVICE_ROLE_KEY` server-only — לא דולף ל-client bundle · נוהל-secrets (secrets ב-`.env.local` בלבד, לא ב-commit) מאומת ע"י appsec · ref: [COMPLIANCE.md C1](../compliance/COMPLIANCE.md) · [EXECUTION-PLAN §שלב-5](../context/EXECUTION-PLAN.md)
  - 📊 **מטא:** ⏱1h · 🤖1(appsec) · 💲$0 · 🟢 · ראש-צוות:quality-lead · — · אימות:Workflow (security-review)
- [ ] **I6** — זכויות-נושא-מידע (מחיקה/ייצוא) · קריטריון-קבלה: מחיקה — `DeleteAccountModal` קיים → לאמת מחיקה-בפועל מ-DB · עיון/ייצוא נתוני-משתמש (export) ממומש · זכויות עיון/תיקון/מחיקה זמינות לנושא-המידע (תיקון-13) · ref: [COMPLIANCE.md C6](../compliance/COMPLIANCE.md) · [build-roadmap Phase 9](../build-roadmap.md)
  - 📊 **מטא:** ⏱3h · 🤖2(backend-engineer, privacy-officer) · 💲$0 · 🟡 · ראש-צוות:quality-lead · — · אימות:Workflow

## מסמכי-ייחוס (קרא לפני עבודה)

- [../compliance/COMPLIANCE.md](../compliance/COMPLIANCE.md) — מסמך-האב: 6 תחומי-חובה (נגישות/פרטיות/צרכנות/תשלומים/קניין-רוחני/קטינים) + task-force (privacy-officer מוביל) + backlog C1–C6 + כלל-זכויות name-clean.
- [../build-roadmap.md](../build-roadmap.md) — Phase 9 (Polish & Launch) + Phase 10 (Course-Site Factory) + Gates A–G (כולל Gate-E Lighthouse ≥90 a11y, Gate-G סקירת appsec/privacy).
- [../context/EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md) — §שלב-5 ציות (חל על כל-השירות · pre-launch · לא-חוסם-v1 · בדיקה משפטית לפני מכירה).

## החלטות פתוחות / הערות

- ⚖️ מסמך-עבודה פנימי — **לא ייעוץ משפטי.** בדיקה משפטית מקצועית (פרטיות + צרכנות + נגישות) חובה לפני מכירה.
- **name-clean:** חקיקה = נחלת-הכלל (ציטוט מותר); חומרי-מרצה = reference + שכתוב, ללא שמות בשום פלט.
- מיקום: Phase 9 (I1/I2/I6) → Phase 10 (I3/I4) · I5 ניתן כבר ב-v1/Phase-1.
- (לאמת): סף רכז-נגישות · חובת GDPR (תלוי קהל-EU) · בחירת ספק-סליקה.
