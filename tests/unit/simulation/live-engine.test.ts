/**
 * tests/unit/simulation/live-engine.test.ts — reducer ה-LiveEngine (ADR-018). טהור.
 */
import { describe, expect, it } from 'vitest';
import { initLiveState, applyResult, runningScore } from '@/features/simulation/live-engine';
import type { RespondLiveResult, LiveTranscriptTurn } from '@/features/simulation/live-types';

const baseRes: RespondLiveResult = {
  inspectorReply: 'יפה.',
  mode: 'מאומת',
  quality: 'good',
  pointsAwarded: 8,
  advanceStage: true,
  nextInspector: 'technical',
  nextStage: 'branch',
  nextQuestion: 'מנֵה סיכונים.',
  done: false,
  source: 'claude',
};

describe('live-engine reducer', () => {
  it('initLiveState — שלב opening + שאלת-פתיחה', () => {
    const s = initLiveState('בנייה');
    expect(s.stage).toBe('opening');
    expect(s.question).toContain('ספר לנו על עצמך');
    expect(s.transcript).toHaveLength(0);
    expect(s.done).toBe(false);
  });

  it('applyResult — מוסיף תור-מוערך + מתקדם לשלב-הבא + מאפס index', () => {
    let s = initLiveState('בנייה');
    s = applyResult(s, 'אני הנדסאי בניין', baseRes);
    expect(s.transcript).toHaveLength(1);
    expect(s.transcript[0]!.reply).toBe('יפה.');
    expect(s.transcript[0]!.pointsAwarded).toBe(8);
    expect(s.stage).toBe('branch');
    expect(s.inspector).toBe('technical');
    expect(s.turnIndexInStage).toBe(0);
  });

  it('applyResult — בלי-advance מגדיל turnIndexInStage', () => {
    let s = initLiveState('בנייה');
    s = applyResult(s, 'תשובה', { ...baseRes, advanceStage: false, nextStage: 'opening' });
    expect(s.turnIndexInStage).toBe(1);
    expect(s.stage).toBe('opening');
  });

  it('applyResult — advanceStage עם nextStage=null (לא-done) מגדיל index, לא מאפס (#12)', () => {
    let s = initLiveState('בנייה');
    // התקדם ל-branch כדי שאינדקס-התור יהיה > 0 לפני ה-edge.
    s = applyResult(s, 'תשובה-1', baseRes);
    s = applyResult(s, 'תשובה-2', {
      ...baseRes,
      advanceStage: false,
      nextStage: 'branch',
    });
    expect(s.turnIndexInStage).toBe(1);
    // edge: advanceStage=true אבל nextStage=null ולא-done → אסור-לאפס.
    s = applyResult(s, 'תשובה-3', {
      ...baseRes,
      advanceStage: true,
      nextStage: null,
      nextQuestion: null,
      done: false,
    });
    expect(s.turnIndexInStage).toBe(2);
    expect(s.stage).toBe('branch'); // השלב נשמר (nextStage ?? state.stage)
  });

  it('applyResult — advanceStage=true עם nextStage זהה-לשלב-הנוכחי מגדיל index, לא מאפס (#12)', () => {
    let s = initLiveState('בנייה');
    s = applyResult(s, 'תשובה-1', { ...baseRes, advanceStage: false, nextStage: 'opening' });
    expect(s.turnIndexInStage).toBe(1);
    // advanceStage=true אבל nextStage===state.stage → לא-שינוי-שלב → אסור-לאפס.
    s = applyResult(s, 'תשובה-2', { ...baseRes, advanceStage: true, nextStage: 'opening' });
    expect(s.turnIndexInStage).toBe(2);
    expect(s.stage).toBe('opening');
  });

  it('applyResult — done → result + done', () => {
    let s = initLiveState('בנייה');
    s = applyResult(s, 'תשובה', {
      ...baseRes,
      done: true,
      finalReport: { score: 75, weaknesses: ['חוק'], strengtheningActions: ['a', 'b', 'c'] },
    });
    expect(s.done).toBe(true);
    expect(s.result?.score).toBe(75);
  });

  it('runningScore — ממוצע-נקודות × 10', () => {
    expect(runningScore([])).toBe(0);
    const t: LiveTranscriptTurn[] = [
      { stage: 'opening', inspector: 'regulatory', question: 'q', answer: 'a', pointsAwarded: 8 },
      { stage: 'branch', inspector: 'technical', question: 'q', answer: 'a', pointsAwarded: 6 },
    ];
    expect(runningScore(t)).toBe(70);
  });
});
