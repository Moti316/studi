# src/lib/ai - Gemini API wrappers

> **Phase**: 4+ · Owner: ml-engineer

עטיפות סביב `@google/genai` (Gemini) עם context-caching מובנה.

## עקרון

כל קריאה ל-Gemini עוברת **דרך הקבצים כאן**, לא ישירות מ-route handler.
מטרות:

- prompt caching מובנה (חוסך 90% עלות)
- type-safe payloads (Zod schemas)
- retry logic סטנדרטי
- cost tracking + Sentry observability

## קבצים מתוכננים (Phase 4)

- `client.ts` - Gemini client singleton (`@google/genai`)
- `prompts/` - prompts בעברית, cached as system instruction (context caching)
  - `topic-detection.ts` - Gemini 2.5 Flash
  - `lesson-generation.ts` - Gemini 2.5 Pro
  - `question-generation.ts` - Gemini 2.5 Pro with RAG context
  - `deep-explanation.ts` - Gemini 2.5 Pro with source chunk
- `schemas.ts` - Zod schemas לכל ה-outputs (validation)
- `cost-tracker.ts` - מדידת usage פר-משתמש

## דוגמת-use

```typescript
import { generateLesson } from '@/lib/ai/prompts/lesson-generation';

const lesson = await generateLesson({
  chunks: [...],
  topic: 'בטיחות בעבודה',
  language: 'he',
});
// → { title, content, estimated_xp, chunk_ids_used }
```

## עקרונות

- **context cache**: system instruction cached (Gemini context caching)
- **streaming**: לתשובות ארוכות (deep explanation)
- **validation**: כל output עובר Zod schema
- **error handling**: retry x2 עם exponential backoff על rate limit
- **Sentry**: כל call נרשם עם duration + tokens + cost
