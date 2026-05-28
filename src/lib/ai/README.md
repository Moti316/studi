# src/lib/ai - Claude API wrappers

> **Phase**: 4+ · Owner: ml-engineer

עטיפות סביב `@anthropic-ai/sdk` עם prompt caching מובנה.

## עקרון

כל קריאה ל-Claude עוברת **דרך הקבצים כאן**, לא ישירות מ-route handler.
מטרות:
- prompt caching מובנה (חוסך 90% עלות)
- type-safe payloads (Zod schemas)
- retry logic סטנדרטי
- cost tracking + Sentry observability

## קבצים מתוכננים (Phase 4)

- `client.ts` - Anthropic client singleton
- `prompts/` - prompts בעברית, cached as system messages
  - `topic-detection.ts` - Haiku
  - `lesson-generation.ts` - Sonnet
  - `question-generation.ts` - Sonnet with RAG context
  - `deep-explanation.ts` - Sonnet with source chunk
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

- **prompt cache**: system + tools (cached for 5 min)
- **streaming**: לתשובות ארוכות (deep explanation)
- **validation**: כל output עובר Zod schema
- **error handling**: retry x2 עם exponential backoff על rate limit
- **Sentry**: כל call נרשם עם duration + tokens + cost
