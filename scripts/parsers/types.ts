/**
 * ParsedQuestion — מבנה-המוצא המשותף לכל ה-parsers.
 *
 * sourceId  — שם-הקובץ + מיקום (מחרוזת חופשית, לדוגמה: "file.pdf#q3")
 * type      — mcq_long = MCQ עם שאלה ארוכה (>120 תווים), mcq_short = MCQ קצר, open = פתוח
 * question  — טקסט השאלה (בלי ניקוי/תרגום)
 * options   — מערך האפשרויות לMCQ (4 פריטים בדרך-כלל)
 * correctIndex — אינדקס (0-based) של התשובה הנכונה ב-options
 * correctAnswerText — טקסט התשובה הנכונה (לשאלות פתוחות)
 * rawText   — הטקסט המקורי הגולמי (לוידוא ידני)
 * scopeRefs — קישורי-scope (יוטמע ידנית ב-scope-tag UI) — ברירת-מחדל: []
 */
export type QuestionType = 'mcq_long' | 'mcq_short' | 'open';

export interface ParsedQuestion {
  sourceId: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswerText?: string;
  rawText?: string;
  scopeRefs: string[];
}

export interface ParseResult {
  source: string;
  totalQuestions: number;
  questions: ParsedQuestion[];
}
