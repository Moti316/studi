# יומן-פעילות — איל (ml-engineer)

> פורמט רשומה: `## [תאריך שעה] משימה` ואז Outcome · What changed · Verification · Follow-ups · Verdict (PASS|CONCERNS|FAIL) · Self-check (בהקשר? סטייה? red-lines?) · Bugs/Fixes.

## [2026-06-01 00:20] עוטף-Gemini (ai/client) + scope-tagger דו-שלבי + בדיקות

**Outcome:** נבנו 2 מודולי-שרת חדשים מעל `@google/genai` v2.7 — עוטף-Gemini lazy
(text+JSON) ו-scope-tagger דו-שלבי (regex → אימות-Gemini) עם default-deny. typecheck
נקי, 29 בדיקות חדשות עוברות, חבילת-היחידה המלאה ירוקה (275/275).

**What changed:**

- `src/lib/ai/client.ts` — עוטף Gemini server-only (הערה + guard `assertServerSide`,
  אין חבילת `server-only` מותקנת). lazy-singleton (לא מאתחל ב-import אם המפתח חסר;
  המפתח מ-`process.env.GEMINI_API_KEY` בלבד). ייצוא: `geminiGenerateText`,
  `geminiGenerateJSON<T>` (responseMimeType=application/json + responseSchema),
  `GeminiClientError` (re-throw עם הקשר: מודל+op), `getGeminiClient`,
  `__resetGeminiClientForTests`. ברירת-מחדל model=`GEMINI_MODEL_CLASSIFICATION` (Flash)
  עם fallback מתועד.
- `src/lib/import/scope-tagger.ts` — `ScopeTag` + `tagScope(text, filename?)` בדיוק
  לפי החתימה הנדרשת. מפת `SCOPE_KEYWORDS` (id→ביטויים עבריים) זרועה-איכותית לכל 36
  ה-IDs בקטגוריות 1-3 (+ זרע קל ל-4-7). שלב-1 regex על שם-קובץ+טקסט-מלא; שלב-2
  אימות-Gemini-Flash על טקסט קטוע ל-1500 תווים. default-deny ללא-match
  (`{in_scope:false, scope_refs:[], status:'לא ידוע'}`). sanitize מפיל IDs מומצאים
  (isValidScopeId) ו-clamp confidence ל-[0,1]; כשל-Gemini → fallback regex עם 'מוסקנא'
  (לא חוסם pipeline, לא ממציא). status תואם enum `content_status` שבסכמה-בפועל.
- `tests/unit/import/scope-tagger.test.ts` — 15 בדיקות (regex hit/miss, default-deny
  ללא קריאת-Gemini, אימות-Gemini ממוקסק, truncation, הפלת-IDs-מומצאים, clamp, fallback).
- `tests/unit/ai/client.test.ts` — 14 בדיקות (`@google/genai` ממוקסק; text/JSON,
  system, ברירת-מודל, override, שגיאות-הקשר, lazy-init, singleton).

**Verification:** `pnpm typecheck` נקי · `pnpm vitest run` על 2 הקבצים → 29/29 · חבילה
מלאה `pnpm test` → 35 קבצים / 275 בדיקות, 0 כשלים. אפס קריאות-Gemini אמיתיות (mock).

**Follow-ups:** (1) retry/backoff + Sentry/cost-tracking (README §Phase-4) — נדחה,
מחוץ-לסקופ-המשימה. (2) הרחבת-זרע ל-SCOPE_KEYWORDS קטגוריות 4-7 — נדחה, שלב-2 מכסה.
(3) ולידציית-Zod על פלט geminiGenerateJSON אצל הקורא.

**Verdict:** PASS

**Self-check:** בהקשר (Gemini-only, server-side, אפס-secrets, מול הסכמה-בפועל —
status enum תואם) · אין סטייה · לא הופרו red-lines (שחזוריות: deterministic regex +
schema-constrained JSON; אין תוכן-מומצא — IDs מאומתים מול הקטלוג, כשל→'מוסקנא' לא
'מאומת'; לא הרצתי db:push/commit/push).

**Bugs/Fixes:** TS4115 `noImplicitOverride` על param-property `cause` ב-GeminiClientError
→ תוקן ע"י העברת `cause` ל-`Error(message,{cause})` במקום parameter-property.
