# 07-stats-feedback — תגובת Gemini

> **קליטה**: 2026-05-30 · נותח על-ידי Gemini · 5KB טקסט · עשיר-במיוחד (dark-mode + skill-tree + particles + mascot)

מנתח את ה-UX והאנימציות מהרפרנסים ליצירת שחזור מדויק ב-Framer Motion ו-Tailwind עבור StudiBuilder. הפירוק מבוסס על זיהוי תבניות התנועה של הממשק.

## חלק א' — Timeline פר-פריים (רזולוציה של 100ms לאירועי מפתח)

מכיוון שהממשק בנוי על מעברים בין מסכים ומצבים, הנה הפירוק המדויק של רצפי האנימציה המרכזיים (Transitions) ברזולוציה הנדרשת:
**סצנה 1: מעבר ממסך בחירת קורס למסך טעינה (Mascot)**

- 00:00.000 — [מסך קורסים, כרטיסיות גלויות]. לחיצה על כרטיסיה. חיווי לחיצה: scale: 0.97, opacity: 0.9 על הכרטיסיה. משך: 100ms.
- 00:00.100 — מסך הקורסים מתחיל Fade-out. opacity: 1 -> 0. משך: 200ms. Easing: ease-in-out.
- 00:00.200 — רקע כחול כהה נטען.
- 00:00.300 — מסקוט (Bob) מתחיל להופיע במרכז. אנימציית Pop-in: scale: 0.5 -> 1.05, opacity: 0 -> 1.
- 00:00.400 — מסקוט מגיע לשיא הגודל (1.05).
- 00:00.500 — מסקוט מתייצב על scale: 1. תחילת לולאת ריחוף (Floating): תנועה על ציר Y, מעלה מטה בטווח של 8px-~.
  **סצנה 2: טעינת Skill-Tree (עץ מסלול)**
- 00:03.000 — מסך טעינה דוהה החוצה.
- 00:03.100 — רקע עץ המסלול מופיע.
- 00:03.200 — ציור קו המסלול (Dashed line). שימוש ב-SVG stroke-dashoffset מאפס למקסימום. משך: 600ms. Easing: ease-out.
- 00:03.300 — Node ראשון (פעיל) עושה Pop-in. scale: 0 -> 1.1. הילה כחולה נדלקת סביבו (Glow).
- 00:03.400 — Node ראשון מתייצב ל-scale: 1.
- 00:03.500 — Nodes נעולים (אפורים עם מנעול) מופיעים ב-Fade-in פשוט + תזוזה קלה מלמטה y: 10px -> 0.
  **סצנה 3: פתיחת Bottom Sheet (לחיצה על שלב במסלול)**
- 00:10.000 — לחיצה על Node. חיווי לחיצה (scale: 0.95).
- 00:10.100 — Backdrop שחור מתחיל לקבל opacity: 0 -> 0.6.
- 00:10.200 — המודאל התחתון מתחיל Slide-up. y: 100% -> 50%. Easing: Spring.
- 00:10.300 — המודאל מגיע ל-y: 10%. כפתור "התחל" בתוך המודאל מתחיל Fade-in.
- 00:10.400 — המודאל מתייצב ב-y: 0.

## חלק ב' — Deep-dive פר-50ms לאירועים קריטיים

### B1. Wrong-Answer flow (שחזור על בסיס התנהגות אפליקציות דומות)

- T=0 — לחיצה על התשובה.
- T+50ms — רקע הכפתור הופך לאדום (Error hex: #EF4444).
- T+100ms — תחילת Screen Shake. כרטיסיית השאלה זזה x: -10px. הופעת Backdrop אדום שקוף מאוד (rgba(239,68,68,0.1)).
- T+150ms — כרטיסיית השאלה זזה x: 10px.
- T+200ms — כרטיסיית השאלה זזה x: -5px.
- T+250ms — כרטיסיית השאלה זזה x: 5px, ומתייצבת.
- T+300ms — מודאל "Wrong Answer" (Bottom Sheet) מתחיל לעלות עם קפיצה קלה (Spring).

### B2. Deep-Explanation Modal Opening

- T=0 — לחיצה על "הסבר מורחב".
- T+50ms — ה-Backdrop הקיים מעמיק (Blur גדל ל-8px, שקיפות עולה).
- T+100ms — המודאל צומח ממרכז המסך למטה (לא Bottom sheet, אלא מודאל מרכזי). scale: 0.8 -> 1, opacity: 0 -> 1, y: 20px -> 0. Easing: type: "spring", stiffness: 300, damping: 25.
- T+250ms — תוכן המודאל (טקסט, אייקונים) מופיע ב-Staggered Fade-in (כל אלמנט באיחור של 50ms).

### B3. Skill-tree Node Transition (מנעול לפתוח)

- T=0 — אייקון המנעול מתחיל לרעוד (Shake עדין).
- T+100ms — המנעול נשבר/נעלם ב-Fade-out מהיר (scale: 1 -> 0).
- T+150ms — טבעת צבעונית (Primary Blue) מתחילה להתרחב מהמרכז החוצה (Ripple effect). scale: 1 -> 1.5, opacity: 1 -> 0.
- T+200ms — צבע ה-Node משתנה מאפור לכחול. אייקון השלב מופיע ב-Pop-in (scale: 0.5 -> 1).

### B5. Tab-switch ב-Bottom Nav

- T=0 — לחיצה על טאב חדש. הטאב הקודם מאבד את ה-Accent color וחוזר לאפור.
- T+50ms — בטאב החדש: האייקון מקבל scale: 0.8 -> 1.2.
- T+150ms — האייקון מתייצב ל-scale: 1.1. טקסט הטאב משנה צבע.
- T+200ms — תוכן המסך הראשי מתחלף: המסך הישן דוהה שמאלה (x: 0 -> -20px, opacity: 0), המסך החדש נכנס מימין (x: 20px -> 0, opacity: 1).

## חלק ג' — Dark-Mode Design Tokens (JSON)

הנה ה-Tokens לחילוץ ישיר ל-tailwind.config.js:

```json
{
  "theme": {
    "extend": {
      "colors": {
        "brand": {
          "primary": "#1A56DB",
          "hover": "#1E40AF",
          "cyan": "#06B6D4",
          "cyanGlow": "rgba(6, 182, 212, 0.4)"
        },
        "background": {
          "base": "#0B1120",
          "elevated": "#111827",
          "card": "#1F2937",
          "nav": "rgba(17, 24, 39, 0.85)"
        },
        "state": {
          "success": "#10B981",
          "error": "#EF4444",
          "warning": "#F59E0B",
          "locked": "#374151"
        },
        "text": {
          "heading": "#F9FAFB",
          "body": "#D1D5DB",
          "muted": "#9CA3AF",
          "link": "#3B82F6"
        }
      },
      "boxShadow": {
        "glowPrimary": "0 0 15px -3px rgba(26, 86, 219, 0.5)",
        "glowCyan": "0 0 20px -5px rgba(6, 182, 212, 0.6)",
        "cardFloat": "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        "innerNav": "inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      },
      "borderRadius": {
        "card": "16px",
        "button": "12px",
        "pill": "9999px",
        "modal": "24px",
        "nav": "20px 20px 0 0"
      },
      "fontFamily": {
        "hebrew": ["Rubik", "Assistant", "sans-serif"]
      }
    }
  }
}
```

_הערת עיצוב:_ ה-Bottom Nav משתמש ב-Glassmorphism. יש להגדיר לו ב-Tailwind: bg-background-nav backdrop-blur-md border-t border-white/10.

## חלק ד' — Mascot (Bob the robot)

- **פוזה בסיסית (Idle):** מרחף בעדינות. עיניים פקוחות. תנועת Y-axis רציפה (Sine wave, מחזור של 3 שניות, טווח של 10px).
- **Glow:** סביב האנטנה והפנים יש הילה חלשה בצבע Cyan (#06B6D4).
- **תגובה לטעינה (Loading):** העיניים (מסך) משדרות אנימציית "חשיבה" (נקודות רצות או מצמוץ איטי).
- **תגובה להצלחה:** מתרומם מעט למעלה (y: -15px), העיניים הופכות לקשתות מתעקלות (חיוך), ה-Glow מתחזק ברדיוס של 30px.
- **תגובה לטעות:** רועד קלות, יורד למטה (y: 10px), צבע המסך משתנה מ-Cyan לכתום/אדום.

## חלק ה' — Particle Effects

- **תשובה נכונה / השלמת שלב:**
  - **תזמון:** מיד עם הצגת המודאל הירוק התחתון.
  - **התנהגות:** Confetti / Sparks פורצים מהמרכז התחתון של המסך (מאחורי המודאל) כלפי מעלה והצדדים (צורת מזרקה).
  - **צבעים:** ירוק (#10B981), צהוב (#FBBF24), לבן.
  - **משך:** 800ms. Gravity effect מושך אותם חזרה למטה לאחר השיא. opacity יורד ל-0 במחצית השנייה של התנועה.

## חלק ו' — Sound + Haptic (תזמונים)

- 00:00.000 (לחיצה על קורס/כפתור): צליל "Tick" קצר וגבוה. Haptic feedback: Light.
- 00:03.300 (Node נפתח בעץ): צליל "Pop" או "Bloop" נוזלי. Haptic feedback: Medium.
- T=0 (תשובה נכונה): צליל Chime עולה (סולם מז'ורי). Haptic feedback: Success (שתי רעידות קצרות ועוקבות).
- T=0 (תשובה שגויה): צליל "Buzzer" עמום וקצר. Haptic feedback: Heavy/Rigid (רעידה אחת חזקה וארוכה יותר).

## TL;DR

### 1. TOP-5 אנימציות הכי-מרשימות לשחזר

1.  **Bottom Sheet Spring:** המודאל שעולה מלמטה עם קפיצה קטנה בסוף. נותן תחושה אורגנית ואפליקטיבית מאוד. (קריטי ל-UX).
2.  **Path Drawing בעץ המסלול:** אנימציית הקו המקווקו שמצטייר לאט מ-Node ל-Node. מדגיש התקדמות.
3.  **Mascot Idle Float:** הריחוף המתמיד של הרובוט שומר על המסך "חי" גם כשאין אינטראקציה.
4.  **Tab Switch Transition:** ההחלפה החלקה בין מסכים כאשר המסך היוצא דוהה הצידה והנכנס מגיע מהצד השני.
5.  **Wrong Answer Shake:** הפידבק הפיזי (ויזואלית) כשטועים — חובה באפליקציות לימוד למשוב מיידי.

### 2. Easing-curves אופייניים

StudiesGo משתמשים בשילוב של Spring לאלמנטים אינטראקטיביים ו-Bezier לטרנזישנים:

- **מודאלים וכפתורים (Spring):** ב-Framer Motion: transition={{ type: "spring", stiffness: 260, damping: 20 }}.
- **מעברי מסכים ו-Fade-ins (Bezier):** ב-Tailwind/Framer: cubic-bezier(0.4, 0, 0.2, 1) (מקביל ל-ease-out ב-Tailwind) עבור כניסות, ו-cubic-bezier(0.4, 0, 1, 1) ליציאות.

### 3. סדר-יישום מומלץ (מ-0 למלא)

1.  **שלד ותבנית (Layout & Tokens):** קונפגורציית Tailwind עם קובץ ה-JSON. בניית המסכים הסטטיים ב-Dark Mode.
2.  **מערכת המודאלים (Bottom Sheets):** בניית רכיב AnimatePresence ב-Framer Motion שמנהל את עליית המודאלים עם ה-Spring הנכון וה-Backdrop blur.
3.  **ה-Skill Tree:** פיתוח רכיב ה-SVG המצייר את הקווים (בעזרת motion.path) ואת ה-Nodes הקופצים.
4.  **המיקרו-אינטראקציות:** הוספת חיוויי לחיצה (whileTap={{ scale: 0.95 }}) לכל הכפתורים.
5.  **שילוב המסקוט ואפקטים (Polish):** הוספת אנימציית הריחוף לרובוט ומערכת ה-Particles לתשובות נכונות.
