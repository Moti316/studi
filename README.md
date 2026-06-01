# StudiBuilder

> פלטפורמת AI בעברית להכנת קורסי-לימוד גיימיפיקטיביים מתוך מסמכי-מקור
> (PDF / Word / PowerPoint). קורס-בכורה: הכנה לוועדת-הסמכה ממונה-בטיחות 2026-07-15.
> Hebrew RTL · 5 סוגי-שאלות · TTS עברית · XP/streak · 3 מצבי-לימוד (Q&A / Scenario / AI-Chat).

**מודל-עסקי** (Phase 10): Course-as-Product Factory — כל קורס שמוטי בונה נולד כמוצר-עצמאי
עם landing page, checkout, וקמפיינים אוטומטיים.

---

## הפעלה מהירה

```bash
# 1. install dependencies (pnpm 9+)
pnpm install

# 2. setup environment
cp .env.example .env.local
# ערוך את .env.local עם ה-credentials שלך:
#   - Supabase (URL, anon key, service role, DATABASE_URL)
#   - Google OAuth (client ID + secret) + Google Drive (לייבוא-תוכן)
#   - GEMINI_API_KEY (generation + classification + embeddings — מפתח יחיד)
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

> **מקור-אמת חי: [`docs/context/STATUS.md`](./docs/context/STATUS.md).** מעודכן: 2026-06-02 (`main=93f6d79`).

| #   | Phase                                 | סטטוס       |
| --- | ------------------------------------- | ----------- |
| 0   | Foundation - scaffold + CI + תיעוד    | ✅ הושלם    |
| 1   | Auth & User Profile                   | ✅ הושלם    |
| 2   | Dashboard skeleton                    | 🟡 UI+mock  |
| 3   | Upload UI                             | ⏳          |
| 4   | Course Pipeline (Parse→RAG→Questions) | 🟡 ייבוא-T1 ✅; RAG חסר |
| 5   | Quiz Engine (5 question types)        | 🟡 ~3/5     |
| 6   | Gamification (XP/streak)              | ⏳          |
| 7   | TTS (4 Hebrew voices)                 | ⏳          |
| 8   | Credits System                        | ⏳          |
| 9   | Polish & Launch                       | ⏳          |
| 10  | Course-as-Product Factory             | ⏳          |

לפירוט מלא: [`docs/context/EXECUTION-PLAN.md`](./docs/context/EXECUTION-PLAN.md) · משימות: [`TODO.md`](./TODO.md)

---

## ארכיטקטורה

```
[Browser RTL Hebrew]
   ↓
[Next.js 15 (App Router + RSC) on Vercel]
   ↓
[Supabase: Postgres + pgvector + Auth + Storage + Realtime]
   ↓
[Inngest workers] ←→ [Gemini 2.5 Pro (gen) + 2.5 Flash (classify)]
                  ←→ [Gemini embeddings (RAG)]
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

- [`docs/concept.md`](./docs/concept.md) - חזון-המוצר וערך-ייחודי
- [`docs/features.md`](./docs/features.md) - 10 קטגוריות פיצ'רים מפורטות
- [`docs/sitemap.md`](./docs/sitemap.md) - מפת מסכים ו-flowchart
- [`docs/architecture/ADR-001-stack.md`](./docs/architecture/ADR-001-stack.md) - בחירת stack
- [`docs/architecture/ADR-002-pipeline.md`](./docs/architecture/ADR-002-pipeline.md) - course pipeline
- [`docs/architecture/ADR-003-auth.md`](./docs/architecture/ADR-003-auth.md) - auth strategy
