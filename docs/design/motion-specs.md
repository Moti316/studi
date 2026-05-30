# Motion Specs — StudiBuilder Animations

> **מקור**: ניתוח-Gemini מ-`docs/sources/studiesgo-videos/<NN>/gemini-response.md` + ניתוח-Claude מ-frames.
> **מטרה**: מפרט-מדויק לבניית-אנימציות ב-Framer-Motion ב-Phase 5-6.

## מצב סקירה

| סרטון                 | תגובת-Gemini        | פרסור | Framer-Motion variants  |
| --------------------- | ------------------- | ----- | ----------------------- |
| 02-lesson-flow        | ✅ קליטה 2026-05-30 | ✅    | ✅ (8 variants V1-V8)   |
| 07-stats-feedback     | ✅ קליטה 2026-05-30 | ✅    | ✅ (10 variants V9-V18) |
| 04-onboarding         | 🟡 ממתין            | -     | -                       |
| 01-create-course-flow | 🟡 ממתין            | -     | -                       |
| 05-quiz-types         | 🟡 ממתין            | -     | -                       |
| 06-settings-voices    | 🟡 ממתין            | -     | -                       |
| 03-messenger          | 🟡 ממתין            | -     | -                       |

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

## 📋 Variants מ-`07-stats-feedback` (10 אנימציות)

### V9 — Skill-Tree Path Drawing (SVG stroke-dashoffset)

**טריגר**: כניסה למסך-skill-tree (סרטון 07 ב-`00:03.200`).

```ts
// src/lib/animations/skill-tree.ts
export const pathDrawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }, // ease-out
  },
};

// שימוש: <motion.path d="..." variants={pathDrawVariants} initial="hidden" animate="visible" />
```

### V10 — Skill-Tree Active Node Pop-In + Glow

**טריגר**: רינדור-ראשון של node-פעיל בעץ-מסלול (`00:03.300`).

```ts
// src/lib/animations/skill-tree.ts
import { springs } from './_base';

export const activeNodeVariants = {
  hidden: { scale: 0, boxShadow: '0 0 0 rgba(26,86,219,0)' },
  visible: {
    scale: [0, 1.1, 1],
    boxShadow: '0 0 15px -3px rgba(26,86,219,0.5)', // glow-primary
    transition: { ...springs.elastic, times: [0, 0.7, 1] },
  },
};
```

### V11 — Skill-Tree Locked Node Reveal

**טריגר**: nodes-נעולים עולים אחרי active-node (`00:03.500`).

```ts
// src/lib/animations/skill-tree.ts
export const lockedNodeVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};
```

### V12 — Skill-Tree Unlock Sequence (3-stage)

**טריגר**: node-נעול → נפתח. Deep-dive B3.

```ts
// src/lib/animations/skill-tree.ts
export const unlockSequence = {
  // Stage 1: lock shakes + fades
  lockShake: {
    x: [0, -3, 3, -2, 2, 0],
    opacity: [1, 1, 1, 1, 0],
    transition: { duration: 0.2 },
  },
  // Stage 2: ripple ring expands
  ripple: {
    scale: [1, 1.5],
    opacity: [1, 0],
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  // Stage 3: new icon pops in
  iconPop: {
    scale: [0.5, 1],
    transition: { duration: 0.2, ...springs.pop },
  },
};
```

### V13 — Mascot Idle Float (Sine wave loop)

**טריגר**: idle-state של רובוט. רץ-תמיד.

```ts
// src/lib/animations/mascot.ts
export const mascotIdle = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut', // sine wave
    },
  },
};
```

### V14 — Mascot Success Reaction

**טריגר**: תשובה-נכונה / השלמת-שלב.

```ts
// src/lib/animations/mascot.ts
export const mascotSuccess = {
  animate: {
    y: -15,
    filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.8))', // glow מתחזק
    transition: { ...springs.elastic },
  },
};
```

### V15 — Mascot Error Reaction

**טריגר**: תשובה-שגויה.

```ts
// src/lib/animations/mascot.ts
export const mascotError = {
  animate: {
    y: 10,
    x: [0, -4, 4, -2, 2, 0], // shake קל
    filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.6))', // glow כתום/אדום
    transition: { duration: 0.4 },
  },
};
```

### V16 — Screen Shake (Wrong Answer)

**טריגר**: לחיצה על תשובה-שגויה. Deep-dive B1.

```ts
// src/lib/animations/feedback.ts
export const screenShake = {
  animate: {
    x: [0, -10, 10, -5, 5, 0], // 5 keyframes ב-250ms
    transition: { duration: 0.25, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
};
```

### V17 — Deep-Explanation Modal (Center-pop, NOT bottom-sheet)

**טריגר**: לחיצה על "הסבר מורחב". Deep-dive B2.

```ts
// src/lib/animations/modal.ts
export const centerModalVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { scale: 0.9, opacity: 0, transition: { duration: 0.15 } },
};

// Backdrop deepens at same time:
export const backdropDeepenVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: {
    opacity: 0.6,
    backdropFilter: 'blur(8px)',
    transition: { duration: 0.2 },
  },
};
```

### V18 — Bottom-Nav Tab Switch (Cross-fade with X-slide)

**טריגר**: החלפת tab ב-bottom-nav. Deep-dive B5.

```ts
// src/lib/animations/nav.ts
import { springs } from './_base';

export const tabIconActiveVariants = {
  inactive: { scale: 1, color: '#9CA3AF' },
  active: {
    scale: [0.8, 1.2, 1.1],
    color: '#1A56DB', // brand-primary
    transition: { duration: 0.2, times: [0, 0.5, 1] },
  },
};

// Screen content slide-cross-fade:
export const screenSwapVariants = {
  exit: { x: -20, opacity: 0, transition: { duration: 0.15 } },
  enter: { x: 20, opacity: 0 },
  active: { x: 0, opacity: 1, transition: { ...springs.button, delay: 0.1 } },
};
```

### Bonus — Confetti Particles (Success Celebration)

**טריגר**: השלמת-שלב / mastery. חלק-ה' של Gemini.

```ts
// src/lib/animations/particles.ts
// המלצה: react-confetti או tsParticles.
// הפרמטרים:
export const confettiConfig = {
  particleCount: 80,
  spread: 90,
  startVelocity: 30,
  decay: 0.94,
  gravity: 0.6,
  colors: ['#10B981', '#FBBF24', '#FFFFFF'],
  origin: { y: 0.8, x: 0.5 }, // מהמרכז-תחתון
  duration: 800,
};
```

---

## 🌙 Dark-Mode Design Tokens מ-`07-stats-feedback`

מעבר-ישיר ל-`tailwind.config.ts`:

```ts
// tailwind.config.ts (תוספת ל-darkMode tokens)
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#1A56DB',
        hover: '#1E40AF',
        cyan: '#06B6D4',
        cyanGlow: 'rgba(6, 182, 212, 0.4)',
      },
      background: {
        base: '#0B1120',       // app bg
        elevated: '#111827',   // surface-1
        card: '#1F2937',       // surface-2
        nav: 'rgba(17, 24, 39, 0.85)', // glassmorphism
      },
      state: {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        locked: '#374151',     // skill-tree disabled
      },
      text: {
        heading: '#F9FAFB',
        body: '#D1D5DB',
        muted: '#9CA3AF',
        link: '#3B82F6',
      },
    },
    boxShadow: {
      glowPrimary: '0 0 15px -3px rgba(26, 86, 219, 0.5)',
      glowCyan: '0 0 20px -5px rgba(6, 182, 212, 0.6)',
      cardFloat: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      innerNav: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    borderRadius: {
      card: '16px',
      button: '12px',
      pill: '9999px',
      modal: '24px',
      nav: '20px 20px 0 0',
    },
    fontFamily: {
      hebrew: ['Rubik', 'Assistant', 'sans-serif'],
    },
  },
}
```

**Bottom-Nav glassmorphism class** (לדוגמא):

```tsx
<nav className="bg-background-nav rounded-nav shadow-innerNav border-t border-white/10 backdrop-blur-md">
  {/* tabs */}
</nav>
```

---

## 🎬 Top-5 אנימציות-מרשימות (לפי-Gemini)

1. **Bottom-Sheet Spring** (V6) — תחושה אורגנית, קריטי ל-UX
2. **Skill-Tree Path Drawing** (V9) — מדגיש-התקדמות
3. **Mascot Idle Float** (V13) — "חי" גם בלי-אינטראקציה
4. **Tab Switch Transition** (V18) — החלפת-מסכים חלקה
5. **Wrong Answer Shake** (V16) — feedback פיזי-מיידי

---

### 🔴 גבוה (חובה ל-Phase 5)

- ✅ V1: Card Tap Feedback
- ✅ V2: Card Selected State
- ✅ V3: Matched-Pair Fade
- ✅ V4: Primary-Button Enable
- ✅ V5: Submit-Button Tap-Down
- ✅ V6: Bottom-Sheet Slide-Up
- ✅ V7: Robot Pop-In
- ✅ V8: Stagger Answer-List
- ✅ V9: Skill-Tree Path Drawing (מ-07)
- ✅ V10: Active-Node Pop-In + Glow (מ-07)
- ✅ V11: Locked-Node Reveal (מ-07)
- ✅ V12: Unlock Sequence 3-stage (מ-07)
- ✅ V16: Screen-Shake Wrong-Answer (מ-07)
- ✅ V17: Center-Modal Deep-Explanation (מ-07)

### 🟠 בינוני (Phase 6)

- ✅ V13: Mascot Idle Float (מ-07)
- ✅ V14: Mascot Success Reaction (מ-07)
- ✅ V15: Mascot Error Reaction (מ-07)
- ✅ Bonus: Confetti Particles (מ-07)
- 🟡 XP-counter count-up (ייתכן ב-07-שני-Pass אם נצטרך עוד דיוק)
- 🟡 Level-up burst (לא-נצפה בסרטון, נצטרך לעצב)
- 🟡 Streak-fire flicker (לא-מודגש בסרטון-07)

### 🟢 נמוך (Phase 7+)

- ✅ V18: Bottom-Nav Tab-Switch (מ-07)
- 🟡 Toast appear/dismiss (ממתין)
- 🟡 Daily-goal checkmark draw (ממתין)
- 🟡 Input focus-glow (ממתין ל-04)
- 🟡 Voice-preview animation (ממתין ל-06)

---

## TODO לפני-Phase-5

- [x] motilev8 מעביר תיאור-Gemini של סרטון 02 ✅
- [x] motilev8 מעביר תיאור-Gemini של סרטון 07 ✅
- [x] Claude מטמיע 18 variants + 2 sets-של-tokens (light + dark)
- [ ] בנייה: `src/lib/animations/` עם 18 variants + `_base.ts`
- [ ] בנייה: `tailwind.config.ts` — extend עם quiz-tokens + dark-tokens
- [ ] integration ב-`<MatchingPairs>` (Phase 5) — POC ראשון
- [ ] (אופציונלי) — קליטת 04-onboarding ל-empty-state-animations

---

## הערות-עבודה

- ה-quiz הוא **light-mode** (לא dark-mode)! ה-dark-mode בא מ-skill-tree (סרטון 07).
- ה-StudiBuilder יחזיק **שני-themes**: light לpages (quiz/lesson) + dark ל-navigation/skill-tree.
- צבעי-Tailwind שמתאימים ב-default-palette: `red-300/100`, `green-300/100`, `blue-500/300`, `amber-400/100`. ניתן-להשתמש בהם או להגדיר tokens-יחודיים.
