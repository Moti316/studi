# CLAUDE.md - StudiBuilder

## אזהרת קריאה

לפני כל פעולה: קרא `AGENTS.md` (קנוני), `USER.md` (העדפות motilev8),
ואת `teams/<tier>/<slug>/identity.md` של הסוכן הרלוונטי.

## מסמכי-תיעוד — רישום-חובה

> **כלל קבוע (לעתיד):** כל קובץ `.md` חדש שנוצר בפרויקט **חייב להירשם כאן** וב-`docs/context/PROJECT-MAP.md`. אין מסמכים "יתומים".

**קריאה-חובה בתחילת כל סשן (קרא במלואם, לא לדלג):**

- **בסיס:** `CLAUDE.md` · `AGENTS.md` · `USER.md`
- **הקשר-חי** (`docs/context/`): `PROJECT-MAP.md` · `PROJECTS.md` · `STATUS.md` · `EXECUTION-PLAN.md` · `TASKS.md` · `BUGS.md` · `DECISIONS.md` · `ACCESS-MAP.md` · `SESSION-LOG.md`
- **תוכן/scope:** `docs/content-scope.md` · `docs/CONTENT-INDEX.md`
- **ציות/רעיונות:** `docs/compliance/COMPLIANCE.md` (חובות-ציות + task-force) · `docs/IDEAS.md` (רעיונות/פידבק)
- **ארכיטקטורה** (לפי-צורך): `docs/architecture/ADR-001..011`
- **סוכנים:** `teams/PROJECT-CONTEXT.md` (עוגן-הקשר — נקרא ראשון) · `teams/ORG.md` (היררכיה+פרוטוקולים+מחזור-חיים) · `teams/README.md` (רוסטר 27) · `teams/HOWTO-add-agent.md` (מתי+איך להקים סוכן) · `teams/<tier>/<slug>/{identity.md,memory.md,activity-log.md}`

הרשימה המסודרת המלאה: `docs/context/PROJECT-MAP.md`.

### פרוטוקול-סוכן (חובה)

כל סוכן קורא `teams/PROJECT-CONTEXT.md` + `identity.md` + `memory.md` בתחילת הפעלה,
ומתעד ב-`activity-log.md` בסיום. ההיררכיה והפרוטוקולים (זרימת-דיווח, בקרת-סחף, מחזור-חיים)
מוגדרים ב-`teams/ORG.md`. הרוסטר (27 = 22 מבצעים + 4 ראשי-צוות + מתווך) ב-`teams/README.md`.

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

## סקילים מומלצים (Claude Code Skills)

> הפעל אוטומטית בשלב הנכון (פירוט בזיכרון `studi-skills`):

- **frontend-design** — בכל בניית UI (lesson-player, admin, components) → עיצוב בהשראת StudiesGo, לא גנרי
- **run** — להריץ את האפליקציה ולראות שינוי עובד · **verify** — לאמת end-to-end (לא רק שטסטים עוברים)
- **code-review** + **security-review** — שער-האיכות של המועצה לפני push (באגים · creator-gate · service-role · פרטיות)
- **skill-creator** — בניית/שיפור סקילים (Agent-OS starter-kit) · **playground** — דשבורד-סוכנים
- ⛔ **claude-api** — לא רלוונטי: עובדים עם Gemini (`@google/genai`), לא Anthropic SDK

## נהלי-עבודה (קבוע)

- **דחיפה אחרי כל משימה:** commit+push ל-`claude/v1` ברגע שמשימה קוהרנטית ירוקה (typecheck+test); שמור Todolist מעודכן.
- **משמעת-תיעוד (לסשנים הבאים):** כל קובץ `.md` חדש או **פעולה משמעותית** → עדכון **קבצי-זיכרון** + **CLAUDE.md** + רישום ב-**`docs/context/PROJECT-MAP.md`**. אם נדרשים קבצים נוספים (README/ADR-index/EXECUTION-PLAN) — לעדכן גם אותם. (הכלל הזה עצמו מתועד כאן ובזיכרון.)
- **מסמכים-חיים:** `docs/IDEAS.md` (רעיונות/פידבק — להוסיף בחופשיות) · `docs/compliance/COMPLIANCE.md` (ציות).

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

> **מצב v1 (2026-06-01):** Agent-OS (27 סוכנים) + צינור-ייבוא + admin-תיוג (`/admin/questions`) + נגן-שיעור (`/lesson/[id]`) **נבנו, נבדקו (392) ונמזגו ל-`main`**. נשאר: **M5** (הרצת-ייבוא בפועל → ~540 שאלות) + **M6** (code-review/security-review). צעדים מדויקים: `docs/context/SESSION-LOG.md` (רשומה אחרונה) + זיכרון `studi-v1-next-steps`.
