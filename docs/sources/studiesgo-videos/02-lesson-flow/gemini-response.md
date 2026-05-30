# 02-lesson-flow — תגובת Gemini

> **קליטה**: 2026-05-30 · נותח על-ידי Gemini · 4KB טקסט

---

## חלק א' — Timeline פר-פריים מלא (רזולוציית 100ms)

### מצב התחלתי (00:00.000 - 00:09.400)

`00:00.000` — מסך שאלה מסוג התאמה. למעלה: סרגל-התקדמות, מד-אש (4), מד-XP (110). כותרת: "התאם בין בעל התפקיד לתחומי אחריותו". למטה: 2 עמודות של 3 כרטיסיות (מונחים מימין, הגדרות משמאל). כפתור תחתון "בדוק תשובה" disabled (תכלת-בהיר, opacity-מלאה אבל צבע-דהוי). אין מסקוט גלוי.
`00:00.100 → 00:09.400` — ללא שינוי.

### אינטראקציה 1: בחירת מונח ראשון

`00:09.500` — נגיעה בכרטיסיה הימנית-העליונה "ממונה בטיחות". Tap-down: scale 1.0→0.98.
`00:09.600` — שחרור. Border #E0E0E0 → #FFB74D. רקע מקבל גוון-כתום (opacity 0.05).
`00:09.700` — scale חוזר ל-1.0, easing **spring-stiff**.
`00:09.800 → 00:12.300` — ללא שינוי.

### אינטראקציה 2: התאמה ראשונה (Match)

`00:12.400` — נגיעה בכרטיסיה השמאלית-האמצעית "פיקוח על קיום הוראות החוק".
`00:12.500` — שמאלית-אמצעית: border-כתום זהה לזו שבימין.
`00:12.600` — שתי הכרטיסיות עוברות לסטטוס "הותאם" — border אפור-כהה, opacity 0.5. הכתום נעלם.
`00:12.700` — סיום-הדהייה של הזוג.

### אינטראקציה 3-6: זוגות נוספים (14.500-22.300)

שלושה זוגות באותו דפוס.

### הפעלת כפתור (00:22.400 — קריטי!)

`00:22.400` — **ברגע שכל 3 הזוגות הותאמו**:

- כפתור "בדוק תשובה" → Enable
- background #B3D4FF → #5C9CFF
- טקסט → לבן-בוהק
- scale: 1.0 → 1.02 → 1.0, **spring-bouncy**

### אינטראקציה 7: בדיקת התשובה (מצב טעות)

`00:32.100` — לחיצה על "בדוק תשובה". scale 0.95.
`00:32.200` — Bottom-sheet עולה מלמטה (y: 100% → 0). צבע אדום/ורוד.
`00:32.300` — אייקון-רובוט בחלק-עליון + טקסט "תשובה לא נכונה".
`00:32.400` — **במקביל**: גריד-הכרטיסים נעלם (opacity 1→0), במקומו רשימה אנכית.
`00:32.500` — פריטים: אדום=טעות, ירוק=הצלחה. כל-פריט slide-up (y 10→0, opacity 0→1).
`00:32.600` — אזור-"הסבר" מופיע (opacity 0→1).
`00:32.700` — כפתור-תחתון הופך ל-"המשך" בכחול-עז.
`00:32.800 → 00:42.000` — קריאה.

---

## חלק ב' — Deep-dives פר-50ms

### 2.1 — בחירת-כרטיסייה והתאמה

- **T-50ms**: סטטי, ימין כבר מסומן בכתום
- **T=0**: נגיעה. Scale 1.0→0.96 (50ms, ease-out)
- **T+50ms**: שחרור. Spring (stiffness:400, damping:25). Border→#FFB74D (no transition)
- **T+100ms**: זוג מזוהה. Fade-out
- **T+150ms**: opacity 1.0→0.5 (150ms linear). Border→#E5E7EB
- **T+200ms**: סיום. disabled-state

### 2.2 — הפעלת-כפתור "בדוק תשובה"

- **T-50ms**: תכלת-דהוי #A0C3FF, pointer-events:none
- **T=0**: זוג-אחרון הותאם. Background→#4B8DF8 (150ms)
- **T+50ms**: Pulse/Pop scale 1.0→1.04
- **T+100ms**: שיא 1.04. צבע מסיים-מעבר. טקסט→#FFFFFF
- **T+150ms**: 1.04→1.0 spring (stiffness:500, damping:15)

### 2.3 — תשובה-שגויה (Bottom Sheet + List Morph)

- **T-50ms**: אצבע משחררת "בדוק"
- **T=0**: **שני דברים במקביל**:
  1. גריד-מקורי opacity 1→0 (100ms)
  2. Drawer y "100%"→"0%"
- **T+50ms**: קונטיינר-תשובות-חדש. y:20, opacity:0. spring-in
- **T+100ms**: Drawer 70% גובה. רובוט: Scale 0→1.1 (spring stiffness:300, damping:12)
- **T+150ms**: Drawer ננעל (y:0). שגוי Border #FCA5A5 BG #FEF2F2 · נכון Border #86EFAC BG #F0FDF4
- **T+200ms**: רובוט 1.1→1.0. תיבת-הסבר BG #F0F7FF, fade-in

---

## חלק ג' — Design Tokens

### Color palette

| token              | hex                   | שימוש                  |
| ------------------ | --------------------- | ---------------------- |
| `bg-app`           | `#FFFFFF`             | רקע (light-mode)       |
| `primary-active`   | `#5A94FF` / `#4B8DF8` | כפתור enabled          |
| `primary-disabled` | `#BEE0FF` / `#A0C3FF` | כפתור disabled         |
| `accent-select`    | `#FFB23D` / `#FFB74D` | border-בחירה כתום      |
| `error-bg-drawer`  | `#FFF0F2`             | רקע bottom-sheet שגיאה |
| `error-border`     | `#FCA5A5`             | border-שגוי            |
| `error-bg-item`    | `#FEF2F2`             | רקע פריט-שגוי          |
| `success-border`   | `#86EFAC` / `#6AD386` | border-נכון            |
| `success-bg-item`  | `#F0FDF4`             | רקע פריט-נכון          |
| `explanation-bg`   | `#F0F7FF`             | תיבת-הסבר              |
| `text-primary`     | `#1F2937`             | טקסט-ראשי              |
| `text-secondary`   | `#9CA3AF`             | טקסט-משני / disabled   |
| `border-default`   | `#E0E0E0` / `#E5E7EB` | card-border רגיל       |

### Shape & Radius

- **Cards**: `radius:12px`, `border:1px solid` (flat, ללא shadow)
- **כפתור**: pill (`radius:9999px`)
- **Bottom-sheet**: `radius:16px` (פינות-עליונות)
- **Gap**: 12px

### Typography

- **Font**: Assistant או Rubik (משוער)
- **Card**: 14-16px · **Button**: 18px / 700 · **Title**: 20px / 700

---

## חלק ד' — Sound + Haptic

**הערת motilev8**: בסרטון אין-קול אבל יש-קול כאשר יש הסברים — יופיע בסרטונים-הבאים.

הצעות-Gemini (משוערות):

| אירוע                   | sound                  | haptic             |
| ----------------------- | ---------------------- | ------------------ |
| בחירת-כרטיס (00:09.500) | Pop קצר                | Light impact       |
| התאמת-זוג (00:12.600)   | Chime 2-תווים-בעלייה   | Medium impact      |
| הפעלת-כפתור (00:22.400) | Swoosh/Ding            | Medium impact כפול |
| שגיאה (00:32.200)       | Buzzer-מינורי "דא-דון" | Heavy "בום-בום"    |

---

## TL;DR

### 5 אנימציות הכי-חשובות

1. **Layout-swap (00:32)** — `<AnimatePresence>` + `layoutId`
2. **Pop-up רובוט (00:32.300)** — spring אלסטי (damping:12)
3. **הדלקת "בדוק" (00:22.400)** — color + scale-bump
4. **`whileTap={{ scale: 0.96 }}`** — קריטי לתחושת-מישוש
5. **התאמת-זוג ודהייה** — opacity 1→0.5

### Easing-default StudiesGo

**Spring כמעט-בכל-מקום**, לא cubic-bezier.

```ts
{ type: "spring", stiffness: 400, damping: 25 }  // כפתורים
{ type: "spring", stiffness: 300, damping: 12 }  // הופעת-רובוט (אלסטי)
{ type: "spring", stiffness: 500, damping: 15 }  // bump-pop
```

### סדר-יישום מומלץ

1. State (Context: selectedLeft, selectedRight, matchedPairs, status)
2. Card-component עם `whileTap`
3. Submit-button מאזין ל-`matchedPairs.length === 3`
4. Bottom-sheet drawer
5. Layout-morph עם `<AnimatePresence>` + stagger-list
