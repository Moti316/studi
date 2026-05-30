# 🎬 סרטון 01 — Create-Course Flow

> **תוכן**: 5 שלבי-יצירת-קורס — drag-drop → topic-confirm → page-selector (570 פריטים) → cost-confirmation → 5-stage processing animation.
> **משך**: 49 שניות · **גודל**: 16MB

---

## 📋 פרומפט לג'מיני — ניתוח פר-פריים (100ms)

```
אני בונה אפליקציית-לימוד בעברית שמשחזרת את StudiesGo. אתה מקבל סרטון
49 שניות של תהליך-יצירת-קורס-5-שלבי. אני צריך לשחזר ב-Framer-Motion.

⚡ חובה: תיאור פר-פריים ברזולוציה של 100ms.
   זמנים: MM:SS.ms (לדוגמא 00:12.450).

## חלק א' — Timeline מלא (00:00.000 → סוף, פר-100ms)

00:00.000 — [מה רואים: מסך, אלמנטים, צבעים]
00:00.100 — [שינויים, או "ללא שינוי"]
...

ציין לכל-שינוי:
- תנועה (מאיפה-לאן, easing)
- שינוי-צבע (hex-from → hex-to)
- scale / opacity
- glow / shadow

## חלק ב' — Deep-dive פר-50ms לאירועים-מפתח

### B1. מעבר-בין-שלבים (5 פעמים בסרטון)
- איזה transition? (slide-up? fade? scale?)
- משך + easing

### B2. "בודקים את המקור..." loader
- איזה loader? (spinner / progress-bar / pulsing-dots)
- timing-of-loop
- מה קורה אחרי 100% (transition לתוצאה)

### B3. Page-grid scroll behavior
- האם יש sticky-header?
- selection-state-change של card (50ms-by-50ms)
- בחירת "בחר הכל": איך מתעדכן ה-grid? (stagger? batch?)
- המונה "X/570 נבחרו": איך מתעדכן? count-up?

### B4. Credits-counter (15 → 23)
- האם זה count-up animation?
- timing + easing
- האם יש צבע-שמשתנה?

### B5. 5-stage processing animation
- כל-שלב: איך נראה? מה ההבדל מהשלב-הקודם?
- מעבר בין-שלבים: animation?
- האם המסקוט (Bob) משתנה לפי-שלב?

## חלק ג' — Design Tokens שזוהו

- Color-palette (hex): bg / primary / accent / success / muted / text
- Border-radius: card / button / input
- Shadow + glow (color + spread)
- Typography (family, sizes, weights)

## חלק ד' — Mascot poses + transitions

- איזה pose בכל-שלב מ-1 עד 5?
- idle-animation? (blink, bobbing)
- transition בין-poses

## חלק ה' — Sound + Haptic

זמן + תיאור-צליל לכל-אירוע.

## TL;DR

- "5 האנימציות הכי-חשובות לשחזר ב-create-course"
- "Easing-default של ה-flow"
- "סדר-יישום מומלץ"

חזור בעברית. אל-תקצר.
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
