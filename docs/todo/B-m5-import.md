# TODO · B — M5 — הרצת-ייבוא בנק-השאלות

> שלב B ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: 🟠 חסום (ע"י A + אישור-בנקים) · תלות: חסום ע"י A · פותח תוכן-אמת ל-Quiz Engine (D) · מעודכן: 2026-06-02.

> 🔧 **superseded/legacy (הכרעת-2026-06-09):** מיני-קורס-שו"ת = בנק-NotebookLM רב-סוגי (~500 · mcq/matching/open מקורפוס-החקיקה · status=`מוסקנא`), שמיוצר דרך NotebookLM בלבד (אפס-Gemini · G3-מעוגן · אימות-סמנטי Workflow-Claude) — **מחליף את ~540 בנק-qa הישן** המתואר כאן (כולל תיוג-Gemini-Flash). שלב B כולו מתאר את הצינור-הישן-שמוחלף. ראה [ADR-015](../architecture/ADR-015-notebooklm-content-engine.md). **מחיקת 540-הישן תלויה ב-import+smoke של החדש.**

## מטרה (Definition of Done)

הרצת `pnpm import:t1 --execute` בפועל מזינה את טבלת `questions` ב-~540 שאלות מבנקי-השאלות המאושרים (~19 קבצי-T1 ב-allow-list), כל שאלה עם `source_ref` ייחודי (ידמפוטנטי), תיוג-scope אוטומטי של Gemini Flash בסטטוס `מוסקנא` (לא `מאומת` — קידום-ידני בלבד), ב-hard-cap של $5; `/admin/questions` ו-`/lesson/practice` מציגים תוכן-אמת. "סיום" = ה-DB מכיל את השאלות, ה-report ב-`logs/` ירוק, וה-allow-list נשען רק על בנקי-שאלות (לא חומרי-לימוד T2/T3).

## תלויות

**חוסם:** שלב A (תשתית-ייבוא ירוקה) + **אישור-מוטי** לטבלת-הקוריישן ב-[M5-discovery-curation.md](../M5-discovery-curation.md) (71→~19 בנקים). **פותח:** תוכן-אמת ל-Quiz Engine (שלב D) — בלי שאלות ב-DB, נגן-השיעור ו-`/admin/questions` רצים על mock בלבד.

## תתי-משימות

- [ ] **B1** — אישור [docs/M5-discovery-curation.md](../M5-discovery-curation.md) (~19 בנקים) → הוספת File-IDs ל-`T1_FILE_IDS` ב-[scripts/import-content.config.ts](../../scripts/import-content.config.ts) · קריטריון-קבלה: ה-allow-list הקיים (5 רשומות) מורחב ל-~19 רשומות `T1FileEntry` תקינות (`id`/`label`/`location`); 2 הכפילויות-האפשריות (#12 מול #3, #15 מול #14) ו-2 הגבוליים הוכרעו במפורש; אין File-ID מקוצר; חומרי-לימוד (~50) **נשארים מחוץ** ל-allow-list. ref: [M5-discovery §טבלת-קוריישן](../M5-discovery-curation.md)
  - 📊 **מטא:** ⏱1h · 🤖2(data-engineer, product-owner) · 💲$0 · 🟢 · ראש-צוות:builder-lead · 🚩דורש-מוטי · אימות:solo
- [ ] **B2** — `pnpm import:t1:dry` (לוודא צמצום מ-69 ל-allow-list) → החלת migration 0002 (`source_ref` + unique index) ישירות מול `DATABASE_URL` (לא `db:push`) · קריטריון-קבלה: ה-dry-run מדפיס `X in T1 allow-list, N skipped (parseable but not curated)` — כש-X = מספר-הבנקים המאושר וכל היתר `skipped` (`reason: not in T1 allow-list`); אין כתיבת-DB ואין קריאות-Gemini ב-dry; migration 0002 יוצר את `idx_questions_source_ref` (UNIQUE) + עמודת `source_ref` כפי שמוצהר ב-`drizzle/schema.ts` (כיום אין קובץ-SQL ל-0002 — לייצר ולהחיל ישירות מול DATABASE_URL). ref: [import-content.ts §default-deny](../../scripts/import-content.ts) · [ADR-011 §Idempotency](../architecture/ADR-011-drive-import-pipeline.md)
  - 📊 **מטא:** ⏱2h · 🤖2(data-engineer, devops-engineer) · 💲$0 · 🟡 · ראש-צוות:builder-lead · — · אימות:Workflow
- [ ] **B3** — `pnpm import:t1 --execute` → ~540 שאלות + תיוג-Gemini Flash (hard-cap $5) → report ב-`logs/` · קריטריון-קבלה: ה-pipeline מוריד→מפרסר→`mapQuestion`→`tagScope`→`upsertQuestions` רק על ה-allow-list; ה-pre-flight אינו חורג מ-`BUDGET.totalUsdHardCap=5` (worst-case ~$1.60, `maxGeminiCalls=2000`, `estUsdPerGeminiCall=0.0008`); כל שאלה מקבלת `source_ref` דטרמיניסטי (`t1:<fileId>:<hash>`) ו-`ON CONFLICT DO NOTHING` → ריצה-חוזרת = 0 חדשים (ידמפוטנטי); תיוג-Gemini נכתב כ-`status='מוסקנא'`/`in_scope` ולעולם לא `מאומת`; כשל-קובץ-בודד נרשם ולא עוצר את הריצה; report-JSONL נכתב ל-`logs/import-<ts>.jsonl` עם summary (`parsed`/`failed`/`inserted`/`skipped`/`gemini calls`). ref: [import-content.config.ts §BUDGET](../../scripts/import-content.config.ts) · [scope-tagger.ts](../../src/lib/import/scope-tagger.ts) · [map-question.ts](../../src/lib/import/map-question.ts) · [upsert-questions.ts](../../src/lib/import/upsert-questions.ts)
  - 📊 **מטא:** ⏱2h · 🤖2(data-engineer, ml-engineer) · 💲~$2–5 (hard-cap $5) · 🟡 · ראש-צוות:builder-lead · 🚩דורש-מוטי · אימות:Workflow
- [ ] **B4** — אימות: ספירת `questions` ב-DB · `/admin/questions` מציג+תיוג · `/lesson/practice` מנגן תוכן-אמת · קריטריון-קבלה: `count(*)` ב-`questions` ≈ 540 (תואם ל-report `inserted`); `/admin/questions` מציג את השאלות המיובאות עם תיוג-scope (`מוסקנא`) וניתן לקדם ידנית ל-`מאומת` מול ה-PDF; `/lesson/practice` (טרם-נבנה — ⬜ ב-EXECUTION-PLAN שלב-2) מושך שאלות-אמת מה-DB ולא mock. (לאמת — route `/lesson/practice` תלוי בשלב D). ref: [EXECUTION-PLAN §שלב-2 Quiz Engine](../context/EXECUTION-PLAN.md)
  - 📊 **מטא:** ⏱1h · 🤖2(test-engineer, content-verifier) · 💲$0 · 🟢 · ראש-צוות:builder-lead · — · אימות:Workflow

## מסמכי-ייחוס (קרא לפני עבודה)

- [docs/M5-discovery-curation.md](../M5-discovery-curation.md) — טבלת-קוריישן (71→~19 בנקי-שאלות, File-IDs, allow-list, כפילויות+גבוליים, צעדים-אחרי-אישור).
- [docs/architecture/ADR-011-drive-import-pipeline.md](../architecture/ADR-011-drive-import-pipeline.md) — ארכיטקטורת-הצינור (T1–T4, scope-filter דו-שלבי, hard-cap, idempotency, phased-rollout).
- [docs/context/EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md) — §שלב-1 Content Import (סטטוס: צינור-בנוי, M5 = הרצה) + §שלב-2 Quiz Engine.
- [scripts/import-content.ts](../../scripts/import-content.ts) — אורקסטרטור (discovery → default-deny gate → budget → parse → tag → upsert → report).
- [scripts/import-content.config.ts](../../scripts/import-content.config.ts) — `T1_FILE_IDS` allow-list + `BUDGET` (hard-cap $5) + MIME-routing.
- [src/lib/import/scope-tagger.ts](../../src/lib/import/scope-tagger.ts) — תיוג-scope (regex → Gemini Flash, default-deny, לעולם לא `מאומת` אוטומטית).
- [src/lib/import/map-question.ts](../../src/lib/import/map-question.ts) — מיפוי `ParsedQuestion`→`NewQuestion` (טהור, default-deny על מפתח-תשובה חסר).
- [src/lib/import/upsert-questions.ts](../../src/lib/import/upsert-questions.ts) — upsert ידמפוטנטי `ON CONFLICT (source_ref) DO NOTHING`.

## החלטות פתוחות / הערות

- ⚖️ **כלל-זהב:** PDF הוא source-of-truth; תיוג-Gemini הוא הצעה (`מוסקנא`) — הקידום ל-`מאומת` ידני מול המקור.
- migration 0002 כקובץ-SQL **טרם קיים** (כיום רק הצהרה ב-`drizzle/schema.ts`) — לייצר ולהחיל ישירות מול `DATABASE_URL`, לא `db:push` (B2).
- route `/lesson/practice` **טרם-נבנה** (⬜ EXECUTION-PLAN שלב-2) — אימות-B4 שלו תלוי בשלב D.
- 2 הכפילויות-האפשריות (#12/#15) ו-2 הגבוליים (חזרה/סיכום) דורשים הכרעת-מוטי לפני B1.
- 🗂️ **ארגון-מחדש Drive (2026-06-02):** בנקי-ה-T1 מרוכזים כעת בתיקייה אחת "שאלות ותשובות לוועדת הסמכה" (`1Ecc…`) → discovery פשוט (אפשר לכוון ישירות לתיקייה זו במקום לסרוק הכל). **+2 בנקים** שנראו בה וטרם ב-allow-list: שאלות-חשמל (`1nv0H…`) · Emailing שאלות-למבחן (`1D-ef…`) — לשקול ב-B1. File-IDs יציבים → הקוריישן ב-`M5-discovery-curation.md` תקף.
