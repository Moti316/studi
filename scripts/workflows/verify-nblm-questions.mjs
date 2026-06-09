export const meta = {
  name: 'verify-nblm-questions',
  description:
    'אימות-סמנטי פר-נוסח לשאלות-NotebookLM (citation-fit · נכונות · PPE-אחרון · עברית · scope) מול גוף-החוק; block שמרני בלבד → held (מונע over-pruning של תוכן-מעוגן)',
  phases: [
    { title: 'Load', detail: 'bootstrap: קריאת _index.json → רשימת קבצי-הקבוצה' },
    { title: 'Verify', detail: 'סוכן content-verifier פר-נוסח: Read group-file + Grep statute' },
  ],
};

const INDEX_FILE =
  (args && typeof args.indexFile === 'string' && args.indexFile) ||
  '.cache/notebooklm/questions/verify/_index.json';

const LOAD_SCHEMA = {
  type: 'object',
  properties: { groupFiles: { type: 'array', items: { type: 'string' } } },
  required: ['groupFiles'],
};

phase('Load');
const loaded = await agent(
  [
    `קרא (Read) את הקובץ ${INDEX_FILE} — מערך-JSON של אובייקטים, כל אחד עם השדה "groupFile".`,
    'החזר {groupFiles: [כל ערכי-ה-groupFile, בדיוק כפי שהם, לפי הסדר]}.',
  ].join('\n'),
  { label: 'load-index', phase: 'Load', schema: LOAD_SCHEMA },
);
const groupFiles = loaded && Array.isArray(loaded.groupFiles) ? loaded.groupFiles : [];
if (groupFiles.length === 0) {
  log(`לא נטענו קבצי-קבוצה מ-${INDEX_FILE}`);
  return { held: [], heldCount: 0, warnings: 0, totalVerified: 0, groups: 0 };
}
const scopeOf = (f) => (String(f).match(/g-([0-9.]+)-\d+\.json$/) || [, '?'])[1];

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sourceRef: { type: 'string' },
          severity: { type: 'string', enum: ['ok', 'warn', 'block'] },
          flags: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
        },
        required: ['sourceRef', 'severity', 'reason'],
      },
    },
  },
  required: ['verdicts'],
};

function verifyPrompt(groupFile) {
  return [
    'אתה מבקר-תוכן עצמאי (content-verifier) של קורס "ממונה בטיחות בעבודה" (עברית · ישראל).',
    `**צעד 1: Read את קובץ-הקבוצה: ${groupFile}**`,
    '— JSON: {scopeId,title,statutePath,questions:[{sourceRef,type,prompt,answer,options,explanation}]}.',
    'הוא מכיל את נושא-החוק (title), נתיב-נוסח-המקור (statutePath), ואת השאלות לאימות.',
    '**צעד 2: Grep/Read את נוסח-המקור (statutePath שבקובץ)** לאימות כל שאלה (אל תסתמך על זיכרון).',
    'הנוסח עלול להיות ארוך מאוד (למשל 2.11.1) — השתמש ב-Grep למספרי-הסעיפים ולמילות-המפתח שב-answer/explanation, אל תקרא את כל הקובץ.',
    '',
    'בדוק לכל שאלה 5 קריטריונים:',
    '1. citation-fit: ה-citation שב-explanation — הסעיף/התקנה הספציפי באמת עוסק/מסמיך את נושא-השאלה? סעיף מהתחום-הלא-נכון = הזיה-משפטית.',
    '2. נכונות מול-המקור: mcq → ה-answer (המסיח-הנכון) אכן נכון; matching → כל זוג מונח↔הגדרה נכון; open → התשובה תואמת את הנוסח.',
    '3. היררכיית-בקרות: אם רלוונטי — צמ"א/PPE מוצא-אחרון (לא ראשון).',
    '4. עברית תקינה (ללא אותיות-משובשות/typos שפוגעים בהבנה).',
    '5. in-scope: בתוך תכנית-הקורס · ללא רפורמות תשפ"ה-2025 (טרם-בתוקף).',
    '',
    'severity: **block** = שגיאה-מהותית **שאתה בטוח בה** (הזיית-ציטוט · תשובה-שגויה · PPE-הפוך · מחוץ-לסקופ) → תוסר מהבנק.',
    '  **warn** = ספק / פגם-קל / לא-הצלחת-לאמת — תישאר ל-content-verifier. **ok** = תקין.',
    '⚠️ **שמרנות-הסרה:** קבע block רק כשאתה בטוח. בכל ספק-אמיתי → warn (אסור להסיר תוכן-מעוגן-G3 בטעות).',
    'flags = תגי-הקריטריונים שנכשלו (citation-fit/factual/ppe/hebrew/scope).',
    '',
    'החזר {verdicts:[{sourceRef,severity,flags,reason}]} — בדיוק רשומה אחת לכל sourceRef שבקובץ.',
  ].join('\n');
}

log(`מאמת ${groupFiles.length} נוסחים`);

const results = await parallel(
  groupFiles.map((gf) => () =>
    agent(verifyPrompt(gf), {
      label: `verify:${scopeOf(gf)}`,
      phase: 'Verify',
      schema: VERDICT_SCHEMA,
      agentType: 'content-verifier',
    }),
  ),
);

const verdicts = results.filter(Boolean).flatMap((r) => (Array.isArray(r.verdicts) ? r.verdicts : []));
const held = verdicts
  .filter((v) => v && v.severity === 'block')
  .map((v) => ({ sourceRef: v.sourceRef, reasons: [v.reason], flags: v.flags || [] }));

return {
  held,
  heldCount: held.length,
  warnings: verdicts.filter((v) => v && v.severity === 'warn').length,
  totalVerified: verdicts.length,
  groups: groupFiles.length,
};
