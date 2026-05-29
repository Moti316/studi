# ADR-007: Brand Identity — Layout, Mascot, Typography, Theme

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: visual-designer · interaction-designer · content-writer · motilev8
> **Phase**: 9 (visual polish)

---

## Context

StudiBuilder נבנה בהשראת StudiesGo — כדי לאמת ארכיטקטורה מהר. העיצוב הנוכחי (Phase 0–2) העתיק במכוון את ה-aesthetic של המקור: כחול `#1d6bf2`, כתום `#f47b29`, קמע רובוט "Bob". זה היה הגיוני כ-placeholder.

לקראת Phase 9 (polish & launch) נדרשת זהות עצמאית — אחת שנשמרת על העיצוב שעובד, אך מוסיפה אופי ייחודי.

ב-2026-05-29 התקיים דיון מעמיק (מתועד ב-`/root/.claude/plans/greedy-hopping-piglet.md`, חלק י"א). ארבעה כיווני-layout נשקלו, שלושה כיווני-מותג נמדדו, וארבעה כיווני-קמע הוצגו. המסמך הזה מתעד את ההחלטות שנסגרו.

---

## Decisions

### 1. Layout: Variant 1+3 — Hero Slider + Mascot-forward

**מה נבחר**: שילוב של שתי וריאנטים:

- **Variant 1 — Hero Slider**: כרטיסייה גדולה בראש מסך הבית, מתחלפת אוטומטית בין ארבעה מצבים:
  - "המשך לימוד" — קורס אחרון בתהליך
  - "קורס חדש מומלץ" — הצעה על-פי נושאים קודמים
  - "טיפ יומי" — תוכן קצר אחד ביום
  - "הישג" — XP / streak שהושגו לאחרונה
- **Variant 3 — Mascot-forward**: דמות-הקמע מוצגת בעמדה גדולה ומרכזית כ-focal point, לא כ-element שוליי

**Palette שנשמרת**:

| טוקן      | ערך                   | שימוש                    |
| --------- | --------------------- | ------------------------ |
| `bg-base` | `#0a1228` (dark navy) | רקע ראשי                 |
| `primary` | `#1d6bf2`             | כפתורים, קישורים, הדגשות |
| `accent`  | `#f97316`             | XP, streak, בחירה פעילה  |
| `card`    | `#111827` (dark-card) | כרטיסיות                 |

**Bottom Nav**: glassmorphism — `backdrop-blur` + `bg-white/5` + `border-white/10`. ארבעה tabs:

| אייקון     | תווית      | Route        |
| ---------- | ---------- | ------------ |
| בית        | בית        | `/dashboard` |
| קורסים     | קורסים     | `/courses`   |
| סטטיסטיקות | סטטיסטיקות | `/stats`     |
| הגדרות     | הגדרות     | `/settings`  |

---

### 2. קמע: דמות-אנושית סטיילייז (לא רובוט)

**מה נבחר**: דמות-אדם-מצויר/ה — אנושית, חמה, מקצועית. לא ינשוף, לא שועל, לא רובוט.

**הנחיות לעיצוב הדמות**:

- **מגדר**: עיצוב non-binary אפשרי — שיער, לבוש ותנוחה שאינם נוטים בבירור לצד אחד. ה-visual-designer יחליט בהצעת הסקיצות.
- **סגנון**: flat illustration, קווים נקיים, פלטת צבעים עקבית עם הממשק.
- **5 poses**:
  | Pose | מתי מוצגת |
  |---|---|
  | `curious` | מסכי-טעינה, שאלה ראשונה בשיעור |
  | `happy` | תשובה נכונה, השלמת שיעור |
  | `thinking` | עיבוד AI, "בודקים את המקור..." |
  | `proud` | level-up, הישג חדש, streak גבוה |
  | `sad` | תשובה שגויה, מסך שגיאה |
- **אביזרי-vertical**: הדמות יכולה לעטות אביזרים פר-נושא-קורס:
  - קסדת בטיחות — קורסי בטיחות בעבודה
  - כובע אקדמי — קורסי מקצוע כללי
  - חלוק מעבדה — קורסי מדע ואיכות
  - (ברירת-מחדל) ללא אביזר — generic / onboarding
- **פורמט**: SVG ראשי לכל pose, אופציה ל-Lottie לאנימציות עדינות (entering, idle loop).

**שם הדמות — לדיון בלבד (לא נסגר)**:

שלושה מועמדים עיקריים:

| שם       | טון                | הערות                                      |
| -------- | ------------------ | ------------------------------------------ |
| **דעת**  | רשמי-חם, מקצועי    | מילה עברית — ידע, חכמה. עובד לכל vertical. |
| **אבי**  | חברותי, נגיש       | שם מוכר, ניתן לאסוציה ל"אב-בית".           |
| **רוני** | ניטרלי-מגדרי, צעיר | עובד לדמות non-binary.                     |

הבחירה תיעשה לאחר שה-visual-designer יציג סקיצות. הסקיצות קובעות — השם יגיע אחרי הדמות, לא לפניה.

**קבצים מושפעים**:

- `src/components/auth/BobMascot.tsx` → ייקרא `MascotCharacter.tsx`
- ארבעה import-points יתעדכנו בהתאם
- ה-API (props: `pose`, `accessory?`, `size?`) יישמר — רק ה-SVG הפנימי יוחלף

---

### 3. Typography

**מה נבחר**: Heebo כ-font בסיסי — נשאר. אופציה ל-Frank Ruhl Libre לכותרות — נפתחת לבחינה בשלב ה-polish.

| שימוש               | Font                          | משקל     |
| ------------------- | ----------------------------- | -------- |
| גוף טקסט            | Heebo                         | 400, 500 |
| כפתורים, תוויות     | Heebo                         | 500, 700 |
| כותרות H1/H2        | **Frank Ruhl Libre** (לבחינה) | 700      |
| מספרים (XP, streak) | Heebo                         | 700      |

**הגיון**: Frank Ruhl Libre הוא font עברי עם אופי — קלאסי אך לא ישן. שילובו בכותרות בלבד מוסיף depth ומבחין את StudiBuilder מה-sans-only aesthetic של StudiesGo.

**תנאי לקבלה**: בדיקת קונטרסט WCAG-AA לכל שילוב font+color לפני שימוש. אם Frank Ruhl Libre גורם לבעיות RTL או קריאות, נשאר ב-Heebo בלבד.

**יישום**: `src/app/layout.tsx` — הוספת `next/font/google` עבור Frank Ruhl Libre לצד Heebo הקיים. טוקן: `font-display` ב-tailwind config.

---

### 4. Theme Support: Light + Dark

**מה נבחר**: תמיכה ב-light + dark, שתי ה-themes מוגדרות. ברירת-מחדל: dark.

**מצב נוכחי**: ה-infrastructure כבר קיים (`darkMode: 'class'` ב-tailwind.config), אך הממשק נבנה ל-dark בלבד בפועל.

**מה מתווסף ב-Phase 9**:

1. טוקנים נפרדים לכל theme ב-`src/app/globals.css`:
   ```
   :root          → light tokens (bg לבן, טקסט כהה)
   .dark          → dark tokens (bg navy, טקסט בהיר) ← ברירת-מחדל
   ```
2. `ThemeSelector` בהגדרות → persistence ל-Supabase `user_settings.theme`
3. בדיקת קונטרסט לשתי ה-themes לפני שחרור

**ברירת-מחדל**: dark mode — עקבי עם ה-aesthetic שנבחר.

---

## Alternatives Considered

### Layout: כיוון A — "אקדמיה רכה"

- פלטת קרם / ירוק-זית / טרקוטה, mascot ינשוף, Frank Ruhl Libre כדומיננטי
- ✅ מובחנות גבוהה מ-StudiesGo
- ❌ bg בז' יוצר קונטרסט-בעיה עם פלטת-כרטיסיות (דורש בדיקה מקיפה)
- ❌ שובר continuity עם Phase 0–2 — כל component צבעוני יצריך rewrite
- **נדחה**

### Layout: כיוון B — "Geometric Brutalist"

- לבן/שחור/צהוב, ללא mascot, Heebo Bold גדול
- ✅ מובחנות מקסימלית
- ❌ "קר" — לא מתאים לחוויית-לימוד שרוצה warmth
- ❌ שובר `BobMascot` API ב-4 מקומות + אין mascot = מאבדים focal point רגשי
- **נדחה**

### Layout: כיוון C — "ניאו-ירושלמי"

- קרם / זהב / תכלת-ים, שועל/אריה, Frank Ruhl Libre
- ✅ זהות ישראלית חזקה
- ❌ תכלת קרובה מדי ל-StudiesGo כחול
- ❌ סיכון kitsch — "ירושלמי" בעיצוב קל ליפול לאסוציאציות לא-רצויות
- **נדחה**

### Mascot: שועל-חכם "שולי"

- ✅ חמים, אסוציאציה לחכמה
- ❌ mascot שועל נפוץ מאוד (Firefox-adjacent)
- ❌ לא ניתרל-מגדרי — חיה בעלת אופי מגדרי חזק בתרבות הפופ
- **נדחה**

### Mascot: ינשוף "חוכמה"

- ✅ החוכמה הקלאסית, מוכר ב-edtech
- ❌ Duolingo owl — קרוב מדי
- ❌ לא עובד לאביזרי-vertical (ינשוף עם קסדת-בטיחות לא אמין)
- **נדחה**

### Mascot: מופשט "לומי"

- ✅ פוסט-מגדרי, ניקי
- ❌ פחות חם — מסך-שגיאה עם "לומי עצוב" לא מתחבר רגשית
- ❌ קשה לתקשורת poses שונים ב-SVG פשוט
- **נדחה**

### Typography: Heebo בלבד (ללא שינוי)

- ✅ אין סיכון, אין עבודה
- ❌ מאבדים הזדמנות ל-differentiation ויזואלי
- **נדחה — נפתח לבחינה** (Frank Ruhl Libre נכנס ל-evaluation, לא לנעילה)

---

## Consequences

### Positive

- ✅ continuity עם Phase 0–2 — 24 קומפוננטים שמשתמשים ב-token-names **לא משתנים**
- ✅ Hero Slider נותן ערך ממשי: ממשיך לימוד מיידי + הישגים בולטים
- ✅ דמות-אנושית עובדת לכל vertical ללא conflict (בטיחות, מדע, מקצוע)
- ✅ Glassmorphism bottom nav — ייחודי מספיק מבלי לשבור את ה-nav API
- ✅ Dark mode כברירת-מחדל עקבי עם dark navy palette
- ✅ Frank Ruhl Libre לכותרות — אופציה שלא שוברת דבר אם לא מתאימה

### Negative / Trade-offs

- ❌ BobMascot → MascotCharacter: שינוי-שם דורש עדכון 4 imports
- ❌ Hero Slider: קומפוננט חדש + auto-rotate logic + a11y (pause-on-focus)
- ❌ שם הדמות לא נסגר — נשאר כ-open decision עד סקיצות visual-designer
- ❌ Frank Ruhl Libre להורדה נוספת (web font request, ~10–15 KB)
- ❌ light theme דורש בדיקת קונטרסט מלאה — עבודה שלא הייתה קיימת ב-dark-only

### Neutral

- בדיקת a11y נדרשת לשתי ה-themes — זו עבודה שהייתה נדרשת בכל מקרה ב-Phase 9

---

## Validation

- [ ] Hero Slider עובר pause-on-focus (a11y: לא מסיח תשומת-לב כשמשתמש מנווט עם מקלדת)
- [ ] Hero Slider מציג ארבעת המצבים ב-mobile (390px) ללא overflow
- [ ] MascotCharacter.tsx מקבל `pose` ו-`accessory?` ומציג SVG נכון
- [ ] glassmorphism bottom nav נקרא ב-axe-core ב-0 contrast violations
- [ ] Frank Ruhl Libre (אם מאומץ): כל כותרת עוברת WCAG-AA contrast בשתי ה-themes
- [ ] dark theme + light theme: בדיקת Playwright ב-`dir=rtl` על `/dashboard` + `/settings`
- [ ] 24 קומפוננטים שמשתמשים ב-`primary-*`/`accent-*` — לא השתנה דבר ב-visual regression

---

## Open Decisions (לא נסגרו)

| שאלה                               | מי מחליט                   | מתי                |
| ---------------------------------- | -------------------------- | ------------------ |
| שם הדמות (דעת / אבי / רוני)        | motilev8 לאחר סקיצות       | לפני Phase 9       |
| Frank Ruhl Libre: כן/לא            | visual-designer + motilev8 | לאחר prototype קצר |
| light theme: עיצוב מלא             | visual-designer            | במסגרת Phase 9     |
| אנימציית idle-loop לדמות (Lottie?) | visual-designer + frontend | Phase 9            |

---

## References

- `/root/.claude/plans/greedy-hopping-piglet.md` — חלק י"א (הדיון המלא, 2026-05-29)
- ADR-001 — Stack (Tailwind, shadcn, dark mode class)
- ADR-004 — Dashboard Shell (BottomNav, StructureNav decisions)
- `tailwind.config.ts` — `colors.primary`, `colors.accent`, `darkMode: 'class'`
- `src/components/auth/BobMascot.tsx` — הקובץ שיעבור rename
- `docs/screens-spec/dashboard.md` — מפרט מסך הבית (Hero area)
