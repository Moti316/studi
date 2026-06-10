/**
 * src/features/simulation/live-types.ts — מודל-הנתונים של ה-LiveEngine (ADR-018).
 *
 * סימולציה-פתוחה-חיה: כל תור-מפקח = תשובה-חופשית של המועמד → server-action → Claude
 * (פרומפט-מגן) מעריך ומגיב **כמפקח**, ומחזיר משוב + ציון-פר-תור + התור-הבא, עד דו"ח-סיום
 * (0-100 + חולשות + 3 חיזוקים). מקביל ל-`PrebakedEngine` (בחירה-סגורה) — אותו דומיין, transport-חי.
 *
 * טהור (types בלבד · אפס-IO). reuse: `Inspector`/`SimStageKey` (types.ts) · `ResponseMode` (modes.ts).
 */
import type { Inspector, SimStageKey } from './types';
import type { ResponseMode } from '@/lib/ai/prompts/committee-sim/modes';

/** איכות-תשובה לתור בודד (קובעת ניקוד + סיווג-חולשה). */
export type LiveQuality = 'good' | 'partial' | 'poor';

/** תור בודד בתמלול-השיח (נשמר בצד-הלקוח · נשלח חזרה לשרת בכל קריאה — stateless). */
export interface LiveTranscriptTurn {
  stage: SimStageKey;
  inspector: Inspector;
  /** שאלת/אתגר-המפקח. */
  question: string;
  /** תשובת-המועמד החופשית. */
  answer: string;
  /** תגובת-המפקח (אחרי הערכה) — קיים בתורים-שהוערכו. */
  reply?: string;
  /** הערת-אימון מחוץ-לדמות (🦺) — אופציונלי. */
  coaching?: string;
  mode?: ResponseMode;
  quality?: LiveQuality;
  pointsAwarded?: number;
}

/** דו"ח-סיום בתום-הסימולציה (אחרי השלב האכזרי). */
export interface LiveFinalReport {
  /** ציון 0-100. */
  score: number;
  weaknesses: string[];
  /** בדיוק 3 פעולות-חיזוק. */
  strengtheningActions: string[];
}

/** קלט ל-server-action: התור-הנוכחי + כל התמלול-עד-כה (stateless · המראה-API). */
export interface RespondLiveInput {
  /** ענף-הסימולציה (קובע את חבילת-העיגון). */
  branch: string;
  stage: SimStageKey;
  currentQuestion: string;
  currentInspector: Inspector;
  /** תשובת-המועמד לתור-הנוכחי. */
  answer: string;
  /** התמלול עד-כה (לא כולל את התור-הנוכחי). */
  transcript: LiveTranscriptTurn[];
  /** אינדקס-התור בתוך השלב הנוכחי (0-based) — לקאפ-קשיח על אורך-שלב. */
  turnIndexInStage: number;
}

/** פלט ה-server-action: תגובת-המפקח + meta-להמשך. */
export interface RespondLiveResult {
  /** תגובת-המפקח בדמות (עברית · עשירה · עשוי לכלול diagram-ASCII). */
  inspectorReply: string;
  coachingNote?: string;
  mode: ResponseMode;
  quality: LiveQuality;
  pointsAwarded: number;
  /** האם להתקדם לשלב-הבא. */
  advanceStage: boolean;
  nextInspector: Inspector;
  /** השלב-הבא, או null בסיום. */
  nextStage: SimStageKey | null;
  /** השאלה-הבאה, או null בסיום. */
  nextQuestion: string | null;
  done: boolean;
  finalReport?: LiveFinalReport;
  /** מקור-ההערכה: Claude חי או fallback דטרמיניסטי. */
  source: 'claude' | 'deterministic';
}
