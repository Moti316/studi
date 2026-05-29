# StudiBuilder

> פלטפורמת AI בעברית שהופכת PDF/Word/PowerPoint לקורסי-לימוד אינטראקטיביים
> בסגנון Duolingo - עם XP, streak, TTS עברית, ו-4 סוגי שאלות.

**מקור-השראה**: [StudiesGo](https://studiesgo.com) - ניתוח מלא מתועד ב-`docs/`.

---

## הפעלה מהירה

```bash
# 1. install dependencies (pnpm 9+)
pnpm install

# 2. setup environment
cp .env.example .env.local
# ערוך את .env.local עם ה-credentials שלך:
#   - Supabase (URL, anon key, service role, DATABASE_URL)
#   - Google OAuth (client ID + secret)
#   - Anthropic Claude API key
#   - Voyage AI key
#   - ElevenLabs key
#   - Resend (mail)
#   - Sentry DSN

# 3. run dev server
pnpm dev
# → http://localhost:3000

# 4. tests
pnpm test          # unit (Vitest)
pnpm test:e2e      # e2e (Playwright)
pnpm typecheck     # TypeScript strict
pnpm lint          # ESLint + Prettier
```

---

## סטטוס

**Phase**: 0/10 - Foundation ✅

| #   | Phase                                 | סטטוס    |
| --- | ------------------------------------- | -------- |
| 0   | Foundation - scaffold + CI + תיעוד    | ✅ הושלם |
| 1   | Auth & User Profile                   | 🚧 הבא   |
| 2   | Dashboard skeleton                    | ⏳       |
| 3   | Upload UI                             | ⏳       |
| 4   | Course Pipeline (Parse→RAG→Questions) | ⏳       |
| 5   | Quiz Engine (4 question types)        | ⏳       |
| 6   | Gamification (XP/streak)              | ⏳       |
| 7   | TTS (4 Hebrew voices)                 | ⏳       |
| 8   | Credits System                        | ⏳       |
| 9   | Polish & Launch                       | ⏳       |

לפירוט מלא: [`docs/build-roadmap.md`](./docs/build-roadmap.md)

---

## ארכיטקטורה

```
[Browser RTL Hebrew]
   ↓
[Next.js 15 (App Router + RSC) on Vercel]
   ↓
[Supabase: Postgres + pgvector + Auth + Storage + Realtime]
   ↓
[Inngest workers] ←→ [Claude (Sonnet 4.6 + Haiku 4.5)]
                  ←→ [Voyage AI embeddings]
                  ←→ [ElevenLabs TTS]
```

ראה [`docs/architecture.md`](./docs/architecture.md) למפרט מלא ו-[`docs/architecture/`](./docs/architecture/) ל-ADRs.

---

## מבנה תיקיות

```
.
├── src/
│   ├── app/                 Next.js App Router
│   ├── components/          shadcn/ui + custom
│   ├── lib/
│   │   ├── ai/              Claude wrappers (prompt cache)
│   │   ├── db/              Drizzle schema
│   │   ├── auth/            Supabase Auth helpers
│   │   └── tts/             ElevenLabs wrapper
│   └── features/            domain features (course-creation, lesson-player, gamification)
├── tests/
│   ├── unit/                Vitest specs
│   └── e2e/                 Playwright specs
├── inngest/functions/       async pipelines
├── docs/
│   ├── concept.md           מה זה StudiBuilder
│   ├── features.md          רשימת פיצ'רים
│   ├── architecture.md      stack proposal
│   ├── sitemap.md           URL structure
│   ├── build-roadmap.md     10 phases plan
│   ├── architecture/        ADRs
│   ├── screens-spec/        מפרט פר-מסך (20)
│   ├── screens/             reference screenshots
│   └── qa/                  manual QA checklists
├── teams/                   agent identity docs
│   ├── strategic/           opus tier (PO, tech-lead, domain-expert)
│   ├── builder/             sonnet tier (frontend, backend, ML, data, ...)
│   ├── quality/             appsec, privacy, test, e2e
│   └── coordinator/         release-manager
├── .claude/agents/          21 agents for Claude Code
├── .github/workflows/       CI + E2E + (deploy-preview, deploy-prod)
└── AGENTS.md · CLAUDE.md · USER.md · MEMORY.md
```

---

## עקרונות-יסוד

- **עברית RTL כאזרח-ראשון** - לא תיקון בדיעבד
- **TDD-first** - בדיקה כושלת לפני הקוד
- **AI-call תמיד עם prompt-cache** - חוסך 90% עלות
- **secrets ב-.env.local בלבד** - לעולם לא ב-commit

ראה [`CLAUDE.md`](./CLAUDE.md) להוראות מלאות לסוכני Claude Code.

---

## תיעוד-מקור

- [`docs/concept.md`](./docs/concept.md) - מה StudiesGo, ערך-ייחודי
- [`docs/features.md`](./docs/features.md) - 10 קטגוריות פיצ'רים מפורטות
- [`docs/sitemap.md`](./docs/sitemap.md) - מפת מסכים ו-flowchart
- [`docs/architecture/ADR-001-stack.md`](./docs/architecture/ADR-001-stack.md) - בחירת stack
- [`docs/architecture/ADR-002-pipeline.md`](./docs/architecture/ADR-002-pipeline.md) - course pipeline
- [`docs/architecture/ADR-003-auth.md`](./docs/architecture/ADR-003-auth.md) - auth strategy
