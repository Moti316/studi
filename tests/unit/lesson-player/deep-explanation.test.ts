import { describe, it, expect, vi, beforeEach } from 'vitest';

// db נטען-בעת-import וקורא env → חובה למקמק לפני import של ה-action.
vi.mock('@/lib/db', () => ({ db: { execute: vi.fn() } }));
vi.mock('@/lib/rag/embed', () => ({ embedRagQuery: vi.fn() }));
vi.mock('@/lib/rag/retrieval', () => ({ retrieveRelevantChunks: vi.fn() }));
vi.mock('@/lib/ai/client', () => ({ geminiGenerateText: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ getUser: vi.fn() }));

import { generateDeepExplanation } from '@/features/lesson-player/deep-explanation.action';
import { db } from '@/lib/db';
import { embedRagQuery } from '@/lib/rag/embed';
import { retrieveRelevantChunks } from '@/lib/rag/retrieval';
import { geminiGenerateText } from '@/lib/ai/client';
import { getUser } from '@/lib/auth/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('generateDeepExplanation (RAG server-action)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUser as any).mockResolvedValue({ id: 'u1' }); // ברירת-מחדל: משתמש-מחובר
  });

  it('מחבר הסבר מעוגן + מקבץ מקורות (dedup לפי כותרת, איחוד scope-ids)', async () => {
    (db.execute as any).mockResolvedValue([
      { prompt: 'מהו ציוד מגן אישי?', correct_answer: null, explanation: 'תשובת-מודל' },
    ]);
    (embedRagQuery as any).mockResolvedValue([0.1, 0.2, 0.3]);
    (retrieveRelevantChunks as any).mockResolvedValue([
      {
        id: 'c1',
        text: 'נוסח א',
        scopeRefs: [{ id: '2.3' }],
        sourceTitle: 'תקנות ציוד-מגן 1997',
        score: 0.9,
      },
      {
        id: 'c2',
        text: 'נוסח ב',
        scopeRefs: [{ id: '2.3' }, { id: '1.0' }],
        sourceTitle: 'תקנות ציוד-מגן 1997',
        score: 0.8,
      },
    ]);
    (geminiGenerateText as any).mockResolvedValue('הסבר מעוגן-חקיקה.');

    const res = await generateDeepExplanation('q-1');

    expect(embedRagQuery).toHaveBeenCalledOnce();
    expect(retrieveRelevantChunks).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5);
    expect(res.explanation).toBe('הסבר מעוגן-חקיקה.');
    // dedup: מקור-אחד (אותה כותרת) עם איחוד שני ה-scope-ids.
    expect(res.sources).toHaveLength(1);
    expect(res.sources[0]?.title).toBe('תקנות ציוד-מגן 1997');
    expect(res.sources[0]?.scopeIds.sort()).toEqual(['1.0', '2.3']);
  });

  it('שאלה לא-קיימת → זורק שגיאה', async () => {
    (db.execute as any).mockResolvedValue([]);
    await expect(generateDeepExplanation('missing')).rejects.toThrow(/not found/);
  });

  it('משתמש-לא-מחובר → זורק (שער-auth · cost-abuse · אפס-Gemini)', async () => {
    (getUser as any).mockResolvedValue(null);
    await expect(generateDeepExplanation('q-1')).rejects.toThrow(/unauthenticated/);
    expect(db.execute).not.toHaveBeenCalled();
    expect(embedRagQuery).not.toHaveBeenCalled();
  });
});
