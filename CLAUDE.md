# CLAUDE.md - StudiBuilder

## אזהרת קריאה
לפני כל פעולה: קרא `AGENTS.md` (קנוני), `USER.md` (העדפות motilev8),
ואת `teams/<tier>/<slug>/identity.md` של הסוכן הרלוונטי.

## הפרויקט בקצרה
StudiBuilder = פלטפורמת AI לבניית קורסי-לימוד בעברית מתוך מסמכים.
דומיין: edtech · קהל: motilev8 (internal) · stack: TS · stage: greenfield.

## עקרונות-יסוד (לעולם אל תוותר)
- **עברית RTL כאזרח-ראשון** - לא תיקון בדיעבד
- **TDD-first** - בדיקה כושלת לפני הקוד, אחרי הקוד פוגעת באמינות
- **secrets ב-.env.local בלבד** - לעולם לא ב-commit
- **AI-call תמיד עם prompt-cache** - חוסך 90% עלות. ראה `src/lib/ai/`
- **שגיאות הן מצב מתוכנן** - כל פעולת-משתמש עוטפת ב-try/catch + telemetry

## stack שנבחר (אסור לסטות בלי ADR)
- Next.js 15 (App Router, RSC) + TypeScript strict
- Supabase: Postgres + pgvector + Auth + Storage + Realtime
- Inngest: pipelines אסינכרוניים (5-stage course-build)
- Claude API: Sonnet 4.6 (gen) + Haiku 4.5 (classification)
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

## מבנה התיקיות
```
src/
  app/                Next.js App Router pages
  components/         shadcn + custom UI
  lib/
    ai/              Claude wrappers + prompts (cached)
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
- [ ] Phase 1 - Auth & profile
- [ ] Phase 2 - Dashboard skeleton
- [ ] Phase 3 - Upload UI
- [ ] Phase 4 - Course pipeline (parsing → RAG → questions)
- [ ] Phase 5 - Quiz engine
- [ ] Phase 6 - Gamification (XP/streak)
- [ ] Phase 7 - TTS (4 voices)
- [ ] Phase 8 - Credits system
- [ ] Phase 9 - Polish & launch

ראה `docs/build-roadmap.md` לפירוט מלא של כל phase.
