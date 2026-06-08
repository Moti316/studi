/**
 * src/lib/import/verify-grounding.ts — שערי אנטי-הזיה (G1–G5) לתוכן שנוצר ע"י
 * NotebookLM/AI לפני כתיבתו ל-DB. עיקרון: PDF/נוסח-החקיקה = source-of-truth →
 * כל ציטוט שמודל מחזיר חייב לעבור אימות דטרמיניסטי מול הקורפוס האמיתי.
 *
 * השערים (פר-ציטוט):
 *   G1 — scopeId חוקי (allowlist 57 · isValidScopeId).            [קשה: נכשל → לא-מעוגן]
 *   G2 — ה-scopeId נפתר לקובץ-`.md` אמיתי בקורפוס (גוף-נוסח קיים).  [קשה לעיגון: אין גוף → אין G3]
 *   G3 — ה-quote מופיע **מילולית** בגוף-הנוסח (quoteAppearsInBody). [הקשֶה ביותר · drop אם נכשל]
 *   G4 — (רמת-תרחיש) legalBackup חייב ≥1 ציטוט מעוגן-מלא, אחרת "מוחזק". [held · מדווח]
 *   G5 — הסעיף נמצא בגוף (report-only · לעולם לא חוסם).
 *
 * הגיון-השערים **טהור** (resolver-גוף מוזרק) → נבדק-ביחידה בלי fs. העטיפה-האמיתית
 * (`createDefaultBodyResolver`) קוראת את INDEX.md פעם-אחת + readFileSync של ה-`.md`.
 * שימוש-חוזר: `quoteAppearsInBody`/`normalizeForMatch` מ-generated-mcq (אותו G3 הקנוני).
 */
import { isValidScopeId } from '../db/constants/scope-refs';
import { normalizeForMatch, quoteAppearsInBody } from './generated-mcq';

/** ציטוט מובנה כפי שמגיע מהפלט של NotebookLM. */
export interface Citation {
  /** scope-ID דוטד (למשל '2.1'). */
  scopeId: string;
  /** ציטוט-מילולי שאמור להופיע בנוסח-החקיקה. */
  quote: string;
  /** הסעיף/התקנה (אופציונלי · report-only ל-G5). */
  section?: string;
}

/** תוצאת-שערים פר-ציטוט. */
export interface CitationGate {
  scopeId: string;
  quote: string;
  section?: string;
  /** G1 — scopeId ∈ allowlist-57. */
  g1: boolean;
  /** G2 — scopeId נפתר לגוף-נוסח אמיתי. */
  g2: boolean;
  /** G3 — ה-quote מופיע מילולית בגוף (false אם אין גוף). */
  g3: boolean;
  /** G5 — הסעיף נמצא בגוף (null אם אין סעיף/אין גוף · report-only). */
  g5: boolean | null;
  /** מעוגן-מלא: G1 ∧ G2 ∧ G3. רק ציטוט כזה נכתב כ-scope_ref / גיבוי-חוקי. */
  grounded: boolean;
  /** הסבר קצר-קריא (לדו"ח ה-dry-run). */
  detail: string;
}

/** פותר scopeId → גוף-נוסח (`.md` ללא frontmatter), או null אם לא-קיים בקורפוס. */
export type BodyResolver = (scopeId: string) => string | null;

/**
 * מפריד frontmatter-YAML מוב-תחילי (בלוק בין `---` ל-`---`) ומחזיר את הגוף בלבד.
 * תואם ל-splitFrontmatter ב-verify-legislation/ingest — מימוש מקומי כדי לשמור
 * את הקובץ חופשי-מ-תלות-מעגלית. אם אין frontmatter — מחזיר את הקלט כפי-שהוא.
 */
export function stripFrontmatter(md: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(md);
  return m ? md.slice(m[0].length) : md;
}

/**
 * Parse של INDEX.md (טבלת-markdown מחוללת) → מפה scopeId → נתיב-`.md` יחסי-לשורש.
 * כל שורת-טבלה: `| <scope> | <כותרת> | … | [.md](<relPath>) | …`. טהור (קלט-טקסט).
 */
export function parseLegislationIndex(indexMd: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of indexMd.split('\n')) {
    if (!line.startsWith('|')) continue;
    const mdLink = /\[\.md\]\(([^)]+)\)/.exec(line);
    const rel = mdLink?.[1];
    if (!rel) continue;
    // התא-הראשון = scopeId (אחרי ה-`|` הפותח, עד ה-`|` הבא).
    const firstCell = line.slice(1, line.indexOf('|', 1)).trim();
    if (!firstCell) continue;
    map.set(firstCell, rel.trim());
  }
  return map;
}

/** האם מחרוזת-הסעיף (מספרהּ) מופיעה בגוף — אות ל-G5 (report-only · לֵנֵיֶנטי). */
function sectionAppearsInBody(section: string | undefined, body: string): boolean | null {
  if (!section || !body) return null;
  const digits = (section.match(/\d+[א-ת]?/g) ?? []).map((d) => normalizeForMatch(d));
  if (digits.length === 0) return null;
  const nb = normalizeForMatch(body);
  // לפחות אחד מספרי-הסעיף מופיע בגוף.
  return digits.some((d) => nb.includes(d));
}

/**
 * מאמת ציטוט-בודד מול הקורפוס. הגיון טהור — ה-resolver מוזרק (גוף-נוסח או null).
 * G1 קשה · G2 קובע אם יש גוף · G3 קשה (מילולי) · G5 report-only.
 */
export function verifyCitation(citation: Citation, resolveBody: BodyResolver): CitationGate {
  const scopeId = String(citation?.scopeId ?? '').trim();
  const quote = String(citation?.quote ?? '');
  const section = citation?.section;

  const g1 = isValidScopeId(scopeId);
  if (!g1) {
    return {
      scopeId,
      quote,
      section,
      g1: false,
      g2: false,
      g3: false,
      g5: null,
      grounded: false,
      detail: `G1 ✗ scopeId לא-מוכר (${scopeId || '∅'})`,
    };
  }

  const body = resolveBody(scopeId);
  const g2 = body !== null && body !== undefined;
  if (!g2) {
    return {
      scopeId,
      quote,
      section,
      g1: true,
      g2: false,
      g3: false,
      g5: null,
      grounded: false,
      detail: `G2 ✗ אין נוסח-md בקורפוס עבור ${scopeId} (תקן/שיטה ללא חקיקה?)`,
    };
  }

  const g3 = quoteAppearsInBody(quote, body as string);
  const g5 = sectionAppearsInBody(section, body as string);
  const grounded = g1 && g2 && g3;

  return {
    scopeId,
    quote,
    section,
    g1: true,
    g2: true,
    g3,
    g5,
    grounded,
    detail: grounded
      ? `✓ מעוגן-מלא (${scopeId}${section ? ' · ' + section : ''})`
      : `G3 ✗ ה-quote אינו מופיע מילולית בנוסח ${scopeId}`,
  };
}

/** תוצאת-עיגון ברמת-תרחיש (אחרי G4). */
export interface ScenarioGrounding {
  /** כל הציטוטים עם תוצאות-שעריהם. */
  gates: CitationGate[];
  /** הציטוטים המעוגנים-במלואם בלבד (G1∧G2∧G3). */
  groundedCitations: CitationGate[];
  /** G4 — האם יש ≥1 ציטוט מעוגן-מלא (תנאי לכתיבת legalBackup). */
  hasGroundedBackup: boolean;
}

/**
 * מאמת אוסף-ציטוטים של תרחיש ומיישם G4: legalBackup חייב ≥1 ציטוט מעוגן-מלא.
 * `hasGroundedBackup=false` → התרחיש "מוחזק" (מדווח · לא-נכתב ב-`--execute`).
 */
export function verifyScenarioCitations(
  citations: Citation[],
  resolveBody: BodyResolver,
): ScenarioGrounding {
  const gates = (citations ?? []).map((c) => verifyCitation(c, resolveBody));
  const groundedCitations = gates.filter((g) => g.grounded);
  return {
    gates,
    groundedCitations,
    hasGroundedBackup: groundedCitations.length > 0,
  };
}

/** תוצאת-תקפוּת של הגיבוי-החוקי (G4 מחמיר · דרישת-מוטי: ציון-סעיף חובה). */
export interface LegalBackupResult {
  /** האם הגיבוי-החוקי תקף: ≥1 ציטוט מעוגן-מלא **שגם נושא סעיף**. */
  ok: boolean;
  /** שערי כל ציטוטי-ה-legalBackup (לדו"ח). */
  gates: CitationGate[];
}

/** האם לציטוט יש סעיף לא-ריק (תקנה/סעיף ספציפי). */
function hasSection(g: CitationGate): boolean {
  return typeof g.section === 'string' && g.section.trim().length > 0;
}

/**
 * G4 מחמיר על **legalBackup בלבד** (דרישת-מוטי · 2026-06-08): התשובה-החוקית
 * של תרחיש חייבת להיצמד לחוק/תקנה **כולל ציון-סעיף**. ציטוט-גיבוי-חוקי נחשב
 * תקף רק אם הוא **מעוגן-מילולית** בנוסח (G1∧G2∧G3) **וגם** נושא `section`.
 * ציטוט מעוגן-ללא-סעיף אינו מספיק. ראה [[citation-per-control-law-only]].
 */
export function hasValidLegalBackup(
  legalCitations: Citation[],
  resolveBody: BodyResolver,
): LegalBackupResult {
  const gates = (legalCitations ?? []).map((c) => verifyCitation(c, resolveBody));
  const ok = gates.some((g) => g.grounded && hasSection(g));
  return { ok, gates };
}
