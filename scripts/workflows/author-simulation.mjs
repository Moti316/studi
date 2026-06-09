export const meta = {
  name: 'author-simulation',
  description: 'מחבר סימולציית-וועדה אחת (ADR-016) מזרע-v2 מעוגן + פרומפט-מגן — Claude · אפס-Gemini · schema-validated',
  phases: [{ title: 'Author', detail: 'סוכן: קריאת זרע+מתודולוגיה → חיבור Simulation מסועף' }],
};

const SEED_FILE = '.cache/notebooklm/simulations/_seed-loto.json';
const MASTER_FILE = 'src/lib/ai/prompts/committee-sim/master.ts';

const SIM_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    branch: { type: 'string' },
    intro: { type: 'string' },
    scopeRefs: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, confidence: { type: 'number' } },
        required: ['id', 'confidence'],
      },
    },
    maxScore: { type: 'number' },
    scoringCriteria: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, weight: { type: 'number' } },
        required: ['name', 'weight'],
      },
    },
    stages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: ['opening', 'branch', 'law', 'cruel'] },
          title: { type: 'string' },
          turns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                inspector: { type: 'string', enum: ['technical', 'hygiene', 'regulatory'] },
                prompt: { type: 'string' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      quality: { type: 'string', enum: ['good', 'partial', 'poor'] },
                      points: { type: 'number' },
                      feedback: { type: 'string' },
                      citation: { type: 'string' },
                    },
                    required: ['text', 'quality', 'points', 'feedback'],
                  },
                },
              },
              required: ['id', 'inspector', 'prompt', 'options'],
            },
          },
        },
        required: ['key', 'title', 'turns'],
      },
    },
  },
  required: ['title', 'branch', 'intro', 'scopeRefs', 'maxScore', 'scoringCriteria', 'stages'],
};

const prompt = [
  'אתה בוחן-וועדת-הסמכה של ממונה-בטיחות בישראל. משימה: לחבר **סימולציית-וועדה אינטראקטיבית אחת** (ADR-016).',
  '',
  `**צעד 1:** קרא (Read) את ${MASTER_FILE} — מתודולוגיית-הוועדה (3 מפקחים · 4 שלבים · מדרג-בקרות · צמ"א-אחרון · ציטוט-פר-בקרה · Vision Zero · "השאלה האכזרית"). זה הקול והסטנדרט שלך.`,
  `**צעד 2:** קרא (Read) את ${SEED_FILE} — זרע-תרחיש מעוגן: {title, background, data, task, grounding:[{scopeId,section,quote}], solutionParts, rubric}.`,
  '',
  'חבר Simulation מסועפת לפי המבנה (4 שלבים):',
  '• `opening` (היכרות · 1-2 תורים): המפקחים פותחים בשיח-אישי — "ספר על עצמך / מה הרקע / איזה קורס עברת". (לא שאלה טכנית — זו ההיכרות.)',
  '• `branch` (תרחיש-ענפי · 2-3 תורים): מציגים את התרחיש מהזרע · "מהו הסיכון הראשון? · אילו בדיקות? · מדרג-בקרות".',
  '• `law` (צלילה-לחוק · 1-2 תורים): "איזו תקנה/סעיף מסמיך? · מה תעשה אם המעסיק לא מקיים?" — מעוגן בציטוט-החקיקה מהזרע.',
  '• `cruel` (השאלה-האכזרית · 1 תור): שאלה סוקרטית בלתי-צפויה (שיקול-דעת תחת-לחץ).',
  '',
  'לכל תור: שייך מפקח (technical/hygiene/regulatory לפי הנושא) · prompt בגוף-שני · 3-4 options.',
  'לכל option: quality (good=מדויק-ומלא · partial=חלקי/לא-שלם · poor=שגוי/קיצור-דרך-מסוכן) · points (good≈10 · partial≈5 · poor=0) · feedback קצר בקול-מפקח (good=מאשר+מחזק · partial=דוחק להרחיב · poor=מתקן בחדות).',
  'ל-option ה-good של שלב-ה-`law` (ולכל בחירה-נכונה שמסתמכת על החוק): הוסף `citation` = התקנה+סעיף **מהעיגון-שבזרע בלבד** (למשל הציטוט scopeId/section). **אל תמציא תקנות/סעיפים** שאינם בעיגון.',
  'עקרונות-חובה: צמ"א/PPE לעולם לא פתרון-ראשון כשיש בקרה-הנדסית (poor אם מציעים PPE במקום הנדסה). כל בחירה-נכונה משקפת מדרג-בקרות נכון.',
  '',
  'scopeRefs = [{id: scopeId-מהעיגון, confidence:1}]. maxScore=100. scoringCriteria = 5 קריטריונים משוקללים (ידע-בחוק 25 · יישום-מעשי 25 · תקשורת 20 · חשיבה-מערכתית 15 · אנטי-הזיה 15). branch = הענף (למשל "מכונות/אחזקה"). intro = סצנת-הפתיחה (מהזרע · גוף-שני). id-ים ייחודיים לתורים (t1,t2,...).',
  '',
  'החזר את ה-Simulation כ-JSON לפי הסכמה. עברית תקנית · RTL · מדויק-משפטית.',
].join('\n');

phase('Author');
const sim = await agent(prompt, {
  label: 'author:loto',
  phase: 'Author',
  schema: SIM_SCHEMA,
  agentType: 'domain-expert',
});

return sim;
