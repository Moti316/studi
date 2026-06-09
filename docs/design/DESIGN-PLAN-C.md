# DESIGN-PLAN-C — כיוון "Bold-Modern · מונע-מושן"

> **כיוון C** מתוך 3 כיווני-עיצוב ל-StudiBuilder · קורס "ממונה בטיחות".
> **אתוס:** מודרני-נועז · motion-forward · מובחן-ויזואלית — edtech עכשווי עם אנרגיה-גבוהה, gradients ו-micro-interactions עשירות.
> **גרסה:** 1.0 · **תאריך:** 2026-06-04 · **שפה:** עברית RTL כאזרח-ראשון.
> **צוות:** interaction-designer · visual-designer · design-system · frontend-engineer · accessibility-i18n.
>
> 🎨 **כיוון-חזותי:** StudiesGo = מקור-ההשראה החזותי **היחיד** (נשאר בתוקף). שאלון-ה-onboarding מהשראת-מבנה (`docs/IDEAS.md` "מתכנן-מסלול-אישי").
> 🔧 **FIREWALL מגן — בוטל 2026-06-09 (REVERSED · [ADR-009](../architecture/ADR-009-magen-integration.md)):** ~~אסור בהחלט להעתיק קוד/תוכן/prompts ממערכת "מגן" (`megen`); native-בלבד · אפס-העתקה.~~ **כעת port-permitted** — מותר לפורט את פרומפט-המאסטר של מגן name-cleaned (מוטי בעל-שני-הריפו → אפס-licensing); megen נשאר מבודד (read-only · תוכן-פרומפט בלבד · לא מנוע-Python).
>
> **מקור-אמת:** נגזר מקורפוס-StudiesGo (`docs/screens/*.jpg` · `docs/design/motion-specs.md` · `docs/design/mascot-brief.md` · `gemini-response` ל-02/04) ומ-Design-Brief 1.0.

---

## 0. תזת-הכיוון (במשפט אחד)

**Bold-Modern** לוקח את ה-DNA של StudiesGo (ניגוד כחול↔כתום · pill-buttons · spring-everywhere · מסקוט-מרחף) ו**מעלה אותו ל-gear הבא**: ה-gradient לא נשאר רק על הכפתור — הוא הופך ל**שפת-רקע** (mesh/aurora עדין), ה-micro-interactions עוברות מ"נחמדות" ל**מוחשיות-ומלאות-אנרגיה**, וה-typography מקבל **כותרות-ענק** עם מילת-מפתח-כתומה. זה edtech שמרגיש כמו **2026, לא 2019** — אבל **רציני מספיק** לקהל ממוני-בטיחות בוגר (לא Duolingo-ילדותי). ההבחנה מהמתחרים: **אנרגיה גבוהה + ליטוש-מוצר-מכירה**, לא prototype-פנימי.

**שלוש החלטות-מפתח שמבדילות את כיוון-C משני האחרים:**

1. **Aurora-gradient כשפת-רקע** — לא רק accent. כל מסך-מפתח (auth · onboarding · dashboard-hero · lesson-complete) יושב על mesh-gradient עדין-נע. זו החתימה-החזותית-הנועזת.
2. **Micro-interactions עשירות-מ-baseline** — כל-אלמנט-אינטראקטיבי מגיב (hover-lift · tap-squash · magnetic-cursor בדסקטופ · glow-on-focus). ה-spring של StudiesGo נשמר, אבל מורחב ל-`bouncy`-variant חדש לרגעי-ניצחון.
3. **כותרות-Display ענקיות** — סקאלת-טיפוגרפיה אגרסיבית (עד `48px` במובייל ל-hero) עם מילת-מפתח-כתומה — ממשיכה את דפוס-StudiesGo ("איך נקרא **לקורס**?") אבל בעוצמה גבוהה-יותר.

---

## 1. שפת-עיצוב + Design Tokens

### 1.1 פילוסופיית-צבע

StudiesGo מחזיק **שני themes** (light לתוכן-לימודי · dark לניווט/skill-tree). כיוון-C **משמר זאת** אבל מוסיף שכבת-`gradient-mesh` שמאחדת אותם ויזואלית. הניגוד **כחול↔כתום** הוא חתימת-המותג ונשמר בקדושה.

**עקרון:** כחול = מותג/פעולה · כתום = בחירת-משתמש + gamification (XP/streak) · ירוק/אדום = משוב. כיוון-C **מחזק** את הכחול לכיוון gradient-עשיר-יותר ואת הכתום לכיוון amber-לוהט.

### 1.2 פלטת-צבעים (hex)

**Light theme — תוכן-לימודי (dashboard · quiz · settings · onboarding):**

| token                 | hex                                                              | שימוש                                                            |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--bg-app`            | `#F7F9FC`                                                        | רקע-מסך בסיסי (off-white רך)                                     |
| `--bg-surface`        | `#FFFFFF`                                                        | כרטיסים, modals                                                  |
| `--bg-aurora-1`       | `#EAF2FF`                                                        | נקודת-mesh כחולה-בהירה (פינה ימנית-עליונה)                       |
| `--bg-aurora-2`       | `#FFF4E6`                                                        | נקודת-mesh כתומה-בהירה (פינה שמאלית-תחתונה)                      |
| `--bg-aurora-3`       | `#F0FBFF`                                                        | נקודת-mesh ציאן-בהירה (מרכז-תחתון)                               |
| `--primary`           | `#2D7DF6`                                                        | כחול-מותג (בסיס gradient)                                        |
| `--primary-deep`      | `#1E63E0`                                                        | כחול-עמוק (קצה-gradient)                                         |
| `--primary-grad`      | `linear-gradient(135deg, #2D7DF6 0%, #1E63E0 100%)`              | כפתור-ראשי, CTA                                                  |
| `--primary-grad-bold` | `linear-gradient(135deg, #3B8BFF 0%, #1A56DB 60%, #1E40AF 100%)` | hero-CTA נועז (3-stops)                                          |
| `--primary-disabled`  | `#A0C3FF`                                                        | כפתור כבוי                                                       |
| `--accent`            | `#FF9F2D`                                                        | כתום-בחירה (amber-לוהט, חם מ-StudiesGo המקורי `#FFB23D`)         |
| `--accent-deep`       | `#F97316`                                                        | כתום-עמוק (border-נבחר, streak-flame)                            |
| `--accent-grad`       | `linear-gradient(135deg, #FFB23D 0%, #F97316 100%)`              | מד-XP, streak-ring, יעד-נבחר                                     |
| `--success-border`    | `#86EFAC` · `--success-bg` `#F0FDF4`                             | תשובה-נכונה                                                      |
| `--error-border`      | `#FCA5A5` · `--error-bg` `#FEF2F2` · `--error-drawer` `#FFF0F2`  | תשובה-שגויה                                                      |
| `--explanation-bg`    | `#F0F7FF`                                                        | תיבת-הסבר                                                        |
| `--text-primary`      | `#1F2937`                                                        | טקסט-ראשי                                                        |
| `--text-secondary`    | `#6B7280`                                                        | משני (כהה-יותר מ-StudiesGo `#9CA3AF` — לעמידה ב-AA על off-white) |
| `--text-muted`        | `#9CA3AF`                                                        | disabled/placeholder                                             |
| `--border-default`    | `#E5E7EB`                                                        | border-כרטיס רגיל                                                |
| `--ring-focus`        | `#2D7DF6` (3px, offset 2px)                                      | focus-ring keyboard                                              |

**Dark theme — ניווט · skill-tree · stats · feedback-drawer:**

| token                                                                                              | hex                                                   | שימוש                        |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| `--d-bg-base`                                                                                      | `#0B1120`                                             | רקע-מסך                      |
| `--d-bg-aurora`                                                                                    | radial `rgba(45,125,246,.18)` + `rgba(6,182,212,.12)` | aurora כהה (mesh עדין על bg) |
| `--d-bg-elevated`                                                                                  | `#111827`                                             | משטח-1                       |
| `--d-bg-card`                                                                                      | `#1F2937`                                             | משטח-2 (כרטיס)               |
| `--d-bg-nav`                                                                                       | `rgba(17,24,39,.85)` + `backdrop-blur(16px)`          | bottom-nav glassmorphism     |
| `--d-brand`                                                                                        | `#1A56DB` (hover `#1E40AF`)                           | node-פעיל, tab-active        |
| `--d-cyan`                                                                                         | `#06B6D4` (glow `rgba(6,182,212,.45)`)                | mascot-glow, accent-success  |
| `--d-success` `#10B981` · `--d-error` `#EF4444` · `--d-warning` `#F59E0B` · `--d-locked` `#374151` | מצבים                                                 |
| `--d-text-heading` `#F9FAFB` · `--d-text-body` `#D1D5DB` · `--d-text-muted` `#9CA3AF`              | היררכיית-טקסט                                         |

**Aurora-mesh (חתימת-C) — איך זה נראה:** רקע-`--bg-app` עם 3 radial-gradients רכים (`blur 80px`, `opacity .5`) בפינות. ב-`prefers-reduced-motion` הם **סטטיים**; אחרת — נעים ב-loop איטי מאוד (20s, `ease-in-out`, תזוזה ≤20px). לעולם לא מסיח — רק "חי" ברקע.

```css
.aurora-bg {
  background-color: var(--bg-app);
  background-image:
    radial-gradient(60% 50% at 85% 10%, var(--bg-aurora-1) 0%, transparent 60%),
    radial-gradient(55% 45% at 10% 90%, var(--bg-aurora-2) 0%, transparent 60%),
    radial-gradient(50% 40% at 50% 100%, var(--bg-aurora-3) 0%, transparent 55%);
}
```

### 1.3 טיפוגרפיה

- **משפחה:** `Rubik` (primary) → `Assistant` (fallback) → `system-ui, sans-serif`. שניהם variable-Hebrew מצוינים ל-RTL. `font-feature-settings` מאופשר.
- **משקלים:** `400` body · `500` emphasis · `600` sub-headings · `700` headings · `800` display (חתימת-C — הכותרות-הענק).
- **דפוס-כותרת-מודגש (חתימת-מותג):** מילת-מפתח אחת מודגשת בכתום בתוך כותרת כהה. כיוון-C מעצים: הכותרת ב-`800`, המילה-הכתומה ב-`--accent-deep` + לעיתים underline-gradient עדין.

**סקאלת-טיפוגרפיה (mobile-first · נועזת):**

| token        | size / line-height | weight | שימוש                            |
| ------------ | ------------------ | ------ | -------------------------------- |
| `display-xl` | `48 / 52`          | 800    | hero-onboarding, lesson-complete |
| `display-lg` | `36 / 42`          | 800    | dashboard-greeting, hero-CTA     |
| `h1`         | `28 / 36`          | 700    | כותרת-מסך                        |
| `h2`         | `22 / 30`          | 700    | כותרת-section, שאלת-quiz         |
| `h3`         | `18 / 26`          | 600    | כותרת-כרטיס                      |
| `body-lg`    | `17 / 26`          | 400    | טקסט-תשובה (MCQ)                 |
| `body`       | `15 / 24`          | 400    | גוף-טקסט                         |
| `label`      | `14 / 20`          | 500    | תוויות, כפתורים-קטנים            |
| `caption`    | `13 / 18`          | 400    | AI-notice, hints, tip-card       |
| `button`     | `17 / 24`          | 700    | טקסט-כפתור-ראשי                  |

> **a11y:** כל הגדלים ב-`rem` (base 16px), `clamp()` ל-display כדי שלא יישבר ב-desktop. line-height ≥1.4 לטקסט-עברי (ascender/descender).

### 1.4 מרווחים (spacing scale)

מערכת **4px-base** (`--space-1` = 4px … `--space-2`=8 · `-3`=12 · `-4`=16 · `-5`=20 · `-6`=24 · `-8`=32 · `-10`=40 · `-12`=48 · `-16`=64).

- **Gap-כרטיסים:** `12px` (`--space-3`) — נאמן ל-StudiesGo.
- **Padding-כרטיס:** `16-20px`.
- **Padding-מסך:** `16px` mobile · `24px` desktop · max-width `480px` למובייל-canvas, `1120px` ל-desktop-shell.

### 1.5 Radius

| token         | value           | שימוש                                                   |
| ------------- | --------------- | ------------------------------------------------------- |
| `--r-card`    | `16px`          | כרטיסים (כיוון-C מעט-עגול-יותר מ-light-12 של StudiesGo) |
| `--r-card-lg` | `20px`          | כרטיסי-תשובה (MCQ), hero-card                           |
| `--r-modal`   | `24px`          | modals, sheets-עליון                                    |
| `--r-pill`    | `9999px`        | **כל הכפתורים** (חתימת-StudiesGo, מקודש)                |
| `--r-sheet`   | `24px 24px 0 0` | bottom-sheet                                            |
| `--r-nav`     | `24px 24px 0 0` | bottom-nav                                              |
| `--r-input`   | `9999px`        | שדות-קלט (pill — נצפה ב-auth)                           |

### 1.6 צללים (shadows)

StudiesGo light = **flat, כמעט-ללא-shadow** (border בלבד). כיוון-C **מוסיף עומק-מדוד** — צללים רכים-וצבעוניים (לא אפורים) שנותנים תחושת-lift מודרנית בלי כובד.

| token              | value                                  | שימוש                            |
| ------------------ | -------------------------------------- | -------------------------------- |
| `--sh-card`        | `0 2px 8px -2px rgba(31,41,55,.06)`    | כרטיס-מנוחה (עדין-מאוד)          |
| `--sh-card-hover`  | `0 8px 24px -6px rgba(45,125,246,.18)` | hover-lift (גוון-כחול — חתימת-C) |
| `--sh-cta`         | `0 6px 20px -4px rgba(45,125,246,.40)` | כפתור-ראשי (glow כחול)           |
| `--sh-accent`      | `0 4px 16px -4px rgba(249,115,22,.35)` | streak/XP/נבחר (glow כתום)       |
| `--sh-modal`       | `0 20px 50px -12px rgba(11,17,32,.30)` | modal/sheet                      |
| `--d-sh-card`      | `0 10px 25px -5px rgba(0,0,0,.5)`      | dark-card float                  |
| `--d-glow-primary` | `0 0 20px -3px rgba(26,86,219,.55)`    | node-פעיל, skill-tree            |
| `--d-glow-cyan`    | `0 0 24px -5px rgba(6,182,212,.6)`     | mascot-glow                      |

### 1.7 אייקונוגרפיה

- **ספרייה:** `lucide-react` (stroke-based, `1.75px` — מעט-עבה-יותר מ-default ל-presence נועז). גודל-בסיס `20-24px`.
- **סגנון:** rounded-corners, stroke אחיד — תואם את ה-mascot (stroke 2px).
- **אימוג'י-מותג** (נאמן ל-StudiesGo): `⚡` (XP) · `🔥` (streak) · `👋` (greeting) · `💡` (tip) · `✨` (AI-notice). **ב-a11y:** עטופים ב-`<span aria-hidden>` כשהם דקורטיביים; טקסט-המספר נושא את המשמעות.
- **חיצי-ניווט (RTL-aware):** chevron מתהפך — "המשך" → חץ-שמאלה ב-RTL. אייקון `arrow-left` משמש "המשך"; `arrow-right` משמש "חזרה".
- **אייקוני-ענף (onboarding Q3):** עיגול-צבעוני + lucide (`hard-hat` בנייה · `factory` תעשייה · `zap` חשמל · `book-open` כללי).

---

## 2. מסך התחברות (`/login` overlay · `/beta-access` full)

### 2.1 קונספט

ה-auth ב-StudiesGo הוא **glass-card על gradient תכלת-אפרפר** (נצפה ב-`auth_login.jpg`). כיוון-C **מעצים**: הרקע הופך ל-**aurora-mesh חי** (כחול-עליון, כתום-תחתון), וה-glass-card מקבל **border-gradient עדין** + מסקוט-"רוני" (וריאנט-curious עם **קסדת-בטיחות כתומה** לקורס-ממונה-בטיחות) שמרחף לידו. זה הרושם-הראשון של מוצר-המכירה — חייב להיות **מזמין ומלוטש**.

### 2.2 פריסה

- **מובייל:** modal `90vw` (max `400px`), ממורכז, על aurora-backdrop עם `blur(2px)` על מה-שמאחור.
- **דסקטופ:** split — צד-ימין (RTL) glass-card · צד-שמאל aurora-panel גדול עם מסקוט-hero ענק + tagline ("בנה. למד. **הוסמך.**").
- **רכיבים:** `<AuthCard>` (glass) · לוגו StudiBuilder + מסקוט-mini · כותרת "**בוא נתחבר**" (display-lg, מילת-"נתחבר"-כתומה) · `<GoogleSignInButton>` · מפריד "או" · `<MagicLinkForm>` (input-pill + CTA-gradient) · `<TosFooter>`.

### 2.3 מצבים

| מצב                     | תיאור-ויזואלי                                                                                                                                          | מסקוט                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| **choices (default)**   | glass-card מלא: Google-button (לבן + border, לוגו-Google) · "או" · input-אימייל · CTA "**שלח קישור התחברות**" (gradient) · TOS-footer                  | רוני-`curious` מרחף (idle-float V13), glow-cyan עדין |
| **email-input (focus)** | input מקבל focus-ring כחול `3px` + glow רך · CTA מתבהר מ-disabled→enabled (V4 color+pop) · validation בזמן-אמת (border-ירוק תקין / border-אדום שגוי)   | רוני נשאר curious                                    |
| **loading (שליחה)**     | CTA → spinner-inline (`rotate 360 linear ∞`) + טקסט "שולח..." · button-disabled                                                                        | רוני-`thinking` (3 נקודות מהבהבות)                   |
| **magic-sent**          | card מתחלף (cross-fade + scale): אייקון-מעטפה גדול · "**בדוק את המייל!**" · "שלחנו קישור ל-{email}" · "תקף ל-60 דקות" · קישורים "שלח שוב / שנה אימייל" | רוני-`happy` (pop-in V7 + fist-pump)                 |
| **oauth-redirect**      | overlay-spinner קצר + "מעביר ל-Google..." → redirect                                                                                                   | רוני-`thinking`                                      |
| **error**               | toast-עליון אדום ("קישור-ההתחברות נכשל — נסה שוב") + input border-אדום, **לא רק צבע**: אייקון `alert-circle` + טקסט-שגיאה מתחת                         | רוני-`sad` (shrug V15) קצר                           |

### 2.4 Micro-interactions (חתימת-C)

- Google-button: `hover` → lift `y:-2px` + `--sh-card-hover` · `tap` → `scale .97` (spring.button).
- CTA-gradient: `hover` → ה-gradient **זז** (`background-position` shift, .4s) + glow-כחול מתחזק · `tap` → `scale .95` (V5).
- input: `focus` → ring מתרחב עם spring + רקע-pill מתבהר מעט.
- מעבר choices→magic-sent: `AnimatePresence` עם `layout`-spring + cross-fade.

### 2.5 Wireframe ASCII — Login (mobile, RTL)

```
╔══════════════ aurora-mesh backdrop (blur) ══════════════╗
║   ·· כחול ··                                  ·· ··      ║
║                                                          ║
║      ┌──────────── glass-card (r-modal) ──────────┐      ║
║      │                                      ✕      │      ║
║      │        ┌─────────────────────┐              │      ║
║      │        │  StudiBuilder  🤖🪖  │  ← לוגו+רוני │      ║
║      │        └─────────────────────┘              │      ║
║      │                                              │      ║
║      │            בוא נתחבר                         │  ← display-lg
║      │     (״נתחבר״ בכתום-מודגש)                   │      ║
║      │                                              │      ║
║      │   ╭────────────────────────────────╮        │      ║
║      │   │      המשך עם Google      [G]    │  pill  │      ║
║      │   ╰────────────────────────────────╯        │      ║
║      │                                              │      ║
║      │   ───────────────  או  ──────────────       │      ║
║      │                                              │      ║
║      │                              אימייל          │  ← label
║      │   ╭────────────────────────────────╮        │      ║
║      │   │  you@example.com               │  pill  │      ║
║      │   ╰────────────────────────────────╯        │      ║
║      │   ╭════════════════════════════════╮        │      ║
║      │   ║     שלח קישור התחברות    →      ║ grad   │      ║
║      │   ╰════════════════════════════════╯        │      ║
║      │                                              │      ║
║      │   בהמשך אתה מסכים לתנאי השימוש ולמדיניות     │  ← caption
║      └──────────────────────────────────────────────┘      ║
║                              ·· כתום ··                   ║
╚══════════════════════════════════════════════════════════╝
   (החץ → ב-CTA מצביע שמאלה ב-RTL = "קדימה")
```

---

## 3. מסך פתיחה + שאלון-onboarding (native)

### 3.1 קונספט

בכניסה-ראשונה לקורס "ממונה בטיחות" → **welcome-hero** ואז **5 שאלות** שבונות **מסלול-לימוד-אישי** עד מועד-הוועדה. כל-שאלה = מסך-יחיד, מעבר slide-אופקי (מבוסס `04-onboarding` gemini), מד `1/5..5/5`, כפתורי-בחירה גדולים (pill), מסקוט-`curious` (קסדת-בטיחות) מלווה. ~~נכתב **native** — אפס-העתקה מ"מגן".~~ — **🔧 firewall-מגן בוטל 2026-06-09 · port-permitted name-cleaned ([ADR-009](../architecture/ADR-009-magen-integration.md)).**

> הרעיון מבוסס **השראת-מבנה** מ-`docs/IDEAS.md` "מתכנן-מסלול-אישי". הנוסחה, השאלות והניסוח נכתבו כאן ל-StudiBuilder. ~~🔒 אין שימוש ב-`study_plan_90days`/`committee_bank`/תוכן-מגן.~~ — **🔧 firewall-מגן בוטל 2026-06-09 · port-permitted name-cleaned ([ADR-009](../architecture/ADR-009-magen-integration.md)).**

### 3.2 זרימת-מסכים

```
Welcome-hero → Q1 → Q2 → Q3 → Q4 → Q5 → [spinner-בונה-מסלול] → Summary "המסלול-שלי" → Dashboard
   (skip→)  ────────────────────────────────────────────────────────────────────────┘
```

- **Welcome-hero:** aurora-mesh מלא · מסקוט-`happy` ענק (קסדת-בטיחות, idle-float) · כותרת `display-xl` "**ברוך הבא** למסלול שלך 🪖" · sub "5 שאלות קצרות ונבנה לך תוכנית עד הוועדה" · CTA-gradient "**בואו נתחיל**" · קישור-עדין "דלג, אכנס ישר" (למתקדמים).
- **כל-שאלה:** header עם מד-נקודתי `●●●○○` (כתום-מתמלא **מימין-לשמאל**) + "שאלה 2 מתוך 5" · כותרת-שאלה `h1` · אזור-בחירה · footer "המשך →" (disabled עד-בחירה, V4-enable) + "חזרה" (chevron-ימינה).

### 3.3 חמש השאלות המדויקות

| #      | שאלה (UI עברית)                       | סוג-קלט                          | אפשרויות מדויקות                                         | שדה-נתון               |
| ------ | ------------------------------------- | -------------------------------- | -------------------------------------------------------- | ---------------------- |
| **Q1** | "מתי **מועד-הבחינה/הוועדה** שלך?"     | date-picker pill + checkbox      | בורר-תאריך · "עוד לא קבעתי"                              | `exam_date`            |
| **Q2** | "כמה זמן **ביום** תוכל/י להקדיש?"     | 4 pills (single)                 | `30 דק׳` · `שעה` · `שעה וחצי` · `שעתיים+`                | `daily_minutes`        |
| **Q3** | "מה הרקע **המקצועי** שלך?"            | 5 כרטיסים (single, אייקון-עיגול) | `בנייה 🪖` · `תעשייה 🏭` · `חשמל ⚡` · `כללי 📖` · `אחר` | `domain_background`    |
| **Q4** | "כמה מתוכנית-הלימודים **כבר השלמת**?" | סולם 4-מצבים (single)            | `מתחיל/ה` · `חלקי` · `מתקדם/ת` · `חזרה לקראת בחינה`      | `progress_self_report` |
| **Q5** | "אילו **ימים** בשבוע נוחים ללימוד?"   | בחירה-מרובה (א׳–ש׳)              | toggle-pills א׳ ב׳ ג׳ ד׳ ה׳ ו׳ ש׳                        | `study_days[]`         |

**אינטראקציות-בחירה (חתימת-C):** בחירת-pill/כרטיס → border→`--accent-deep` (V2, flip-מיידי) + רקע-tint-כתום-5% + `tap scale .96` (V1) + haptic-light. הכרטיס-הנבחר מקבל glow-כתום עדין (`--sh-accent`). מעבר-בין-שאלות: slide-אופקי (יוצא `x:0→-100vw` · נכנס `x:100vw→0`, easeInOut, .25s) + מד מתקדם.

### 3.4 פלט מסלול-אישי (Summary)

מסך-סיכום אחרי Q5 (אחרי spinner "**בונה לך מסלול...**" — נאמן ל-create-loading-modal):

- **כותרת-ניצחון:** `display-lg` "**המסלול שלך מוכן!** 🎯" + confetti-קל (80 חלקיקים) + מסקוט-`proud` (קסדה + halo-זהב).
- **כרטיס-תקציב:** "יש לך **N שעות-לימוד** עד הוועדה" (מחושב: `daily_minutes × |study_days| × שבועות-עד-exam_date`).
- **כרטיס-קצב:** "כדי לסיים בזמן — **X נושאים/שבוע**". אם לא-ריאלי → badge-warning כתום "⚠️ לוח-זמנים צפוף — שקול/י להוסיף יום".
- **כרטיס-"המסלול-שלי":** טיימליין-ויזואלי אופקי — נושאים כ-`nodes` (מתחבר ל-skill-tree V9-12, path-draw), "**אתה כאן**"-marker כתום. הסדר ממוין: `domain_background` מקדים נושאים-מוכרים (בנייה→נושאי-בנייה ראשונים), `progress_self_report` מדלג/מדגיש.
- **כרטיס-יעד-יומי:** "**יעד יומי מומלץ: 20 XP**" (נכתב ל-`settings.daily_goal_min`) + streak-target עד הוועדה.
- **CTA:** "**יאללה, מתחילים!**" (gradient) → dashboard.

### 3.5 Wireframe ASCII — Onboarding Q2 (mobile, RTL)

```
╔════════════════ aurora-mesh (עדין) ════════════════╗
║                                                     ║
║   ⟵ חזרה                          שאלה 2 מתוך 5     ║
║   ●  ●  ○  ○  ○   ← מד נקודתי (מתמלא מימין→שמאל)   ║
║                                                     ║
║        ┌─────────┐                                  ║
║        │  🤖🪖    │  ← רוני curious (idle-float)     ║
║        └─────────┘                                  ║
║                                                     ║
║          כמה זמן ביום תוכל/י                        ║
║          להקדיש ללימוד?            ← h1             ║
║       (״ביום״ בכתום-מודגש)                         ║
║                                                     ║
║   ╭───────────────╮   ╭───────────────╮            ║
║   │     30 דק׳    │   │      שעה       │  ← pills   ║
║   ╰───────────────╯   ╰═══════════════╯            ║
║                        (נבחר=border כתום+glow)      ║
║   ╭───────────────╮   ╭───────────────╮            ║
║   │   שעה וחצי    │   │    שעתיים+     │            ║
║   ╰───────────────╯   ╰───────────────╯            ║
║                                                     ║
║                                                     ║
║   ╭═══════════════════════════════════════╮        ║
║   ║            המשך              →         ║ grad   ║
║   ╰═══════════════════════════════════════╯        ║
║              (disabled עד בחירה)                    ║
╚═════════════════════════════════════════════════════╝
```

---

## 4. מעברים

**Easing-default (נאמן ל-StudiesGo · motion-specs):** **Spring כמעט-בלעדי, לא cubic-bezier.** כיוון-C מוסיף וריאנט `bouncy` אחד לרגעי-ניצחון.

```ts
// src/lib/animations/_base.ts (קיים — כיוון-C מוסיף את bouncy + aurora)
button : spring(stiffness 400, damping 25)   // micro-interactions
elastic: spring(stiffness 300, damping 12)   // mascot/cards/modals — overshoot
pop    : spring(stiffness 500, damping 15)   // pop מהיר
layout : spring(stiffness 350, damping 30)   // AnimatePresence
bouncy : spring(stiffness 260, damping 14)   // ← חדש-C: רגעי-ניצחון (level-up, summary)
durations: fast .05 · base .15 · medium .25 · slow .4
```

| סוג-מעבר                                               | ערכים                                                                                  | מקור/הערה                   |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------- |
| **Page/route** (onboarding-steps)                      | slide-אופקי: יוצא `x:0→-100vw` · נכנס `x:100vw→0`, `easeInOut`, `.25s` + מד `n/5` עולה | `04-onboarding` gemini      |
| **Route-כללי** (dashboard↔lesson)                      | spinner-טעינה `rotate 360 linear ∞` + cross-fade content, `.2s`                        | `04` gemini (loading-modal) |
| **Tab-switch** (bottom-nav)                            | icon `scale .8→1.2→1.1` + content X-slide cross-fade (V18)                             | motion-specs V18            |
| **Bottom-sheet** (feedback/upload)                     | `y:100%→0` spring.layout + backdrop `opacity 0→.4` (V6)                                | motion-specs V6             |
| **Center-modal** (deep-explanation)                    | `scale .8→1` + backdrop blur `0→8px` (V17)                                             | motion-specs V17            |
| **Shared-element** (course-card → lesson-hero)         | `layoutId="course-{id}"` — הכרטיס "גדל" לכותרת-השיעור, spring.layout. **חתימת-C**      | חדש                         |
| **Shared-element** (onboarding node → skill-tree node) | `layoutId="topic-{id}"` — node-המסלול מ-Summary ממשיך לעץ                              | חדש                         |
| **Aurora-drift**                                       | mesh-points זזים `≤20px`, `20s ease-in-out ∞` (כבוי תחת reduced-motion)                | חתימת-C                     |
| **Hero-CTA gradient-shift**                            | `background-position 0%→100%`, `.4s` ב-hover                                           | חתימת-C                     |

> כל המעברים מכבדים `respectReducedMotion()` — slide הופך ל-fade-מיידי, aurora-drift נעצר, confetti מבוטל.

---

## 5. כפתורים

### 5.1 וריאנטים

| variant          | מראה                                                                       | שימוש                                                        |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **primary**      | gradient `--primary-grad` · טקסט-לבן `700` · `--sh-cta` (glow כחול) · pill | CTA-ראשי ("שלח קישור", "המשך", "צור קורס")                   |
| **primary-bold** | gradient `--primary-grad-bold` (3-stops) · גדול-יותר · glow-חזק            | hero-CTA (onboarding-welcome, lesson-complete) — **חתימת-C** |
| **secondary**    | רקע-לבן · border `--border-default` · טקסט-`--primary` · pill              | פעולה-משנית ("חזרה", "דלג")                                  |
| **accent**       | gradient `--accent-grad` (כתום) · טקסט-לבן · `--sh-accent`                 | gamification/בחירה ("הפעל streak", יעד)                      |
| **ghost**        | שקוף · טקסט-`--primary` · hover→bg-tint                                    | קישורים-פעולה ("שלח שוב", "שנה אימייל")                      |
| **danger**       | רקע `--error-bg` · טקסט-אדום · border-אדום                                 | "מחק חשבון", "התנתק" (settings danger-zone)                  |
| **icon**         | עגול · `44×44px` (a11y target) · ghost/filled                              | ניווט-עגול ("→" header-quiz)                                 |

### 5.2 מצבים (לכל variant)

`default` · `hover` (lift `y:-2px` + shadow-מתחזק) · `active/tap` (`scale .95-.97` spring.button) · `focus-visible` (ring-כחול `3px` offset `2px`) · `disabled` (`--primary-disabled`, טקסט חצי-שקוף, cursor-not-allowed, **לא רק צבע** — opacity + cursor) · `loading` (spinner-inline + טקסט "טוען...", רוחב-נעול למניעת-קפיצה).

### 5.3 גדלים

| size | height | padding-x | font           | שימוש                   |
| ---- | ------ | --------- | -------------- | ----------------------- |
| `sm` | 36px   | 16px      | label-14       | toggles, chips          |
| `md` | 44px   | 24px      | button-17      | ברירת-מחדל (a11y-min)   |
| `lg` | 52px   | 32px      | button-17      | CTA-מסך                 |
| `xl` | 60px   | 40px      | display-בינוני | hero-CTA (primary-bold) |

### 5.4 Micro-interactions (חתימת-C — עשירות)

- **tap-squash:** `scale .95` + spring.button (V5) — נצפה ב-StudiesGo (`0.97`); כיוון-C מחדד ל-`.95` ל-CTA-ראשיים.
- **gradient-shift on hover:** `background-position` נע — תחושת-"חי".
- **enable-pop:** disabled→enabled עם `scale [1,1.04,1]` + color-fade (V4) — נצפה ב-quiz.
- **magnetic (desktop בלבד):** ה-CTA "נמשך" קלות לכיוון-הסמן (≤6px) — disabled תחת reduced-motion/touch.
- **success-ripple:** לחיצה מוצלחת → ripple-עיגול יוצא מנקודת-הלחיצה (חתימת-C, .3s).
- **haptic (mobile):** Light=tap · Medium=submit/match · Heavy=error (משוער מ-`02`).

---

## 6. הנפשות

> כל הערכים מ-`docs/design/motion-specs.md` (34 variants). כיוון-C **משתמש בכולם** ומוסיף שכבת-aurora + bouncy-summary. כולם מכבדים `respectReducedMotion()`.

### 6.1 מסקוט "רוני" (דמות-אנושית · קסדת-בטיחות לקורס-זה)

| pose                         | טריגר                                          | מפרט Framer-Motion                                                                  |
| ---------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| **idle-float** (V13)         | תמיד                                           | `y:[0,-10,0]` · `3s` · `easeInOut` · `∞`                                            |
| **curious**                  | empty-states, onboarding, auth                 | idle-float + הטיית-ראש; bubble-`?` אופציונלי                                        |
| **happy / success** (V7+V14) | תשובה-נכונה, magic-sent, welcome               | pop-in `scale:[0,1.1,1]` (elastic, .4s) → fist-pump → glow-cyan↑ `drop-shadow 30px` |
| **thinking** (V15-base)      | loading, pipeline, oauth                       | head-tilt + 3-נקודות-מהבהבות (.3s) / spinner-כחול לידו                              |
| **proud** (bouncy-C)         | סיום-קורס, level-up, summary, streak-milestone | entrance `scale-in` (bouncy) + halo-זהב `glow-pulse 1.5s ∞`                         |
| **sad / error** (V15)        | תשובה-שגויה, streak-נשבר                       | `y:10` + shake `x:[0,-4,4,-2,2,0]` + glow-אדום `15px` (.4s)                         |

> כיוון-C מציג **שני וריאנטים** (נאמנות-brief): וריאנט-רובוט (המשכיות-StudiesGo) **וגם** וריאנט-רוני (ייחוד-StudiBuilder). קורס-ממונה-בטיחות → קסדה-כתומה כברירת-מחדל. כל-mascot-SVG: `role="img"` + `aria-label` (למשל "רוני שמח — תשובה נכונה").

### 6.2 Feedback — נכון / שגוי

| אירוע           | אנימציה                                       | מפרט                                                                                       |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **בחירת-תשובה** | card border→כתום                              | V2 (flip-מיידי, `transition:0`) + V1 tap `scale .96`                                       |
| **נכון**        | bottom-sheet עולה + רוני-happy + stagger-list | V6 (`y:100%→0` spring.layout) + V7 (robot pop) + V8 (stagger 50ms) · אופציונלי confetti-קל |
| **שגוי**        | screen-shake + drawer-אדום + רוני-sad         | V16 (`x:[0,-10,10,-5,5,0]`, .25s) + V6-drawer (`--error-drawer`) + V15                     |
| **הסבר-מורחב**  | center-modal pop + backdrop-blur              | V17 (`scale .8→1` + blur 0→8px)                                                            |

> **לא רק צבע:** נכון = border-ירוק **+ אייקון `check`** · שגוי = border-אדום **+ אייקון `x`** + shake. (WCAG — צבע אף-פעם לא הסימן-היחיד.)

### 6.3 גיימיפיקציה — XP / streak / level

| אלמנט                    | אנימציה                                            | מפרט                                                                                                  |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **XP-gain**              | "+10 XP" pop-up כתום עולה-ונעלם + counter count-up | spring.pop + count-up `.6s` · gradient-accent                                                         |
| **streak-flame**         | להבה-כתומה flicker + טבעת-מתמלאת                   | scale-pulse `[1,1.08,1]` `2s ∞` + ring `pathLength 0→1`                                               |
| **level-up**             | burst + רוני-proud + confetti                      | bouncy-C entrance + confetti (80, ירוק/זהב/לבן, .8s)                                                  |
| **daily-goal-checkmark** | draw-on של `✓`                                     | SVG `pathLength 0→1` `.4s`                                                                            |
| **skill-tree**           | path-draw + node-pop + unlock                      | V9 (`pathLength 0→1` .6s) · V10 (active pop+glow) · V11 (locked reveal) · V12 (shake→ripple→icon-pop) |

> **gamification מאופק (brief):** נוכח אך **מניע ולא מסיח** — confetti רק ב-milestones-אמיתיים, לא בכל-תשובה. קהל-בוגר.

### 6.4 טעינה (loading)

| הקשר                          | אנימציה                                                | מפרט                                                     |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| **route/step**                | spinner-כחול `rotate 360 linear ∞` במרכז-card          | `04` gemini (loading-modal — `create_topic_confirm.jpg`) |
| **pipeline (create)**         | רוני-thinking + progress-stages + "בודקים את המקור..." | spinner + step-labels                                    |
| **skeleton (dashboard/list)** | shimmer-gradient נע על placeholders                    | `1.5s linear ∞` (כבוי reduced-motion → סטטי-אפור)        |
| **button-inline**             | spinner קטן + טקסט מתחלף                               | רוחב-נעול                                                |

---

## 7. מראה נקי / נעים / מזמין (vibe + מצבי-מערכת)

### 7.1 ה-Vibe הכללי

**"אנרגיה-גבוהה אך מבוקרת."** ה-aurora-mesh, ה-gradients וה-micro-interactions יוצרים תחושת-**חיות ומודרניות**, אבל ה-whitespace-הנדיב (gap-12, padding-נשים), הטיפוגרפיה-הברורה, וה-gamification-המאופק שומרים על **רוגע ומיקוד**. התוצאה: מוצר שמרגיש **יקר ומלוטש** (לא prototype), **מזמין** (חם, צבעוני, מסקוט-ידידותי), אך **רציני** (קהל ממוני-בטיחות — לא ילדים). כל מסך נושם; ה-aurora לעולם לא צועק.

### 7.2 מצבי Empty / Loading / Error

| מצב                          | עיצוב                                                                                                               | מסקוט                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Empty (dashboard ריק)**    | aurora-hero · "**בוא נתחיל ללמוד היום!**" (display-lg) · CTA-bold "+ קורס חדש" · 3 counters אפס (credits/XP/streak) | רוני-`curious`/`happy` (idle-float) |
| **Empty (stats ללא-נתונים)** | EmptyStateCard ממורכז · "עוד אין נתונים — סיים שיעור ראשון ונתחיל לעקוב 📊" · CTA "התחל שיעור"                      | רוני-`curious`                      |
| **Loading (route)**          | spinner-כחול במרכז על aurora · skeleton-shimmer לכרטיסים                                                            | רוני-`thinking` (ב-pipeline)        |
| **Loading (skeleton)**       | shimmer-placeholders בצורת-התוכן (לא spinner-ריק) — תחושת-מהירות                                                    | —                                   |
| **Error (כללי)**             | toast-עליון אדום (אייקון `alert` + טקסט-עברי + "נסה שוב") · לא-מסך-מלא אלא-אם-fatal                                 | רוני-`sad` (קצר)                    |
| **Error (fatal/404)**        | מסך-מלא · רוני-sad · "משהו השתבש 😕" · CTA "חזרה לדף-הבית"                                                          | רוני-`sad`                          |
| **Offline**                  | banner-עליון אפור "אין חיבור — נסנכרן כשתחזור"                                                                      | —                                   |

---

## 8. RTL + נגישות (a11y / WCAG AA)

### 8.1 RTL — אזרח-ראשון (לא תיקון-בדיעבד)

- **Logical-properties בלבד:** `ps-*`/`pe-*` · `ms-*`/`me-*` · `inset-inline-*` — **אף פעם** `pl-*`/`pr-*`.
- **חיצים/chevrons מתהפכים:** "המשך →" מצביע **שמאלה** ב-RTL (נצפה ב-`create-c`); back-arrow ימינה; chevron-list מתהפך.
- **מד-התקדמות נקודתי** (`●●○○○`) מתמלא **מימין-לשמאל** (נצפה ב-`lesson_mcq.jpg` — הכתום מימין).
- **Gradients אלכסוניים** (`135deg`): נבדק שכיוון-הזרימה תואם-RTL ולא נראה "הפוך".
- **מסקוט tassel/אביזר** מכוון ימינה ב-layout-עברי.
- **טקסט-מספר מעורב** (XP `30 XP`, תאריכים): `dir="auto"`/`unicode-bidi: plaintext` למניעת-היפוך-ספרות.
- **בדיקת-Playwright חובה** תחת `dir="rtl"` לכל-מסך-חדש (CLAUDE.md RTL-checklist).

### 8.2 a11y (יעד: axe-core 0-violations · Lighthouse a11y ≥95)

- **ניגודיות WCAG-AA:** כל שילוב-טקסט נבדק. `--text-secondary` הוקשח ל-`#6B7280` (מ-`#9CA3AF`) לעמוד ב-4.5:1 על off-white. טקסט-לבן על gradient-כחול ≥4.5:1 (נבדק על הקצה-הבהיר). aurora-mesh **לעולם לא מתחת לטקסט** ברמת-ניגוד-בעייתית — הטקסט תמיד על surface-לבן/card.
- **צבע ≠ סימן-יחיד:** נכון/שגוי = צורה+אייקון (check/x) **בנוסף** לירוק/אדום. נבחר/לא-נבחר = border-עובי+אייקון, לא רק גוון.
- **keyboard-nav מלא:** Tab בין-שדות (auth) · בין-controls (settings) · בחירת-תשובות (quiz, חיצים + Enter) · onboarding (Tab בין-pills, Space לבחירה). focus-ring-כחול `3px` **נראה-תמיד** (`:focus-visible`).
- **`prefers-reduced-motion`:** `respectReducedMotion()` מאפס spring/shake/confetti/aurora-drift/magnetic. slide→fade-מיידי.
- **מקלדת-מובייל** עולה ב-focus-שדה (auth/create); `inputmode`/`autocomplete` מתאימים (email).
- **ARIA:** מסקוט `role="img"`+`aria-label` · מד-התקדמות `role="progressbar"` `aria-valuenow` · toast `role="status"`/`aria-live="polite"` · modal `role="dialog"` + focus-trap + Esc-לסגירה · sheet-feedback `aria-live` למשוב.
- **touch-targets** ≥44×44px (כפתורי-md, icon-buttons).
- **כפתור-נגישות גלובלי** (FAB/settings-toggle) לכל-עמוד (`a11y-fab.md`) — הגדלת-טקסט/ניגודיות-גבוהה/עצירת-תנועה.
- **מחק-חשבון** = מחיקה-מלאה (GDPR right-to-be-forgotten) + אישור-כפול.
- **aurora a11y:** ה-mesh דקורטיבי (`aria-hidden`), opacity-נמוך, לא פוגע-בקריאות; ניתן-לכיבוי דרך reduced-motion + high-contrast-toggle.

---

## 9. למה הכיוון מתאים למוצר-לשיווק (קהל ממוני-בטיחות עברי)

1. **רושם-ראשון מוכר-ונמכר.** קהל-יעד (ממוני-בטיחות, 25-55) צורך מוצרי-edtech עכשוויים. Bold-Modern עם aurora-gradients ו-micro-interactions עשירות **משדר "מוצר-2026 מקצועי ויקר"** — קריטי כשזה מוצר-מכירה, לא prototype-פנימי. ההבחנה-הויזואלית הגבוהה עוזרת לבדל מקורסים-משעממים מתחרים (PDF-ים, מצגות).

2. **אנרגיה-מניעה ללימוד-ממושך.** הכנה-לוועדה היא מסע-ארוך (חודשים). gamification (XP/streak/confetti) + מסקוט-רוני + מסלול-אישי **מחזיקים מוטיבציה** — בדיוק הצורך של לומד-מבוגר עם 1-2 שעות/יום. ה-aurora וה-spring נותנים תחושת-תנופה ("המערכת חיה איתי").

3. **רציני-אך-לא-ילדותי.** ה-brief מדגיש: קהל-בוגר, לא ילדים. כיוון-C **מאזן** את האנרגיה — מסקוט דמות-אנושית-בוגרת (לא רובוט-ילדותי/anime), gamification-מאופק (confetti רק ב-milestones), טיפוגרפיה-מקצועית, **קסדת-בטיחות כתומה** כחתימה-תמטית רלוונטית-לתחום. זה "Notion-warmth + Khan-seriousness" עם boost-של-אנרגיה.

4. **אמון-וציות כחלק-מהיופי.** `AiNotice` הקבוע + PDF-as-source-of-truth + badge-"מקור" משולבים **בעיצוב-עצמו** (citation-affordance ויזואלי). לקהל-בטיחות שמורגל ב-תקנים-וציטוטים — זה משדר **אמינות**, שמגדילה אמון-מכירה.

5. **עברית-RTL-נטיבית = יתרון-מקומי.** רוב מוצרי-edtech הגלובליים חלשים-ב-RTL. StudiBuilder עם RTL-אזרח-ראשון + מסקוט-מקומי + שפה-חמה **מרגיש "נבנה-בשבילי"** לקהל-ישראלי — נכס-שיווקי-ממשי.

---

## 10. חתימות-מותג (סיכום-מהיר לבנייה)

**משמר מ-StudiesGo (FIREWALL — מקור-יחיד):** ניגוד כחול↔כתום · pill-buttons (`--r-pill`) · glass-dark-nav · מסקוט-מרחף-עם-glow · spring-everywhere · מד-נקודתי-כתום (RTL) · tip-card "💡" · AiNotice "✨" · שני-themes (light-תוכן / dark-ניווט).

**מוסיף ב-Bold-Modern (חתימת-C):** aurora-mesh כשפת-רקע · gradient-3-stops ל-hero · כותרות-display-`800`-ענק · micro-interactions עשירות (gradient-shift · magnetic · success-ripple) · `bouncy`-spring לניצחונות · shared-element-transitions (`layoutId`) · shadows-צבעוניים-רכים.

**חתימת-StudiBuilder (כל-הכיוונים):** דמות-אנושית "רוני" (5 poses) · קסדת-בטיחות-כתומה לקורס-ממונה-בטיחות · מסלול-אישי-מותאם (onboarding native) · עברית-RTL-נטיבית · citation-affordance (אמון-ציות).

---

### קבצי-מקור (paths מוחלטים — מאומתים בריצה זו)

- `c:/Users/USER/OneDrive/שולחן העבודה/Google_Antigravity/studi/docs/design/motion-specs.md` (34 variants + tokens light+dark)
- `c:/Users/USER/OneDrive/שולחן העבודה/Google_Antigravity/studi/docs/design/mascot-brief.md` (5 poses + 3 אביזרים + "רוני")
- `c:/Users/USER/OneDrive/שולחן העבודה/Google_Antigravity/studi/docs/sources/studiesgo-videos/04-onboarding/gemini-response.md` (slide-transitions + spinner)
- `c:/Users/USER/OneDrive/שולחן העבודה/Google_Antigravity/studi/docs/screens/{auth_login,dashboard,lesson_mcq,create_topic_confirm}.jpg` (curated-visual — אומתו-בעין)
- `c:/Users/USER/OneDrive/שולחן העבודה/Google_Antigravity/studi/docs/screens-spec/{auth-modal,dashboard}.md` · `docs/IDEAS.md` (Personalized Study-Path)

**הערת-firewall:** ~~כל התוכן נגזר מקורפוס-StudiesGo + מסמכי-StudiBuilder בלבד; לא נעשה שימוש בקוד/תוכן/prompts ממערכת "מגן".~~ — **🔧 firewall-מגן בוטל 2026-06-09 (REVERSED · port-permitted):** מותר עכשיו לפורט פרומפט-מגן name-cleaned (מוטי בעל-שני-הריפו → אפס-licensing · megen מבודד read-only). הכיוון-החזותי StudiesGo נשאר בתוקף. ראה [ADR-009](../architecture/ADR-009-magen-integration.md).

```

```
