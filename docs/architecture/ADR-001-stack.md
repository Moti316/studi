# ADR-001: בחירת Stack — Next.js 15 + Supabase + Claude

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: tech-lead · motilev8
> **Phase**: 0

---

## Context

מתחילים בפרויקט greenfield (StudiBuilder) - שיעוד-AI בעברית-RTL. נדרשת בחירת stack שיתמוך ב:
- Hebrew RTL כאזרח-ראשון
- pipeline אסינכרוני ארוך (5-stage course-build)
- pgvector ל-RAG
- TTS עברית
- מוצר Solo dev (לכן עדיף managed services)
- deploy תוך < 4 שעות עבודה

---

## Decision

**Stack מאוחד מבוסס TypeScript:**

| שכבה | בחירה | למה |
|---|---|---|
| Framework | **Next.js 15 App Router + RSC** | full-stack מאוחד, אקוסיסטם בוגר, Vercel native |
| Language | **TypeScript strict** | type safety לפרויקט שיגדל |
| Styling | **Tailwind + tailwindcss-rtl + shadcn/ui** | RTL מובנה, components מותאמים |
| Auth | **Supabase Auth (Google OAuth + Magic Link)** | מנוהל, חינמי בהתחלה |
| DB | **Supabase Postgres + pgvector** | מנוהל, vector search מובנה |
| Storage | **Supabase Storage** | קבצי-מקור של משתמשים, audio cache |
| Realtime | **Supabase Realtime** | progress push, balance updates |
| ORM | **Drizzle** | type-safe, lightweight, SQL-first |
| Async jobs | **Inngest** | חוצה Vercel timeout, observability מובנה |
| LLM | **Anthropic Claude (Sonnet 4.6 + Haiku 4.5)** | איכות עברית, prompt caching |
| Embeddings | **Voyage AI (voyage-3)** | זול, איכותי, multilingual |
| TTS | **ElevenLabs** | 4 קולות עברית עם איכות גבוהה |
| Tests | **Vitest + Playwright** | מהיר, native ESM |
| Hosting | **Vercel** | edge functions, preview deploys |
| Observability | **Sentry** | error tracking, performance |

---

## Alternatives Considered

### Backend-as-a-service alternatives
- **Firebase**: עברית פחות טובה, אין pgvector native, lock-in גבוה
- **Convex**: אטרקטיבי אבל pre-1.0, אקוסיסטם קטן

### Framework alternatives
- **Remix/React Router 7**: דומה ל-Next.js, פחות בוגר, פחות אקוסיסטם
- **SvelteKit**: מצוין אבל פחות AI/Supabase support out-of-box

### LLM alternatives
- **OpenAI GPT**: עברית טובה, אבל אין prompt caching בקנה-מידה
- **Google Gemini**: עברית מצוינת אבל TTS+Notebook lock-in
- **Local LLM**: לא אפשרי לאיכות בעברית במכשירי-לקצה

### TTS alternatives
- **Azure**: עברית סבירה, יותר זולה
- **Google Cloud TTS**: עברית מוגבלת
- **OpenAI TTS**: לא תומך עברית טוב

---

## Consequences

### Positive
- ✅ Solo dev מנהל סטאק אחד (TypeScript)
- ✅ Supabase = פחות הרכבים
- ✅ Next.js App Router + RSC = פחות client-state, פחות bugs
- ✅ פיתוח מהיר ל-MVP

### Negative / Trade-offs
- ❌ **Vercel timeout** (10s/60s) - כל LLM call חייב לעבור דרך Inngest. תוסף תלות
- ❌ **Supabase vendor lock-in** - migration ל-self-host יקרה. מקובל כי greenfield
- ❌ **TypeScript backend** - פחות library options ל-document parsing מאשר Python. נטפל ב-Phase 4

### Neutral
- pgvector מספיק עד 100k chunks. תיעוד switch-plan ל-Qdrant ב-ADR-005

---

## Validation

- [ ] Phase 0 ends with dev server עולה + CI ירוק + deploy לפרודקשן
- [ ] Phase 4 ends תוך < 15 דקות לקורס של 50 עמ'
- [ ] עלות Supabase < $25/חודש לב-100 משתמשים פעילים

---

## References

- [Next.js 15 docs](https://nextjs.org/docs)
- [Supabase + pgvector guide](https://supabase.com/docs/guides/ai)
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Inngest patterns](https://www.inngest.com/docs/learn)
