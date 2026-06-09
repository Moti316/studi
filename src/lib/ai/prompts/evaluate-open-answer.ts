/**
 * src/lib/ai/prompts/evaluate-open-answer.ts — הערכה-סמנטית חיה לשו"ת-פתוח (ADR-017).
 *
 * ⚠️ SERVER-ONLY (נוגע ב-Claude). מעריך אם תשובת-המועמד **קשורה במשמעות** לתשובת-
 * המודל — לא מילה-במילה (מזהה נרדפים: "נעילה ותיוג"="LOTO"). מנוע: Claude (Haiku · זול).
 * **fallback דטרמיניסטי** (keyword-match) כשאין מפתח → התנהגות-זהה-לקודם, אפס-שבירה.
 */
import { claudeGenerateJSON, isClaudeConfigured } from '@/lib/ai/claude';
import { gradeOpenAnswer, type OpenGrade } from '@/lib/grading/keyword-match';

export interface SmartGradeResult {
  grade: OpenGrade;
  /** האם התשובה רלוונטית/קשורה לעיקר. */
  relevant: boolean;
  /** משוב-מכוון קצר (Claude בלבד; ריק ב-fallback). */
  feedback: string;
  /** מושגי-מפתח שכוסו / הוחמצו (ל"ראה את הקשר"). */
  matchedWords: string[];
  missedWords: string[];
  source: 'claude' | 'deterministic';
}

const SYSTEM = [
  'אתה בוחן-וועדה של קורס "ממונה בטיחות בעבודה" (עברית · ישראל) המעריך תשובת-מועמד פתוחה.',
  'הערך לפי **משמעות וקשר**, לא מילה-במילה: זהה מונחים-נרדפים וקיצורים ("נעילה ותיוג"="LOTO" · "ציוד-מגן"="צמ"א").',
  'היה הוגן ומעודד; משוב קצר, ענייני ומכוון-לשיפור.',
].join('\n');

/**
 * מעריך תשובת-מועמד מול תשובת-המודל. Claude אם מוגדר; אחרת keyword-match.
 * לעולם לא זורק — כשל-Claude → fallback דטרמיניסטי.
 */
export async function gradeOpenAnswerSmart(
  userAnswer: string,
  modelAnswer: string,
  prompt: string,
): Promise<SmartGradeResult> {
  if (isClaudeConfigured() && userAnswer.trim().length > 0) {
    try {
      const res = await claudeGenerateJSON<{
        grade: OpenGrade;
        relevant: boolean;
        feedback: string;
        covered: string[];
        missed: string[];
      }>({
        system: SYSTEM,
        prompt: [
          `שאלה: ${prompt}`,
          `תשובת-המודל (הרֵפֵרֶנס): ${modelAnswer}`,
          `תשובת-המועמד: ${userAnswer}`,
          'הערך: האם המועמד נגע בעיקר? החזר JSON:',
          '{"grade":"correct"|"partial"|"incorrect","relevant":boolean,"feedback":"משוב קצר בעברית","covered":["מושגים שכיסה"],"missed":["מושגים שהחמיץ"]}',
        ].join('\n'),
      });
      return {
        grade: res.grade,
        relevant: res.relevant === true,
        feedback: String(res.feedback ?? ''),
        matchedWords: Array.isArray(res.covered) ? res.covered.map(String) : [],
        missedWords: Array.isArray(res.missed) ? res.missed.map(String) : [],
        source: 'claude',
      };
    } catch {
      /* כשל-Claude → fallback */
    }
  }
  const d = gradeOpenAnswer(userAnswer, modelAnswer);
  return {
    grade: d.grade,
    relevant: d.grade !== 'incorrect',
    feedback: '',
    matchedWords: d.matchedWords,
    missedWords: d.missedWords,
    source: 'deterministic',
  };
}
