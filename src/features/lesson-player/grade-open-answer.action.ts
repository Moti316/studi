'use server';

/**
 * Server Action — הערכת תשובת-שו"ת-פתוח (ADR-017). קורא ל-Claude (אם מוגדר מפתח)
 * להערכה-סמנטית, אחרת fallback דטרמיניסטי. נקרא מ-<ExplanationCard> (client).
 */
import { gradeOpenAnswerSmart, type SmartGradeResult } from '@/lib/ai/prompts/evaluate-open-answer';

export async function gradeOpenAnswerAction(input: {
  userAnswer: string;
  modelAnswer: string;
  prompt: string;
}): Promise<SmartGradeResult> {
  return gradeOpenAnswerSmart(input.userAnswer, input.modelAnswer, input.prompt);
}
