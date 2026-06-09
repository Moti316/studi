# DESIGN-PLAN-A — StudiesGo-Faithful · משחקי-תוסס

> **כיוון:** A · **אתוס:** הכי-קרוב-ל-StudiesGo — מסקוט מונפש, צבעוניות-תוססת, חוויית-Duolingo, גיימיפיקציה בקדמת-הבמה. מזמין, כיפי, ממכר.
> **מוצר:** StudiBuilder · קורס-ראשון "ממונה בטיחות" (לימוד-אישי-לוועדה **וגם** מוצר-לשיווק · creator-gated).
> **גרסה:** 1.0 · **תאריך:** 2026-06-04 · **שפה:** עברית RTL כאזרח-ראשון.
> **צוות:** interaction-designer · visual-designer · design-system · frontend-engineer · accessibility-i18n.
>
> 🎨 **כיוון-חזותי:** StudiesGo = מקור-ההשראה-החזותי **היחיד** (נשאר בתוקף — כיוון-עיצוב, לא firewall-IP). שאלון-ה-onboarding נכתב מהשראת-`docs/IDEAS.md` "Personalized Study-Path".
> 🔧 **FIREWALL מגן — בוטל 2026-06-09 (REVERSED · [ADR-009](../architecture/ADR-009-magen-integration.md)):** ~~אסור להעתיק קוד/תוכן/prompts ממערכת "מגן" (megen); native-בלבד · אפס-העתקה.~~ **כעת port-permitted** — מותר לפורט את פרומפט-המאסטר של מגן name-cleaned (מוטי בעל-שני-הריפו → אפס-licensing); megen נשאר מבודד (read-only · תוכן-פרומפט בלבד · לא מנוע-Python).

---

## 0. תזת-הכיוון בפסקה אחת

כיוון-A לוקח את חתימת-StudiesGo — ניגוד **כחול↔כתום**, כפתורי-pill, כרטיסי-light-flat, glass-dark-nav, מסקוט-מרחף-עם-glow ו-**spring-בכל-מקום** — ומגדיל אותה אל מלוא-עוצמתה: מסקוט "רוני" עם **קסדת-בטיחות כתומה** שמגיב לכל פעולה, מוני-XP ו-streak שחיים-ונושמים בקדמת-המסך, confetti בכל-הישג, ו-skill-tree dark-mode שמרגיש כמו מפת-משחק. זהו הכיוון ה"כיפי-ביותר" — הכי-מזמין, הכי-ממכר, אבל **בוגר ומלוטש** (קהל ממוני-בטיחות, לא ילדים): הגיימיפיקציה **מניעה, לא מסיחה**, וה-`AiNotice` + citation-affordance נוכחים תמיד כעוגן-אמינות.

**שלוש ההבטחות החזותיות של כיוון-A:**

1. **"חי"** — שום מסך אינו דומם. רוני מרחף (V13), המונים סופרים-למעלה, ה-streak מהבהב. תמיד יש micro-motion ב-spring.
2. **"מתגמל"** — כל אינטראקציה נכונה מקבלת משוב מיידי: confetti, pop של רוני, מונה-XP שמתמלא, drawer-הצלחה ירוק.
3. **"מזמין-אך-אמין"** — צבעוניות-תוססת על משטחים-נקיים-לבנים; הגיימיפיקציה עוטפת תוכן-רציני (PDF-as-source, AiNotice קבוע).

---

## 1. שפת-עיצוב + Design Tokens

### 1.1 פילוסופיית-הצבע

StudiBuilder מחזיק **שני themes במכוון** (מאומת מ-4 ה-curated screens):

- **Light** = משטח-התוכן-הלימודי (login · dashboard · quiz/lesson · settings · create). רקע לבן/off-white, כרטיסים flat עם border-בלבד, אפס-כמעט-צללים.
- **Dark** = משטח-הניווט-וההישג (skill-tree · stats · bottom-nav glass · level-up). רקע עמוק, glow-rings, glassmorphism.

**שלוש שפות-צבע-תפקידיות (חתימת-StudiesGo):**

- 🔵 **כחול = פעולה + מותג** — כל CTA, tab-פעיל, focus-ring, node-פעיל.
- 🟠 **כתום = הבחירה-של-המשתמש + גיימיפיקציה** — border-כרטיס-נבחר, מד-XP, להבת-streak, יעד-יומי-נבחר, **קסדת-רוני**.
- 🟢🔴 **ירוק/אדום = משוב** — נכון/שגוי בלבד (אף-פעם לא הסימן-היחיד).

> בכיוון-A הניגוד כחול↔כתום מוקצן: הכתום **חם-ורווי-יותר** (`#FFB23D`→`#FF9F1C` ב-accent-strong) כדי שהגיימיפיקציה תקפוץ. זה ה-"vibrant" שמבדיל את כיוון-A מ-B/C.

### 1.2 פלטת-צבעים — Light Theme (ברירת-מחדל)

| token                 | hex                                               | שימוש                                                |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `--bg-app`            | `#FFFFFF`                                         | רקע-מסך-ראשי                                         |
| `--bg-subtle`         | `#F7F9FC`                                         | רקע-מקטע, off-white                                  |
| `--bg-quiz-gradient`  | `linear-gradient(180deg,#FFFFFF 0%,#EEF4FF 100%)` | רקע-מסך-שאלה (נצפה ב-`lesson_mcq`)                   |
| `--primary`           | `#2D7DF6`                                         | CTA-בסיס                                             |
| `--primary-grad`      | `linear-gradient(100deg,#2D7DF6 0%,#1E63E0 100%)` | gradient-כפתור-ראשי אלכסוני                          |
| `--primary-hover`     | `#1E63E0`                                         | hover                                                |
| `--primary-disabled`  | `#A0C3FF`                                         | כפתור-כבוי                                           |
| `--accent`            | `#FFB23D`                                         | כתום-בחירה (border-כרטיס-נבחר)                       |
| `--accent-strong`     | `#FF9F1C`                                         | כתום-רווי — streak-flame, XP-fill, badge (vibrant-A) |
| `--accent-tint`       | `rgba(255,178,61,0.05)`                           | מילוי-כרטיס-נבחר                                     |
| `--success-border`    | `#86EFAC`                                         | תשובה-נכונה                                          |
| `--success-bg`        | `#F0FDF4`                                         | רקע-נכון                                             |
| `--error-border`      | `#FCA5A5`                                         | תשובה-שגויה                                          |
| `--error-bg`          | `#FEF2F2`                                         | רקע-שגוי                                             |
| `--error-drawer`      | `#FFF0F2`                                         | drawer-שגיאה                                         |
| `--explanation-bg`    | `#F0F7FF`                                         | תיבת-הסבר                                            |
| `--text-primary`      | `#1F2937`                                         | טקסט-ראשי                                            |
| `--text-secondary`    | `#9CA3AF`                                         | משני / disabled                                      |
| `--text-heading-deep` | `#1E3A8A`                                         | כותרת-כחולה-כהה (דפוס-מותג)                          |
| `--border-default`    | `#E5E7EB`                                         | border-כרטיס רגיל                                    |
| `--credit-pill`       | `#EAF1FF`                                         | רקע-מונה-קרדיט                                       |

### 1.3 פלטת-צבעים — Dark Theme (skill-tree · stats · nav · level-up)

| token                   | hex                   | שימוש                                    |
| ----------------------- | --------------------- | ---------------------------------------- |
| `--brand-primary`       | `#1A56DB`             | node-פעיל, tab-active                    |
| `--brand-primary-hover` | `#1E40AF`             | hover                                    |
| `--brand-cyan`          | `#06B6D4`             | mascot-glow, accent-success              |
| `--cyan-glow`           | `rgba(6,182,212,0.4)` | טבעת-glow                                |
| `--bg-base`             | `#0B1120`             | רקע-מסך-dark                             |
| `--bg-elevated`         | `#111827`             | משטח-1                                   |
| `--bg-card`             | `#1F2937`             | משטח-2 / כרטיס                           |
| `--bg-nav`              | `rgba(17,24,39,0.85)` | bottom-nav glass + `backdrop-blur(12px)` |
| `--state-success`       | `#10B981`             | הצלחה                                    |
| `--state-error`         | `#EF4444`             | שגיאה                                    |
| `--state-warning`       | `#F59E0B`             | אזהרה / זהב                              |
| `--state-locked`        | `#374151`             | node-נעול                                |
| `--text-heading`        | `#F9FAFB`             | כותרת-dark                               |
| `--text-body`           | `#D1D5DB`             | גוף-dark                                 |
| `--text-muted`          | `#9CA3AF`             | עמום-dark                                |

### 1.4 טיפוגרפיה

- **משפחה:** `Rubik` (primary, variable-Hebrew) → `Assistant` (fallback) → `system-ui, sans-serif`. שניהם RTL-מצוינים. נטען דרך `next/font/google` עם `subsets: ['hebrew','latin']` ו-`display: 'swap'`.
- **סקאלה (modular, ratio≈1.25, base 16px):**

| token      | px / weight / line-height | שימוש                      |
| ---------- | ------------------------- | -------------------------- |
| `display`  | 28 / 800 / 1.2            | כותרת-onboarding, level-up |
| `h1`       | 22 / 700 / 1.3            | כותרת-מסך                  |
| `h2`       | 20 / 700 / 1.35           | כותרת-כרטיס-גדול, שאלה     |
| `h3`       | 18 / 700 / 1.4            | כפתור, כותרת-מקטע          |
| `body`     | 16 / 400-500 / 1.6        | טקסט-תשובה, פסקה           |
| `body-sm`  | 14 / 400 / 1.55           | טקסט-כרטיס משני            |
| `caption`  | 13 / 400 / 1.5            | משני, label, AiNotice      |
| `mono-num` | 20 / 700 (tabular-nums)   | מוני XP/streak/credits     |

- **דפוס-כותרת-מודגש (חתימת-מותג):** מילת-מפתח אחת מודגשת ב-`--accent-strong` בתוך כותרת `--text-heading-deep` — לדוגמה: "איך נקרא **לקורס**?" / "יש לך **42 שעות** עד הוועדה". חוזר ב-onboarding, create, summary.
- **מספרים:** `font-variant-numeric: tabular-nums` קבוע על כל מונה כדי שספירת-up לא "תרקוד".

### 1.5 מרווחים (4-pt grid)

`space-1=4 · space-2=8 · space-3=12 · space-4=16 · space-5=20 · space-6=24 · space-8=32 · space-10=40 · space-12=48`.

- **Gap-סטנדרטי בין-כרטיסים:** `12px`. **Grid-MCQ/dashboard:** 2-col, gap-12.
- **Padding-כרטיס-תשובה:** `16px 20px`. **Padding-מסך:** `16px` צד, `24px` עליון.
- **גובה-מגע-מינימלי:** `48px` (a11y target-size, גם בכפתורי-pill).

### 1.6 רדיוס

| token            | ערך             | שימוש                       |
| ---------------- | --------------- | --------------------------- |
| `--r-card-light` | `12px`          | כרטיס-light                 |
| `--r-card-dark`  | `16px`          | כרטיס-dark                  |
| `--r-answer`     | `14px`          | כרטיס-תשובה-MCQ (רחב, נצפה) |
| `--r-modal`      | `24px`          | modal מרכזי                 |
| `--r-sheet`      | `16px 16px 0 0` | bottom-sheet                |
| `--r-nav`        | `20px 20px 0 0` | bottom-nav glass            |
| `--r-pill`       | `9999px`        | **כל הכפתורים + מוני-pill** |

### 1.7 צללים

**Light = flat כמעט-ללא-shadow** (border נושא את ההיררכיה):

- `--shadow-card`: `0 1px 2px rgba(16,24,40,0.04)` (כמעט-בלתי-נראה).
- `--shadow-answer`: `0 2px 8px rgba(45,125,246,0.06)` (צל-כחלחל עדין-מאוד מתחת לכרטיס-תשובה).
- `--shadow-cta`: `0 4px 14px rgba(45,125,246,0.25)` (כפתור-ראשי "מרחף").

**Dark = floating + glow:**

- `--shadow-float`: `0 10px 25px -5px rgba(0,0,0,0.5)`.
- `--glow-primary`: `0 0 15px -3px rgba(26,86,219,0.5)`.
- `--glow-cyan`: `0 0 20px -5px rgba(6,182,212,0.6)`.
- `--inner-nav`: `inset 0 1px 0 rgba(255,255,255,0.1)`.

### 1.8 אייקונוגרפיה

- **ספרייה:** `lucide-react` (stroke 2px אחיד, מעוגל — תואם את שפת-המסקוט). גודל-בסיס 24px, 20px ב-inline.
- **אייקוני-גיימיפיקציה (חתימת-A):** ⚡ XP · 🔥 streak · 🏆 רמה · 🎯 יעד-יומי · 📖 שיעור. מצוירים כ-SVG-מותאם (לא אמוji-גלם) ב-2 צבעים: כתום-רווי למצב-פעיל, אפור למצב-נח.
- **כיווניות-RTL:** chevron/back/arrow **מתהפכים** דרך `[dir=rtl] .icon-flip{transform:scaleX(-1)}`. "המשך →" מצביע **שמאלה** ב-RTL (נצפה ב-create-c).
- **כל-מסקוט-SVG:** `role="img"` + `aria-label` (חובת-a11y).

### 1.9 קומפוננטות-ליבה (טוקניזציה)

| קומפוננטה          | מאפיינים-מותגיים                                                        |
| ------------------ | ----------------------------------------------------------------------- |
| `<Pill>`           | rounded-full, 48px-min, gradient-primary OR accent OR ghost             |
| `<AnswerCard>`     | r-answer, border-default→accent בבחירה, טקסט מיושר-לימין, shadow-answer |
| `<StatPill>`       | מונה-pill (credits/XP/streak), tabular-nums, אייקון-צבעוני בצד          |
| `<MascotStage>`    | עוטף `<MascotCharacter>` + idle-float + reaction-state                  |
| `<GlassNav>`       | bottom-nav dark glass, 4 tabs, tab-active בכרטיס-תכלת מרומם             |
| `<WizardProgress>` | `●●○○○` נקודתי, מתמלא **מימין-לשמאל**                                   |
| `<TipCard>`        | "💡 טיפ קטן" אפור-בהיר, מתחת לשדה-קלט                                   |

---

## 2. מסך התחברות (Auth)

### 2.1 קונספט

נאמן ל-`auth_login.jpg`: **glass-card מרחף** על gradient-רקע תכלת-אפרפר, לוגו StudiBuilder + רוני-curious בעיגול, בחירת-OAuth, מפריד "או", magic-link. בכיוון-A מוסיפים **חיוניות**: רוני מרחף (idle-float V13) ומגיב בכניסה (pop-in elastic V7); ה-glass-card נכנס בסקייל-elastic; ה-gradient-רקע נע לאט (subtle hue-shift, 20s loop, נכבה תחת reduced-motion).

### 2.2 פריסה (mobile-first, מרכזי)

- **רקע:** gradient `#C7D2E8`→`#E8EDF7` (תכלת-אפרפר), עם blur-orbs כחול/כתום עדינים מאחור.
- **Glass-card:** `background: rgba(255,255,255,0.55)` + `backdrop-blur(20px)` + border `rgba(255,255,255,0.6)`, r-modal=24px, padding-24, max-width 380px.
- **ראש-card:** "Studi**Builder**" (Builder ב-accent) + רוני-curious 56px בעיגול עם glow-cyan עדין.
- **כותרת:** "בחר אפשרות התחברות" (h2, מרכזי).
- **GoogleSignInButton:** pill-ghost, border-default, אייקון-Google מימין (RTL), טקסט "המשך עם Google".
- **מפריד:** קו-עדין + "או" מרכזי.
- **שדה-אימייל:** label "אימייל" (מיושר-ימין) + input pill, placeholder `you@example.com`, focus-ring כחול 2px.
- **CTA:** Pill gradient-primary מלא-רוחב, "שלח קישור התחברות", shadow-cta.
- **footer:** "בהמשך אתה מסכים ל**תנאי השימוש** ול**מדיניות הפרטיות**" (caption, קישורים מודגשים).

### 2.3 מצבים

| מצב                    | תיאור                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **ריק (idle)**         | כפתורים פעילים, שדה-ריק, רוני-curious מרחף                                                                                           |
| **קלט-לא-תקין**        | אימייל לא-ולידי → border-error + הודעת-caption אדומה מתחת ("כתובת לא תקינה"), רוני-sad קצר                                           |
| **טעינה (שליחה)**      | CTA → spinner-pill (rotate 360 linear ∞), טקסט→"שולח...", שדה-disabled                                                               |
| **magic-sent (הצלחה)** | card מתחלף ל-state-הצלחה: ✅ ירוק + "שלחנו קישור ל-{email} 📬", רוני-happy + confetti-קל, כפתור-משני "שלח שוב" (טיימר 30ש׳ cooldown) |
| **OAuth-redirect**     | overlay-spinner "מעביר ל-Google...", רוני-thinking                                                                                   |
| **שגיאת-שרת**          | toast-אדום מלמעלה "משהו השתבש, נסה שוב", CTA חוזר-פעיל, רוני-sad                                                                     |

### 2.4 מעברים (auth)

- כניסה: card `scale 0.92→1` + `opacity 0→1` (elastic, stiffness 300/damping 12).
- רוני: pop-in `scale 0→1.1→1` (V7) עם delay 0.15s אחרי ה-card.
- idle→success: cross-fade תוכן-card (`opacity`/`y` spring-layout), confetti-burst 40 חלקיקים.
- error-shake על השדה: `x:[0,-6,6,-3,3,0]` 0.25s (גרסה מרוככת של V16).

### 2.5 Wireframe ASCII — Login (RTL: כותרות מימין, חיצים שמאלה)

```
            ╔══════════════ gradient תכלת-אפרפר ══════════════╗
            ║   (blur-orb כחול)              (blur-orb כתום)   ║
            ║                                                  ║
            ║      ┌────────── glass-card ──────────┐  [✕]     ║
            ║      │                                 │         ║
            ║      │      ╭───────╮                  │         ║
            ║      │      │ (רוני)│  Studi·Builder    │  ← לוגו ║
            ║      │      ╰───────╯  ⌣  glow-cyan     │         ║
            ║      │                                 │         ║
            ║      │       בחר אפשרות התחברות         │  ← h2   ║
            ║      │                                 │         ║
            ║      │  ╭───────────────────────────╮  │         ║
            ║      │  │   [G]  המשך עם Google      │  │ ghost   ║
            ║      │  ╰───────────────────────────╯  │         ║
            ║      │                                 │         ║
            ║      │  ─────────────  או  ──────────  │         ║
            ║      │                                 │         ║
            ║      │                          אימייל │ ← label  ║
            ║      │  ╭───────────────────────────╮  │         ║
            ║      │  │  you@example.com          │  │ focus🔵 ║
            ║      │  ╰───────────────────────────╯  │         ║
            ║      │  ╭───────────────────────────╮  │         ║
            ║      │  │   שלח קישור התחברות  🔵grad │  │ CTA    ║
            ║      │  ╰───────────────────────────╯  │         ║
            ║      │                                 │         ║
            ║      │  בהמשך אתה מסכים לתנאי-השימוש    │ caption ║
            ║      └─────────────────────────────────┘         ║
            ╚══════════════════════════════════════════════════╝

   מצב magic-sent:  ┌──────────┐
                    │   ✅📬    │  "שלחנו קישור ל-moti@..."
                    │ (רוני😊)  │  [ שלח שוב (30ש׳) ]   + confetti
                    └──────────┘
```

---

## 3. מסך פתיחה + שאלון-משתמש (Onboarding)

### 3.1 מטרה ועקרונות-UX

בכניסה-ראשונה לקורס "ממונה בטיחות" → בונים **מסלול-לימוד-אישי** עד מועד-הוועדה. השראת-מבנה מ-`docs/IDEAS.md`. ~~(אפס-תוכן-מגן)~~ — **🔧 firewall-מגן בוטל 2026-06-09 · port-permitted ([ADR-009](../architecture/ADR-009-magen-integration.md)).**

**עקרונות:**

- **5 שאלות-ליבה בדיוק** — onboarding קצר (לא להעמיס). שאלה = מסך-יחיד.
- מעבר slide-אופקי בין-שלבים (RTL: יוצא-שמאלה, נכנס-מימין) + מד `1/5..5/5` שמתמלא **מימין-לשמאל**.
- כפתורי-בחירה **גדולים (pill, 56px)**, אצבע-ידידותיים.
- "דלג"-עדין (caption, פינה) למתקדמים — onboarding לא-חוסם.
- **רוני-curious מלווה** בכל-שלב, מגיב לבחירה (nod קל).
- כיוון-A מוסיף **micro-celebration** בכל-מעבר: רוני-nod + dot מתמלא בכתום + sound-pop עדין (אופציונלי).

### 3.2 מסך-Welcome (לפני Q1)

- רוני-curious 160px (Hero) + **קסדת-בטיחות כתומה** (חתימת-הקורס) מרחף, idle-float.
- כותרת display: "ברוך הבא! בוא נבנה לך **מסלול-אישי** לוועדה 🦺".
- תת-כותרת: "5 שאלות קצרות — ונדע בדיוק איך לתקתק את ההכנה שלך."
- CTA pill-gradient "בואו נתחיל!" + "דלג בינתיים" (caption).
- entrance: רוני pop-in elastic, כותרת stagger-up.

### 3.3 חמש שאלות-הליבה (UI מדויק)

| #      | שאלה (UI עברית)                      | סוג-קלט                                                        | שדה-נתון               |
| ------ | ------------------------------------ | -------------------------------------------------------------- | ---------------------- |
| **Q1** | "מתי מועד-הבחינה / הוועדה שלך?"      | date-picker (כרטיס-תאריך RTL) + צ'יפ "עוד-לא-קבעתי"            | `exam_date`            |
| **Q2** | "כמה זמן ביום תוכל/י להקדיש ללימוד?" | 4 pills: `30 ד׳` · `1 ש׳` · `1.5 ש׳` · `2 ש׳+` (נבחר=כתום)     | `daily_minutes`        |
| **Q3** | "מה הרקע-המקצועי שלך?"               | 5 כרטיסים-גדולים עם אייקון: בנייה · תעשייה · חשמל · כללי · אחר | `domain_background`    |
| **Q4** | "כמה מתוכנית-הלימודים כבר השלמת?"    | סולם 4-מצבים: מתחיל · חלקי · מתקדם · חזרה-לבחינה               | `progress_self_report` |
| **Q5** | "אילו ימים בשבוע נוחים לך ללמוד?"    | בחירה-מרובה (א׳–ש׳, 7 צ'יפים, נבחר=כתום)                       | `study_days[]`         |

> שאלות-עתידיות אופציונליות (לא ב-v1): "נושא-שמלחיץ-אותך-במיוחד?", "מעדיף/ה קול-הקראה?".
> מבנה-הבחירה (Q3 ענף-עוגן→קל-יותר) נגזר מהשראת-`study_plan_90days`. ~~**כספֵק-מבנה בלבד** — אין שימוש ב-committee_bank / תוכן-מגן.~~ — **🔧 firewall-מגן בוטל 2026-06-09 · port-permitted name-cleaned ([ADR-009](../architecture/ADR-009-magen-integration.md)).**

### 3.4 מסך-סיכום ("המסלול-שלי") — פלט-ההתאמה-האישית

אחרי Q5 → מסך-חגיגה (רוני-proud + confetti, V14 + Bonus):

- **תקציב-שעות-מחושב:** `daily_minutes × |study_days| × שבועות-עד-exam_date` →
  כותרת-מודגשת: "יש לך **42 שעות-לימוד** עד הוועדה 🎯".
- **קצב-נדרש:** "כדי לסיים בזמן — **3 נושאים בשבוע**" + אזהרה-כתומה אם לא-ריאלי: "⚠️ הלו"ז צפוף — שקול/י להוסיף יום-לימוד".
- **סדר-נושאים-לפי-פערים:** רשימה-ממוינת — `domain_background` מקדים נושאים-מוכרים (בנייה→קל יותר → בהמשך-המסלול), `progress_self_report` מדלג/מדגיש.
- **יעד-יומי מומלץ** → נכתב ל-`settings.daily_goal_min` + **streak-target** עד הוועדה.
- **כרטיס-טיימליין "המסלול-שלי":** timeline ויזואלי שמתחבר ל-skill-tree (V9-12) — נושאים כ-nodes, "📍 היום-אתה-כאן".
- CTA "צא לדרך!" → dashboard.

### 3.5 מעברים (onboarding)

- בין-שלבים: יוצא `x:0→+100vw` (RTL: שמאלה), נכנס `x:-100vw→0` (RTL: מימין), `easeInOut 0.35s` (נגזר מ-04-onboarding gemini).
- מד-התקדמות: dot מתמלא כתום ב-`scale 0→1` spring-pop בכל-מעבר.
- spinner בין-שלבים-כבדים (חישוב-מסלול): `rotate 360 linear ∞` 0.8s.
- מסך-סיכום: confetti 80 חלקיקים + רוני pop-to-proud + מוני-שעות count-up (0→42).

### 3.6 Wireframe ASCII — Onboarding (RTL)

```
   ┌─────────────────────────────────────┐   ┌─────────────────────────────────┐
   │              דלג בינתיים ›           │   │  ●●●○○  3/5         דלג ›        │ ← מד מימין-לשמאל
   │                                     │   │                                 │
   │           ╭─────────╮               │   │   ╭────╮  מה הרקע-המקצועי שלך?    │
   │           │ (רוני🦺) │  idle-float    │   │   │רוני│                          │
   │           ╰─────────╯               │   │   ╰────╯                          │
   │                                     │   │                                 │
   │   ברוך הבא! בוא נבנה לך              │   │  ┌────────┐ ┌────────┐           │
   │   *מסלול-אישי* לוועדה 🦺              │   │  │ 🏗️     │ │ 🏭     │           │
   │                                     │   │  │ בנייה  │ │ תעשייה │           │
   │   5 שאלות קצרות — ונדע בדיוק          │   │  └────────┘ └────────┘           │
   │   איך לתקתק את ההכנה שלך.            │   │  ┌────────┐ ┌────────┐ ┌──────┐   │
   │                                     │   │  │ ⚡חשמל  │ │ כללי   │ │ אחר  │   │
   │   ╭───────────────────────────╮     │   │  └────────┘ └────────┘ └──────┘   │
   │   │     בואו נתחיל!  🔵grad     │     │   │                                 │
   │   ╰───────────────────────────╯     │   │   ╭─────────────────────────╮    │
   │                                     │   │   │  המשך  ←  🔵grad          │    │ ← חץ שמאלה
   │            WELCOME                   │   │   ╰─────────────────────────╯    │
   └─────────────────────────────────────┘   └─────────────────────────────────┘

   ┌──────────────── מסך-סיכום: "המסלול-שלי" ────────────────┐
   │                  ╭─────────╮     🎉 confetti              │
   │                  │ (רוני😎) │  proud + glow                │
   │                  ╰─────────╯                              │
   │                                                          │
   │        יש לך  *42 שעות-לימוד*  עד הוועדה 🎯                │ ← count-up 0→42
   │        כדי לסיים בזמן —  *3 נושאים בשבוע*                  │
   │        ⚠️ הלו"ז צפוף — שקול להוסיף יום                     │ (תנאי)
   │                                                          │
   │   ┌──── המסלול-שלי (timeline → skill-tree) ────┐          │
   │   │  ●───●───◉───○───○───○                       │          │
   │   │  יסוד  חוק 📍כאן  גובה  חשמל  ...            │          │
   │   └─────────────────────────────────────────────┘          │
   │                                                          │
   │   ╭───────────────────────────────────────────╮          │
   │   │            צא לדרך!  🔵grad                  │          │
   │   ╰───────────────────────────────────────────╯          │
   └──────────────────────────────────────────────────────────┘
```

---

## 4. מעברים (Page · Route · Shared-element)

**Easing-default StudiesGo = Spring (לא cubic-bezier).** ערכי-בסיס מתוך `_base.ts`:

```ts
springs = {
  button: { type: 'spring', stiffness: 400, damping: 25 }, // micro, scale-bump
  elastic: { type: 'spring', stiffness: 300, damping: 12 }, // cards/modals/mascot — overshoot
  pop: { type: 'spring', stiffness: 500, damping: 15 }, // pop מהיר
  layout: { type: 'spring', stiffness: 350, damping: 30 }, // AnimatePresence
};
durations = { fast: 0.05, base: 0.15, medium: 0.25, slow: 0.4 };
```

| מעבר                                         | spec                                                                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route (page-to-page)**                     | exit: `opacity 1→0` 0.15s easeOut · enter: `y 20→0 + opacity 0→1` 0.25s easeOut (נצפה ב-04 שלב-1). spinner-כחול בין-מסכים-כבדים (`rotate 360 linear ∞`) |
| **Onboarding step-swap**                     | slide-אופקי `x ±100vw` easeInOut 0.35s (RTL-aware) + מד `n/5→n+1/5`                                                                                     |
| **Bottom-nav tab-switch (V18)**              | icon `scale 0.8→1.2→1.1` + color→brand-primary 0.2s · תוכן cross-fade `x±20 + opacity` spring.button, delay 0.1s                                        |
| **Bottom-sheet (V6)**                        | `y 100%→0` spring.layout · backdrop `opacity 0→0.4` 0.2s · exit `y→100%` easeIn 0.2s                                                                    |
| **Center-modal (V17)**                       | `scale 0.8→1 + y 20→0 + opacity` spring(300/25) · backdrop `blur 0→8px + opacity 0→0.6` 0.2s                                                            |
| **Shared-element: mascot**                   | `layoutId="roni"` — רוני "עף" מ-auth→dashboard→onboarding ברצף ללא-קפיצה (Framer `layout`)                                                              |
| **Shared-element: course-card→lesson**       | כרטיס-קורס מ-dashboard מתרחב ל-lesson-header (`layoutId="course-{id}"`, spring.layout)                                                                  |
| **Shared-element: timeline-node→skill-tree** | node מ-onboarding-summary שומר `layoutId` אל ה-node המקביל ב-skill-tree                                                                                 |
| **Skill-tree entry (V9-11)**                 | SVG path-draw `pathLength 0→1` 0.6s ease-out · active-node pop+glow (V10) · locked-nodes stagger slide-up (V11)                                         |

**a11y-motion:** `respectReducedMotion()` מאפס spring/shake/confetti/slide תחת `prefers-reduced-motion: reduce` → נשאר cross-fade-בלבד.

---

## 5. כפתורים

### 5.1 וריאנטים

| וריאנט         | רקע                        | טקסט            | border             | שימוש                                        |
| -------------- | -------------------------- | --------------- | ------------------ | -------------------------------------------- |
| **primary**    | gradient-primary (אלכסוני) | לבן 700         | —                  | CTA-ראשי ("+ קורס חדש", "המשך", "שלח קישור") |
| **accent**     | `--accent-strong`          | `#1F2937` 700   | —                  | פעולת-גיימיפיקציה / "תבע פרס"                |
| **ghost**      | שקוף                       | `--primary` 700 | `--border-default` | OAuth, "דלג", משני                           |
| **success**    | `--success-bg`             | ירוק-כהה        | `--success-border` | "המשך לשאלה הבאה" (drawer-נכון)              |
| **danger**     | שקוף                       | `--state-error` | `--state-error`    | "מחק חשבון", "התנתק"                         |
| **icon-round** | לבן / glass                | —               | עדין               | ניווט עגול ("→", "✕"), header-quiz           |

כל-הווריאנטים: **pill (`9999px`)**, גובה-מינימלי 48px, padding `12px 24px`, h3 (18/700).

### 5.2 מצבים

| מצב                        | טיפול                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **idle**                   | בסיס                                                                                 |
| **hover**                  | `--primary-hover` / overlay-שחור 5% (desktop)                                        |
| **active/tap (V5)**        | `scale 0.95` spring.button 0.05s                                                     |
| **disabled (V4)**          | רקע `--primary-disabled`, טקסט `#FFFFFFCC`, cursor-not-allowed                       |
| **enable-transition (V4)** | disabled→enabled: backgroundColor 0.15s + `scale [1,1.04,1]` spring.pop (pop-בהפעלה) |
| **loading**                | spinner-inline (`rotate 360 linear ∞`) + טקסט→"...", רוחב-נשמר (no layout-shift)     |
| **focus-visible**          | `outline: 2px solid --primary; outline-offset: 2px` (keyboard-only, a11y)            |

### 5.3 גדלים

| גודל          | גובה | padding | font   | שימוש                  |
| ------------- | ---- | ------- | ------ | ---------------------- |
| `lg`          | 56px | 16/32   | 18/700 | CTA-מסך, onboarding    |
| `md`          | 48px | 12/24   | 16/700 | רגיל (ברירת-מחדל)      |
| `sm`          | 40px | 8/16    | 14/600 | משני, inline           |
| `pill-select` | 48px | 12/20   | 16/600 | בחירה (יעד-יומי, ימים) |

### 5.4 Micro-interactions

- **tap (V5):** `whileTap scale 0.95`, spring.button — קיים בכל-כפתור.
- **enable-pop (V4):** כשתנאי-מתקיים (כל-זוגות-הותאמו / שדה-מלא) הכפתור קופץ `[1,1.04,1]` + צבע-מתחלף — מושך-עין שהפעולה-פתוחה.
- **gradient-sheen (vibrant-A):** ב-hover על primary, gradient זז עדין `background-position` 0.4s — תחושת-"חי".
- **haptic+sound (משוער מ-02):** tap=Light · enable=Medium·Swoosh · success=Chime · error=Heavy·Buzzer (נכבה תחת mute / reduced-motion).

---

## 6. הנפשות (Framer-Motion)

> כל-הערכים מתוך `motion-specs.md` (34 variants) — כיוון-A **ממקסם** את הנוכחות-החזותית שלהם (מסקוט+גיימיפיקציה בקדמת-הבמה).

### 6.1 מסקוט "רוני" (חתימת-A)

5 poses (`curious · happy · thinking · proud · sad`) × אביזר `helmet-safety` (קסדת-בטיחות כתומה — חתימת-הקורס). SVG layered (`body-base · face · pose-{name} · accessory-{name}`), 256×256 viewBox.

| state    | variant                    | spec                                                | טריגר                          |
| -------- | -------------------------- | --------------------------------------------------- | ------------------------------ |
| idle     | `mascotIdle` (V13)         | `y:[0,-10,0]` 3s easeInOut ∞                        | תמיד                           |
| entry    | `robotPop` (V7)            | `scale:[0,1.1,1]` elastic, times[0,0.7,1] 0.4s      | פתיחת-מסך/sheet                |
| success  | `mascotSuccess` (V14)      | `y:-15` + glow `drop-shadow(0 0 30px cyan)` elastic | תשובה-נכונה                    |
| error    | `mascotError` (V15)        | `y:10, x:[0,-4,4,-2,2,0]` + glow-אדום 0.4s          | תשובה-שגויה                    |
| thinking | `pose-thinking` + ellipsis | אצבע-לחי, נקודות `...` 0.3s                         | טעינה/pipeline                 |
| proud    | `pose-proud` + halo        | כוכב-זהב pulse 1.5s                                 | סיום/level-up/streak-milestone |

> **המשכיות:** וריאנט-רובוט-StudiesGo נשמר כ-fallback (continuity), אך ברירת-המחדל בכיוון-A היא **רוני-אנושי + קסדה** (differentiator). מעבר-חלק דרך `layoutId="roni"`.

### 6.2 משוב נכון/שגוי (לב-החוויה ב-A)

**נכון:**

1. כרטיס-נבחר → `success-border + success-bg`.
2. bottom-sheet ירוק עולה (V6, spring.layout).
3. רוני pop-in (V7) ל-pose-happy + glow-cyan (V14).
4. confetti 80 חלקיקים (ירוק/זהב/לבן, V-bonus).
5. רשימת-הסבר stagger-up (V8, 50ms).
6. מונה-XP count-up (+10 → pop כתום).

**שגוי:**

1. screen-shake `x:[0,-10,10,-5,5,0]` 0.25s (V16).
2. כרטיס → `error-border + error-bg`.
3. bottom-sheet `--error-drawer` עולה (V6).
4. רוני pop-to-sad + shake + glow-אדום (V15).
5. הסבר + הדגשת-התשובה-הנכונה (ירוק) — **עידוד-עדין** ("לא נכון — אבל בסדר גמור").
6. streak **לא**-נשבר על טעות-בודדת (רק על יום-מוחמץ) — UX-מתגמל.

### 6.3 גיימיפיקציה (קדמת-הבמה ב-A)

| אלמנט                      | אנימציה                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| **XP-counter**             | count-up tabular-nums + `+N` pop כתום (spring.pop) בכל-זכייה                                    |
| **XP-bar (יומי 0/20)**     | מילוי `scaleX` spring.layout, ב-100%→pulse-זהב + checkmark-draw                                 |
| **Streak-flame (🔥)**      | flicker עדין `scale:[1,1.06,1]` 1.2s ∞ + glow-כתום; milestone(7/30)→burst                       |
| **Level-badge / level-up** | dark-modal `scale 0.8→1` (V17) + ray-burst + רוני-proud + confetti-זהב                          |
| **Skill-tree (V9-12)**     | path-draw 0.6s · active-node pop+glow · locked stagger · unlock 3-stage (shake→ripple→icon-pop) |
| **Daily-goal complete**    | checkmark SVG path-draw + toast "השלמת את היעד היומי! 🎯"                                       |

### 6.4 טעינה (loading)

| הקשר                       | spinner                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| כפתור                      | spinner-inline 20px `rotate 360 linear ∞`, רוחב-נשמר                  |
| מעבר-מסך                   | spinner-כחול מרכזי `scale 0.8→1 + opacity 0→1` ואז rotate (04-gemini) |
| pipeline (create)          | רוני-thinking + ellipsis + progress-stage `1/5...`                    |
| skeleton (dashboard/stats) | shimmer `background-position` 1.2s ∞ על placeholders אפורים-בהירים    |

---

## 7. מראה נקי/נעים/מזמין

### 7.1 Vibe כללי

**"חצר-משחק-בוגרת":** משטחים-לבנים-נקיים + צבעוניות-תוססת-נקודתית (כחול+כתום) + מסקוט-חמים + spring-בכל-מקום. לא עמוס — **whitespace-נדיב** (gap-12 בין-כרטיסים, padding-16 צד). הצבע "קופץ" רק היכן-שצריך פעולה/הישג; שאר-המסך רגוע ולבן. זה ה-balance שמרגיש **כיפי אך מקצועי** — מתאים למוצר-מכירה לקהל-בוגר.

- **היררכיה דרך border+צבע, לא צללים** (light flat).
- **כל-מסך "חי"** — לפחות micro-motion אחד (רוני-float / streak-flicker).
- **עקביות-רדיוס** (הכל-pill / r-card) → תחושת-מערכת-אחת.

### 7.2 מצבי Empty / Loading / Error (לכל-מסך)

| מסך             | Empty                                                                     | Loading                          | Error                                       |
| --------------- | ------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------- |
| **Dashboard**   | רוני-curious + "עוד אין קורסים — בוא ניצור את הראשון 🦺" + CTA-גדול       | skeleton-shimmer 3 כרטיסים       | toast-אדום + "נסה לרענן"                    |
| **Stats**       | רוני-curious 96px + "התחל ללמוד כדי לראות סטטיסטיקות 📊" (EmptyStateCard) | skeleton-גרפים                   | inline-error + retry                        |
| **Lesson/Quiz** | — (תמיד יש שאלה)                                                          | spinner-כחול + AiNotice-skeleton | "טעינת השאלה נכשלה" + retry + רוני-thinking |
| **Create**      | dropzone-ריק + רוני-curious + "גרור קובץ או בחר (עד 50MB)"                | progress-stage + רוני-thinking   | קובץ-לא-נתמך → border-error + tip           |
| **Settings**    | —                                                                         | skeleton-מקטעים                  | toast-שמירה-נכשלה                           |

**עיקרון-empty ב-A:** empty-state **לעולם לא קר** — רוני נוכח, הטון מעודד, יש CTA-ברור. ההזדמנות-להפוך-empty-לכניסה (onboarding-nudge).

### 7.3 אמון וציות כחלק-מהמראה (חתימת-מותג)

- **AiNotice קבוע בכל-שיעור:** `✨ "המידע נוצר ע"י AI ועלול להכיל שגיאות"` (caption, מתחת-header) — חלק-מהזהות-החזותית-של-אמינות.
- **citation-affordance:** badge "מקור 📄" ליד-תשובה-חוקית → לוחץ→bottom-sheet עם PDF עמוד+סעיף (PDF-as-source-of-truth). ויזואל-אמון, לא קישוט.

---

## 8. RTL + נגישות (WCAG AA)

### 8.1 RTL (אזרח-ראשון, לא תיקון-בדיעבד)

- **Logical-properties בלבד:** `ps-*`/`pe-*`/`ms-*`/`me-*` (Tailwind `tailwindcss-rtl`), אף-פעם לא `pl/pr/ml/mr`.
- **חיצים/chevrons מתהפכים:** "המשך →" מצביע **שמאלה** ב-RTL (נצפה ב-create-c); back-arrow ימינה; `.icon-flip{transform:scaleX(-1)}` תחת `[dir=rtl]`.
- **מד-התקדמות מתמלא מימין-לשמאל** (`●●○○○`, dot-נבחר מימין).
- **gradient-כפתורים אלכסוניים** — זווית-זרימה `100deg` נבדקת תואמת-RTL (לא "נשפכת" הפוך).
- **tassel-מסקוט / קסדה** — אביזר ב-z-index נכון, צד-RTL.
- **bottom-nav:** סדר-tabs RTL (בית מימין? — לפי `dashboard.jpg` בית בקצה-ימין-המרוחק; נשמר).
- **בדיקת-Playwright חובה תחת `dir=rtl`** לכל-מסך + screenshot-test.

### 8.2 נגישות (יעד: axe-core 0-violations · Lighthouse a11y ≥95)

| דרישה                   | מימוש                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **ניגודיות**            | כל-שילוב WCAG-AA (4.5:1 טקסט, 3:1 UI). טקסט-לבן על gradient-primary נבדק; כתום-`#FF9F1C` עם טקסט-כהה `#1F2937` (לא לבן)           |
| **צבע ≠ סימן-יחיד**     | נכון/שגוי גם **צורה+אייקון** (✓/✗) לא רק ירוק/אדום; כרטיס-נבחר גם border-עבה+✓, לא רק כתום                                        |
| **keyboard-nav**        | Tab מלא: auth-fields · settings-controls · בחירת-תשובות (Enter/Space) · onboarding (חצים בין-pills) · focus-ring כחול נראה-בבירור |
| **mascot-SVG**          | `role="img"` + `aria-label` ("רוני שמח" וכו') לכל-pose                                                                            |
| **reduced-motion**      | `respectReducedMotion()` מאפס spring/shake/confetti/slide; idle-float נכבה                                                        |
| **target-size**         | כל-מטרה ≥48×48px                                                                                                                  |
| **focus-trap**          | modal/bottom-sheet לוכדים focus + ESC-סגירה                                                                                       |
| **live-region**         | `aria-live="polite"` לתוצאת-תשובה, ספירת-XP, toast                                                                                |
| **מקלדת-מובייל**        | עולה ב-focus-שדה (auth/create), `inputmode` נכון (email/numeric)                                                                  |
| **כפתור-נגישות גלובלי** | toggle ב-settings → reduce-motion ידני + הגדלת-טקסט, נשמר ל-localStorage                                                          |
| **מחק-חשבון**           | מחיקה-מלאה GDPR (right-to-be-forgotten) — danger-section, double-confirm                                                          |

> **למה זה עובד עם RTL:** עברית-RTL-נטיבית מבטיחה שכיוון-הקריאה, ה-focus-order וה-tab-order זורמים ימין→שמאל **בעקביות** — מה שמונע את הבלבול-הנפוץ של a11y ב-RTL-מתורגם. כל-aria-label בעברית, כל-מד מתמלא בכיוון-הקריאה, וכל-חץ מצביע-נכון → קורא-מסך + ניווט-מקלדת קוהרנטיים.

---

## 9. למה כיוון-A מתאים למוצר-לשיווק (קהל ממוני-בטיחות עברי)

1. **רטנשן = הכנסה.** מוצר-מכירה חי-או-מת על-פי האם הלומד חוזר. הגיימיפיקציה-בקדמת-הבמה (XP/streak/confetti/skill-tree) היא מנוע-ההרגל המוכח של Duolingo — בדיוק מה שצריך כדי שממונה-בטיחות עסוק יחזור 1-2 שעות/יום עד הוועדה.
2. **"כיף" מוריד-חרדת-מבחן.** הכנה-לוועדה מלחיצה. מסקוט-מעודד (רוני-sad→"בסדר גמור"), streak-שלא-נשבר-על-טעות, ו-celebration-בכל-הישג הופכים חומר-יבש (תקנות-בטיחות) לחוויה-נסבלת-ואף-ממכרת.
3. **מזמין = converts.** דף-ראשון-מרשים (auth-glass + רוני-מרחף + spring) מייצר רושם-ראשוני של מוצר-מלוטש-ומקצועי — קריטי לקהל ששוקל-לשלם.
4. **בוגר-לא-ילדותי.** רוני **אנושי-מקצועי** (לא רובוט-ילדותי, פרופורציה 1:3.5, עיניים-נורמליות) + **קסדת-בטיחות** = מזדהה-עם-הקהל ("זה בשבילי, ממונה-בטיחות"), לא מרתיע-כ"אפליקציית-ילדים".
5. **אמינות מובנית במראה.** AiNotice קבוע + citation-affordance (PDF-מקור) = אות-אמון לקהל-מקצועי שחייב-מקורות-מדויקים — מבדל מ-"עוד-אפליקציה-AI".
6. **נאמנות-StudiesGo = ביטחון-ביצוע.** הכיוון נגזר מקורפוס-StudiesGo-אמיתי (34 variants מאומתים, 4 curated-screens) → סיכון-עיצובי-נמוך, פחות-הפתעות, מהיר-ליישום.
7. **עברית-RTL-נטיבית = יתרון-שוק.** רוב-מוצרי-ה-edtech-המגויימים הם תרגום-RTL-עקום. חוויה-עברית-נטיבית-מלוטשת היא differentiator-אמיתי בשוק-הישראלי.

---

## נספח — מיפוי-מסכים → variants → tokens

| מסך          | theme     | variants-ליבה                                       | tokens-מפתח                                |
| ------------ | --------- | --------------------------------------------------- | ------------------------------------------ |
| Landing      | light     | route-enter, mascot-idle                            | primary-grad, accent-strong                |
| Auth         | light     | V7(mascot-pop), elastic-card, error-shake           | bg-quiz-gradient, primary-grad, glass      |
| Onboarding   | light     | slide-swap, dot-pop, count-up, confetti, V14        | accent (select), display, primary-grad     |
| Dashboard    | light+nav | V13, V18(nav), streak-flicker, XP-fill              | credit-pill, accent-strong, glass-nav      |
| Create (1-5) | light     | WizardProgress, V6(sheet), spinner, mascot-thinking | primary-grad, tip-card, border             |
| Lesson/Quiz  | light     | V1-V8, V16, V17, confetti, mascot success/error     | quiz-gradient, success/error, accent       |
| Skill-tree   | dark      | V9-V12                                              | brand-primary, glow-primary, locked        |
| Stats        | dark      | V9, count-up, skeleton                              | bg-base, brand-cyan, heatmap-orange        |
| Settings     | light+nav | V18, toggle, pill-select(יעד), theme-switch         | accent(select), primary(toggle), glass-nav |
| Level-up     | dark      | V17, ray-burst, confetti-gold, proud                | state-warning(זהב), glow-cyan              |

---

### קבצי-מקור (מאומתים בריצה זו)

- `docs/design/motion-specs.md` (34 variants + tokens light+dark) ✅ נקרא
- `docs/design/mascot-brief.md` (5 poses + 3 אביזרים + "רוני") ✅ נקרא
- `docs/sources/studiesgo-videos/04-onboarding/gemini-response.md` (slide-transitions + spinner) ✅ נקרא
- `docs/IDEAS.md` (Personalized Study-Path — השראת-מבנה) ✅ נקרא
- `docs/screens/{auth_login,dashboard,lesson_mcq,settings_general}.jpg` ✅ נצפו (אימות-עין על tokens)

**הערת-firewall:** ~~כל-התוכן נגזר מקורפוס-StudiesGo + מסמכי-StudiBuilder בלבד; לא נעשה שימוש בקוד/תוכן/prompts ממערכת "מגן".~~ — **🔧 firewall-מגן בוטל 2026-06-09 (REVERSED · port-permitted):** מותר עכשיו לפורט פרומפט-מגן name-cleaned (מוטי בעל-שני-הריפו → אפס-licensing · megen מבודד read-only). הכיוון-החזותי StudiesGo נשאר בתוקף. ראה [ADR-009](../architecture/ADR-009-magen-integration.md).
