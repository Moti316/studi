/**
 * src/lib/ai/prompts/committee-sim/live.ts — שכבת-הפרומפט-והפרסום של הסימולציה-החיה (ADR-018).
 *
 * בונה את ה-system-prompt-החי (פרומפט-מגן `COMMITTEE_SIM_MASTER` + הרחבת-דיאלוג-חי + עיגון),
 * ממיר transcript→messages, ומפענח את ה-JSON-envelope של תגובת-המפקח. כולל **fallback
 * דטרמיניסטי** (בלי-מפתח / כשל-Claude) כדי שהסימולציה תעבוד תמיד. טהור (אפס-IO · אפס-SDK).
 */
import type { CacheableSystem } from '@/lib/ai/claude';
import type { Inspector, SimStageKey } from '@/features/simulation/types';
import type {
  LiveQuality,
  LiveFinalReport,
  RespondLiveInput,
  RespondLiveResult,
} from '@/features/simulation/live-types';
import { COMMITTEE_SIM_MASTER } from './master';
import { packForBranch, formatGrounding } from './grounding';
import { RESPONSE_MODES, type ResponseMode } from './modes';

/** סדר 4 השלבים. */
const STAGE_ORDER: SimStageKey[] = ['opening', 'branch', 'law', 'cruel'];

/** תווית-מפקח לפרומפט/לתמלול. */
const INSPECTOR_LABEL: Record<Inspector, string> = {
  technical: "מפקח א' (טכני)",
  hygiene: "מפקח ב' (גיהותי)",
  regulatory: "מפקח ג' (רגולטורי)",
};

/** תווית-שלב לתמלול. */
const STAGE_LABEL: Record<SimStageKey, string> = {
  opening: 'היכרות',
  branch: 'תרחיש-ענפי',
  law: 'צלילה-לחוק',
  cruel: 'השאלה-האכזרית',
};

/** שאלת-הפתיחה הסטטית (שיח-אישי) — מזריעה את תור-1; Claude משתלט מהתשובה-הראשונה. */
export const OPENING_QUESTION =
  'בוקר טוב, ותודה שבאת. לפני שניכנס לחומר — ספר לנו על עצמך בקצרה: מה הרקע המקצועי שלך, ולמה החלטת ללכת על הסמכת ממונה-בטיחות? ובאיזה תחום אתה מרגיש הכי חזק?';

/** המפקח-הפותח (שלב opening). */
export const OPENING_INSPECTOR: Inspector = 'regulatory';

/** סכמת-ה-JSON שהמודל מחזיר (משובץ ב-system). */
const LIVE_JSON_SCHEMA = `{
  "inspectorReply": "תגובת-המפקח בעברית, בדמות. עשוי לכלול שורות-חדשות ו/או diagram-ASCII. תייג קביעות-משפטיות ב-[מאומת]/[מוסקנא]/[לא ידוע].",
  "coachingNote": "מחרוזת או null — הערת-אימון קצרה מחוץ-לדמות (🦺)",
  "mode": "מאומת | מוסקנא | לא ידוע",
  "quality": "good | partial | poor",
  "pointsAwarded": 0,
  "advanceStage": false,
  "nextInspector": "technical | hygiene | regulatory",
  "nextStage": "opening | branch | law | cruel | null",
  "nextQuestion": "השאלה-הבאה בדמות, או null",
  "done": false,
  "finalReport": null
}`;

function liveExtension(branch: string, grounding: string): string {
  return [
    '',
    '— מצב: סימולציית-וועדה-חיה (דיאלוג-פתוח) —',
    `ענף-התרחיש: ${branch}.`,
    "אתה מנהל דיאלוג-חי מול מועמד יחיד שמקליד תשובות-חופשיות. שלושת-המפקחים מדברים לסירוגין (בכל תור מפקח אחד): א' טכני · ב' גיהותי · ג' רגולטורי.",
    '',
    'מהלך 4 השלבים (התקדם לפי-הסדר):',
    '1. opening (היכרות) — שיח-אישי: מי אתה, רקע, למה ממונה. הגב בחום, ואז "תפוס אותו במילה שלו" → שאלת-חוק הוגנת.',
    '2. branch (תרחיש-ענפי) — הצב אותו כממונה בתרחיש-הענף; בקש מיפוי-סיכונים/בקרות לפי-חומרה.',
    '3. law (צלילה-לחוק) — "מה אומר החוק? איזו תקנה מסמיכה?" — דרוש שם + שנה + מהות.',
    '4. cruel (השאלה-האכזרית) — שאלה סוקרטית בלתי-צפויה (שיקול-דעת תחת-לחץ). אחרי שלב-זה → done.',
    '',
    'הערכת-תשובה (לכל תור):',
    '- העריך לפי **משמעות**, לא מילה-במילה (נרדפים: "נעילה ותיוג"=LOTO · "ציוד-מגן"=צמ"א).',
    '- **partial-credit**: על תשובה חצי-נכונה אמור "חצי-נקודה" — נקוב במה שנכון, ואז תקן בתקיפות את החסר.',
    '- לַמֵּד: כשפוספס יסוד — הסבר (מותר diagram-ASCII קצר, למשל היררכיית חקיקה-ראשית↔תקנות-נגזרות).',
    '- כנות > בלוף: "לא בטוח" כן → תגמל; בילוף → הצבע עליו.',
    '- ציטוט-חוק: השתמש **רק** בעיגון-שסופק (שם + שנה). אל תמציא מספרי-סעיף. אם אינך בטוח → [לא ידוע]. ת"י ≠ סמכות.',
    '- coachingNote: מדי-פעם הערת-אימון קצרה (למשל "בנֵה תשובת-חוק: שם→שנה→מה-עושה-בפועל; מותר \'לא בטוח בשנה אבל המהות X\'").',
    '',
    'ניקוד: pointsAwarded 0-10 פר-תור (good≈8-10 · partial≈4-7 · poor≈0-3). בדרך-כלל 1-2 תורים פר-שלב; advanceStage=true כשהשלב מוצה; nextInspector מתחלף.',
    'בתום שלב cruel: done=true + finalReport { score 0-100 משוקלל (ידע-בחוק 25 · יישום 25 · תקשורת 20 · חשיבה-מערכתית 15 · אנטי-הזיה 15) · weaknesses · **בדיוק 3** strengtheningActions }.',
    '',
    'עיגון-החקיקה לענף (השתמש בו · שם + שנה בלבד):',
    grounding,
    '',
    'החזר **JSON תקין יחיד בלבד** (ללא טקסט נוסף · ללא code-fences) במבנה:',
    LIVE_JSON_SCHEMA,
  ].join('\n');
}

/**
 * ה-system-prompt-החי, ניתן-לקאשינג (הוא קבוע לאורך הסשן → ~90% הנחה על ה-input-החוזר).
 * = פרומפט-מגן (reuse · לא-fork) + הרחבת-דיאלוג-חי + חבילת-העיגון לענף.
 */
export function buildLiveSystemPrompt(branch: string): CacheableSystem {
  const grounding = formatGrounding(packForBranch(branch));
  return { text: `${COMMITTEE_SIM_MASTER}\n${liveExtension(branch, grounding)}`, cache: true };
}

/** הודעת-שיח (תואם-מבנה ל-Anthropic.MessageParam — content כמחרוזת). */
export interface ConverseMessage {
  role: 'user' | 'assistant';
  content: string;
}

function turnUserText(
  stage: SimStageKey,
  inspector: Inspector,
  question: string,
  answer: string,
): string {
  return `[שלב: ${STAGE_LABEL[stage]} · ${INSPECTOR_LABEL[inspector]}]\nשאלה: ${question}\nתשובת-המועמד: ${answer}`;
}

/** ממיר את התמלול + התור-הנוכחי ל-message-history (user/assistant לסירוגין). */
export function transcriptToMessages(input: RespondLiveInput): ConverseMessage[] {
  const msgs: ConverseMessage[] = [];
  for (const t of input.transcript) {
    msgs.push({ role: 'user', content: turnUserText(t.stage, t.inspector, t.question, t.answer) });
    if (t.reply) msgs.push({ role: 'assistant', content: t.reply });
  }
  msgs.push({
    role: 'user',
    content: turnUserText(input.stage, input.currentInspector, input.currentQuestion, input.answer),
  });
  return msgs;
}

/** תשובה ריקה/קצרה-מאוד → דלג-Claude (אפס-קריאה · nudge דטרמיניסטי). */
export function isTooShortToGrade(answer: string): boolean {
  const words = (answer ?? '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  return words.length < 3;
}

export class LiveParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiveParseError';
  }
}

function stripFences(s: string): string {
  return s
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const QUALITIES: LiveQuality[] = ['good', 'partial', 'poor'];
const INSPECTORS: Inspector[] = ['technical', 'hygiene', 'regulatory'];

/** מבטיח בדיוק 3 פעולות-חיזוק (ריפוד/קיצוץ). */
function normalizeThree(arr: unknown): string[] {
  const list = Array.isArray(arr) ? arr.map((x) => String(x)).filter(Boolean) : [];
  const fillers = [
    'חזק את שליטתך בשמות-החוקים והשנים העבריות.',
    'תרגל בניית-תשובה לפי מדרג-הבקרות (צמ"א אחרון).',
    'התאמן בקישור תרחיש-שטח לתקנה-המסמיכה.',
  ];
  let i = 0;
  while (list.length < 3) list.push(fillers[i++ % fillers.length]!);
  return list.slice(0, 3);
}

/**
 * מפענח את ה-JSON-envelope של תגובת-המפקח. מסיר-fences, מאמת/מקבע (clamp · enum-narrow ·
 * 3-חיזוקים), וזורק `LiveParseError` רק על מבנה בלתי-ניתן-לשחזור (→ הקורא נופל ל-fallback).
 */
export function parseLiveTurn(raw: string): Omit<RespondLiveResult, 'source'> {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(stripFences(raw)) as Record<string, unknown>;
  } catch (e) {
    throw new LiveParseError(`JSON לא-תקין: ${e instanceof Error ? e.message : String(e)}`);
  }

  const reply = String(obj.inspectorReply ?? '').trim();
  if (!reply) throw new LiveParseError('inspectorReply ריק');

  const quality = QUALITIES.includes(obj.quality as LiveQuality)
    ? (obj.quality as LiveQuality)
    : 'partial';
  const mode = (RESPONSE_MODES as readonly string[]).includes(obj.mode as string)
    ? (obj.mode as ResponseMode)
    : 'מוסקנא';
  const nextInspector = INSPECTORS.includes(obj.nextInspector as Inspector)
    ? (obj.nextInspector as Inspector)
    : 'regulatory';
  const nextStageRaw = STAGE_ORDER.includes(obj.nextStage as SimStageKey)
    ? (obj.nextStage as SimStageKey)
    : null;
  const done = obj.done === true;

  let finalReport: LiveFinalReport | undefined;
  const f = obj.finalReport as Record<string, unknown> | null | undefined;
  if (f && typeof f === 'object') {
    finalReport = {
      score: clamp(Math.round(Number(f.score) || 0), 0, 100),
      weaknesses: Array.isArray(f.weaknesses) ? f.weaknesses.map((x) => String(x)) : [],
      strengtheningActions: normalizeThree(f.strengtheningActions),
    };
  }

  return {
    inspectorReply: reply,
    coachingNote: obj.coachingNote ? String(obj.coachingNote) : undefined,
    mode,
    quality,
    pointsAwarded: clamp(Math.round(Number(obj.pointsAwarded) || 0), 0, 10),
    advanceStage: obj.advanceStage === true,
    nextInspector,
    nextStage: done ? null : nextStageRaw,
    nextQuestion: done ? null : obj.nextQuestion ? String(obj.nextQuestion) : null,
    done,
    finalReport: done ? (finalReport ?? deterministicReportFromScore(60)) : undefined,
  };
}

/** קאפ-קשיח על אורך-שלב (גם במסלול-Claude) — מונע לולאה-אינסופית/עלות-מתפרצת. */
const MAX_TURNS_PER_STAGE = 3;

/**
 * מכפיף את החלטת-המודל להתקדמות-מונוטונית-קדימה (ADR-018 · תיקון-סקירה 2026-06-10):
 * המסלול-החי סמך 100% על המודל לקבוע advanceStage/done → Haiku בדיאלוג-עברי-ארוך עלול
 * לא-לסיים-לעולם (תקיעה בשלב · transcript-גדל · עלות). כאן אוכפים: אחרי MAX_TURNS_PER_STAGE
 * תורים בשלב — כפיית-התקדמות; בשלב-האחרון (cruel) — כפיית-done + דו"ח. לעולם לא נסיגה-לשלב-קודם.
 */
export function clampLiveProgress(
  p: Omit<RespondLiveResult, 'source'>,
  input: RespondLiveInput,
): Omit<RespondLiveResult, 'source'> {
  if (p.done) return p; // המודל סיים — מכבדים.
  const overCap = input.turnIndexInStage >= MAX_TURNS_PER_STAGE - 1;
  const advance = p.advanceStage || overCap;
  if (!advance) {
    // נשאר בשלב — אך לעולם לא נסיגה: ה-nextStage חייב להיות השלב-הנוכחי.
    return { ...p, advanceStage: false, nextStage: input.stage };
  }
  const next = nextStageOf(input.stage);
  if (next === null) {
    // שלב-אחרון (cruel) → סיום-כפוי + דו"ח (אם המודל לא סיפק).
    return {
      ...p,
      advanceStage: true,
      done: true,
      nextStage: null,
      nextQuestion: null,
      finalReport: p.finalReport ?? deterministicReportFromScore(60),
    };
  }
  return { ...p, advanceStage: true, nextStage: next };
}

/* ───────────────────────── fallback דטרמיניסטי (בלי-מפתח / כשל-Claude) ───────────────────────── */

const STAGE_QUESTION: Record<SimStageKey, string> = {
  opening: OPENING_QUESTION,
  branch:
    'עכשיו לשטח: אתה הממונה החדש בתרחיש שתואר. מנֵה את הסיכונים המרכזיים שאתה רואה — מהחמור לקל — ולכל אחד בקרה אחת.',
  law: 'בוא נעגן בחוק: איזו תקנה/חוק מסמיך את הבקרה המרכזית כאן? נקוב בשם, בשנה, ובמה היא דורשת.',
  cruel:
    'שאלה אחרונה, קשה: ההנהלה דוחה את ההמלצה שלך בטענת-תקציב, ומחר מתחילה העבודה. מה אתה עושה — צעד-אחר-צעד?',
};

const STAGE_INSPECTOR: Record<SimStageKey, Inspector> = {
  opening: 'regulatory',
  branch: 'technical',
  law: 'regulatory',
  cruel: 'hygiene',
};

function nextStageOf(stage: SimStageKey): SimStageKey | null {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1]! : null;
}

function gradeByEffort(answer: string): { quality: LiveQuality; points: number } {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 25) return { quality: 'good', points: 8 };
  if (words.length >= 10) return { quality: 'partial', points: 5 };
  return { quality: 'poor', points: 2 };
}

function deterministicReply(stage: SimStageKey, quality: LiveQuality): string {
  const ack =
    quality === 'good'
      ? 'תשובה מסודרת — ניכר שחשבת על זה.'
      : quality === 'partial'
        ? 'חצי-נקודה: יש כאן בסיס נכון, אבל חסר עומק וביסוס-חוקי.'
        : 'התשובה כללית מדי. הוועדה מחפשת מבנה ועיגון, לא רושם כללי.';
  const tip =
    stage === 'law'
      ? ' זכור: שם-החוק → השנה העברית → מה הוא דורש בפועל.'
      : stage === 'branch'
        ? ' מפֵּה לפי חומרה, מהגבוה לנמוך, ושלב בקרה לכל סיכון.'
        : '';
  return `${ack}${tip} (הערכה דטרמיניסטית — ללא מפתח-Claude.)`;
}

function deterministicReportFromScore(score: number): LiveFinalReport {
  return {
    score,
    weaknesses: ['ביסוס-חוקי (שם+שנה+סעיף)', 'מבנה-תשובה שיטתי'],
    strengtheningActions: normalizeThree([]),
  };
}

function deterministicReport(input: RespondLiveInput, lastPoints: number): LiveFinalReport {
  const pts = [...input.transcript.map((t) => t.pointsAwarded ?? 0), lastPoints];
  const avg = pts.length ? pts.reduce((s, p) => s + p, 0) / pts.length : 5;
  const score = clamp(Math.round(avg * 10), 0, 100);
  const weak = input.transcript
    .filter((t) => (t.quality ?? 'partial') !== 'good')
    .map((t) => `${STAGE_LABEL[t.stage]}: חיזוק נדרש`);
  return {
    score,
    weaknesses: weak.length ? [...new Set(weak)] : ['ביסוס-חוקי', 'מבנה-תשובה'],
    strengtheningActions: normalizeThree([]),
  };
}

/** תור-מפקח דטרמיניסטי (בלי-Claude): מעריך לפי-מאמץ, מתקדם לפי turnIndexInStage. */
export function deterministicLiveTurn(input: RespondLiveInput): RespondLiveResult {
  const { quality, points } = gradeByEffort(input.answer);
  const advance = input.turnIndexInStage >= 1 || quality === 'good';
  const ns = advance ? nextStageOf(input.stage) : input.stage;
  const done = advance && ns === null;
  const reply = deterministicReply(input.stage, quality);

  if (done) {
    return {
      inspectorReply: reply,
      mode: 'מוסקנא',
      quality,
      pointsAwarded: points,
      advanceStage: true,
      nextInspector: 'regulatory',
      nextStage: null,
      nextQuestion: null,
      done: true,
      finalReport: deterministicReport(input, points),
      source: 'deterministic',
    };
  }

  const nextStage = ns ?? input.stage;
  return {
    inspectorReply: reply,
    mode: 'מוסקנא',
    quality,
    pointsAwarded: points,
    advanceStage: advance,
    nextInspector: STAGE_INSPECTOR[nextStage],
    nextStage,
    nextQuestion: advance
      ? STAGE_QUESTION[nextStage]
      : 'הרחב — תן לי פרטים קונקרטיים יותר, ושלב הפניה-לחוק אם אתה יכול.',
    done: false,
    source: 'deterministic',
  };
}

/** תשובה ריקה/קצרה-מאוד → nudge בלי-קריאה (לא מתקדם). */
export function deterministicNudge(input: RespondLiveInput): RespondLiveResult {
  return {
    inspectorReply:
      'ענה בבקשה בתשובה מלאה — משפט-שניים לפחות. בוועדה אמיתית תשובה-בחצי-מילה נקראת כחוסר-ביטחון. נסה שוב.',
    mode: 'לא ידוע',
    quality: 'poor',
    pointsAwarded: 0,
    advanceStage: false,
    nextInspector: input.currentInspector,
    nextStage: input.stage,
    nextQuestion: input.currentQuestion,
    done: false,
    source: 'deterministic',
  };
}
