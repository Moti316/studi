# CLAUDE.md - StudiBuilder

> 🗂️ **אינדקס-הכל (קרא ראשון!):** [`docs/context/MD-INDEX.md`](docs/context/MD-INDEX.md) — אינדקס-MD **חכם ומחולל-אוטומטית** של **כל** מסמכי-הפרויקט (ניווט-מהיר פר-נושא · תכלית · עדכון-אחרון · יתומים-מקומיים). **בתחילת כל סשן עבור עליו במלואו — בלי לחפף**, ושלוף ממנו את הקבצים הרלוונטיים למשימה. רענון: `pnpm index:md` (גם אוטומטי ב-pre-commit ו-SessionStart).

## אזהרת קריאה

**צעד-0 (לפני הכל, כל סשן):** סנכרון מול הריפו — `git fetch`; אם מאחור → `git pull`.
עובדים על **מספר מחשבים** (single-branch `main`, push אחרי כל משימה) → הקשר-ישן = סחף.
ה-SessionStart hook ([.claude/scripts/session-context.mjs](.claude/scripts/session-context.mjs)) מתריע אוטומטית כשמאחור.

לפני כל פעולה: קרא `AGENTS.md` (קנוני), `USER.md` (העדפות motilev8),
ואת `teams/<tier>/<slug>/identity.md` של הסוכן הרלוונטי.

## מסמכי-תיעוד — רישום-חובה

> **כלל קבוע (לעתיד):** כל קובץ `.md` חדש שנוצר בפרויקט **חייב להירשם כאן** וב-`docs/context/PROJECT-MAP.md`. אין מסמכים "יתומים".

**קריאה-חובה בתחילת כל סשן (קרא במלואם, לא לדלג):**

- **צעד-0 — סנכרון-ריפו (הפעולה-הראשונה, לפני קריאת-המסמכים):** `git fetch` + `git pull` אם מאחור. ה-SessionStart hook מתריע אוטומטית.
- **בסיס:** `CLAUDE.md` · `AGENTS.md` · `USER.md`
- **משימות (TODO דו-שכבתי):** `TODO.md` (master A–I מול EXECUTION-PLAN) · `docs/todo/` (קובץ פר-שלב — פירוט תתי-משימות + קריטריוני-קבלה)
- **הקשר-חי** (`docs/context/`): `PROJECT-MAP.md` · `PROTOCOL-INDEX.md` (מפת-ממשל מאוצרת — 4 שכבות+בקרה · 12 פרוטוקולים · זרימת-דיווח · צו-עצירה · 7-צעדים · Star-Chamber) · `PROJECTS.md` · `STATUS.md` · `EXECUTION-PLAN.md` · `TASKS.md` (stub → `docs/todo/`) · `BUGS.md` · `DECISIONS.md` · `ACCESS-MAP.md` · `SESSION-LOG.md`
- **תוכן/scope:** `docs/content-scope.md` · `docs/CONTENT-INDEX.md`
- **קורס safety-officer** (`courses/safety-officer/`): `curriculum-atgar` · `LEGISLATION-SOURCES` · `LEGISLATION-COVERAGE` · `MOLSA-PROGRAM` · `LEARNING-MATERIALS` · `UNREAD-MEDIA` · `ATTRIBUTION` · `COURSE-DESIGN` · `FINAL-PROJECT` · `REGULATORY-WATCH` · `ISO-31010/31000-DRAFT` · `docs/PROJECT-STRUCTURE.md`
- **ציות/רעיונות:** `docs/compliance/COMPLIANCE.md` (חובות-ציות + task-force) · `docs/IDEAS.md` (רעיונות/פידבק)
- **ארכיטקטורה** (לפי-צורך): `docs/architecture/ADR-001..013`
- **סוכנים:** `teams/PROJECT-CONTEXT.md` (עוגן-הקשר — נקרא ראשון) · `teams/ORG.md` (היררכיה+פרוטוקולים+מחזור-חיים) · `teams/README.md` (רוסטר 33) · `teams/HOWTO-add-agent.md` (מתי+איך להקים סוכן) · `teams/oversight/` (ענף-בקרה עצמאי: TEAM · \_oversight-protocol · \_curriculum-audit-protocol · stop-orders-ledger) · `teams/<tier>/<slug>/{identity.md,memory.md,activity-log.md}`

הרשימה המסודרת המלאה: `docs/context/PROJECT-MAP.md`.

### פרוטוקול-סוכן (חובה)

כל סוכן קורא `teams/PROJECT-CONTEXT.md` + `identity.md` + `memory.md` בתחילת הפעלה,
ומתעד ב-`activity-log.md` בסיום. ההיררכיה והפרוטוקולים (זרימת-דיווח, בקרת-סחף, מחזור-חיים)
מוגדרים ב-`teams/ORG.md`. הרוסטר (33 = 22 מבצעים + 4 ראשי-צוות + מתווך + 6 ענף-בקרה `oversight`) ב-`teams/README.md`. **ענף-הבקרה עצמאי** — מדווח ישירות למועצה (לא דרך המתווך), עם סמכות צו-עצירה (קוורום-2/3 + ledger, רק-מוטי-מבטל).

## הפרויקט בקצרה

StudiBuilder = **פלטפורמת-ייצור-קורסים** בעברית מתוך מסמכים, נבנית **end-to-end** (בלי דחיות).
creator-gated: רק מוטי מייצר קורסים. תוצר-ראשון: קורס "ממונה בטיחות" — ללימוד-אישי לוועדה **וגם** כמוצר לשיווק.
דומיין: edtech · קהל: motilev8 (creator) + לומדים (מוצר) · stack: TS. ראה `docs/context/EXECUTION-PLAN.md`.

## עקרונות-יסוד (לעולם אל תוותר)

- **PDF הוא source-of-truth לחוקים/תקנות** — כל תשובה למשתמש על תקנה חייבת citation מ-PDF + עמוד-וסעיף. סיכומים ב-`docs/content_scope_extensions.md` הם **קובץ-הקשר-פנימי בלבד**, אסור להציג מהם תשובה ישירה למשתמש. ראה `docs/sources/laws/README.md`
- **עברית RTL כאזרח-ראשון** - לא תיקון בדיעבד
- **TDD-first** - בדיקה כושלת לפני הקוד, אחרי הקוד פוגעת באמינות
- **secrets ב-.env.local בלבד** - לעולם לא ב-commit
- **AI-call תמיד עם context-cache** (Gemini context caching) - חוסך עלות. ראה `src/lib/ai/`
- **שגיאות הן מצב מתוכנן** - כל פעולת-משתמש עוטפת ב-try/catch + telemetry
- **ציות חל על כל השירות** (נגישות/פרטיות/צרכנות) — לא רק דף-המכירה. ראה `docs/compliance/COMPLIANCE.md`
- **רפורמות תשפ"ה-2025 (ממונה-בטיחות) — לא תוכן-קורס כעת** (בדיון משפטי, תחילה ~10/2026). ⏰ **טריגר בדיקה-מחודשת 10/2026.** ראה `courses/safety-officer/REGULATORY-WATCH.md` + זיכרון `regulatory-watch-2025`
- **ציטוט-חקיקה (חידוד):** כל אסמכתא = התקנה/החוק הספציפי המסמיך **פר-בקרה** (רתמה→צמ"א 2.3 · פיגום→בנייה 2.2 · גובה→2.1) + סעיף, מאומת מול ה-PDF (content-verifier). ת"י ≠ סמכות-עצמאית.

> **🔓 מגן — port-permitted (עודכן 2026-06-09 · ה-firewall בוטל):** ריפו-מגן (`github.com/Moti316/megen`) — **מותר לפורט את פרומפט-המאסטר** (לחיבור-תרחישי-וועדה / סימולציה) ל-StudiBuilder, **name-cleaned** (להסיר "מגן"/"שגיא"/Telegram/מזהי-בעלים · לשמור 4-עקרונות · Zero-Harm · common-pitfalls · 3-מצבי-תשובה). מוטי בעל-שני-הריפו → **אפס-licensing**. megen **מבודד** (clone לתיקייה-סמוכה · read-only · מועתק רק **תוכן-פרומפט** · לעולם לא מנוע-ה-Python). שימוש: NotebookLM מעגן חוק/תקנה → פרומפט-מגן מחבר. ⛔ **מבטל את "כלל-מגן (firewall) — השראה-בלבד".** ראה `docs/architecture/ADR-009-magen-integration.md` (תיקון 2026-06-09).

> **🎭 כיוון-תרחישים — סימולציית-וועדה (ADR-016 · 2026-06-09):** מיני-קורס-התרחישים = **סימולציה אינטראקטיבית של 3 מפקחים בדיאלוג-חי עם המועמד** (4 שלבים: היכרות-אישית→תרחיש-ענפי→צלילה-לחוק→השאלה-האכזרית · ציון 0-100) — **מחליף את ה-walkthrough הסטטי** (ADR-014). מנוע **HYBRID**: פרה-בנוי-מסועף עכשיו (אפס-runtime · אפס-עלות) → `LiveEngine` (Claude-API) עתיד. **חיבור = Claude (פרומפט-מגן) + NotebookLM · אפס-Gemini** (Gemini חסום-מכסה 20/יום · `author-scenarios-magen.ts`=הטעות-שתוקנה). פתיחה = שיח-אישי. נלווה: לו"ז-לימוד-אישי (אינטייק→תוכנית). מודל: `src/features/simulation/types.ts`. ראה `ADR-016` + זיכרון `committee-simulation-direction`.

## stack שנבחר (אסור לסטות בלי ADR)

- Next.js 15 (App Router, RSC) + TypeScript strict
- Supabase: Postgres + pgvector + Auth + Storage + Realtime
- Inngest: pipelines אסינכרוניים (5-stage course-build)
- Google Gemini: 2.5 Pro (gen) + 2.5 Flash (classification) + Gemini embeddings (RAG). מפתח אחד `GEMINI_API_KEY`
- ElevenLabs: TTS עברית (4 voices, cached)
- shadcn/ui + Tailwind + tailwindcss-rtl
- Vitest (unit) + Playwright (e2e)
- Vercel hosting, Sentry observability

## פקודות נפוצות

- `pnpm dev` - dev server
- `pnpm test` - vitest
- `pnpm test:e2e` - playwright
- `pnpm typecheck` - tsc --noEmit
- `pnpm lint` - eslint + prettier
- `pnpm db:push` - drizzle migrations
- `pnpm db:studio` - drizzle studio
- `pnpm legislation:fetch[:dry]` - הורדת קורפוס-החקיקה מנבו (`.md` verbatim) · `pnpm legislation:verify` - אימות L1–L5 (`--verify-live`=diff מול נבו) · `pnpm legislation:index` - חידוש `INDEX.md` (מפת scope↔Drive-PDF↔נבו)

## סקילים מומלצים (Claude Code Skills)

> הפעל אוטומטית בשלב הנכון (פירוט בזיכרון `studi-skills`):

- **frontend-design** — בכל בניית UI (lesson-player, admin, components) → עיצוב בהשראת StudiesGo, לא גנרי
- **run** — להריץ את האפליקציה ולראות שינוי עובד · **verify** — לאמת end-to-end (לא רק שטסטים עוברים)
- **code-review** + **security-review** — שער-האיכות של המועצה לפני push (באגים · creator-gate · service-role · פרטיות)
- **skill-creator** — בניית/שיפור סקילים · **playground** — דשבורד-סוכנים
- **agent-os** ✅ (`.claude/skills/agent-os/`) — ערכה גנרית רב-פרויקטית לסקאפולד ארכיטקטורת-הסוכנים (SKILL + 12 תבניות · placeholders · firewall-מגן). תוצר-5 ממשל-v2 (2026-06-04)
- ⚠️ **claude-api** — לא בשימוש-בפרודקשן-הנוכחי (Gemini=LLM-יחיד · `@google/genai`). אבל **חיבור/אימות-תרחישים+שאלות = Claude-Workflows** (אפס-Gemini), ומסלול-השדרוג ל-`LiveEngine` (סימולציה-חיה · ADR-016) מבוסס-Claude — ראה `ADR-016`.

## נהלי-עבודה (קבוע)

- **🟢 הרשאה-עומדת — הרצת-סקריפטים + בדיקה-עצמית (מוטי 2026-06-09):** Claude Code **תמיד מורשה** להריץ אוטונומית את סקריפטי-הגשר וההפקה (`notebooklm login`/`list` · `scenarios:generate`/`import` · `questions:generate`/`import` · `qa:delete`) **ולהריץ Workflows-של-Claude לחיבור-תרחישים+אימות-סמנטי (אפס-Gemini)** **ולבצע בדיקה-עצמית/verify** — **בלי לבקש אישור פר-הרצה**. (⛔ `scenarios:author`/קריאות-Gemini-offline הוחלפו ב-Workflow-Claude — ADR-016.) ה-login-האינטראקטיבי (דפדפן+Google) הוא הצעד-היחיד שדורש את מוטי בפועל (אם ה-session פג); אם פג — להריץ את הסקריפט (יקפיץ חלון) ולהמשיך. ראה זיכרון `content-gen-full-automation`. (DB-write עלול להיחסם ב-auto-mode → `dangerouslyDisableSandbox`.)
- **תמיד plan-first (העדפת-מוטי 2026-06-02):** כל משימה מהותית מתחילה ב-**plan-mode** — חקירה → הצגת-תוכנית → **ExitPlanMode לאישור** — _לפני_ כל ביצוע/עריכה. **לעולם לא לקפוץ ישר לביצוע.** (הביצוע + push ל-`main` אחריו לפי אישור-מוטי-הקבוע.)
- **דחיפה אחרי כל משימה:** commit+push ישיר ל-`main` (single-branch, ללא ענפים) ברגע שמשימה קוהרנטית ירוקה (typecheck+test רצים ב-git-hook); שמור Todolist מעודכן. אישור-מוטי קבוע (2026-06-01) — ראה `docs/architecture/ADR-012-dev-workflow-practices.md`.
- **משמעת-תיעוד (לסשנים הבאים):** כל קובץ `.md` חדש או **פעולה משמעותית** → עדכון **קבצי-זיכרון** + **CLAUDE.md** + רישום ב-**`docs/context/PROJECT-MAP.md`**. אם נדרשים קבצים נוספים (README/ADR-index/EXECUTION-PLAN) — לעדכן גם אותם. (הכלל הזה עצמו מתועד כאן ובזיכרון.)
- **מסמכים-חיים:** `docs/IDEAS.md` (רעיונות/פידבק — להוסיף בחופשיות) · `docs/compliance/COMPLIANCE.md` (ציות).
- **לוג-סשן ב-Google Doc (כל סשן):** בכל סשן — **doc-לוג נפרד** בתיקיית-Drive `StudiBuilder — לוגי-סשן` (id `1_GZY5fWK4z-BQRXUkySmsOUOPDnccVNw`, ב-`ACCESS-MAP.md`) דרך **MCP Google Drive** (`create_file` → כתיבה; ה-client של הפרויקט read-only). תוכן: **סעיף-עדכון פר-משימה** (#1, #2, …) + **סיכום-סוגר** (מה נדחף · מה דורש-מוטי · הצעד-הבא) + **בלוק פרומפט-המשך**. כותרת: `🟢 StudiBuilder · סשן <תאריך> · <נושא>`. ⚠️ ל-MCP יש `create_file` בלבד (אין update/append) → צבור את הלוג בסשן וכתוב את ה-doc בצ'קפוינט/בסוף (אל תיצור כפילויות לאותו סשן).

## מבנה התיקיות

```
src/
  app/                Next.js App Router pages
  components/         shadcn + custom UI
  lib/
    ai/              Gemini wrappers + prompts (cached)
    db/              drizzle schema + queries
    auth/            Supabase Auth helpers
    tts/             ElevenLabs wrapper + cache
  features/
    course-creation/ Phase 4 pipeline + UI
    lesson-player/   Phase 5 quiz engine
    gamification/    Phase 6 XP/streak
  styles/            globals.css, design tokens
tests/
  unit/             vitest specs
  e2e/              playwright specs
inngest/
  functions/        async pipelines
docs/
  architecture/     ADRs (architecture decision records)
  screens-spec/     מפרט פר-מסך (20 מסכים)
  qa/               checklists ידניים פר-Phase
  build-roadmap.md  10 phases overview
```

## כללי תכנון

- כל פיצ'ר מתחיל ב-`docs/architecture/ADR-NNN-name.md`
- כל UI component מקבל story ב-Storybook + screenshot test
- כל endpoint מקבל unit + integration test
- pipeline אסינכרוני = idempotent (יכול לרוץ פעמיים בלי נזק)

## RTL checklist (לכל component חדש)

- [ ] padding/margin משתמש ב-`ps-*`/`pe-*` לא `pl-*`/`pr-*`
- [ ] חיצים מתהפכים (`>` במקום `<` ב-RTL)
- [ ] טקסט מימין לשמאל - native browser handling
- [ ] icons עם direction (chevron, back) מתהפכים
- [ ] בדיקת Playwright ב-`dir=rtl`

## Build phases (סטטוס)

- [x] Phase 0 - Foundation (סקאפולד, CI, deploy)
- [x] Phase 1 - Auth & profile (Supabase מחובר, Vercel חי על studibuilder.vercel.app)
- [~] Phase 2 - Dashboard skeleton (UI-only, mock-data — DB persistence ב-Phase 6/7)
- [ ] Phase 3 - Upload UI
- [ ] Phase 4 - Course pipeline (parsing → RAG → questions)
- [ ] Phase 5 - Quiz engine
- [ ] Phase 6 - Gamification (XP/streak)
- [ ] Phase 7 - TTS (4 voices)
- [ ] Phase 8 - Credits system
- [ ] Phase 9 - Polish & launch
- [ ] Phase 10 - Course-Site Factory (landing+checkout+ads per course)

ראה `docs/build-roadmap.md` לפירוט מלא של כל phase.

> **מצב v1 (2026-06-03):** Agent-OS (**33** — +ענף-בקרה `oversight` עצמאי, ממשל-v2 סשן-A+B) + צינור-ייבוא + admin-תיוג + נגן-שיעור **נמזגו ל-`main`** (439+ טסטים). **ממשל-v2:** סשן-A (גבול פלטפורמה↔קורס + סכמת-TODO מורחבת) + סשן-B (ענף-בקרה 6 סוכנים · צו-עצירה קוורום-2/3) הושלמו; סשן-C (SKILL `agent-os` גנרי) נותר — ראה `docs/context/GOVERNANCE-V2.md`. **M6 (code-review+security-review) הושלם** — 14 ממצאים מאומתים, 8 תוקנו (`a1cc051`), 3 נדחו להחלטת-מוטי. **A2.1 (קורפוס-חקיקה) הושלם:** 42 נוסחי-נבו כ-`.md` verbatim ב-`courses/safety-officer/sources/legislation/` (חילוץ דטרמיניסטי לא-גנרטיבי · אומת 42/42 L1–L5 + verify-live). **אומת מול תכנית-מינהל-הבטיחות 905018 — כל 42 בתכנית-ההסמכה** (`depth` פר-scope). **PDF-מחייב מלא ב-Drive "חוקים ותקנות"** (`authoritative_source`→Drive, creator-gated); מפת-הקשרים מחוללת `sources/legislation/INDEX.md`. 12 מסומנים `source_complete:false` (תוכן-תמונה בנבו → הנוסח-המלא ב-PDF-Drive). **M5 חסום-תכנונית בלבד:** ה-discovery-gate תוקן (default-deny ל-allow-list); נותר לאשר את `docs/M5-discovery-curation.md` (רשימת-בנקי-השאלות ✅~19) → הרצת `import:t1`. צעדים: `docs/context/SESSION-LOG.md` (רשומה אחרונה).
