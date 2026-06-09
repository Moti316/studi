export const meta = {
  name: 'verify-nblm-questions',
  description:
    'אימות-סמנטי (citation-fit · נכונות · PPE-אחרון · עברית · scope) לשאלות-NotebookLM פר-נוסח, עם בדיקה-נגדית עצמאית לכל הזיה לפני הסרה',
  phases: [
    { title: 'Verify', detail: 'סוכן content-verifier פר-נוסח: Grep למקור + אימות כל שאלותיו' },
    { title: 'Adversarial', detail: 'oversight-lead: בדיקה-נגדית עצמאית לכל שאלה שסומנה block' },
  ],
};

// args = { groups: [{scopeId, title, statutePath, questions:[{sourceRef,type,prompt,answer,options?,explanation}]}] }
const groups = (args && Array.isArray(args.groups) ? args.groups : []).filter(
  (g) => g && Array.isArray(g.questions) && g.questions.length > 0,
);

if (groups.length === 0) {
  log('אין קבוצות לאימות (args.groups ריק)');
  return { held: [], heldCount: 0, totalVerified: 0, warnings: 0, groups: 0 };
}

const GROUP_VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sourceRef: { type: 'string' },
          pass: { type: 'boolean' },
          severity: { type: 'string', enum: ['ok', 'warn', 'block'] },
          flags: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
        },
        required: ['sourceRef', 'pass', 'severity', 'reason'],
      },
    },
  },
  required: ['verdicts'],
};

const ADV_SCHEMA = {
  type: 'object',
  properties: {
    confirmedBad: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['confirmedBad', 'reason'],
};

function verifyPrompt(g) {
  return [
    'אתה מבקר-תוכן עצמאי (content-verifier) של קורס "ממונה בטיחות בעבודה" (עברית · ישראל).',
    `לפניך ${g.questions.length} שאלות שנוצרו אוטומטית מנוסח-החקיקה scope ${g.scopeId} — "${g.title}".`,
    `נוסח-המקור המלא בקובץ: ${g.statutePath}`,
    '**חובה: Grep/Read את הקובץ** לאימות כל שאלה מול המקור. הנוסח עלול להיות ארוך מאוד —',
    'השתמש ב-Grep למספרי-הסעיפים ולמילות-המפתח שבשאלה/בתשובה (אל תקרא את כל הקובץ; אל תסתמך על זיכרון בלבד).',
    '',
    'בדוק לכל שאלה 5 קריטריונים (היה קפדן · ברירת-מחדל החמרה רק כשבטוח):',
    '1. citation-fit: ה-citation שבהסבר — האם הסעיף/התקנה הספציפי באמת עוסק/מסמיך את נושא-השאלה? סעיף מהתחום-הלא-נכון = הזיה-משפטית → block.',
    '2. נכונות-עובדתית מול המקור: mcq → המסיח שב-answer אכן הנכון; matching → כל זוג מונח↔הגדרה נכון; open → התשובה תואמת את הנוסח.',
    '3. היררכיית-בקרות: אם השאלה נוגעת לאמצעי-בקרה — צמ"א/PPE מוצג כמוצא-אחרון, לא ראשון. הפוך → block.',
    '4. עברית: ניסוח תקין, ללא אותיות-משובשות/typos חמורים שפוגעים בהבנה.',
    '5. in-scope: בתוך תכנית-הקורס · ללא רפורמות תשפ"ה-2025 (טרם-בתוקף).',
    '',
    'severity: block = שגיאה-מהותית (הזיית-ציטוט · תשובה-שגויה · PPE-הפוך · מחוץ-לסקופ) שמצדיקה הסרה.',
    '  warn = פגם-קל (ניסוח/סגנון) שיישאר ל-content-verifier. ok = תקין.',
    'קבע pass=false אך-ורק כש-severity=block. flags = תגי-הקריטריונים שנכשלו (citation-fit/factual/ppe/hebrew/scope).',
    '',
    'השאלות (JSON):',
    JSON.stringify(g.questions),
    '',
    'החזר {verdicts:[{sourceRef,pass,severity,flags,reason}]} — בדיוק רשומה אחת לכל sourceRef שקיבלת.',
  ].join('\n');
}

function advPrompt(g, block, q) {
  return [
    'בדיקה-נגדית עצמאית (oversight). שאלה מקורס "ממונה בטיחות בעבודה".',
    `scope ${g.scopeId} · "${g.title}" · מקור: ${g.statutePath}`,
    `מבקר קודם סימן אותה כשגויה-מהותית (block): "${block.reason}".`,
    'השאלה (JSON):',
    JSON.stringify(q ?? { sourceRef: block.sourceRef }),
    '**Grep/Read את קובץ-המקור** ואמת באופן בלתי-תלוי: האם זו באמת שגיאה-מהותית שמצדיקה הסרת-השאלה מהבנק?',
    'שמרנות: אם יש ספק-אמיתי (ייתכן שהשאלה תקינה / הציטוט מתאים) → confirmedBad=false. אל תסיר תוכן-מעוגן בטעות.',
    'החזר {confirmedBad:boolean, reason:string}.',
  ].join('\n');
}

const shortRef = (sr) => String(sr).split(':').slice(0, 3).join(':');

log(`מאמת ${groups.length} נוסחים · ${groups.reduce((s, g) => s + g.questions.length, 0)} שאלות`);

const results = await pipeline(
  groups,
  // שלב 1: אימות פר-נוסח (content-verifier · Grep-first)
  (g) =>
    agent(verifyPrompt(g), {
      label: `verify:${g.scopeId}`,
      phase: 'Verify',
      schema: GROUP_VERDICT_SCHEMA,
      agentType: 'content-verifier',
    }),
  // שלב 2: בדיקה-נגדית לכל block — ללא barrier (כל נוסח מתקדם עצמאית)
  (gv, g) => {
    const verdicts = gv && Array.isArray(gv.verdicts) ? gv.verdicts : [];
    const blocks = verdicts.filter((v) => v && (v.severity === 'block' || v.pass === false));
    if (blocks.length === 0) return { scopeId: g.scopeId, verdicts, held: [] };
    return parallel(
      blocks.map((b) => () => {
        const q = g.questions.find((x) => x.sourceRef === b.sourceRef);
        return agent(advPrompt(g, b, q), {
          label: `adv:${shortRef(b.sourceRef)}`,
          phase: 'Adversarial',
          schema: ADV_SCHEMA,
          agentType: 'oversight-lead',
        }).then((a) => ({
          sourceRef: b.sourceRef,
          confirmedBad: a && a.confirmedBad === true,
          reasons: [b.reason, a && a.reason].filter(Boolean),
        }));
      }),
    ).then((checked) => ({
      scopeId: g.scopeId,
      verdicts,
      held: checked.filter(Boolean).filter((c) => c.confirmedBad),
    }));
  },
);

const ok = results.filter(Boolean);
const allVerdicts = ok.flatMap((r) => r.verdicts);
const held = ok.flatMap((r) => r.held.map((h) => ({ sourceRef: h.sourceRef, reasons: h.reasons })));

return {
  held,
  heldCount: held.length,
  totalVerified: allVerdicts.length,
  warnings: allVerdicts.filter((v) => v.severity === 'warn').length,
  blocksProposed: allVerdicts.filter((v) => v.severity === 'block' || v.pass === false).length,
  groups: groups.length,
};
