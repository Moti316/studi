# ADR-015 — מנוע-תוכן NotebookLM (creator-side · מאוחסן-מראש · אפס-עלות-runtime)

> סטטוס: **Accepted** · 2026-06-08 · בעלים: `tech-lead` (איתן) · `ml-engineer` · `motilev8`
> Phase: 4 (content-pipeline) · יישום-ראשון: הרחבת 20 תרחישי-וועדה (מדליק [ADR-014](ADR-014-scenario-engine.md)).
> קשור: [ADR-005](ADR-005-notebooklm-hybrid.md) (NotebookLM-hybrid — מכליל ומדייק) · [ADR-014](ADR-014-scenario-engine.md) (מנוע-תרחישים) · [ADR-011](ADR-011-drive-import-pipeline.md) (צינור-ייבוא) · [ADR-001](ADR-001-stack.md) (Gemini=LLM-יחיד).

---

## הקשר (למה צריך הכרעה עכשיו)

ADR-005 קבע את העיקרון "NotebookLM = curation, Gemini = generation" אבל הניח שלב-generation
שרץ דרך **Gemini-API-בתשלום** בזמן-בנייה. שלושה לחצים חדשים שינו את התמונה:

1. **חסם-מכסה כלכלי (אומת חי · 2026-06-07):** הרצת מנוע-יצירת-התוכן מול Gemini free-tier
   נכשלה `429 "exceeded your current quota"` (10/10 נוסחים) — לא 503-זמני. ה-generation
   חסום עד billing-tier או reset-יומי. תיעוד: `SESSION-LOG.md` (2026-06-07/08).
2. **הכרעת-מוטי (2026-06-08):** לייצר הסברים/מבחנים/דיוק-מידע דרך **מנוי-Gemini (NotebookLM)** —
   _לא_ ה-API-בתשלום. הסיבה: ל-NotebookLM יש grounding מובנה על מסמכי-המקור שלנו, חינם-במנוי,
   ואיכות-הציטוט גבוהה יותר מ-prompt-בודד ל-Gemini-API.
3. **דרישת אוטומציה-מלאה:** "אני לא יכול להיות המתווך" — מוטי לא מעתיק-מדביק ולא מקליק.
   Claude Code חייב להריץ את ה-generation מקצה-לקצה מול המנוי-המחובר-שלו (אפס-קליקים-שלו).
   🧠 זיכרון: `content-gen-full-automation`.

**אילוץ-העל (גובר):** נתיב-המשתמש (הלומד) אסור שיתלה ב-NotebookLM (PROJECT-CONTEXT §מקורות-תוכן).
NotebookLM הוא **creator-side בלבד** — אם ייפול, הקורס המיוצר ממשיך לעבוד במלואו, כי כל
התוכן כבר מאוחסן-מראש ב-DB. זה מרחיב את ADR-005 (שכבר התווה את עקרון ה-data-contract)
ומדייק אותו לפי המציאות-שבפועל: הפורמט הוא **JSON עם ציטוטים מובנים** (לא `scenarios/*.md`),
וה-generation עובר **שערי-אנטי-הזיה דטרמיניסטיים** לפני כתיבה.

---

## ההחלטה (מה הוחלט)

**מנוע-תוכן תלת-שלבי, אסינכרוני, מנותק-runtime:**

> **NotebookLM** (מעוגן-מנוי · חינם) **מייצר** → **Claude Code** **מייבא + מאמת** (שערי G1–G5) →
> **StudiBuilder** **מגיש מאוחסן-מראש** מתוך ה-DB. **אפס-Gemini ואפס-NotebookLM בזמן-ריצה.**

| שלב                  | אחראי                                       | פלט                                                                                                  | שער-איכות                                           |
| -------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **1. Generate**      | NotebookLM (מנוי-מוטי · browser-automation) | JSON פר-תרחיש/שאלה/הסבר → `.cache/notebooklm/<batch>/<ref>.json`                                     | פרומפט-מערכת מטמיע את כללי-הציטוט                   |
| **2. Import+Verify** | Claude Code (TypeScript · offline)          | `map-scenario` משטח solution → `NewScenario` + `NewQuestion`; `verifyScenarioCitations` מסנן ציטוטים | **G1–G5** (אנטי-הזיה דטרמיניסטי)                    |
| **3. Serve**         | StudiBuilder (Next.js · runtime)            | `loadScenarios`/`questions` → נגן-השיעור                                                             | אין AI-call · `status='מוסקנא'` עד content-verifier |

**Pattern שנאמץ:** _generate-offline → verify-deterministic → serve-precomputed_.
זהה בעקרון ל-`precompute:explanations` (ADR קודם · `cb8a66e`) — רק שהמחולל הוא NotebookLM ולא Gemini-API.

**מה זה מחליף/מרחיב:** ADR-005 (data-contract `.md` → **JSON מובנה עם ציטוטים**; שלב-export ידני → **אוטומציית-דפדפן מלאה**).

### הכרעת-הגשר (transport ל-NotebookLM)

הגשר = הרכיב שמריץ generation מול המנוי. הוא **creator-side-only · מקומי · לא-backend** ולא נכנס לנתיב-המשתמש.

| עדיפות                 | מנגנון                                                          | אופי                      | למה                                                                     |
| ---------------------- | --------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| **Primary**            | `notebooklm-py` (Playwright · undocumented APIs · MIT · v0.7.1) | cookie-auth מנוי (לא-API) | יודע לייצר quiz מובנה · grounding-מנוי · מותקן בתיקייה-נפרדת (firewall) |
| **Fallback-A**         | Playwright-MCP / browser-extension                              | אוטומציית-דפדפן ישירה     | אם ה-undocumented-API של notebooklm-py נשבר (ToS/UI-drift)              |
| **Fallback-transport** | `gemini-webapi`                                                 | webapp-cookie (לא-API)    | ערוץ-תחבורה חלופי לאותו מנוי כש-NotebookLM עצמו חסום                    |

**עקרון-המפתח (file-contract seam):** הגשר והמייבא מצומדים **רק דרך חוזה-ה-JSON על-הדיסק** (§חוזה-ה-JSON).
שלושת המנגנונים מתחלפים מאחורי אותו seam **בלי לגעת בקוד-ה-import או ב-DB**. כל מנגנון = adapter שכותב את אותו JSON.
זה ה-trade-off המרכזי שמגן על הארכיטקטורה: התלות בכלי-צד-ג׳ הלא-יציב (notebooklm-py) מבודדת לשכבה-אחת, מאחורי גבול-קובץ.

> **תלות bootstrap (חד-פעמי · מוטי):** הגשר דורש סביבת-**Python** + **login-Google** ראשוני
> של מוטי (התקנה בתיקייה-נפרדת · הזדהות-אינטראקטיבית פעם-אחת · cookie נשמר). אחרי ה-bootstrap
> Claude Code מריץ אוטונומית מול ה-cookie השמור — מוטי לא מתווך פר-הרצה. זהו ה-friction
> היחיד שנשאר, והוא חד-פעמי-פר-מכונה.

### חוזה-ה-JSON (seam יציב — הגשר פולט · המייבא צורך)

קובץ `.cache/notebooklm/scenarios/<ref>.json`:

```jsonc
{
  "batch": "scenarios-expand",
  "contentType": "scenario_expansion", // | "explanation" | "mcq"
  "items": [
    {
      "sourceRef": "scn:<fileId>:<index>", // אופציונלי — ה-importer ישלים אם חסר
      "title": "...",
      "background": "...",
      "data": null,
      "task": "נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.",
      "solution": {
        "immediateAction": { "text": "...", "citations": [] },
        "legalBackup": {
          "text": "...",
          "citations": [{ "scopeId": "2.1", "quote": "<מילולי מהנוסח>", "section": "תקנה 2" }],
        },
        "engineeringMgmt": { "text": "...", "citations": [] },
      },
      "rubric": [
        { "criterion": "...", "points": 1 },
        { "criterion": "...", "points": 1 },
        { "criterion": "...", "points": 1 },
      ],
    },
  ],
}
```

- `map-scenario` **משטח** את `solution{immediateAction, legalBackup, engineeringMgmt}` לשדה-`solution` יחיד
  (Markdown · 3 כותרות-מודגשות: `**פעולה מיידית:**` / `**גיבוי חוקי:**` / `**הנדסה וניהול:**`) — תואם ל-`ScenarioInput.solution` הקיים (`src/features/lesson-player/components/types.ts`).
- `legalBackup` חייב **≥1 ציטוט** (אכיפת G4). `status='מוסקנא'` **תמיד** (עד content-verifier).
- `scopeRefs` = **רק ציטוטים מעוגנים-מלא** — מחושב ב-`import-scenarios` דרך `verifyScenarioCitations`, מועבר ל-`map-scenario`.

### שערי-אנטי-הזיה G1–G5 (הערובה האמיתית)

ממומשים ב-`src/lib/import/verify-grounding.ts` (טהורים · resolver-גוף מוזרק · נבדקים-ביחידה בלי fs):

| שער    | בדיקה                                                          | אופי                                 | מקור-אמת                                                   |
| ------ | -------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| **G1** | `scopeId` ∈ allowlist-57 (`isValidScopeId`)                    | קשה → drop                           | `scope-refs.ts`                                            |
| **G2** | `scopeId` נפתר לקובץ-`.md` אמיתי (גוף-נוסח קיים)               | קשה → אין G3                         | `legislation-resolver.ts` · קורפוס-נבו                     |
| **G3** | ה-quote מופיע **מילולית** בגוף-הנוסח (`quoteAppearsInBody`)    | **קשה ביותר · drop**                 | קורפוס-נבו (`courses/safety-officer/sources/legislation/`) |
| **G4** | (רמת-תרחיש) `legalBackup` ≥1 ציטוט מעוגן-מלא, אחרת **"מוחזק"** | held · מדווח · לא-נכתב ב-`--execute` | `verifyScenarioCitations`                                  |
| **G5** | מספר-הסעיף מופיע בגוף                                          | report-only · **לעולם לא חוסם**      | —                                                          |

> **G3 = הערובה.** מודל-שפה _יכול_ להזות ציטוט-חקיקה משכנע. G3 מאמת אותו **מילולית מול נוסח-נבו האמיתי**
> בקורפוס — בדיקת-מחרוזת דטרמיניסטית, לא שיפוט-מודל. ציטוט שלא קיים מילולית בנוסח **נושר** (לא מתורגם, לא מתוקן).
> מעוגן-מלא = `G1 ∧ G2 ∧ G3`. רק ציטוט-מעוגן נכתב כ-`scope_ref` / "גיבוי-חוקי". שאר-הציטוטים נופלים בשקט.
> `status='מוסקנא'` נשאר עד ש-content-verifier (תמר) מאשר ידנית → תואם 3-מצבי-התשובה (PROJECT-CONTEXT §עקרונות-תוכן).

שימוש-חוזר: `quoteAppearsInBody` / `normalizeForMatch` נלקחים מ-`generated-mcq.ts` (אותו G3 קנוני של ה-MCQ-pipeline) — **לא כפל-לוגיקה**.

### חיבור scenarios ↔ questions (companion-question)

תרחיש לבדו אינו ניתן-לתרגול — נגן-השיעור מנותב דרך טבלת `questions`. לכן כל תרחיש מיובא כ**זוג**:

1. **`scenarios`** row — `title · background · data? · task · solution · rubric[] · scopeRefs · sourceRef · status='מוסקנא'` (`upsert-scenarios.ts`).
2. **`questions`** row תאומה — `type='scenario_walkthrough'` · `scenarioId` = ה-id החדש · `sourceRef` יציב (`upsert-questions.ts`).

**אכיפת-DB (`drizzle/schema.ts`):** CHECK constraint `scenario_needs_ref`:
`type != 'scenario_walkthrough' OR scenario_id IS NOT NULL` — שאלת-תרחיש **חייבת** `scenario_id`.
זה הופך את ה-companion-question לחוזה-נאכף-במסד, לא-קונבנציה.

### מיגרציה 0003 (idempotency)

`supabase/migrations/0003_add_scenarios_source_ref_index.sql`:
`CREATE UNIQUE INDEX IF NOT EXISTS idx_scenarios_source_ref ON scenarios (source_ref)`.

טבלת `scenarios` כבר נשאה `source_ref` (מ-0001) אך — בניגוד ל-`questions` (0002) — לא הייתה מאונדקסת.
ה-importer זקוק ל-`INSERT ... ON CONFLICT (source_ref) DO NOTHING` כדי שהרצה-חוזרת **לא תכפיל** תרחישים.
מראה בדיוק את `idx_questions_source_ref`. NULLs distinct ב-Postgres → תרחישים מ-יד (NULL ref) לא מושפעים.
hand-applied לפי `drizzle.config.ts` (Supabase SQL Editor) **או** `scripts/apply-migration-0003.ts` (idempotent · IF NOT EXISTS).

### firewall-מגן — **בוטל 2026-06-09 (REVERSED · [ADR-009](ADR-009-magen-integration.md))**

> **🔧 בוטל 2026-06-09:** ~~firewall-מגן (native · name-clean) — אסור copy/coupling לריפו-מגן; firewall (PROJECT-CONTEXT §כלל-מגן) נשמר במלואו.~~ **כעת port-permitted:** מותר לפורט את **פרומפט-המאסטר של מגן** (סימולציה/חיבור-תרחישי-וועדה) ל-StudiBuilder, **name-cleaned** (להסיר מגן/שגיא/Telegram/מזהי-בעלים · לשמור 4-עקרונות · Zero-Harm · common-pitfalls · 3-מצבי-תשובה). מוטי בעל-שני-הריפו → אפס-licensing. megen נשאר מבודד (clone לתיקייה-סמוכה · read-only · רק תוכן-פרומפט · לא מנוע-Python).

מקור-ההשראה (20 התרחישים · `scripts/data/committee-scenarios.json`) הוא base-מקומי **נקי-שם · לא-מקוממט · solutions verbatim-קצרים**.
המנוע **מרחיב** אותם (דרישת-מוטי "להרחיב, לא לסכם") **native** דרך NotebookLM המעוגן-בחומרי-המקור-שלנו (נבו · Drive · G3). **שימוש (2026-06-09):** NotebookLM מעגן חוק/תקנה (verbatim · G3) → פרומפט-מגן name-cleaned מחבר את התרחיש (Gemini-API · offline) → אימות-סמנטי → ייבוא.
ה-grounding שלנו הוא הקורפוס-שלנו (נבו · Drive). ~~firewall (PROJECT-CONTEXT §כלל-מגן) נשמר במלואו.~~ → §כלל-מגן בוטל 2026-06-09 (ראה [ADR-009](ADR-009-magen-integration.md)).

---

## חלופות שנדחו

### A. Gemini-API-בתשלום ל-generation (ADR-005 כפשוטו)

- ✅ ערוץ-יחיד · ללא browser-automation · ללא bootstrap.
- ❌ **חסום בפועל** — free-tier מוצה (`429`), billing = עלות-runtime/בנייה שמוטי דחה מפורשות.
- ❌ grounding חלש יותר מ-NotebookLM (prompt-בודד מול notebook-מעוגן).
- **למה לא:** ההכרעה הכלכלית של מוטי (מנוי במקום API) + grounding נחות.

### B. NotebookLM בזמן-ריצה (הלומד פונה ל-NotebookLM)

- ✅ תוכן-טרי תמיד · אפס-precompute.
- ❌ **הפרת-PROJECT-CONTEXT** (§מקורות-תוכן: "פרודקשן = אפס-תלות-NotebookLM") → דגל-מתווך מיידי.
- ❌ תלות-ToS · cookie-expiry בנתיב-המשתמש · latency · creator-cookie חשוף ל-runtime.
- **למה לא:** קו-אדום ארכיטקטוני — נתיב-המשתמש לעולם לא תלוי בכלי-creator.

### C. מוטי כמתווך-ידני (copy-paste מ-NotebookLM)

- ✅ אפס-bootstrap טכני · אפס-undocumented-API.
- ❌ "אני לא יכול להיות המתווך" (הכרעת-מוטי) · לא-מתכוונן (scale = 540+ פריטים) · שביר-אנושית.
- **למה לא:** סותר את דרישת האוטומציה-המלאה.

### D. data-contract כ-Markdown (`scenarios/*.md` · ADR-005 המקורי)

- ✅ קריא-אנושית · תואם פורמט-מגן.
- ❌ ציטוטים לא-מובנים → קשה לאמת G1–G5 דטרמיניסטית · parsing שביר.
- **למה לא:** JSON-מובנה עם `citations[]` נקודתיים הוא ה-seam שמאפשר את שערי-האנטי-הזיה. (זה התיקון-לפי-המציאות של ADR-005.)

### E. גשר יחיד (notebooklm-py בלבד · בלי fallback)

- ✅ פשטות-קוד.
- ❌ undocumented-API · ToS · UI-drift → single-point-of-failure לכל מנוע-התוכן.
- **למה לא:** ה-file-contract seam **כבר** מאפשר fallback בעלות-שולית → מבטחים את הסיכון-הגבוה-ביותר.

---

## סיכונים והכלה

| סיכון                                      | חומרה     | הכלה                                                                                            |
| ------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------- |
| **ToS — אוטומציה לא-רשמית** מול NotebookLM | גבוה      | creator-side-only · מנוי-של-מוטי · לא-backend · לא בנתיב-המשתמש · ספק→מוטי                      |
| **cookie-expiry / UI-drift** שובר את הגשר  | בינוני    | **file-contract seam** → fallback-A/B בלי לגעת ב-import/DB · התוכן כבר מאוחסן (פרודקשן לא נופל) |
| **undocumented-API נשבר** (notebooklm-py)  | בינוני    | adapter מבודד · Playwright-MCP fallback · gemini-webapi transport                               |
| **הזיית-ציטוט** מהמודל                     | **קריטי** | **G3** (אימות-מילולי מול נבו) · G4 (≥1 מעוגן) · `status='מוסקנא'` · content-verifier            |
| **bootstrap חד-פעמי תקוע** (Python/login)  | נמוך      | חד-פעמי-פר-מכונה · מתועד · cookie נשמר                                                          |
| **double-import** (תרחיש כפול)             | נמוך      | unique-index 0003 + `ON CONFLICT (source_ref) DO NOTHING`                                       |

---

## השלכות

### חיובי

- **אפס-עלות-runtime ואפס-תלות-NotebookLM בפרודקשן** — כל התוכן מאוחסן-מראש; הלומד לא פוגש Gemini/NotebookLM.
- עוקף את חסם-מכסת-Gemini (generation דרך מנוי · לא API).
- grounding-מנוי + **G1–G5** = איכות-ציטוט גבוהה ומאומתת-דטרמיניסטית, לא-מומצאת.
- מדליק את ADR-014 (20 התרחישים מורחבים-ומעוגנים) ופותח גם explanation/mcq דרך אותו seam.

### שלילי / חוב-טכני (גלוי ומתוקצב)

- **תלות בכלי-צד-ג׳ לא-יציב** (notebooklm-py · undocumented) — מבודדת מאחורי file-contract seam, אך עדיין דורשת תחזוקה כש-NotebookLM משתנה.
- **bootstrap חד-פעמי** (Python + login) פר-מכונה — friction שיורי.
- **שני מסלולי-איכות** לעקוב: שערי-import (אוטומטי) + content-verifier (ידני · `מוסקנא`→`מאומת`).

### נייטרלי

- ADR-005 **מתעדכן ולא נמחק** (JSON במקום `.md` · אוטומציה במקום export-ידני). ADR-001 ללא שינוי (Gemini נשאר ה-LLM-היחיד בנתיב-המשתמש — וכאן הוא בכלל לא רץ ב-runtime).
- ה-importer ל-`scenarios` (`import-scenarios` + `map-scenario`) הוא הפער-הפתוח הבא למימוש (התשתית — verify-grounding/upsert/resolver — כבר קיימת).

---

## Validation

- [ ] G3 נכשל (drop) על ציטוט-מומצא בבדיקת-יחידה (quote שאינו בנבו) — נשירה, לא כתיבה.
- [ ] תרחיש בלי `legalBackup`-מעוגן → "מוחזק" (לא-נכתב ב-`--execute`) — G4.
- [ ] הרצת-import חוזרת על אותו batch → 0 שורות-חדשות (idempotency · 0003).
- [ ] כל תרחיש-מיובא נכתב כזוג (scenario + question · `scenario_id` מקושר) — CHECK עובר.
- [ ] גשר נופל (cookie-expired) → פרודקשן ממשיך לשרת מ-DB (אפס-תלות-runtime).
- [ ] 20 התרחישים מורחבים-משמעותית (לא-מסוכמים) ומעוגני-חקיקה · `status='מוסקנא'`.

---

## References

- [ADR-005](ADR-005-notebooklm-hybrid.md) — NotebookLM-hybrid (מורחב ע"י מסמך-זה)
- [ADR-014](ADR-014-scenario-engine.md) — מנוע-תרחישים (הצרכן של מנוע-התוכן)
- [ADR-011](ADR-011-drive-import-pipeline.md) · [ADR-001](ADR-001-stack.md)
- `src/lib/import/verify-grounding.ts` (G1–G5) · `generated-mcq.ts` (G3 קנוני) · `legislation-resolver.ts`
- `supabase/migrations/0003_add_scenarios_source_ref_index.sql` · `drizzle/schema.ts` (CHECK `scenario_needs_ref`)
- `docs/context/SESSION-LOG.md` (2026-06-07/08 — חסם-מכסה · הכרעת-מנוי · אוטומציה-מלאה)
- זיכרון: `content-gen-full-automation` · `nevo-legislation-corpus` · `magen-inspiration-only-firewall` (עודכן 2026-06-09 — ה-firewall בוטל · port-permitted · ראה [ADR-009](ADR-009-magen-integration.md))

---

## Revision History

| Date       | Author                             | Change                                    |
| ---------- | ---------------------------------- | ----------------------------------------- |
| 2026-06-08 | tech-lead · ml-engineer · motilev8 | Initial — Accepted (מרחיב ומדייק ADR-005) |
