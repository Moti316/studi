/**
 * src/lib/legislation/catalog.ts — קטלוג-החקיקה לתצוגת ספריית-החקיקה.
 *
 * מקור-אמת יחיד: `scripts/legislation-manifest.ts` (`LEGISLATION_SOURCES`, 42 נוסחים)
 * — אותו manifest שמזין את `fetch-legislation.ts` ומחולל את `INDEX.md`. כאן אנו
 * **נגזרים** ממנו תצוגה היררכית (4 פרקים · חוק > תקנותיו) ללא שכפול-נתונים.
 *
 * server-safe: ה-manifest מכיל רק URL-ים ציבוריים (נבו) ו-Drive-file-ids ציבוריים
 * (לא סודות). הדף הוא RSC.
 */
import {
  LEGISLATION_SOURCES,
  relPathFor,
  driveUrl,
  type LegislationSource,
  type ChapterDir,
  type Depth,
} from '../../../scripts/legislation-manifest';

/** פריט-חקיקה מוכן-לתצוגה. */
export interface LegislationItem {
  /** scope קנוני (למשל '2.4'). */
  readonly scopeId: string;
  /** מזהה-תצוגה: subId אם קיים (למשל '2.8.1','2.10b'), אחרת scopeId. */
  readonly displayId: string;
  /** כותרת רשמית (verbatim נבו). */
  readonly title: string;
  /** שנת-החקיקה (גרגוריאני · נגזר מה-slug). */
  readonly year: number;
  /** עומק-בתכנית (905018). */
  readonly depth: Depth;
  /** קישור לנוסח-נבו (ציבורי). */
  readonly nevoUrl: string;
  /** קישור ל-PDF-המחייב ב-Drive (creator-gated). */
  readonly pdfUrl: string;
  /** נתיב ה-`.md` בריפו (נוסח-עבודה). */
  readonly mdPath: string;
}

/** פרק = משפחת-חוק אחת (חוק/פקודה + תקנותיו). */
export interface LegislationChapter {
  readonly dir: ChapterDir;
  /** מספר-פרק 1..4. */
  readonly num: number;
  /** כותרת-הפרק (משפחת-החוק). */
  readonly title: string;
  readonly items: readonly LegislationItem[];
}

/** כותרות-הפרקים (משפחות-החוק) — מסודר חוק > תקנותיו. */
const CHAPTER_TITLES: Record<ChapterDir, string> = {
  '1-irgun-hapikuach': 'חוק ארגון הפיקוח על העבודה ותקנותיו',
  '2-pkudat-habetihut': 'פקודת הבטיחות בעבודה ותקנותיה',
  '3-gehut': 'תקנות הגיהות התעסוקתית',
  '4-hukei-ezer': 'חוקי-עזר ותקנות משלימות',
};

const CHAPTER_ORDER: readonly ChapterDir[] = [
  '1-irgun-hapikuach',
  '2-pkudat-habetihut',
  '3-gehut',
  '4-hukei-ezer',
];

/** תווית-עברית לעומק-בתכנית. */
export const DEPTH_LABELS: Record<Depth, string> = {
  core: 'ליבה',
  framework: 'מסגרת',
  topic: 'ענפי',
};

/** מזהה-תצוגה: subId אם קיים, אחרת scopeId. */
function displayIdOf(s: LegislationSource): string {
  return s.subId ?? s.scopeId;
}

/** שנת-חקיקה מתוך ה-slug (4 הספרות האחרונות). 0 אם לא-נמצא. */
function yearOf(s: LegislationSource): number {
  const m = s.slug.match(/(\d{4})$/);
  return m ? Number(m[1]) : 0;
}

/** מיון לפי חלקי-displayId המספריים (1.5 לפני 1.5.1, 2.9 לפני 2.10). */
function compareDisplayId(a: string, b: string): number {
  const pa = a.split('.');
  const pb = b.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    // חלק עשוי לשאת אות (למשל '10b') → השווה מספר תחילה ואז מחרוזת.
    const sa = pa[i] ?? '';
    const sb = pb[i] ?? '';
    const na = parseInt(sa, 10);
    const nb = parseInt(sb, 10);
    if (na !== nb) return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
    if (sa !== sb) return sa < sb ? -1 : 1;
  }
  return 0;
}

/** ממיר source → item-תצוגה. */
function toItem(s: LegislationSource): LegislationItem {
  return {
    scopeId: s.scopeId,
    displayId: displayIdOf(s),
    title: s.officialTitle,
    year: yearOf(s),
    depth: s.depth,
    nevoUrl: s.url,
    pdfUrl: driveUrl(s.driveFileId),
    mdPath: relPathFor(s),
  };
}

/**
 * הקטלוג ההיררכי: 4 פרקים, כל פרק עם פריטיו ממוינים לפי scope.
 * נבנה פעם-אחת (module-level · נתון-סטטי).
 */
export const LEGISLATION_CHAPTERS: readonly LegislationChapter[] = CHAPTER_ORDER.map(
  (dir, idx) => ({
    dir,
    num: idx + 1,
    title: CHAPTER_TITLES[dir],
    items: LEGISLATION_SOURCES.filter((s) => s.chapterDir === dir)
      .map(toItem)
      .sort((a, b) => compareDisplayId(a.displayId, b.displayId)),
  }),
);

/** סך-כל הנוסחים בקטלוג (לכותרת/סטטיסטיקה). */
export const LEGISLATION_TOTAL = LEGISLATION_SOURCES.length;

/** רשימה-שטוחה (לחיפוש client-side). */
export const LEGISLATION_FLAT: readonly LegislationItem[] = LEGISLATION_CHAPTERS.flatMap(
  (c) => c.items,
);
