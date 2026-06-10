/**
 * tests/unit/ai/committee-sim-live.test.ts — שכבת-הפרומפט-והפרסום של הסימולציה-החיה (ADR-018).
 * טהור — אפס-SDK, אפס-רשת.
 */
import { describe, expect, it } from 'vitest';
import {
  buildLiveSystemPrompt,
  transcriptToMessages,
  parseLiveTurn,
  clampLiveProgress,
  isTooShortToGrade,
  deterministicLiveTurn,
  deterministicNudge,
  OPENING_QUESTION,
  LiveParseError,
} from '@/lib/ai/prompts/committee-sim/live';
import type { RespondLiveInput } from '@/features/simulation/live-types';

function input(over: Partial<RespondLiveInput> = {}): RespondLiveInput {
  return {
    branch: 'בנייה',
    stage: 'opening',
    currentQuestion: OPENING_QUESTION,
    currentInspector: 'regulatory',
    answer: 'אני הנדסאי בניין עם רקע בפיקוח, ורוצה להעמיק בבטיחות ולתת מענה אמיתי בשטח.',
    transcript: [],
    turnIndexInStage: 0,
    ...over,
  };
}

describe('isTooShortToGrade', () => {
  it('ריק/קצר-מאוד → true', () => {
    expect(isTooShortToGrade('')).toBe(true);
    expect(isTooShortToGrade('כן')).toBe(true);
    expect(isTooShortToGrade('כן לא')).toBe(true);
  });
  it('תשובה-מלאה → false', () => {
    expect(isTooShortToGrade('אני חושב שצריך לעצור את העבודה מיד')).toBe(false);
  });
});

describe('buildLiveSystemPrompt', () => {
  it('מחזיר system ניתן-לקאשינג עם פרומפט-מגן + עיגון', () => {
    const sys = buildLiveSystemPrompt('בנייה');
    expect(typeof sys).toBe('object');
    if (typeof sys === 'object') {
      expect(sys.cache).toBe(true);
      expect(sys.text).toContain('מדרג-הבקרות');
      expect(sys.text).toContain('עבודה בגובה'); // מהעיגון הענפי
      expect(sys.text).toContain('JSON');
    }
  });
});

describe('transcriptToMessages', () => {
  it('בונה user/assistant לסירוגין, מסתיים בתור-הנוכחי (user)', () => {
    const msgs = transcriptToMessages(
      input({
        transcript: [
          {
            stage: 'opening',
            inspector: 'regulatory',
            question: 'מי אתה?',
            answer: 'הנדסאי',
            reply: 'יפה.',
          },
        ],
      }),
    );
    expect(msgs).toHaveLength(3); // user, assistant, user(current)
    expect(msgs[0]!.role).toBe('user');
    expect(msgs[1]!.role).toBe('assistant');
    expect(msgs[2]!.role).toBe('user');
    expect(msgs[2]!.content).toContain('תשובת-המועמד');
  });
});

describe('parseLiveTurn', () => {
  const valid = JSON.stringify({
    inspectorReply: 'חצי-נקודה: תפסת את 1954 אבל פספסת את פקודת-הבטיחות 1970.',
    coachingNote: 'בנֵה תשובת-חוק: שם→שנה→מהות.',
    mode: 'מאומת',
    quality: 'partial',
    pointsAwarded: 6,
    advanceStage: false,
    nextInspector: 'technical',
    nextStage: 'branch',
    nextQuestion: 'מנֵה 10 סיכונים.',
    done: false,
    finalReport: null,
  });

  it('מפענח JSON תקין', () => {
    const r = parseLiveTurn(valid);
    expect(r.inspectorReply).toContain('חצי-נקודה');
    expect(r.quality).toBe('partial');
    expect(r.pointsAwarded).toBe(6);
    expect(r.coachingNote).toBeTruthy();
    expect(r.nextStage).toBe('branch');
  });

  it('מסיר code-fences', () => {
    const r = parseLiveTurn('```json\n' + valid + '\n```');
    expect(r.quality).toBe('partial');
  });

  it('מקבע ערכים לא-חוקיים (clamp + enum-narrow)', () => {
    const r = parseLiveTurn(
      JSON.stringify({
        inspectorReply: 'ok',
        mode: 'xxx',
        quality: 'zzz',
        pointsAwarded: 99,
        nextInspector: 'nope',
        nextStage: 'nope',
        done: false,
      }),
    );
    expect(r.pointsAwarded).toBe(10); // clamp 0..10
    expect(r.quality).toBe('partial'); // default
    expect(r.mode).toBe('מוסקנא'); // default
    expect(r.nextInspector).toBe('regulatory'); // default
    expect(r.nextStage).toBeNull();
  });

  it('done=true → finalReport עם בדיוק 3 חיזוקים', () => {
    const r = parseLiveTurn(
      JSON.stringify({
        inspectorReply: 'סיימנו.',
        quality: 'good',
        pointsAwarded: 9,
        done: true,
        finalReport: { score: 82, weaknesses: ['חוק'], strengtheningActions: ['רק אחד'] },
      }),
    );
    expect(r.done).toBe(true);
    expect(r.finalReport?.score).toBe(82);
    expect(r.finalReport?.strengtheningActions).toHaveLength(3);
    expect(r.nextStage).toBeNull();
  });

  it('inspectorReply ריק → LiveParseError', () => {
    expect(() => parseLiveTurn(JSON.stringify({ inspectorReply: '' }))).toThrow(LiveParseError);
  });

  it('לא-JSON → LiveParseError', () => {
    expect(() => parseLiveTurn('לא json בכלל')).toThrow(LiveParseError);
  });
});

describe('deterministicLiveTurn', () => {
  it('מתקדם שלב אחרי turnIndexInStage>=1', () => {
    const r = deterministicLiveTurn(input({ turnIndexInStage: 1, answer: 'תשובה קצרה כללית' }));
    expect(r.source).toBe('deterministic');
    expect(r.advanceStage).toBe(true);
    expect(r.nextStage).toBe('branch');
  });
  it('שלב cruel מסתיים → done + finalReport', () => {
    const r = deterministicLiveTurn(input({ stage: 'cruel', turnIndexInStage: 1 }));
    expect(r.done).toBe(true);
    expect(r.finalReport?.strengtheningActions).toHaveLength(3);
  });
});

describe('deterministicNudge', () => {
  it('לא מתקדם · quality poor · אותו שלב', () => {
    const r = deterministicNudge(input({ answer: 'כן' }));
    expect(r.advanceStage).toBe(false);
    expect(r.quality).toBe('poor');
    expect(r.nextStage).toBe('opening');
    expect(r.done).toBe(false);
  });
});

describe('clampLiveProgress — קאפ-שלב צד-שרת (מונע לולאה-אינסופית)', () => {
  const parsed = (over: Record<string, unknown> = {}) =>
    parseLiveTurn(
      JSON.stringify({
        inspectorReply: 'תגובה',
        quality: 'good',
        advanceStage: false,
        nextStage: 'branch',
        nextQuestion: 'שאלה',
        done: false,
        ...over,
      }),
    );

  it('מתחת-לקאפ + המודל-לא-מתקדם → נשאר בשלב (לא נסיגה אחורה)', () => {
    const r = clampLiveProgress(
      parsed({ advanceStage: false, nextStage: 'opening' }),
      input({ stage: 'branch', turnIndexInStage: 0 }),
    );
    expect(r.advanceStage).toBe(false);
    expect(r.nextStage).toBe('branch'); // לא נסיגה ל-opening
    expect(r.done).toBe(false);
  });

  it('מעל-הקאפ → כפיית-התקדמות לשלב-הבא', () => {
    const r = clampLiveProgress(parsed(), input({ stage: 'branch', turnIndexInStage: 2 }));
    expect(r.advanceStage).toBe(true);
    expect(r.nextStage).toBe('law');
  });

  it('שלב-אחרון (cruel) מעל-הקאפ → כפיית-done + דו"ח', () => {
    const r = clampLiveProgress(parsed(), input({ stage: 'cruel', turnIndexInStage: 2 }));
    expect(r.done).toBe(true);
    expect(r.nextStage).toBeNull();
    expect(r.finalReport).toBeTruthy();
  });

  it('המודל-סיים (done) → מכובד', () => {
    const r = clampLiveProgress(
      parsed({ done: true }),
      input({ stage: 'law', turnIndexInStage: 0 }),
    );
    expect(r.done).toBe(true);
  });
});
