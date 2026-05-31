# יומן-פעילות — עומר (backend-engineer)

> פורמט רשומה: `## [תאריך שעה] משימה` ואז Outcome · What changed · Verification · Follow-ups · Verdict (PASS|CONCERNS|FAIL) · Self-check (בהקשר? סטייה? red-lines?) · Bugs/Fixes.

## [2026-05-31 23:57] שער-יוצר (creator gate) — requireCreator()

- **Outcome:** נוצר שער-יוצר server-side שמגן על `/admin/**`: רק האימייל
  `motilev8@gmail.com` עובר; משתמש-בטא מחובר מנותב הרחק ל-/dashboard,
  ולא-מחובר מנותב ל-/beta-access (כמו `requireAuth`). PASS.
- **What changed:**
  - `src/lib/auth/creator.ts` — `requireCreator(nextPath?)` + קבוע `CREATOR_EMAIL`.
    מחקה את `requireAuth`: קורא `getUser()`, ואז משווה אימייל case-insensitive
    (כמו `deleteAccount`). דחייה דרך `redirect` (לא חוזר).
  - `tests/unit/auth/creator.test.ts` — 6 בדיקות vitest, `getUser`+`next/navigation`
    ממוקים לפי דפוס-הטסטים הקיים.
- **Verification:**
  - `vitest run tests/unit/auth/creator.test.ts` → 6/6 ירוק.
  - `vitest run tests/unit/auth` → 37/37 ירוק (אפס רגרסיה).
  - `tsc --noEmit` → exit 0. `eslint` על שני הקבצים → exit 0.
- **Follow-ups:**
  - לחווט `requireCreator()` בראש layout/page של `/admin/**` כשהנתיב ייווצר
    (כרגע אין `src/app/admin/` — frontend-engineer).
  - שכבת-הגנה שנייה: לשקול matcher ב-`src/middleware.ts` ל-/admin (defense-in-depth).
  - לשקול ריכוז `CREATOR_EMAIL` לקבוע-env/config משותף אם יידרש יותר ממקום אחד.
- **Verdict:** PASS.
- **Self-check:** בהקשר (creator-gated, server-side enforcement, אפס-secrets,
  אפס-תלות-NotebookLM/Gemini בנתיב הזה). סטייה מהתדריך: התדריך הציע server-only —
  בדקתי, החבילה `server-only` **אינה מותקנת** ואינה ב-package.json, ואף מודול-auth
  קיים אינו מייבא אותה; כדי לא לשבור build הסתמכתי על אכיפת-getUser/redirect
  כמו `requireAuth` (עיקרון "קוד מול הסכמה-שבפועל"). לא הורץ commit/push/db:push.
  red-lines נשמרו (בדיקת-הרשאה server-side, ללא הסתמכות-UI, ללא secrets).
- **Bugs/Fixes:** אין.

## [2026-06-01 00:35] צינור-ייבוא T1 (config · map-question · upsert · orchestrator)

- **Outcome:** נבנה צינור-הייבוא ל-T1 (שאלות→`questions`): קונפיג + מיפוי-טהור
  + upsert-אידמפוטנטי + אורקסטרטור tsx עם dry-run/execute. typecheck נקי,
  299/299 בדיקות עוברות (24 חדשות), eslint+prettier נקיים. PASS.
- **What changed:**
  - `scripts/import-content.config.ts` — T1_FILE_IDS (5 מ-CONTENT-INDEX §7,
    רק IDs מלאים — לא קטועים), ROOT_FOLDER_IDS (re-export מ-`drive/client`
    DRIVE_ROOT_FOLDERS, ללא כפילות), BUDGET (maxGeminiCalls=2000,
    totalUsdHardCap=$5, est-per-call, maxQuestionsPerFile), MIME-routing.
  - `src/lib/import/map-question.ts` — `mapQuestion(parsed, sourceRef)`:
    `'open'`→`'explanation'`, options→jsonb (null ל-explanation), correctIndex→
    `{index:n}` / open→`{text}` / no-key→null, scope_refs=`[]`, **default-deny**
    (אין מפתח-תשובה → in_scope=false, status `'לא ידוע'`; יש-מפתח → `'מוסקנא'`,
    לעולם לא `'מאומת'` ממיפוי-גולמי), source_ref מועבר verbatim.
  - `src/lib/import/upsert-questions.ts` — `upsertQuestions(rows)` server-side
    דרך Drizzle `db`, `onConflictDoNothing({target: questions.sourceRef})` +
    `.returning()` → inserted/skipped (אידמפוטנטי), batching של 500,
    guard על source_ref חסר. + `countExistingSourceRefs`.
  - `scripts/import-content.ts` — אורקסטרטור: dotenv `.env.local` ראשון →
    discover (curated IDs + סריקת-תיקיות עומק-1, סינון-MIME) → ensureCached
    ל-`.cache/drive/{id}.{ext}` → route ל-parsePdfMcq/parseDocxQA → sourceRef
    דטרמיניסטי (sha256 של file-id#index) → mapQuestion → (execute) tagScope →
    upsertQuestions → JSONL ל-`logs/import-<ts>.jsonl` + סיכום. כשל-קובץ=
    skip+report (לא abort). DB/AI מיובאים דינמית ב-execute בלבד (dry-run לא
    דורש DATABASE_URL). budget-guard default-deny. לא Inngest/Sentry.
  - `tests/unit/import/map-question.test.ts` (17) + `upsert-questions.test.ts`
    (7, db ממוקה דרך `vi.hoisted`).
  - `package.json` — `import:t1` / `import:t1:dry` (תבנית `drive:auth`/`drive:test`).
- **Verification:** `pnpm typecheck`→exit 0. `pnpm test`→37 קבצים/299 בדיקות
  ירוק (כולל 24 חדשות). `eslint`+`prettier --check` על 6 הקבצים → נקי.
  **לא הורץ** import עצמו (--execute) ולא db:push.
- **Follow-ups:**
  - ⚠️ **discrepancy schema↔SQL:** האינדקס-הייחודי `idx_questions_source_ref`
    מוגדר ב-`drizzle/schema.ts` אך **חסר** ב-`supabase/migrations/0001_initial_schema.sql`.
    `onConflict(source_ref)` ידרוש שהאינדקס יקיים ב-DB בזמן-execute → על
    `data-engineer` להוסיף את ה-UNIQUE index למיגרציה לפני M5/db:push.
  - File-IDs קטועים ב-§7 (4× אייל-הסמכה `1qbmxVzFHmhqffDyn...`, 5× מבחני-שיעור
    `1oH0Co...`) לא נכללו — נסרקים ע"י discover. כדאי להשלים IDs מלאים ב-CONTENT-INDEX.
  - `GEMINI_MODEL_CLASSIFICATION` מומלץ ב-`.env.local` לפני execute (fallback ל-flash קיים).
- **Verdict:** PASS.
- **Self-check:** בהקשר — Gemini בלבד (דרך scope-tagger הקיים), אפס-תלות-NotebookLM,
  קוד מול הסכמה-שבפועל (schema.ts: type-enum, jsonb, sourceRef-unique), server-side
  (db/ai רק ב-execute), אפס-secrets (process.env/.env.local בלבד), idempotent +
  default-deny + per-file-skip (לא abort). סטיות מהתדריך: (1) tagScope מקבל
  (text, filename) ולא טקסט-בלבד — תאם לחוזה-שבפועל; (2) רק 5 File-IDs מלאים נכנסו
  לקונפיג (הקטועים נסרקים בזמן-ריצה). red-lines נשמרו. לא הורץ commit/push/db:push/--execute.
- **Bugs/Fixes:** במהלך-הפיתוח: (a) הודעת-שגיאה במ-map-question תוקנה ל-`source_ref`
  (snake_case) להתאמה לבדיקה; (b) mock-ה-DB הועבר ל-`vi.hoisted` (hoisting של
  `vi.mock`); (c) הוסר import לא-בשימוש (`readFileSync`) + הוחלפו inline-`import()`
  type-annotations בייבוא-type ברמת-המודול (eslint). אין באגים פתוחים.
