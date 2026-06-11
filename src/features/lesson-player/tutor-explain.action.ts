'use server';

/**
 * src/features/lesson-player/tutor-explain.action.ts — Server Action ל-"מורה-AI" (בלוק-4).
 *
 * מורה-פרטי על תשובות-השיעור: הלומד שואל שאלת-המשך חופשית על שאלה, והמורה מסביר
 * בבהירות מבוסס על ההקשר-שסופק (שאלה + תשובה-נכונה) + ידע-הבטיחות התעסוקתי.
 *
 * דפוס זהה ל-grade-open-answer / deep-explanation:
 *   - auth-gate (getUser) — נתיב-Claude-בתשלום → fallback למשתמש-לא-מחובר (cost-abuse).
 *   - Claude מוגדר → claudeGenerateText עם **author-model** (Sonnet · איכות-הוראה) + system-מורה.
 *   - אחרת / כשל → fallback דטרמיניסטי. **לעולם לא זורק.**
 *
 * הלוגיקה-הטהורה (system/prompt/fallback) ב-tutor-prompt.ts (testable · ללא-IO).
 *
 * @see ./tutor-prompt.ts · src/lib/ai/claude.ts (claudeGenerateText · defaultAuthorModel)
 */

import { isClaudeConfigured, claudeGenerateText, defaultAuthorModel } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth/server';
import {
  SYSTEM_TUTOR,
  buildTutorPrompt,
  tutorFallback,
  type TutorRequest,
  type TutorResponse,
} from './tutor-prompt';

export type { TutorRequest, TutorResponse };

/**
 * askTutorAction — מחזיר הסבר-מורה לשאלת-הלומד. לעולם לא זורק.
 *
 * @param req TutorRequest — הקשר-השאלה + שאלת-הלומד.
 * @returns   TutorResponse (source: 'claude' | 'fallback').
 */
export async function askTutorAction(req: TutorRequest): Promise<TutorResponse> {
  if (!req.userQuestion?.trim()) {
    return { answer: 'מה תרצה לשאול על השאלה הזו? כתוב את מה שלא התברר.', source: 'fallback' };
  }

  // auth: חוסם קריאת-Claude-בתשלום ממשתמש-לא-מחובר (cost-abuse · BUGS#system-bug-hunt).
  const user = await getUser();
  if (!user) return tutorFallback(req);

  if (isClaudeConfigured()) {
    try {
      const answer = await claudeGenerateText({
        system: SYSTEM_TUTOR,
        prompt: buildTutorPrompt(req),
        model: defaultAuthorModel(), // Sonnet — איכות-הוראה (ראה claude-author-vs-eval-model)
        maxTokens: 1200,
      });
      const trimmed = answer.trim();
      if (!trimmed) return tutorFallback(req);
      return { answer: trimmed, source: 'claude' };
    } catch (err) {
      console.error(
        '[askTutorAction] Claude failed — falling back:',
        err instanceof Error ? err.message : String(err),
      );
      return tutorFallback(req);
    }
  }

  return tutorFallback(req);
}
