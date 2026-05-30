# 🎬 סרטון 07 — Stats + Feedback + Skill-Tree — PRIORITY-1

> **תוכן**: סטטיסטיקות + skill-tree dark-mode + wrong-answer-feedback מלא עם "הסבר לעומק". **30 frames** ייחודיים — העשיר ביותר!
> **משך**: 44 שניות · **גודל**: 21MB

## ⚠️ הסרטון הכי-קריטי לאנימציות-Gamification + Dark-Mode Tokens

---

## 📋 פרומפט לג'מיני — ניתוח פר-פריים (100ms)

```
אני בונה אפליקציית-לימוד בעברית (StudiBuilder) שמשחזרת UX של StudiesGo
ב-dark-mode-פרימיום. אתה מקבל סרטון 44 שניות של סטטיסטיקות, skill-tree,
wrong-answer-feedback, ו-deep-explanation. אני צריך לשחזר את-כל-האנימציות
ב-Framer-Motion + Tailwind.

⚡ חובה: תיאור פר-פריים ברזולוציה של 100ms.
   זמנים בפורמט MM:SS.ms.
   אל-תקצר — זה הסרטון העשיר-ביותר ואני צריך כל-פרט.

## חלק א' — Timeline פר-פריים מלא (00:00.000 → סוף)

עבור על-כל-הסרטון, ותן רישום כזה:

00:00.000 — [מסך-נוכחי, כל-האלמנטים הגלויים, צבעים, פוזת-מסקוט]
00:00.100 — [שינויים מ-100ms-קודמים, או "ללא-שינוי"]
...

חוקי-תיאור:
- תנועה: מאיפה לאן (px) + כיוון + easing משוער
- שינוי-צבע: hex-from → hex-to
- scale: מ-1.0 ל-1.X
- opacity changes: 0→1 או 1→0 + משך
- glow/shadow changes: על-מה הוא מופיע? איזה צבע? איזה רדיוס?

## חלק ב' — Deep-dive פר-50ms לאירועים-קריטיים

### B1. Wrong-Answer flow (אם יש)
- T=0 (רגע-הקלקה על-תשובה-שגויה): מצב-מסך-מלא
- T+50ms: מה השתנה?
- T+100ms: ...
- ... עד שלמודאל-הסבר-לעומק נפתח לחלוטין

### B2. Deep-Explanation modal opening
- האם זה slide-up? scale-in? backdrop-fade?
- timing מדויק לכל שלב

### B3. Skill-tree node-transition
- מ-locked ל-unlocked: איך נראית האנימציה?
- האם הקו-המעוקל מצוייר בהדרגה?
- האם יש pop-in של ה-node?

### B4. XP / Streak / Level animations (אם יש בסרטון)
- XP-counter: timing-of-count-up + easing
- Streak fire flicker: pattern + timing
- Level-up: כל-הרצף

### B5. Tab-switch ב-bottom-nav
- אם רואה מעבר בין-tabs: איך נראה ה-indicator?
- שינוי-תוכן-מסך: איזה transition?

## חלק ג' — Dark-Mode Design Tokens (קריטי!)

הוצא מהסרטון hex-codes משוערים:

1. **Background palette**:
   - bg-primary (הרקע-הראשי): hex
   - bg-secondary (cards): hex
   - bg-elevated (modals): hex
   - האם יש gradient ברקע? (linear / radial / כיוון / color-stops)

2. **Brand colors**:
   - primary-blue (כפתורים-ראשיים): hex
   - האם יש glow? איזה צבע + spread?
   - accent (כתום/אדום של XP/streak): hex
   - cyan/turquoise (אם יש סביב המסקוט): hex

3. **Functional colors**:
   - success (תשובה-נכונה): hex
   - error (תשובה-שגויה): hex
   - warning: hex
   - info: hex

4. **Text colors**:
   - heading (לבן/אפור-בהיר): hex
   - body: hex
   - muted: hex
   - link: hex

5. **Glassmorphism (bottom-nav וכו')**:
   - background עם opacity (rgba)
   - backdrop-blur amount (px)
   - border (color + opacity)

6. **Glows + shadows**:
   - על-מה יש glow? איזה צבע? איזה spread (px)?
   - drop-shadows על-cards: x/y/blur/color

7. **Border-radius**:
   - cards: px
   - buttons: px
   - input fields: px
   - bottom-nav: px (rounded-top?)

8. **Typography**:
   - font-family משוער
   - font-sizes: h1 / h2 / body / caption (px)
   - font-weights: regular / medium / bold

## חלק ד' — Mascot (Bob the robot)

- איזה pose בכל-מסך?
- האם יש cyan-glow מסביב? איזה רדיוס?
- האם הוא מצמץ? מתנדנד?
- תגובה-לאירועים — איזה pose-change ומתי?

## חלק ה' — Particle Effects (אם יש)

- האם רואה sparks/particles?
- מתי הם מופיעים?
- כיוון / משך / צבע

## חלק ו' — Sound + Haptic

לכל אירוע-עם-צליל: זמן + תיאור-הצליל.

## TL;DR

- **TOP-5 אנימציות הכי-מרשימות לשחזר** (לפי-עדיפות + סיבה)
- **Dark-mode tokens ב-JSON**: יצא tokens.json שאוכל להעתיק ל-Tailwind config
- **Easing-curves אופייניים**: מה ה-easing-של-StudiesGo? cubic-bezier(...)?
- **אם הייתי בונה את-זה מ-0**: סדר-יישום מומלץ

חזור בעברית. תיאור-מפורט. זה הסרטון-הכי-חשוב.
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
