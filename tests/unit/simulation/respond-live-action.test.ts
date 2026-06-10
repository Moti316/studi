/**
 * tests/unit/simulation/respond-live-action.test.ts — 3 שערי-ה-fallback של ה-action (ADR-018).
 * מוק '@/lib/ai/claude' — אפס-SDK, אפס-רשת.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const isClaudeConfigured = vi.fn();
const claudeConverse = vi.fn();
vi.mock('@/lib/ai/claude', () => ({
  isClaudeConfigured: () => isClaudeConfigured(),
  claudeConverse: (args: unknown) => claudeConverse(args),
}));

const getUser = vi.fn();
vi.mock('@/lib/auth/server', () => ({ getUser: () => getUser() }));

import { respondLiveAction } from '@/features/simulation/respond-live.action';
import type { RespondLiveInput } from '@/features/simulation/live-types';

function input(over: Partial<RespondLiveInput> = {}): RespondLiveInput {
  return {
    branch: 'בנייה',
    stage: 'opening',
    currentQuestion: 'מי אתה?',
    currentInspector: 'regulatory',
    answer: 'אני הנדסאי בניין עם נסיון בפיקוח ובטיחות בעיריית תל-אביב',
    transcript: [],
    turnIndexInStage: 0,
    ...over,
  };
}

beforeEach(() => {
  isClaudeConfigured.mockReset();
  claudeConverse.mockReset();
  getUser.mockReset();
  getUser.mockResolvedValue({ id: 'u1' }); // ברירת-מחדל: משתמש-מחובר
});

describe('respondLiveAction — 3 שערים', () => {
  it('שער-0: משתמש-לא-מחובר → דטרמיניסטי (אפס-קריאת-Claude · חסם-עלות)', async () => {
    getUser.mockResolvedValue(null);
    isClaudeConfigured.mockReturnValue(true);
    const r = await respondLiveAction(input());
    expect(r.source).toBe('deterministic');
    expect(claudeConverse).not.toHaveBeenCalled();
  });

  it('שער-1: תשובה-קצרה → nudge (אפס-קריאת-Claude)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    const r = await respondLiveAction(input({ answer: 'כן' }));
    expect(r.source).toBe('deterministic');
    expect(r.advanceStage).toBe(false);
    expect(claudeConverse).not.toHaveBeenCalled();
  });

  it('שער-2: אין-מפתח → דטרמיניסטי', async () => {
    isClaudeConfigured.mockReturnValue(false);
    const r = await respondLiveAction(input());
    expect(r.source).toBe('deterministic');
    expect(claudeConverse).not.toHaveBeenCalled();
  });

  it('שער-3: Claude חי → source=claude', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeConverse.mockResolvedValue(
      JSON.stringify({
        inspectorReply: 'חצי-נקודה: בסיס נכון, חסר עיגון.',
        quality: 'partial',
        pointsAwarded: 5,
        mode: 'מאומת',
        advanceStage: false,
        nextInspector: 'technical',
        nextStage: 'opening',
        nextQuestion: 'הרחב?',
        done: false,
      }),
    );
    const r = await respondLiveAction(input());
    expect(r.source).toBe('claude');
    expect(r.inspectorReply).toContain('חצי-נקודה');
    expect(claudeConverse).toHaveBeenCalledTimes(1);
  });

  it('שער-3: כשל-Claude → fallback דטרמיניסטי (לא זורק)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    claudeConverse.mockRejectedValue(new Error('boom'));
    const r = await respondLiveAction(input());
    expect(r.source).toBe('deterministic');
  });

  it('#9 cost-guard: transcript ארוך (25 תורים) → דטרמיניסטי (אפס-קריאת-Claude)', async () => {
    isClaudeConfigured.mockReturnValue(true);
    const longTranscript = Array.from({ length: 25 }, () => ({
      stage: 'branch' as const,
      inspector: 'technical' as const,
      question: 'q',
      answer: 'תשובה מלאה עם מספיק מילים כדי לעבור את שער-הקיצור הראשון',
      pointsAwarded: 5,
    }));
    const r = await respondLiveAction(input({ transcript: longTranscript }));
    expect(r.source).toBe('deterministic');
    expect(claudeConverse).not.toHaveBeenCalled();
  });
});
