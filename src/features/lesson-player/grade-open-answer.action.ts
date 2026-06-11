'use server';

/**
 * Server Action — הערכת תשובת-שו"ת-פתוח (ADR-017). קורא ל-Claude (אם מוגדר מפתח)
 * להערכה-סמנטית, אחרת fallback דטרמיניסטי. נקרא מ-<ExplanationCard> (client).
 *
 * ⚠️ **שער-auth (cost-abuse · BUGS#system-bug-hunt-2026-06-11 · #1 HIGH):** משתמש-לא-מחובר →
 *    מסלול keyword-match דטרמיניסטי (אפס-Claude · אפס-עלות). Server Actions הם endpoints-עצמאיים
 *    (POST · header next-action) הנגישים גם ללא טעינת-הדף → בלי שער זה היה cost-abuse + LLM-relay
 *    פתוח (3 השדות נשלטי-תוקף). מקביל ל-respond-live/evaluate-capstone/generate-*.
 */
import {
  gradeOpenAnswerSmart,
  deterministicSmartGrade,
  type SmartGradeResult,
} from '@/lib/ai/prompts/evaluate-open-answer';
import { getUser } from '@/lib/auth/server';

export async function gradeOpenAnswerAction(input: {
  userAnswer: string;
  modelAnswer: string;
  prompt: string;
}): Promise<SmartGradeResult> {
  // שער-auth: חוסם קריאת-Claude-בתשלום ממשתמש-לא-מחובר (cost-abuse + LLM-relay).
  const user = await getUser();
  if (!user) return deterministicSmartGrade(input.userAnswer, input.modelAnswer);

  return gradeOpenAnswerSmart(input.userAnswer, input.modelAnswer, input.prompt);
}
