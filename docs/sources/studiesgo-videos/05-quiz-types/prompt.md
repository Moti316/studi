# 🎬 סרטון 05 — Quiz Types Showcase + Page-Grid

> **תוכן**: 4 סוגי-שאלות בפעולה + page-grid לבחירת-עמודים (570 פריטים).
> **משך**: 50 שניות · **גודל**: 15MB

---

## 📋 פרומפט לג'מיני — ניתוח פר-פריים (100ms)

```
אני בונה אפליקציית-לימוד בעברית. אתה מקבל סרטון 50 שניות של 4 סוגי-שאלות
ב-StudiesGo (MCQ-long, MCQ-short, Matching, Explanation) + page-grid
של 570 פריטים. אני צריך לשחזר ב-Framer-Motion.

⚡ חובה: תיאור פר-פריים ברזולוציה של 100ms.
   זמנים: MM:SS.ms.

## חלק א' — Timeline מלא (00:00.000 → סוף, פר-100ms)

00:00.000 — [מסך + אלמנטים]
00:00.100 — [שינויים]
...

## חלק ב' — Deep-dive פר-50ms

### B1. מעבר בין סוגי-שאלות (4 פעמים)
- איזה transition בין-סוגים?
- timing + easing

### B2. MCQ-long (4 cards אנכיים)
- selection-animation פר-50ms (T=0 → T=400ms)
- border / background / scale change
- האם יש ripple? glow?

### B3. MCQ-short (2x2 grid)
- selection פר-50ms
- ההבדל מ-MCQ-long

### B4. Matching (זוגות)
- בחירת-פריט: animation
- השלמת-זוג: line-draw? color-pair?
- error feedback אם טועים

### B5. Explanation card
- כניסה: slide-up? scale? משך?
- אייקון 💡: יש animation?
- כפתור "המשך": pulse?

### B6. Page-grid (570 פריטים)
- scroll-behavior (smooth? momentum?)
- selection פר-50ms על-card
- "בחר הכל" → batch animation (stagger?)
- מונה "X/570 נבחרו" — count-up?

## חלק ג' — Design Tokens

Color, radius, shadows, typography — לכל סוג-שאלה בנפרד.

## חלק ד' — Sound + Haptic

## TL;DR

- "אנימציות-בחירה לכל סוג-שאלה" (4 דוגמאות)
- "Page-grid patterns לאמץ"

חזור בעברית, מפורט.
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
