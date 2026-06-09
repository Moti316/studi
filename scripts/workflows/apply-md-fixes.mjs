export const meta = {
  name: 'apply-md-fixes',
  description: 'מיישם את תיקוני-אודיט-ה-MD (עקביות הכרעות-2026-06-09) — סוכן פר-קובץ, עריכות-מינימליות מדויקות',
  phases: [
    { title: 'Load', detail: 'קריאת .cache/md-fixes.json → רשימת-הקבצים' },
    { title: 'Fix', detail: 'סוכן פר-קובץ: יישום ה-suggestedFix' },
  ],
};

const FIXES_FILE = '.cache/md-fixes.json';

const CANON = [
  'הקשר קנוני (הכרעות-2026-06-09 · נסח אחיד):',
  '• חיבור-תרחישים+שאלות ואימות-סמנטי = "Workflow רב-סוכני של Claude · אפס-Gemini" — לא "Gemini-API". (Gemini חסום-מכסה 20/יום.)',
  '• מיני-קורס-תרחישים = "סימולציית-וועדה אינטראקטיבית (ADR-016 · 3 מפקחים · 4 שלבים · ציון 0-100 · hybrid פרה-בנוי→LiveEngine)" — מחליף את ה-ScenarioWalkthrough הסטטי (ADR-014).',
  '• מיני-קורס-שו"ת = "בנק-NotebookLM רב-סוגי (~500 · mcq/matching/open מקורפוס-החקיקה · status=מוסקנא)" — מחליף את 540 בנק-qa הישן.',
  '• firewall-מגן בוטל (port-פרומפט name-cleaned מותר · megen מבודד). ADR-009 (תיקון), ADR-016.',
  '• מודל-הסימולציה: src/features/simulation/types.ts (+ engine.ts PrebakedEngine + SimulationPlayer.tsx).',
].join('\n');

function fixPrompt(file) {
  return [
    'אתה עורך-תיעוד מדויק של פרויקט StudiBuilder (עברית · RTL). משימה: ליישם את תיקוני-האודיט לקובץ אחד.',
    `**קובץ-היעד: ${file}**`,
    `קרא (Read) את ${FIXES_FILE} — מערך של {file, findings:[{kind,severity,issue,suggestedFix}]}. אתר את הרשומה שבה file === "${file}" וקרא את ה-findings שלה.`,
    `קרא (Read) את ${file}, והחל **כל** suggestedFix כעריכת-Edit מינימלית ומדויקת (שמור פורמט/סגנון/RTL הקיים; אל תשכתב פסקאות שלמות; אל תיגע בתוכן שאינו קשור לממצא).`,
    'אם ה-suggestedFix מצביע על שורה/טקסט שכבר תוקן (לא נמצא) — דלג עליו וציין זאת.',
    '',
    CANON,
    '',
    'עקרונות: נסח לפי ה-CANON (אחידות). שמור קישורי-MD יחסיים תקינים. אל תמציא תוכן מעבר ל-suggestedFix.',
    'החזר {file, applied: [תקצירי-העריכות], skipped: [ממצאים-שדולגו+סיבה], status}.',
  ].join('\n');
}

const FIX_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    applied: { type: 'array', items: { type: 'string' } },
    skipped: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['done', 'partial', 'skip'] },
  },
  required: ['file', 'applied', 'status'],
};

const LOAD_SCHEMA = {
  type: 'object',
  properties: { files: { type: 'array', items: { type: 'string' } } },
  required: ['files'],
};

phase('Load');
const loaded = await agent(
  `קרא (Read) את ${FIXES_FILE} (מערך-JSON). החזר {files: [כל ערכי-ה-"file", לפי הסדר]}.`,
  { label: 'load-fixes', phase: 'Load', schema: LOAD_SCHEMA },
);
const files = loaded && Array.isArray(loaded.files) ? loaded.files : [];
if (files.length === 0) {
  log(`לא נטענו קבצים מ-${FIXES_FILE}`);
  return { fixed: 0, results: [] };
}
log(`מיישם תיקונים ב-${files.length} קבצים`);

phase('Fix');
const results = await parallel(
  files.map((f) => () =>
    agent(fixPrompt(f), { label: `fix:${f.split('/').pop()}`, phase: 'Fix', schema: FIX_RESULT_SCHEMA }),
  ),
);

const ok = results.filter(Boolean);
return {
  fixed: ok.filter((r) => r.status === 'done').length,
  partial: ok.filter((r) => r.status === 'partial').length,
  results: ok.map((r) => ({ file: r.file, status: r.status, applied: (r.applied || []).length, skipped: (r.skipped || []).length })),
};
