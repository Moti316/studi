# ניתוח פערים — תיעוד/ADRs מול קוד בפועל

> **תאריך:** 2026-05-30 · **נכתב על-בסיס סריקת-קוד ישירה** (לא הסתמכות על התיעוד)
> **deadline ועדה:** 2026-07-15 · **מצב branch:** `claude/docs-business-pivot-adrs`

## Context

הפרויקט עשיר בתיעוד (11 ADRs, 20+ screen-specs, roadmap מפורט), אבל יש פער בין מה
שהתיעוד **מתאר** לבין מה ש**ממומש בקוד**. מסמך זה ממפה את הפער במדויק כדי שכל החלטת-המשך
תתקבל על-בסיס המצב האמיתי ולא על-בסיס מסמכי-תכנון. כל ממצא כאן אומת ע"י קריאת/רשימת קבצים.

---

## 1. סטטוס Phases — מה שטוען התיעוד מול בפועל

| Phase                 | התיעוד טוען       | בפועל (מאומת)                                                                                  | פער        |
| --------------------- | ----------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| **0** Foundation      | ✅ הושלם          | ✅ אמיתי — scaffold, CI, RTL, Vercel                                                           | אין        |
| **1** Auth & Profile  | ✅ הושלם          | ✅ אמיתי — Supabase Auth (Google OAuth + Magic Link), middleware, rate-limit, ~78% כיסוי טסטים | אין        |
| **2** Dashboard       | 🟡 חלקי (UI-only) | 🟡 UI בלבד, **mock-data**, אפס persistence ל-DB                                                | תואם לטענה |
| **3** Upload UI       | ⏳ הבא            | ❌ **לא קיים כלל** — אין `/create/*`, אין components                                           | פער מלא    |
| **4** Course Pipeline | ⏳                | ❌ **תכנון בלבד** — Parsers קיימים, אבל אין Inngest/embedding/RAG/generation                   | פער מלא    |
| **5** Quiz Engine     | 🟡 מתחיל          | ⚠️ **רק 1 מתוך 5** סוגי-שאלות (MatchingPairs POC). אין `/lesson/[id]`, אין API                 | פער גדול   |

**שורה תחתונה:** Phase 0-1 אמיתיים ומוצקים. Phase 2 = שלד-UI. Phase 3-5 (לב ה-MVP לוועדה) — כמעט לא קיימים בקוד.

---

## 2. פער המפתחות (Secrets)

`.env.example` מתעד **27 משתנים** מ-9 שירותים. מצב בפועל:

| שירות             | בשימוש בקוד?                         | איפה המפתחות נמצאים              | נדרש ל...                    |
| ----------------- | ------------------------------------ | -------------------------------- | ---------------------------- |
| Supabase (×4)     | ✅ כן                                | **Vercel** (פרודקשן) — לא מקומית | הכל                          |
| Google Drive (×3) | ✅ כן                                | ✅ `.env.local` מקומית           | ייבוא תוכן                   |
| Anthropic (×3)    | ❌ לא (`src/lib/ai/` = README בלבד)  | ❓ טרם הופק                      | scope-tagging, generation    |
| Voyage AI (×2)    | ❌ לא                                | ❓ טרם הופק                      | embeddings (RAG)             |
| ElevenLabs (×5)   | ❌ לא (`src/lib/tts/` = README בלבד) | ❓                               | TTS (Phase 7)                |
| Inngest (×2)      | ❌ לא (אין תיקיית `inngest/`)        | ❓                               | pipeline אסינכרוני (Phase 4) |
| Resend (×2)       | ❌ לא                                | ❓                               | magic-link email             |
| Sentry (×4)       | ❌ לא                                | ❓                               | observability (Phase 9)      |

**ממצאים:**

- אין מפתחות "יתומים" — כל מה שהקוד מצפה לו מתועד ב-`.env.example`. אין הפתעות נסתרות.
- ה-`.env.local` המקומי מכיל **רק** את 3 מפתחות Google Drive. מספיק ל-`pnpm drive:test`, **לא** מספיק לייבוא ל-Supabase.
- כדי לייבא תוכן בפועל יידרשו: `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY` + גישת-DB (Supabase מ-Vercel).
- **תיקון שבוצע (2026-05-30):** `scripts/auth-drive.ts` ו-`scripts/test-drive.ts` שונו לקרוא מ-`.env.local` (קודם קראו `.env` דרך `dotenv/config` — אי-התאמה מול התיעוד).

---

## 3. הפער הגדול — Import Pipeline (ADR-011) לא ממומש

ADR-011 מתאר `scripts/import-content.ts` עם פקודות `pnpm import:t1` / `import:full` ו-pipeline
בן 8 שלבים. **בפועל הקובץ והפקודות לא קיימים.** קיימות רק אבני-הבניין.

| רכיב                                                                | מצב (מאומת)                                     |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| `src/lib/drive/client.ts` (חיבור Drive)                             | ✅ קיים ומלא                                    |
| `scripts/parsers/` (PDF + DOCX)                                     | ✅ קיימים + נבדקים                              |
| `drizzle/schema.ts` ↔ `supabase/migrations/0001_initial_schema.sql` | ✅ קיימים ותואמים (7 טבלאות + coverage_tracker) |
| `scripts/import-content.ts` (אורקסטרטור)                            | ❌ **חסר**                                      |
| `src/lib/import/chunker.ts`                                         | ❌ **חסר** (תיקיית `src/lib/import/` לא קיימת)  |
| `src/lib/import/scope-tagger.ts`                                    | ❌ **חסר**                                      |
| `src/lib/import/embedder.ts`                                        | ❌ **חסר**                                      |
| `src/lib/import/report.ts`                                          | ❌ **חסר**                                      |
| `scripts/import-content.config.ts` (budget)                         | ❌ **חסר**                                      |
| פקודות `import:*` ב-`package.json`                                  | ❌ **חסרות**                                    |

**משמעות:** גם אחרי השלמת כל המפתחות, נדרש לכתוב ~6 קבצים חדשים (הערכת-עבודה ~8-10 ימים) כדי שייבוא תוכן יעבוד מקצה-לקצה.

---

## 4. Quiz Engine (Phase 5) — 1 מתוך 5

לב ה-MVP לוועדה. נדרשים 5 סוגי-שאלות; קיים אחד.

| סוג שאלה            | רכיב                                                      | מצב                                                                |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| MatchingPairs       | `src/features/lesson-player/components/MatchingPairs.tsx` | ✅ קיים (POC מוקפד: state-machine, RTL, a11y, animations, טסט מלא) |
| MCQ-long            | `MCQLong.tsx`                                             | ❌ חסר                                                             |
| MCQ-short           | `MCQShort.tsx`                                            | ❌ חסר                                                             |
| Explanation         | `ExplanationCard.tsx`                                     | ❌ חסר                                                             |
| ScenarioWalkthrough | `ScenarioWalkthrough.tsx`                                 | ❌ חסר                                                             |

בנוסף חסרים: route `/lesson/[id]`, flow של practice/exam, ו-API endpoints (next-question, attempts, feedback). קיים רק `/poc/matching` כדמו.

---

## 5. פערים נוספים

- **Inngest:** תיקיית `inngest/` לא קיימת. ה-pipeline האסינכרוני (5 שלבים) שמתואר ב-stack לא מומש.
- **`src/lib/ai/` ו-`src/lib/tts/`:** מכילים README בלבד — אין wrapper אמיתי ל-Claude או ל-ElevenLabs.
- **Dashboard persistence:** כל הנתונים ב-`/dashboard`, `/courses`, `/stats`, `/settings` הם mock/client-state. אין שאילתות DB.
- **טסטים חסרים:** אין טסטים ל-quiz components (פרט ל-MatchingPairs), אין integration ל-lesson flow, אין טסטי-AI.

---

## 6. מה כן מוצק (לאיזון)

- ✅ Auth מלא ועובד בפרודקשן (Google + Magic Link, rate-limit, PII-masking, middleware fail-closed).
- ✅ סכמת-DB מלאה ותואמת בין drizzle ל-migration; הורצה בהצלחה ב-Supabase (7 טבלאות + view של 57 scope-IDs).
- ✅ חיבור Drive API מלא + 2 parsers נבדקים.
- ✅ CI/CD, RTL-discipline, design-tokens, animations library (18+ variants).
- ✅ תיעוד עשיר ומדויק (ADRs, specs, roadmap) — הבעיה היא קצב-המימוש, לא איכות-התכנון.

---

## 7. המלצות (לפי סדר)

1. **לסיים Drive auth** — `pnpm drive:auth` → `pnpm drive:test`. מאמת שהחיבור עובד (צריך רק מפתחות Google שכבר קיימים).
2. **להחליט על מפתחות Anthropic + Voyage** — בלעדיהם אי-אפשר scope-tagging/embeddings. אם לא יהיו בזמן → fallback ל-scope-tagging ידני (ADR-011 §Phase-1 מאשר זאת ל-T1).
3. **לבנות את ה-import pipeline** — הצעד החוסם הגדול. סדר מומלץ (ADR-011): chunker → embedder → config → scope-tagger → report → import-content.ts → פקודות package.json.
4. **לבנות את 4 סוגי-השאלות החסרים + `/lesson/[id]`** — לב ה-MVP. MatchingPairs הוא תבנית-ייחוס טובה.
5. **לעדכן את ה-roadmap/ADRs** שיסמנו "proposed" מול "implemented" כדי שהפער לא יישכח שוב.

---

## נספח — עובדות שאומתו בסריקה (2026-05-30)

- routes קיימים: `/`, `/beta-access`, `/courses`, `/dashboard`, `/login`, `/poc/matching`, `/privacy`, `/settings`, `/stats`, `/terms`.
- `src/features/` מכיל קובץ אחד: `lesson-player/components/MatchingPairs.tsx`.
- `src/lib/` תת-תיקיות: `ai` (README), `animations`, `auth`, `db`, `drive`, `mock`, `supabase`, `tts` (README).
- `inngest/` ו-`src/lib/import/` — לא קיימים.
- `package.json` scripts: אין `import:*`.
