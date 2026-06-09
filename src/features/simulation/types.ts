/**
 * src/features/simulation/types.ts — מודל-הנתונים של סימולציית-וועדת-ההסמכה.
 *
 * מבוסס על מתודולוגיית-הוועדה (committee-sim · ADR-009): 3 מפקחים (טכני/גיהותי/
 * רגולטורי), 4 שלבים (היכרות → תרחיש-ענפי → צלילה-לחוק → השאלה-האכזרית), וציון 0-100.
 *
 * **פרה-בנוי-מסועף (hybrid · שלב-1):** הדיאלוג מחובר-מראש OFFLINE (Claude+פרומפט-מגן+
 * NotebookLM · אפס-Gemini · אפס-runtime). כל תור = שאלת-מפקח + 2-4 בחירות-מועמד, כל
 * בחירה עם משוב-מפקח, ניקוד ועיגון-חקיקה. שכבת-ה-engine (engine.ts) מפשטת את ה-
 * transport כך שבעתיד אפשר להחליף ל-LiveEngine (Claude-API · דיאלוג-חופשי) בלי שינוי-UI.
 *
 * טהור (types בלבד · ללא IO).
 */

/** שלוש נקודות-המבט של הוועדה (כל מפקח = זווית-בחינה). */
export type Inspector = 'technical' | 'hygiene' | 'regulatory';

/** ארבעת שלבי-הסימולציה (מתודולוגיית-מגן · סעיף 12). */
export type SimStageKey = 'opening' | 'branch' | 'law' | 'cruel';

/** איכות-תשובה (קובעת ניקוד + משוב + סיווג-חולשה). */
export type AnswerQuality = 'good' | 'partial' | 'poor';

/** בחירת-מועמד אפשרית לתור, עם משוב-המפקח והניקוד. */
export interface SimOption {
  text: string;
  quality: AnswerQuality;
  /** ניקוד-תרומה (0..n) — נסכם לציון-הסופי. */
  points: number;
  /** תגובת-המפקח לבחירה (מאשר/מתקן/דוחק). */
  feedback: string;
  /** עיגון-חקיקה לבחירה-הנכונה (תקנה+סעיף · מ-NotebookLM/G3). */
  citation?: string;
}

/** תור בודד: מפקח שואל, מועמד בוחר. */
export interface SimTurn {
  id: string;
  inspector: Inspector;
  /** השאלה/האתגר של המפקח. */
  prompt: string;
  /** 2-4 בחירות-מועמד (לפחות אחת good). */
  options: SimOption[];
}

/** שלב (אוסף תורים תחת אותה מטרה). */
export interface SimStage {
  key: SimStageKey;
  title: string;
  turns: SimTurn[];
}

/** קריטריון-ציון משוקלל (סכום-המשקלים ≈ 100). */
export interface SimScoringCriterion {
  /** ידע-בחוק · יישום-מעשי · תקשורת · חשיבה-מערכתית · אנטי-הזיה. */
  name: string;
  weight: number;
}

/** סימולציה שלמה (תוצר-החיבור · פרה-בנוי). */
export interface Simulation {
  title: string;
  /** ענף (מסגריה/בנייה/חשמל/חומ"ס/הרמה/גובה/כללי). */
  branch: string;
  /** סצנת-הפתיחה ("אתה ממונה בטיחות ב..."). */
  intro: string;
  scopeRefs: { id: string; confidence: number }[];
  stages: SimStage[];
  scoringCriteria: SimScoringCriterion[];
  /** ציון-מרבי (100). */
  maxScore: number;
}

/** —— שכבת-Engine (transport-abstraction · פרה-בנוי↔חי) —— */

/** תוצאת-תגובה לבחירת-מועמד. */
export interface SimResponse {
  feedback: string;
  citation?: string;
  pointsAwarded: number;
  /** התור-הבא, או null בסיום-הסימולציה. */
  nextTurn: SimTurn | null;
  done: boolean;
}

/** ציון-סיכום בתום-הסימולציה. */
export interface SimResult {
  score: number;
  weaknesses: string[];
  perCriterion: { name: string; score: number }[];
}

/**
 * חוזה-engine שה-UI צורך — אגנוסטי ל-transport.
 * PrebakedEngine (שלב-1 · עץ-מחובר-מראש) · LiveEngine (עתיד · Claude-API).
 */
export interface SimulationEngine {
  /** התור-הראשון. */
  start(): SimTurn;
  /** מגיב לבחירה ומחזיר משוב + התור-הבא. */
  respond(turnId: string, optionIndex: number): SimResponse;
  /** ציון-סיום (אחרי done). */
  result(): SimResult;
}
