/**
 * src/features/simulation/live-engine.ts — reducer צד-לקוח ל-LiveEngine (ADR-018).
 *
 * מחזיק את ה-transcript ואת התור-הנוכחי, בונה את קלט-ה-action, ומחיל את תוצאתו (מוסיף
 * את התור-שהוערך, מגדיר את התור/השלב-הבא, או חותם בדו"ח-סיום). **טהור** (אפס-רשת) —
 * הרכיב מזריק את ה-action; בר-בדיקה במוק-action.
 */
import type { Inspector, SimStageKey } from './types';
import type {
  LiveTranscriptTurn,
  RespondLiveResult,
  RespondLiveInput,
  LiveFinalReport,
} from './live-types';
import { OPENING_QUESTION, OPENING_INSPECTOR } from '@/lib/ai/prompts/committee-sim/live';

/** מצב-הסימולציה-החיה (state של הרכיב). */
export interface LiveState {
  branch: string;
  stage: SimStageKey;
  inspector: Inspector;
  question: string;
  /** אינדקס-התור בתוך השלב (0-based) — לקאפ-שלב. */
  turnIndexInStage: number;
  transcript: LiveTranscriptTurn[];
  result: LiveFinalReport | null;
  done: boolean;
}

/** מצב-התחלתי: שלב-היכרות, שאלת-פתיחה סטטית. */
export function initLiveState(branch: string): LiveState {
  return {
    branch,
    stage: 'opening',
    inspector: OPENING_INSPECTOR,
    question: OPENING_QUESTION,
    turnIndexInStage: 0,
    transcript: [],
    result: null,
    done: false,
  };
}

/** בונה את קלט-ה-action מהמצב + תשובת-המועמד. */
export function toInput(state: LiveState, answer: string): RespondLiveInput {
  return {
    branch: state.branch,
    stage: state.stage,
    currentQuestion: state.question,
    currentInspector: state.inspector,
    answer,
    transcript: state.transcript,
    turnIndexInStage: state.turnIndexInStage,
  };
}

/** מחיל תוצאת-action: מוסיף את התור-שהוערך, ומגדיר את התור-הבא או חותם. */
export function applyResult(state: LiveState, answer: string, res: RespondLiveResult): LiveState {
  const answeredTurn: LiveTranscriptTurn = {
    stage: state.stage,
    inspector: state.inspector,
    question: state.question,
    answer,
    reply: res.inspectorReply,
    coaching: res.coachingNote,
    mode: res.mode,
    quality: res.quality,
    pointsAwarded: res.pointsAwarded,
  };
  const transcript = [...state.transcript, answeredTurn];

  if (res.done) {
    return { ...state, transcript, done: true, result: res.finalReport ?? null, question: '' };
  }

  const nextStage = res.nextStage ?? state.stage;
  const turnIndexInStage = res.advanceStage ? 0 : state.turnIndexInStage + 1;
  return {
    ...state,
    transcript,
    stage: nextStage,
    inspector: res.nextInspector,
    question: res.nextQuestion ?? state.question,
    turnIndexInStage,
    done: false,
  };
}

/** ציון-רץ (0-100) מהתורים-שהוערכו — ממוצע-נקודות × 10. */
export function runningScore(transcript: LiveTranscriptTurn[]): number {
  const pts = transcript.map((t) => t.pointsAwarded ?? 0);
  if (!pts.length) return 0;
  return Math.round((pts.reduce((s, p) => s + p, 0) / pts.length) * 10);
}
