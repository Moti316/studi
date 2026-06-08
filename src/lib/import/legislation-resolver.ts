/**
 * src/lib/import/legislation-resolver.ts — עטיפת-fs ל-G2/G3: פותרת scopeId →
 * גוף-נוסח-החקיקה האמיתי מהקורפוס (`courses/safety-officer/sources/legislation/`).
 *
 * ⚠️ SERVER/SCRIPT-ONLY (קורא מ-fs). מספק את ה-`BodyResolver` ש-verify-grounding
 * (הטהור) מזריק. INDEX.md נקרא פעם-אחת ונשמר-במטמון; גופי-ה-`.md` ממוטמנים פר-scope.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLegislationIndex, stripFrontmatter, type BodyResolver } from './verify-grounding';

/** שורש-קורפוס-החקיקה (נוסחי-נבו verbatim כ-`.md`). */
export const LEGI_DIR = join(process.cwd(), 'courses', 'safety-officer', 'sources', 'legislation');
const INDEX_PATH = join(LEGI_DIR, 'INDEX.md');

let _indexMap: Map<string, string> | null = null;
/** מפת scopeId → נתיב-`.md` יחסי-לשורש (מ-INDEX.md · ממוטמן). */
function indexMap(): Map<string, string> {
  if (!_indexMap) _indexMap = parseLegislationIndex(readFileSync(INDEX_PATH, 'utf8'));
  return _indexMap;
}

const _bodyCache = new Map<string, string | null>();

/**
 * scopeId → גוף-נוסח (`.md` ללא frontmatter) או null אם אין נוסח בקורפוס
 * (למשל תקני-ISO/שיטות-ניתוח/גופים שאין-להם חקיקה ב-`.md`). ממוטמן.
 */
export const resolveScopeBody: BodyResolver = (scopeId) => {
  if (_bodyCache.has(scopeId)) return _bodyCache.get(scopeId) ?? null;
  const rel = indexMap().get(scopeId);
  let body: string | null = null;
  if (rel) {
    try {
      // הנתיב ב-INDEX.md יחסי-לשורש-הריפו (courses/.../legislation/…/x.md).
      body = stripFrontmatter(readFileSync(join(process.cwd(), rel), 'utf8'));
    } catch {
      body = null;
    }
  }
  _bodyCache.set(scopeId, body);
  return body;
};

/** מחזיר את ה-resolver-האמיתי (לשימוש ב-import-scenarios). */
export function createDefaultBodyResolver(): BodyResolver {
  return resolveScopeBody;
}
