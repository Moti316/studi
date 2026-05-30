# Motion Specs — StudiBuilder Animations

> **מקור**: ניתוח-Gemini מ-`docs/sources/studiesgo-videos/<NN>/gemini-response.md` + ניתוח-Claude מ-frames.
> **מטרה**: מפרט-מדויק לבניית-אנימציות ב-Framer-Motion ב-Phase 5-6.

## מצב סקירה

| סרטון                 | תגובת-Gemini        | פרסור | Framer-Motion variants |
| --------------------- | ------------------- | ----- | ---------------------- |
| 02-lesson-flow        | ✅ קליטה 2026-05-30 | ✅    | ✅ (8 variants)        |
| 07-stats-feedback     | 🟡 ממתין            | -     | -                      |
| 04-onboarding         | 🟡 ממתין            | -     | -                      |
| 01-create-course-flow | 🟡 ממתין            | -     | -                      |
| 05-quiz-types         | 🟡 ממתין            | -     | -                      |
| 06-settings-voices    | 🟡 ממתין            | -     | -                      |
| 03-messenger          | 🟡 ממתין            | -     | -                      |

---

## Framer-Motion Baseline (ל-`src/lib/animations/_base.ts`)

מבוסס על מסקנת-Gemini: **StudiesGo משתמש כמעט-בלעדית ב-Spring, לא ב-cubic-bezier**.

```ts
// src/lib/animations/_base.ts

export const springs = {
  /** כפתורים, micro-interactions, scale-bumps */
  button: { type: 'spring', stiffness: 400, damping: 25 } as const,

  /** הופעת-אלמנטים גדולים (cards, modals, robot) — אלסטי-יותר */
  elastic: { type: 'spring', stiffness: 300, damping: 12 } as const,

  /** Pop animations — מהיר עם bounce */
  pop: { type: 'spring', stiffness: 500, damping: 15 } as const,

  /** Layout transitions (האנימציה הסטנדרטית של AnimatePresence) */
  layout: { type: 'spring', stiffness: 350, damping: 30 } as const,
};

export const durations = {
  fast: 0.05,
  base: 0.15,
  medium: 0.25,
  slow: 0.4,
};

export const respectReducedMotion = <T extends Record<string, unknown>>(
  variants: T,
): T | { initial: object; animate: object } => {
  if (typeof window === 'undefined') return variants;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduced ? { initial: {}, animate: {} } : variants;
};
```

---

## 📋 Variants מ-`02-lesson-flow` (8 אנימציות)

### V1 — Card Tap Feedback (`whileTap`)

**טריגר**: לחיצה על כרטיס-תשובה (MCQ / Matching).
**מקור**: סרטון 02 ב-`00:09.500`.

```ts
// src/lib/animations/card.ts
import { springs } from './_base';

export const cardTap = {
  whileTap: { scale: 0.96 },
  transition: { ...springs.button, duration: 0.05 },
};

// שימוש:
// <motion.div {...cardTap}>...</motion.div>
```

### V2 — Card Selected State (border-color flip)

**טריגר**: בחירת-כרטיס (לפני-התאמה).
**מקור**: `00:09.600`.

```ts
// src/lib/animations/card.ts
export const cardSelectedVariants = {
  unselected: {
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255, 178, 61, 0)', // no orange tint
  },
  selected: {
    borderColor: '#FFB23D',
    backgroundColor: 'rgba(255, 178, 61, 0.05)', // 5% orange tint
    transition: { duration: 0 }, // no transition — immediate flip
  },
};
```

### V3 — Matched-Pair Fade (סיפוק-של-הצלחה)

**טריגר**: שני כרטיסים מותאמים → דהייה ל-disabled.
**מקור**: `00:12.600` (T+150ms).

```ts
// src/lib/animations/card.ts
export const matchedPairVariants = {
  matched: {
    opacity: 0.5,
    borderColor: '#E5E7EB',
    transition: { duration: 0.15, ease: 'linear' },
  },
};
```

### V4 — Primary-Button Enable (Color + Pop)

**טריגר**: `matchedPairs.length === total` → כפתור-"בדוק" מופעל.
**מקור**: `00:22.400` (Deep-dive 2.2).

```ts
// src/lib/animations/button.ts
import { springs } from './_base';

export const submitButtonVariants = {
  disabled: {
    backgroundColor: '#A0C3FF',
    color: '#FFFFFFCC', // half-opacity white text
    scale: 1,
  },
  enabled: {
    backgroundColor: '#4B8DF8',
    color: '#FFFFFF',
    scale: [1, 1.04, 1], // pop sequence
    transition: {
      backgroundColor: { duration: 0.15 },
      color: { duration: 0.15 },
      scale: { ...springs.pop, times: [0, 0.5, 1] },
    },
  },
};
```

### V5 — Submit-Button Tap-Down

**טריגר**: לחיצה על "בדוק תשובה".
**מקור**: `00:32.100`.

```ts
// src/lib/animations/button.ts
export const submitButtonTap = {
  whileTap: { scale: 0.95 },
  transition: { ...springs.button, duration: 0.05 },
};
```

### V6 — Bottom-Sheet Slide-Up (Error Drawer)

**טריגר**: תשובה-שגויה / נכונה → drawer עולה.
**מקור**: `00:32.200` (Deep-dive 2.3).

```ts
// src/lib/animations/bottom-sheet.ts
import { springs } from './_base';

export const bottomSheetVariants = {
  hidden: { y: '100%', opacity: 1 },
  visible: {
    y: '0%',
    transition: { ...springs.layout },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// שימוש:
// <AnimatePresence>
//   {isOpen && (
//     <motion.div variants={bottomSheetVariants} initial="hidden" animate="visible" exit="exit">
//       ...
//     </motion.div>
//   )}
// </AnimatePresence>
```

### V7 — Robot Pop-In (Elastic Mascot Entry)

**טריגר**: bottom-sheet נפתח → רובוט קופץ.
**מקור**: `00:32.300` (Deep-dive 2.3, T+100ms).

```ts
// src/lib/animations/mascot.ts
import { springs } from './_base';

export const robotPopVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: [0, 1.1, 1], // overshoot ואז settle
    transition: {
      ...springs.elastic, // stiffness: 300, damping: 12
      times: [0, 0.7, 1],
      duration: 0.4,
    },
  },
};
```

### V8 — Stagger Answer-List (תוצאות-תשובה)

**טריגר**: bottom-sheet נפתח → רשימת-תשובות slide-up.
**מקור**: `00:32.500`.

```ts
// src/lib/animations/answer-list.ts
import { springs } from './_base';

export const answerListContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // 50ms בין-פריטים
      delayChildren: 0.1, // המתנה ל-drawer
    },
  },
};

export const answerListItem = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { ...springs.button },
  },
};

// שימוש:
// <motion.ul variants={answerListContainer} initial="hidden" animate="visible">
//   {items.map(i => (
//     <motion.li key={i.id} variants={answerListItem}>...</motion.li>
//   ))}
// </motion.ul>
```

---

## 🎨 Design Tokens מ-`02-lesson-flow` (Light-Mode Quiz)

מעבר ל-`tailwind.config.ts`:

```ts
// tailwind.config.ts (תוספת ל-colors)
colors: {
  quiz: {
    bg: '#FFFFFF',
    primary: { active: '#4B8DF8', disabled: '#A0C3FF' },
    accent: '#FFB23D', // border-בחירה כתום
    success: {
      border: '#86EFAC',
      bg: '#F0FDF4',
    },
    error: {
      border: '#FCA5A5',
      bg: '#FEF2F2',
      drawer: '#FFF0F2',
    },
    explanation: '#F0F7FF',
    text: { primary: '#1F2937', secondary: '#9CA3AF' },
    border: { default: '#E5E7EB' },
  },
}
```

**Shape tokens**:

```ts
borderRadius: {
  'card': '12px',
  'sheet-top': '16px 16px 0 0',
  'pill': '9999px',
},
```

---

## 📚 רשימת אנימציות-לתעד (סטטוס מעודכן)

### 🔴 גבוה (חובה ל-Phase 5)

- ✅ V1: Card Tap Feedback
- ✅ V2: Card Selected State
- ✅ V3: Matched-Pair Fade
- ✅ V4: Primary-Button Enable
- ✅ V5: Submit-Button Tap-Down
- ✅ V6: Bottom-Sheet Slide-Up
- ✅ V7: Robot Pop-In
- ✅ V8: Stagger Answer-List
- 🟡 V9: Layout-morph grid→list (ממתין ל-deep-dive)
- 🟡 V10: Progress-dots fill (ממתין ל-סרטון-07)
- 🟡 V11: Streak-fire flicker (ממתין ל-07)

### 🟠 בינוני (Phase 6)

- 🟡 XP-counter count-up (ממתין ל-07)
- 🟡 Level-up burst (ממתין ל-07)
- 🟡 Daily-goal checkmark draw (ממתין)
- 🟡 Robot idle (blink + bobbing) (ממתין ל-07)

### 🟢 נמוך (Phase 7+)

- 🟡 Toast appear/dismiss (ממתין)
- 🟡 Modal open/close (ממתין)
- 🟡 Bottom-nav tab-switch (ממתין ל-07)
- 🟡 Input focus-glow (ממתין ל-04)

---

## TODO לפני-Phase-5

- [x] motilev8 מעביר תיאור-Gemini של סרטון 02 ✅
- [ ] motilev8 מעביר תיאור-Gemini של סרטון 07
- [ ] Claude מאמת את-הנקודות-החסרות (V9, V10, V11) אחרי קליטת-07
- [ ] בנייה: `src/lib/animations/` עם 8 variants V1-V8 מ-02
- [ ] בנייה: `tailwind.config.ts` עם design-tokens של quiz
- [ ] integration ב-`<MatchingPairs>` (Phase 5) — POC

---

## הערות-עבודה

- ה-quiz הוא **light-mode** (לא dark-mode)! ה-dark-mode בא מ-skill-tree (סרטון 07).
- ה-StudiBuilder יחזיק **שני-themes**: light לpages (quiz/lesson) + dark ל-navigation/skill-tree.
- צבעי-Tailwind שמתאימים ב-default-palette: `red-300/100`, `green-300/100`, `blue-500/300`, `amber-400/100`. ניתן-להשתמש בהם או להגדיר tokens-יחודיים.
