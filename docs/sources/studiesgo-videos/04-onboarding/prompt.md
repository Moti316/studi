# 🎬 סרטון 04 — Onboarding (First-Time UX)

> **תוכן**: login → welcome → input-של-שם-קורס → מצבים-ריקים → תחילת-יצירת-קורס. **20 frames** ייחודיים.
> **משך**: 37 שניות · **גודל**: 27MB (הגדול-ביותר)

---

## 📋 פרומפט לג'מיני — ניתוח פר-פריים (100ms)

```
אני בונה אפליקציית-לימוד בעברית. אתה מקבל סרטון 37 שניות של onboarding
ב-StudiesGo: login → welcome → empty-states → first-action. אני צריך
לשחזר ב-Framer-Motion.

⚡ חובה: תיאור פר-פריים ברזולוציה של 100ms.
   זמנים: MM:SS.ms.

## חלק א' — Timeline מלא (00:00.000 → סוף, פר-100ms)

00:00.000 — [תיאור-מסך-מלא, פוזת-מסקוט, צבעים]
00:00.100 — [שינויים, או "ללא-שינוי"]
...

ציין לכל-שינוי: תנועה (px + easing), צבעים (hex), scale, opacity, glow.

## חלק ב' — Deep-dive פר-50ms

### B1. כניסה למסך-login + ספקי-OAuth
- איך נראים הכפתורים? animation בכניסה?
- hover/focus states

### B2. Welcome / first-screen animation
- האם יש hero-animation?
- האם המסקוט מציג-עצמו? (slide-in + wave-hand?)
- האם יש onboarding-carousel?

### B3. Empty-state ב-dashboard
- איזה איור? robot-pose?
- ה-CTA "צור-קורס-ראשון": איך נראה? פולסציה?

### B4. Input של שם-קורס
- focus animation: border-glow? color-change?
- האם מקלדת-עברית עולה? (RTL?)
- ה-tip ("בחר שם קצר..."): מתי מופיע? איך?
- כפתור "המשך": מתי הופך לפעיל? color-change?

### B5. Transition מ-empty ל-action
- כשמשתמש לוחץ "צור קורס": איזה transition?
- האם יש confetti? slide-in?

## חלק ג' — Design Tokens

Color-palette, border-radius, shadows, typography.

## חלק ד' — Mascot

- pose בכל מסך-onboarding
- האם יש "first-meet" animation מיוחדת?

## חלק ה' — Sound + Haptic

## TL;DR

- "5 patterns של onboarding לאמץ"
- "Empty-states שצריך לעצב"

חזור בעברית, מפורט.
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
