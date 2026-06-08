/**
 * src/lib/notebooklm/request.ts — בניית prompt עברי ל-NotebookLM להרחבת תרחישים.
 *
 * אין תלות בצד-לקוח ואין קריאות-IO — פונקציה טהורה לחלוטין.
 * השימוש: CLI `scripts/notebooklm/build-request.ts` → כותב ל-`.cache/notebooklm/requests/`.
 *
 * עיקרון מרכזי: NotebookLM אינה API עם responseSchema — לכן החוזה מוטמע בתוך
 * ה-prompt עצמו כ-prose + דוגמה-עובדת אחת. הפלט ממשיך לעבור את שערי
 * verify-grounding (G1–G5) לפני כתיבה ל-DB.
 *
 * @module notebooklm/request
 */

import { matchScopeKeywords } from '@/lib/import/scope-tagger';

/** קלט לתרחיש-בודד. תואם לשדות-הרלוונטיים ב-`NewScenario` (ללא PII). */
export interface ScenarioRequestItem {
  title: string;
  background: string;
  task: string;
  /** solution הנוכחי (Markdown) — לרמז לנקודת-המוצא, לא להעתיק. */
  solution: string;
}

/**
 * הטקסט הקבוע של ה-system-layer (מוטמע ראשון ב-prompt).
 * מיוצא ל-reuse (טסטים, לוג, debug).
 */
export const SCENARIO_EXPANSION_SYSTEM = [
  'אתה מומחה לדיני בטיחות בעבודה בישראל ולהסמכת "ממונה בטיחות בעבודה".',
  'משימתך: **להרחיב** כל תרחיש לפתרון מלא ועשיר בשלושה חלקים — הפרט, הוסף, העמק (אל תקצר).',
  '',
  '⚠️ **העדיפות-העליונה (חשובה מההרחבה עצמה): היצמדות-להיבט-החוקי.** התשובה חייבת',
  'להיצמד לחוקים ולתקנות הספציפיים, **כולל ציון-סעיף מדויק**. הרחבה ללא עיגון-חוקי-עם-סעיף',
  'אינה מספקת ותידחה. תחילה בסס את הגיבוי-החוקי (חוק→תקנה→סעיף), ורק אז הרחב סביבו.',
  '',
  'כללים מחייבים (אנטי-הזיה):',
  '- בסס את פתרונותיך **אך-ורק** על מסמכי-המחברת (חקיקה, תקנות, גיליונות-בטיחות).',
  '- אל תמציא תקנות, סעיפים או מספרים שאינם במסמכי-המחברת.',
  '- כל ציטוט בחלק "גיבוי חוקי" חייב להיות **מילולי לחלוטין מנוסח-החקיקה** — לא פרפרזה.',
  '- **`section` חובה בכל ציטוט-גיבוי-חוקי** — התקנה/הסעיף הספציפי המסמיך (למשל "תקנה 5" / "סעיף 37"). ציטוט ללא סעיף ייחשב לא-תקף וייפסל.',
  '- ה"פתרון הקיים" שמוצג לך הוא **רמז-מבנה בלבד · לא מקור-אמת**. כל טענה — גם אם כבר מופיעה בו — חייבת להיגזר ממסמכי-המחברת; אל תשכפל ממנו ציטוט ללא אימות בנוסח.',
  '- citation = הסעיף/התקנה הספציפיים המסמיכים את הבקרה **פר-בקרה** (רתמה→צמ"א · פיגום→בנייה · גובה→עבודה-בגובה).',
  '- ציין scopeId מדויק לפי מזהה-הנושא שניתן ברמז (למשל 2.1 = עבודה בגובה).',
  '- אל תכלול שמות אנשים אמיתיים, נתוני-PII או פרטים מזהים.',
  '- status תמיד "מוסקנא" (טרם אומת ידנית מול PDF).',
].join('\n');

/**
 * דוגמה-עובדת אחת מלאה (inline) — מוטמעת בגוף ה-prompt כדי לעגן את
 * חוזה ה-JSON, שכן ל-NotebookLM אין responseSchema.
 * הדוגמה היא תרחיש פיגום (2.1/2.2) — scope מוכר, לא PII.
 */
const WORKED_EXAMPLE_JSON = JSON.stringify(
  {
    batch: 'scenarios-expand',
    contentType: 'scenario_expansion',
    items: [
      {
        sourceRef: 'scn:example:0',
        title: 'נפילה מפיגום (דוגמה)',
        background: 'עובד עמד על משטח פיגום נייד ללא מעקה ונפל.',
        data: null,
        task: 'נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.',
        solution: {
          immediateAction: {
            text: 'הוצא את הנפגע מאזור הסכנה, קרא לעזרה ראשונה, גדר את האזור.',
            citations: [],
          },
          legalBackup: {
            text: 'תקנות הבטיחות בעבודה (עבודות בנייה), תשמ"ח-1988, תקנה 48 מחייבת מעקה בטיחות בגובה העולה על 2 מטרים.',
            citations: [
              {
                scopeId: '2.2',
                quote:
                  'לא יועמד אדם לעבוד על משטח עבודה הגבוה יותר מ-2 מטרים מעל פני הקרקע אלא אם הותקן מעקה בטיחות',
                section: 'תקנה 48',
              },
            ],
          },
          engineeringMgmt: {
            text: 'התקנת מעקות קבועים, כתיבת נוהל עבודה בגובה, הדרכת עובדים.',
            citations: [],
          },
        },
        rubric: [
          { criterion: 'פעולה מיידית — עצירת סכנת-חיים', points: 1 },
          { criterion: 'גיבוי חוקי — ציטוט החקיקה הרלוונטית', points: 1 },
          { criterion: 'הנדסה וניהול — טיפול בשורש + בקרות', points: 1 },
        ],
      },
    ],
  },
  null,
  2,
);

/**
 * הסבר-סכמה כ-prose (תחליף responseSchema) — מוטמע לפני הדוגמה.
 */
const SCHEMA_PROSE = [
  '## מבנה ה-JSON הנדרש (הפלט המלא)',
  '',
  'החזר **JSON בלבד** (ללא פתיח, ללא הסבר), בצורה הבאה:',
  '',
  '```',
  '{',
  '  "batch": "scenarios-expand",',
  '  "contentType": "scenario_expansion",',
  '  "items": [',
  '    {',
  '      "sourceRef": "scn:<fileId>:<index>",   // השאר כפי-שניתן; אם חסר — השלם',
  '      "title": "...",',
  '      "background": "...",',
  '      "data": null,',
  '      "task": "נתח את האירוע: פעולה מיידית, גיבוי חוקי, הנדסה וניהול.",',
  '      "solution": {',
  '        "immediateAction": {',
  '          "text": "תיאור פעולה מיידית...",',
  '          "citations": []',
  '        },',
  '        "legalBackup": {',
  '          "text": "הצגת הגיבוי החוקי...",',
  '          "citations": [',
  '            {',
  '              "scopeId": "2.1",',
  '              "quote": "<ציטוט מילולי מהנוסח>",',
  '              "section": "תקנה 2"',
  '            }',
  '          ]',
  '        },',
  '        "engineeringMgmt": {',
  '          "text": "המלצות הנדסה וניהול...",',
  '          "citations": []',
  '        }',
  '      },',
  '      "rubric": [',
  '        { "criterion": "...", "points": 1 },',
  '        { "criterion": "...", "points": 1 },',
  '        { "criterion": "...", "points": 1 }',
  '      ]',
  '    }',
  '  ]',
  '}',
  '```',
  '',
  '**חובה:** `legalBackup.citations` חייב להכיל לפחות ציטוט אחד עם **שלושת השדות**: `quote` (מילולי מהנוסח) + `scopeId` + `section` (תקנה/סעיף ספציפי). ציטוט ללא `section` ייפסל.',
  '**אסור:** ציטוט שאינו מופיע מילה-במילה במסמכי-המחברת — השמט אותו במקרה של ספק (אל תמציא).',
].join('\n');

/**
 * בונה prompt עברי יחיד ל-NotebookLM שמורה **להרחיב** כל תרחיש לפתרון
 * 3-חלקים עשיר ומעוגן-חקיקה.
 *
 * הטמעת-רמזי-scope: עבור כל תרחיש מריצים `matchScopeKeywords` על
 * `title + background` ומוסיפים רמז textual (" [רמז-scope: 2.1, 2.2]") לכותרת
 * בגוף ה-prompt — כך NotebookLM יודע להפנות לנושא הנכון.
 *
 * @param scenarios מערך תרחישים (≥1). שדות: title, background, task, solution.
 * @returns string — ה-prompt המוכן לשליחה ל-NotebookLM.
 */
export function buildScenarioExpansionRequest(scenarios: ScenarioRequestItem[]): string {
  if (scenarios.length === 0) {
    throw new Error('buildScenarioExpansionRequest: נדרש לפחות תרחיש אחד');
  }

  const sections: string[] = [];

  // === חלק 1: system layer ===
  sections.push(SCENARIO_EXPANSION_SYSTEM);
  sections.push('');

  // === חלק 2: הסבר-סכמה ===
  sections.push(SCHEMA_PROSE);
  sections.push('');

  // === חלק 3: דוגמה-עובדת ===
  sections.push('## דוגמה-עובדת (JSON) — בצע בדיוק באותו פורמט עבור כל התרחישים:');
  sections.push('```json');
  sections.push(WORKED_EXAMPLE_JSON);
  sections.push('```');
  sections.push('');

  // === חלק 4: תרחישים להרחבה ===
  sections.push(`## תרחישים להרחבה (${scenarios.length} סה"כ)`);
  sections.push('');
  sections.push('עבור **כל** תרחיש להלן — הרחב לפתרון מלא ומפורט בשלושת החלקים (פרט, הוסף, העמק).');
  sections.push('');

  scenarios.forEach((scenario, index) => {
    // חישוב רמז-scope מ-title + background (stage-1 בלבד, חינמי)
    const scopeText = `${scenario.title} ${scenario.background}`;
    const candidates = matchScopeKeywords(scopeText);
    const scopeHint =
      candidates.length > 0
        ? ` [רמז-scope: ${candidates
            .slice(0, 3)
            .map((c) => c.id)
            .join(', ')}]`
        : '';

    sections.push(`### תרחיש ${index + 1}: ${scenario.title}${scopeHint}`);
    sections.push('');
    sections.push(`**רקע:** ${scenario.background}`);
    sections.push('');
    sections.push(`**משימה:** ${scenario.task}`);
    sections.push('');
    sections.push('**פתרון קיים (נקודת-מוצא — הרחב, אל תעתיק):**');
    sections.push(scenario.solution);
    sections.push('');
    sections.push('---');
    sections.push('');
  });

  // === חלק 5: הנחיית-סיום ===
  sections.push('## הנחיית-סיום');
  sections.push('');
  sections.push(
    `החזר JSON אחד מאוחד (batch אחד, items[${scenarios.length}]) — לפי הסכמה לעיל — ללא כל טקסט נלווה.`,
  );
  sections.push(
    'ודא: כל legalBackup מכיל ≥1 ציטוט **מילולי + scopeId + section** (ציון-סעיף חובה); scopeId תואם לרמז-scope שניתן.',
  );

  return sections.join('\n');
}
