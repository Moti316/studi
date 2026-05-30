# Gemini Animation-Extraction Prompts

> **תהליך-עבודה**: motilev8 מעלה סרטון-StudiesGo ל-Gemini → מעתיק את אחד-הפרומפטים-הבאים → מקבל תיאור-מילולי → מעביר ל-Claude (כאן) → אני שומר ב-`motion-specs.md` ומיישם ב-Framer-Motion.

## למה דווקא Gemini ולא אני?

| יכולת                      | Claude (אני) | Gemini       |
| -------------------------- | ------------ | ------------ |
| ניתוח frames-סטטיים        | ✅ מצוין     | ✅           |
| native video understanding | ❌ אין       | ✅ יש        |
| timing-של-אנימציות         | ❌ צריך-לנחש | ✅ מדויק     |
| easing-curves              | ❌ צריך-לנחש | ✅ ניתן-לתאר |

---

## 🎬 פרומפט 1 — ניתוח-מלא של סרטון בודד (מומלץ)

העתק את הטקסט-הבא ל-Gemini יחד עם הסרטון:

```
אני בונה אפליקציית-לימוד בעברית בסגנון Duolingo. אתה מקבל סרטון screen-recording
של אפליקציה דומה (StudiesGo). אנא נתח אותו ותן תיאור-מפורט-במילים של:

1. **רצף-המסכים**: מה קורה כל-2-3 שניות (מסך → אירוע → מסך-הבא)
2. **אנימציות-מעבר** בין-מסכים:
   - סוג (slide / fade / zoom / spring)
   - כיוון (מימין? משמאל? מלמטה?)
   - משך-משוער (ms)
   - easing (linear / ease-out / spring-bouncy)
3. **Micro-interactions**:
   - מה קורה כשלוחצים על כפתור? (scale-down? ripple? glow?)
   - מה קורה ב-hover/focus? (אם נראה)
4. **אנימציות-של-מצבים-מיוחדים**:
   - תשובה-נכונה: איך נראית? (XP-counter? confetti? sound?)
   - תשובה-שגויה: רעידה? צבע-אדום? איך?
   - level-up / streak-up: אנימציה-מיוחדת?
   - loading: spinner מאיזה-סוג? skeleton?
5. **דמות-המסקוט (רובוט)**:
   - האם יש idle-animation? (נדנוד? מצמוץ?)
   - אילו מצבים-שונים? (שמח/עצוב/מופתע?)
   - איזה event מפעיל איזה מצב?
6. **אלמנטים-מתמשכים**:
   - XP-counter — איך הוא סופר? (linear? bounce?)
   - Streak-fire — האם הלהבה מהבהבת? איך?
   - Progress-dots — איך הם מתמלאים? כל-אחד בנפרד או בבת-אחת?
7. **Sound + haptic** (אם נראה/נשמע):
   - אילו אירועים מלווים בצליל?
   - תיאור-הצליל (ping / beep / chime / drum)
   - haptic feedback (אם נראה רטט-של-מכשיר)

החזר בעברית, מובנה לפי 7 הסעיפים-לעיל. סמן כל זמן ב-MM:SS של הסרטון.
```

---

## 🎯 פרומפט 2 — Deep-dive על אנימציה-ספציפית

כשרוצים לקבל ניתוח-עומק על רגע-אחד (לדוגמא: "מה קורה ברגע של תשובה-נכונה?"):

```
בסרטון המצורף, התמקד באירוע <תיאור-האירוע> שקורה סביב <MM:SS>.
תן תיאור פריים-אחר-פריים, ברזולוציה של 100ms (10 פריימים-לשנייה),
על:

- מה זז? לאן?
- מה מופיע? מה נעלם?
- מה משנה צבע?
- האם יש אפקטים חזותיים? (glow / blur / scale)
- האם יש פאוזה לפני האירוע-הבא? כמה זמן?

הסבר ב-עברית. אם יש easing-curve אופייני (spring? exponential-out?) ציין.
```

---

## 🎨 פרומפט 3 — Color-palette + Visual-tokens

מתאים פעם-אחת לקליטת-עיצוב-הכולל:

```
בסרטון, זהה ותעד:

1. **Color-palette** עם hex-codes משוערים:
   - Background (light + dark mode אם רואים)
   - Primary (כפתורים-ראשיים)
   - Accent (XP/streak/warnings)
   - Success / Error / Info
   - Text colors

2. **Typography**:
   - איזה font? (לפי-מראה — Heebo? Assistant? Rubik?)
   - גדלים-יחסיים (כותרת vs body vs caption)
   - weights (regular / medium / bold)

3. **Spacing-system**:
   - יחס-padding בכרטיסים
   - יחס-margin בין-אלמנטים
   - גובה-של-כפתורים-ראשיים

4. **Border-radius**:
   - כפתורים
   - כרטיסים
   - input fields
   - badges/pills

5. **Shadows + glows**:
   - האם יש drop-shadows? מה הצבע-והכיוון?
   - האם יש glow-effects (אור-עצמי)?

6. **Gradients**:
   - איפה משתמשים? (כפתורים? רקעים? אייקונים?)
   - direction (linear vertical? diagonal?)
   - color-stops

החזר ב-JSON או טבלה.
```

---

## 📋 איזה פרומפט-להפעיל-מתי?

| מטרה                     | פרומפט                   |
| ------------------------ | ------------------------ |
| תיאור-כללי-של-סרטון-חדש  | **1** (ניתוח-מלא)        |
| חקירה-עומק על-רגע-ספציפי | **2** (Deep-dive)        |
| איסוף-טוקנים-עיצוביים    | **3** (Color/Typography) |

---

## איך-אני-משתמש-בתוצאות

1. כשמוטי-מעביר תיאור מ-Gemini → אני שומר ב-`docs/design/motion-specs.md`
2. אני ממיר לסכמת-Framer-Motion עם variants ספציפיים:
   ```ts
   // src/lib/animations/correct-answer.ts
   export const correctAnswerVariants = {
     initial: { scale: 1, opacity: 1 },
     correct: {
       scale: [1, 1.1, 1],
       transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }, // spring-out
     },
   };
   ```
3. ב-Phase 5/6 — כל component-של-feedback ייטען את ה-variants-האלה
4. ה-design-tokens-מ-Gemini ייכנסו ל-`tailwind.config.ts` ול-`globals.css`

## הערה ל-motilev8

- **שמור** עותק של כל תגובה-של-Gemini ב-Google-Docs / Notes שלך כ-backup
- **כל סרטון** דורש פרומפט-1 בנפרד (לא להעביר ל-Gemini כמה-סרטונים-יחד)
- אם Gemini מסכם-קצר-מדי, שאל: "תוכל לתת תיאור-מפורט-יותר עם זמנים-מדויקים?"
- אם תיאור-הצבעים לא-מדויק — תוכל-תמיד לצלם-מסך וב-color-picker
