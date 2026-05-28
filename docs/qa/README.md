# QA Checklists

תיקייה זו מכילה checklists לבדיקות-ידניות שמשלימות את הבדיקות האוטומטיות (CI/E2E).

## מטרה

CI לוכד באגים פונקציונליים. QA ידני לוכד:
- בעיות-UX (לא ברור, לא נוח)
- בעיות RTL/i18n שאוטומציה לא חושפת
- regression ב-pixel-perfect design
- בעיות עברית-ספציפיות (טקסטים מעורבים, מספרים, תאריכים)

## מבנה

| קובץ | מתי | מי מבצע |
|---|---|---|
| `_template.md` | כל Phase | יוצא Phase lead |
| `phase-N-checklist.md` | סוף phase N | כל הצוות |
| `pre-release.md` | לפני Phase 9 deploy | release-manager |
| `security-audit.md` | Phase 9 + רבעוני | appsec |

## תהליך

1. **התחלת Phase**: lead מעתיק `_template.md` ל-`phase-N-checklist.md` ומתאם לפיצ'רים הספציפיים
2. **תוך כדי**: כל סוכן מוסיף בדיקות שעלו ב-implementation
3. **סוף Phase**: כל ה-checks מסומנים ✓ או documented-as-skipped
4. **PR merge**: רק אחרי checklist מאושר

## ביצועים

צוות לוקח 2-4 שעות לעבור על checklist מלא. תכננו זמן בסוף phase.

## פיצ'רים-מובנים

ה-template כולל בדיקות לפי קטגוריות:
- Mobile/desktop/tablet rendering
- Network throttling
- RTL + i18n
- a11y (axe + manual)
- Functional happy path + edge cases + regression
- Security + privacy
- Performance (Core Web Vitals)
- Visual diff vs StudiesGo (השוואה לצילומים)
