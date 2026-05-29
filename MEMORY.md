# MEMORY.md — זיכרון-פרויקט תפעולי

<!-- תקרת-גודל: ~2,200 תווים. consolidation כשמתמלא. -->

## עובדות-פרויקט

- **שם**: StudiBuilder
- **דומיין**: edtech / AI course generator (Hebrew RTL)
- **קהל**: internal לבעלים (motilev8). לא B2B/B2C לעת עתה
- **מקור-השראה**: studiesgo.com - ניתוח מלא ב-`docs/concept.md`
- **שלב**: greenfield (Phase 0 → 9)

## Stack (נעול - אסור לסטות בלי ADR)

- **Frontend**: Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui + tailwindcss-rtl
- **Backend**: Next.js Route Handlers + Server Actions
- **DB**: Supabase (Postgres + pgvector + Auth + Storage + Realtime), Drizzle ORM
- **Async jobs**: Inngest (5-stage course-build pipeline)
- **LLM**: Anthropic Claude - Sonnet 4.6 (generation), Haiku 4.5 (classification). prompt caching חובה
- **Embeddings**: Voyage AI (`voyage-3`)
- **TTS**: ElevenLabs (4 קולות עברית: Yoav/Tali/Michal/Ori)
- **Hosting**: Vercel + Sentry
- **Tests**: Vitest (unit) + Playwright (e2e)

## החלטות-ארכיטקטורה (locked)

- **AI pipeline = build from scratch** - לא NotebookLM. שליטה מלאה ב-prompts
- **Google OAuth login-only** - בלי Drive scope. user מעלה ידנית
- **Course pipeline 5-stage**: Parse → Chunk → Embed → Topic+Lessons → Questions
- **source_chunk_id** מקשר כל שאלה ל-chunk המקורי (RAG link ל"הסבר לעומק")
- **Magic link + Google OAuth** - שני מסלולי התחברות
- **pgvector ראשון** - מעבר ל-Qdrant אם > 100k chunks
- **Inngest workers** - לעבודות ארוכות (Vercel function timeout)

## עקרונות

- עברית RTL כאזרח-ראשון (לא bolt-on)
- TDD-first
- secrets ב-`.env.local` בלבד
- כל LLM call מ-`src/lib/ai/*` עם prompt caching מובנה
- שגיאות מטופלות, לא נבלעות

## Build phases (סטטוס)

- [✅] Phase 0: workspace + planning הושלמו. 21 סוכנים + תיעוד
- [⏳] **Phase 0 actual code**: Next.js scaffold + CI + Vercel deploy (הצעד הבא)
- [ ] Phase 1-9: ראה `docs/build-roadmap.md`

## פערים פתוחים שדורשים החלטה

- Bob mascot - לעצב חדש (visual-designer) או placeholder emoji
- Stripe או מודל-קרדיטים פנימי בלבד (Phase 8)
- onboarding flow תוכן (Phase 9, content-writer)

## מסמכים-מפתח לקריאה

- `docs/concept.md` - מה StudiesGo, מה אנחנו בונים
- `docs/architecture.md` - הצעת stack מלאה (עודכן)
- `docs/build-roadmap.md` - 10 phases (חדש)
- `docs/screens-spec/*.md` - מפרט 20 מסכים (חדש)
