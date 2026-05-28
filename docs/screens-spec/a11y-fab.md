# Accessibility FAB (Floating Action Button)

> **Phase**: 9 (full a11y polish) · Overlay component

## Purpose
כפתור-צף שפותח תפריט נגישות בכל עמוד. תקן לעמידה ב-תקנה ישראלית 5568 / WCAG 2.1 AA.

## Behavior
- כברירת-מחדל: מוצג בדסקטופ, מוסתר במובייל (toggle ב-settings)
- click → opens panel (sheet/drawer)
- panel sticky עד שמשתמש סוגר

## Panel options
- **גודל גוף**: A- / A / A+ (3 רמות + reset)
- **ניגודיות**: רגיל / גבוה / כהה-מהופך
- **הפסקת אנימציות** (prefers-reduced-motion override)
- **הדגש קישורים** (underline all links)
- **קורא-מסך פשוט** (TTS על hover)
- **סמן עכבר גדול**
- **רווח-שורה מורחב**
- "✕ סגור" + "↻ אפס הכל"

## Layout
```
[ floating button bottom-right ]
   ⓘ
   ↓ click
[ panel ───────────────┐
│ נגישות               │
│ [A-] [A] [A+]        │
│ ניגודיות:            │
│  ○ רגיל              │
│  ○ גבוה              │
│  ○ כהה               │
│ [☐ הפסק אנימציות]    │
│ [☐ הדגש קישורים]     │
│ [☐ סמן גדול]         │
│ [↻ אפס] [✕ סגור]    │
└──────────────────────┘
```

## Components
- `<A11yFab>` (sticky button)
- `<A11yPanel>` (Drawer / Sheet)
- `<FontSizeControl>`, `<ContrastControl>`, `<ToggleSetting>`

## Data
- LocalStorage: `a11y_settings` JSON
- CSS variables modified on root: `--font-scale`, `--contrast-mode`

## Acceptance
- [ ] settings persist across sessions
- [ ] all changes apply immediately (CSS variables)
- [ ] panel עצמה נגישה (keyboard nav, screen reader)
- [ ] תואם תקנה ישראלית 5568

## Source
ראיתי הזכרה ב-settings אבל לא צולם בפועל
