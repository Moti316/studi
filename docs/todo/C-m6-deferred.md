# TODO · C — ממצאי M6 שנדחו (החלטות-מוטי)

> שלב C ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: 🟡 פתוח (לא-חוסם) · תלות: החלטות-מוצר/איכות · לא-חוסם build · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

ארבעת הממצאים שריצת-M6 (code-review + security-review) זיהתה כ**מאומתים אך נדחו** (3 ממצאים + חבילת-`server-only`) טופלו או הוכרעו במפורש: כל פריט קיבל הכרעת-מוטי (לממש / לדחות-עם-נימוק), וזה שאושר-לממש מוטמע בקוד עם הטסט הירוק התואם. כל הפריטים **לא-חוסמים את ה-build** — הם איכות/נגישות/דיוק-עלות.

## תלויות

חוסם: שלושה מהפריטים (C1, C3, וחלקית C2) תלויים ב**הכרעת-מוצר/איכות של מוטי** לפני מימוש (במיוחד C1 — שינוי-התנהגות-מוצר). פותח: C2 משפר אמינות-תקצוב לקראת **M5** (הרצת-ייבוא בפועל, hard-cap $5) · C4 (`server-only`) מהדק את guard ה-P3 שכבר קיים ב-`src/lib/ai/client.ts` ומשרת את חוב-הציות C1 ב-[COMPLIANCE.md](../compliance/COMPLIANCE.md) (בידוד service-role / server-only).

## תתי-משימות

- [ ] **C1** — MatchingPairs grading mode (graded↔guided-practice) — החלטת-מוצר. כיום `handleSubmit` מחייב התאמת **כל** הזוגות לפני submit, ולכן `onComplete(true)` תמיד — מצב "תרגול-מודרך" (guided-practice). ה-reducer כבר תומך ב-`result-wrong` + `correctness[]` למצב "מדורג" (graded) אך הענף לא-נגיש. · קריטריון-קבלה: מוטי הכריע איזה מצב הוא ברירת-המחדל; אם נבחר graded — נוסף prop (לאמת) שמאפשר submit חלקי → `onComplete(false)` + הצגת `result-wrong`, עם טסט-Vitest אחד שמכסה זוג-שגוי; אם נדחה — תועד "guided-practice = כוונת-מוצר" ב-JSDoc של הרכיב והפריט נסגר. · ref: [MatchingPairs.tsx](../../src/features/lesson-player/components/MatchingPairs.tsx)
- [ ] **C2** — מונה-Gemini token fidelity — דיוק חישוב-עלות מול ה-API. כיום ה-pre-flight ב-`import-content.ts` מתקצב לפי קבוע-גס `estUsdPerGeminiCall=0.0008` ($/קריאה) ב-`BUDGET`, ללא ספירת-טוקנים אמיתית — worst-case בלבד מול ה-hard-cap. · קריטריון-קבלה: מקור-העלות מדויק לפי טוקנים-בפועל — באמצעות `countTokens` לפני-קריאה ו/או `usageMetadata` מתשובת-Gemini (לאמת זמינות ב-`@google/genai`), נצבר ב-`geminiCallsUsed`-equivalent למונה-USD ממשי; ה-budget-guard (default-deny, exit 3) ממשיך לחסום `--execute` מעל ה-cap; טסט אחד מאמת שחישוב-העלות נגזר מספירת-טוקנים ולא מקבוע. · ref: [client.ts](../../src/lib/ai/client.ts) · [import-content.config.ts](../../scripts/import-content.config.ts)
- [ ] **C3** — MCQ a11y roving-tabindex — נגישות-מקלדת ברכיבי-הבחירה. כיום `McqQuestion` משתמש ב-`role="radiogroup"` עם כל option `tabIndex={submitted ? -1 : 0}` — כל הרדיו-באטנים ב-tab-order, מה שסוטה מתבנית-ARIA של radiogroup (radio בודד פעיל ב-tab; חצים מנווטים פנימה). · קריטריון-קבלה: יושם roving-tabindex — בכל רגע רק option אחד `tabIndex=0` (הנבחר/הראשון) והשאר `-1`, עם ניווט ArrowUp/ArrowDown (ו-Home/End — לאמת) המזיז פוקוס+בחירה בתוך ה-radiogroup, RTL-aware (חצים מתהפכים); נשמרים `aria-checked`/`aria-disabled` הקיימים; טסט-Vitest אחד מאמת מעבר-פוקוס בחיצים. · ref: [McqQuestion.tsx](../../src/features/lesson-player/components/McqQuestion.tsx)
- [ ] **C4** — התקנת חבילת server-only (P3 guard) — מניעת ייבוא server→client. כיום `src/lib/ai/client.ts` נשען על guard ידני `assertServerSide()` + הערת-קונבנציה במקום שגיאת-build, כי חבילת-`server-only` **לא מותקנת** (דגל מתועד ב-SESSION-LOG). · קריטריון-קבלה: `server-only` מותקנת (pnpm) ומיובאת בראש `client.ts` (ושאר מודולי-server שקוראים `process.env`/`SUPABASE_SERVICE_ROLE_KEY` — לאמת רשימה), כך שייבוא לתוך `'use client'` נכשל ב-build; ה-`assertServerSide()` הידני נשמר כ-defence-in-depth או מוסר במודע; `pnpm typecheck` + הטסטים נשארים ירוקים. · ref: [client.ts](../../src/lib/ai/client.ts) · [COMPLIANCE.md](../compliance/COMPLIANCE.md)

## מסמכי-ייחוס (קרא לפני עבודה)

- [SESSION-LOG.md](../context/SESSION-LOG.md) — רשומת ריצת-הלילה (M6: 14 ממצאים מאומתים, 8 תוקנו, 3 נדחו + דגל `server-only`).
- [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md) — מיקום הממצאים-הנדחים מול ה-roadmap (Quiz Engine ~3/5, M5 לא-הורץ).
- [COMPLIANCE.md](../compliance/COMPLIANCE.md) — חוב-ציות C1 (בידוד service-role / server-only) שחופף ל-C4 כאן.

## החלטות פתוחות / הערות

- **מספור כפול:** ה-C1–C4 כאן הם **ממצאי-M6 הנדחים**, ושונים מ-C1–C6 ב-COMPLIANCE.md (backlog-ציות). חופף רק: C4-כאן ↔ C1-ציות (server-only).
- **C1 ו-C3 חוסמים-עצמית עד הכרעה:** C1 = שינוי-התנהגות-מוצר (דורש אישור-מוטי מפורש); C3 = שינוי-UX-נגישות (עדיף לאמת מול תבנית-ARIA ומול בדיקת-axe העתידית — חוב-ציות C2).
- **C2 לפני M5:** רצוי להטמיע את דיוק-הטוקנים לפני הרצת-`import:t1` בפועל, כדי שה-hard-cap $5 יישען על עלות-אמת ולא על קבוע-גס.
