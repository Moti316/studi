# Motion Specs — StudiBuilder Animations

> **מקור**: ניתוח-של-Gemini-מ-סרטוני-StudiesGo (לפי `gemini-animation-prompts.md`) + ניתוח-נוסף-של-Claude מ-frames.
> **מטרה**: מפרט-מדויק-מספיק כדי לבנות אנימציות ב-Framer-Motion ב-Phase 5-6.

## מצב-נוכחי

🟡 **ריק** — ממתין לתיאורים מ-Gemini.

מוטי: כשתעביר תיאור — אדביק כאן ואמיר ל-Framer-Motion variants.

---

## תבנית-של-ערך (לשימוש-עתידי)

לכל אנימציה אעקוב לפי השדות-הבאים:

````markdown
### <שם-האנימציה>

**טריגר**: <מתי-זה-קורה>
**מקור-נצפה**: סרטון <NN> ב-<MM:SS>
**תיאור-מ-Gemini**:

> [paste here]

**פרשנות-טכנית (Claude)**:

- duration: <ms>
- easing: <type>
- keyframes: <list>

**Framer-Motion variant**:

```ts
export const <slug>Variants = {
  initial: { ... },
  animate: { ... },
  transition: { duration: 0.X, ease: [a, b, c, d] },
};
```
````

**שימוש-ב-component**:

- `<src/components/path-to-component.tsx>`

````

---

## אנימציות-לתעד (לפי-עדיפות)

### 🔴 גבוה (חובה ל-Phase 5)

1. **תשובה-נכונה** → XP+10 animation, scale-pulse, sound-cue
2. **תשובה-שגויה** → shake, צבע-אדום, robot-sad-pose
3. **מעבר-בין-שאלות** → slide-up/down
4. **progress-dots fill** → orange-dot fills sequentially
5. **streak-fire-animate** → להבה-מהבהבת idle
6. **lesson-complete** → mastery-celebration (confetti? particles?)

### 🟠 בינוני (Phase 6)

7. **XP-counter-up** → numbers count 0→10
8. **level-up-burst** → flash + scale + sparks
9. **daily-goal-complete** → checkmark-draw animation
10. **streak-broken** → fire-fades-out (sad transition)
11. **bob-mascot-idle** → blink + slight bobbing

### 🟢 נמוך (Phase 7+)

12. **button-press depth** → scale-down + shadow-loss
13. **input-focus glow** → border-color animate + glow
14. **toast-appear** → slide-down + bounce-stop
15. **modal-open** → backdrop-fade + content-scale-up
16. **bottom-nav-tab-switch** → indicator-slide

---

## עקרונות-מנחים (לפני שמקבלים specs מדויקים)

מ-frames של StudiesGo + best-practice של edtech-mobile:

- **משך-ברירת-מחדל**: 200-300ms לרובם
- **easing**: `ease-out` ליציאה, `spring(stiffness: 300, damping: 25)` לבא-לתוקף
- **scale**: 0.95-1.05 — לא יותר (יוצא-קומי)
- **opacity**: 0→1 ב-150ms, לא מהיר-יותר
- **transform-only** — לעולם לא `width/height/top/left` (יוצר reflow)
- **prefers-reduced-motion**: כל-אנימציה חייבת fallback-instant

## Framer-Motion baseline

לכל הקובץ — config-בסיסי:

```ts
// src/lib/animations/_base.ts
export const motionBase = {
  spring: { type: 'spring', stiffness: 300, damping: 25 } as const,
  fast: { duration: 0.15 } as const,
  base: { duration: 0.25 } as const,
  slow: { duration: 0.4 } as const,
};

export const respectReducedMotion = (variants: any) => {
  if (typeof window === 'undefined') return variants;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduced ? { initial: {}, animate: {} } : variants;
};
````

---

## TODO לפני-Phase-5

- [ ] motilev8 מעביר תיאור-Gemini של סרטון 02 (lesson-flow) — הכי-קריטי
- [ ] motilev8 מעביר תיאור-Gemini של סרטון 07 (stats-feedback) — XP/streak/level-up
- [ ] Claude מתרגם 2 התיאורים האלה לפחות-ל-6 Framer-Motion variants
- [ ] בנייה ראשונה של `src/lib/animations/` עם 6 variants
- [ ] integration ב-`<QuizPlayer>` ב-Phase 5
