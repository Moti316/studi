/**
 * src/lib/ai/prompts/committee-sim/grounding.ts — חבילות-עיגון-חקיקה פר-ענף לסימולציה-החיה.
 *
 * נותן ל-Claude את דברי-החקיקה הרלוונטיים לענף כך שיוכל **לנקוב בשם ובשנה** של החוק/התקנה
 * המסמיכים — בלי להמציא מספרי-סעיף (פרומפט-מגן אוסר זאת). שלב-1: **שם + שנה + תפקיד בלבד**
 * (לא ציטוט-סעיף מילולי). v2 עתידי יוכל למשוך ציטוטים-verbatim מהקורפוס (`sources/legislation/`).
 *
 * טהור (אפס-IO) — בר-בדיקה.
 */

/** דבר-חקיקה בחבילת-העיגון (שם + שנה + תפקיד · בלי מספר-סעיף). */
export interface GroundingStatute {
  scopeId: string;
  /** שם רשמי + שנה עברית. */
  title: string;
  /** מה הוא עושה בפועל. */
  role: string;
}

/** שני עמודי-היסוד — בכל ענף (החוק-המסמיך + הפקודה-הטכנית). */
const PILLARS: GroundingStatute[] = [
  {
    scopeId: '1.0',
    title: 'חוק ארגון הפיקוח על העבודה, תשי"ד-1954',
    role: 'החוק-המסמיך: מקים את אגף-הפיקוח, ממנה את מפקח-העבודה הראשי, ומכוחו מותקנות התקנות.',
  },
  {
    scopeId: '2.0',
    title: 'פקודת הבטיחות בעבודה [נוסח חדש], תש"ל-1970',
    role: 'הארגז הטכני-מבצעי: מכונות, מיגון, גידור, בדיקות-ציוד, "תופש מפעל".',
  },
  {
    scopeId: '1.1',
    title: 'תקנות ארגון הפיקוח על העבודה (ממונים על הבטיחות), תשנ"ו-1996',
    role: 'מינוי, כישורים, סמכויות וחובות ממונה-הבטיחות.',
  },
];

const S = {
  bniya: {
    scopeId: '2.2',
    title: 'תקנות הבטיחות בעבודה (עבודות בנייה), תשמ"ח-1988',
    role: 'מסגרת-הבטיחות באתרי-בנייה: מנהל-עבודה, פיגומים, חפירות, הריסות.',
  },
  gova: {
    scopeId: '2.1',
    title: 'תקנות הבטיחות בעבודה (עבודה בגובה), תשס"ז-2007',
    role: 'מניעת-נפילה: מעקות, רשתות, רתמות, הדרכת-גובה ע"י מדריך-מוסמך.',
  },
  ppe: {
    scopeId: '2.3',
    title: 'תקנות הבטיחות בעבודה (ציוד מגן אישי), תשנ"ז-1997',
    role: 'צמ"א — קו-ההגנה האחרון: חובת-אספקה (ללא-עלות) וחובת-שימוש.',
  },
  chashmal: {
    scopeId: '2.4',
    title: 'תקנות הבטיחות בעבודה (חשמל), תש"ן-1990',
    role: 'התקנה, תחזוקה ושימוש במתקני-חשמל; מפסק-פחת, הארקה, ניתוק-מתח.',
  },
  raash: {
    scopeId: '3.2',
    title: 'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובריאות העובדים ברעש), תשמ"ד-1984',
    role: 'רעש-מזיק (מעל 85 dB): מדידות, הפחתה, מגני-שמיעה, בדיקות-שמיעה.',
  },
  nitur: {
    scopeId: '3.1',
    title: 'תקנות הבטיחות בעבודה (ניטור סביבתי וביולוגי של עובדים בגורמים מזיקים), תשע"א-2011',
    role: 'ניטור-סביבתי וביולוגי לעובדים החשופים לגורמים-מזיקים.',
  },
  chomas: {
    scopeId: '2.7',
    title: 'תקנות הבטיחות בעבודה (גיליון בטיחות, סיווג, אריזה, תיוג וסימון), תשנ"ח-1998',
    role: 'גיליון-בטיחות (SDS) בעברית, סיווג, אחסון בטוח, סימון-אזהרות.',
  },
  agouran: {
    scopeId: '2.6',
    title: 'תקנות הבטיחות בעבודה (עגורנאים, מפעילי מכונות הרמה אחרות ואתתים), תשנ"ג-1992',
    role: 'הכשרה, רישוי ובדיקות למפעילי-הרמה (עגורנים, מלגזות) ולאתתים.',
  },
  ezraRishona: {
    scopeId: '2.5',
    title: 'תקנות הבטיחות בעבודה (עזרה ראשונה במקומות עבודה), תשמ"ח-1988',
    role: 'ציוד-עזרה-ראשונה לפי גודל-המפעל וסוג-הסיכונים, ומינוי אחראי.',
  },
} as const;

/** מיפוי ענף → תקנות-ספציפיות (מעבר לעמודי-היסוד). התאמה לפי מילת-מפתח בשם-הענף. */
const BRANCH_MATCHERS: { match: RegExp; statutes: GroundingStatute[] }[] = [
  { match: /בנ(י|ייה)|אתר/, statutes: [S.bniya, S.gova, S.ppe] },
  { match: /גובה|גג|פיגום|סולם/, statutes: [S.gova, S.bniya, S.ppe] },
  { match: /חשמל|פחת|RCD/i, statutes: [S.chashmal, S.ppe] },
  { match: /מכונ|מסגר|חית|ניסור|גידור/, statutes: [S.ppe] },
  { match: /חומ|כימי|מסוכ|SDS/i, statutes: [S.chomas, S.ppe] },
  { match: /הרמה|עגור|מלגז/, statutes: [S.agouran, S.bniya] },
  { match: /חלל|מוקף|בור|ביוב|מחנק/, statutes: [S.ppe, S.ezraRishona] },
  { match: /רעש|גיהות|גהות|אבק/, statutes: [S.raash, S.nitur, S.ppe] },
  { match: /חמה|ריתוך|אש/, statutes: [S.ppe, S.ezraRishona] },
  { match: /חפיר|דיפון/, statutes: [S.bniya, S.ppe] },
];

/** חבילת-העיגון לענף: עמודי-היסוד + התקנות-הספציפיות (deduped). */
export function packForBranch(branch: string): GroundingStatute[] {
  const found = BRANCH_MATCHERS.find((m) => m.match.test(branch));
  const extra = found?.statutes ?? [];
  const out: GroundingStatute[] = [...PILLARS];
  const seen = new Set(out.map((s) => s.scopeId));
  for (const s of extra) {
    if (!seen.has(s.scopeId)) {
      out.push(s);
      seen.add(s.scopeId);
    }
  }
  return out;
}

/** מרנדר חבילת-עיגון לבלוק-טקסט לתוך ה-system-prompt. */
export function formatGrounding(statutes: GroundingStatute[]): string {
  return statutes.map((s) => `- [scope ${s.scopeId}] ${s.title} — ${s.role}`).join('\n');
}
