# ADR-001: בחירת Stack — Next.js 15 + Supabase + Gemini

> **Status**: Accepted · **תיקון 2026-05-31**: ספק-LLM שונה ל-Google Gemini (ראה Amendment למטה)
> **Date**: 2026-05-29
> **Authors**: tech-lead · motilev8
> **Phase**: 0

---

## Amendment (2026-05-31) — ספק-AI: Anthropic+Voyage → Google Gemini

מוטי הכריע להשתמש ב-**Google Gemini** ליצירה+סיווג וב-**Gemini embeddings** ל-RAG, במקום
Anthropic Claude + Voyage. נימוק: מוטי כבר עובד עם Gemini (מגן רץ על Gemini 2.5 Flash), יש tier
חינמי, ומדובר ב-**מפתח אחד** (`GEMINI_API_KEY`) במקום שניים בתשלום. context-caching קיים גם ב-Gemini.
TTS נשאר ElevenLabs (אין Gemini-TTS), ו-NotebookLM **לא** משמש כ-engine — לכן ה-"TTS+Notebook
lock-in" שנשקל למטה אינו רלוונטי. שורות LLM+Embeddings בטבלה עודכנו בהתאם.

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

| שכבה          | בחירה                                                | למה                                                      |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Framework     | **Next.js 15 App Router + RSC**                      | full-stack מאוחד, אקוסיסטם בוגר, Vercel native           |
| Language      | **TypeScript strict**                                | type safety לפרויקט שיגדל                                |
| Styling       | **Tailwind + tailwindcss-rtl + shadcn/ui**           | RTL מובנה, components מותאמים                            |
| Auth          | **Supabase Auth (Google OAuth + Magic Link)**        | מנוהל, חינמי בהתחלה                                      |
| DB            | **Supabase Postgres + pgvector**                     | מנוהל, vector search מובנה                               |
| Storage       | **Supabase Storage**                                 | קבצי-מקור של משתמשים, audio cache                        |
| Realtime      | **Supabase Realtime**                                | progress push, balance updates                           |
| ORM           | **Drizzle**                                          | type-safe, lightweight, SQL-first                        |
| Async jobs    | **Inngest**                                          | חוצה Vercel timeout, observability מובנה                 |
| LLM           | **Google Gemini (2.5 Pro gen + 2.5 Flash classify)** | עברית מצוינת, context-caching, מפתח-אחד (כבר ברשות מוטי) |
| Embeddings    | **Gemini embeddings (`gemini-embedding-001`)**       | multilingual; ממד-וקטור תואם ב-pgvector (ADR-010/011)    |
| TTS           | **ElevenLabs**                                       | 4 קולות עברית עם איכות גבוהה                             |
| Tests         | **Vitest + Playwright**                              | מהיר, native ESM                                         |
| Hosting       | **Vercel**                                           | edge functions, preview deploys                          |
| Observability | **Sentry**                                           | error tracking, performance                              |

---

## Alternatives Considered

### Backend-as-a-service alternatives

- **Firebase**: עברית פחות טובה, אין pgvector native, lock-in גבוה
- **Convex**: אטרקטיבי אבל pre-1.0, אקוסיסטם קטן

### Framework alternatives

- **Remix/React Router 7**: דומה ל-Next.js, פחות בוגר, פחות אקוסיסטם
- **SvelteKit**: מצוין אבל פחות AI/Supabase support out-of-box

### LLM alternatives

- **Anthropic Claude (Sonnet/Haiku)**: איכות-עברית גבוהה + prompt-caching — היה ה-choice המקורי, הוחלף ב-Gemini (ראה Amendment) כדי לאחד על Google ולחסוך מפתח/עלות
- **OpenAI GPT**: עברית טובה, אבל ספק/מפתח נוסף
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
- [Gemini API](https://ai.google.dev/gemini-api/docs) · [Gemini context caching](https://ai.google.dev/gemini-api/docs/caching) · [Gemini embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [Inngest patterns](https://www.inngest.com/docs/learn)
