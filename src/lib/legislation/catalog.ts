/**
 * src/lib/legislation/catalog.ts — קטלוג-החקיקה לתצוגת ספריית-החקיקה.
 *
 * מקור-אמת יחיד: `scripts/legislation-manifest.ts` (`LEGISLATION_SOURCES`)
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
import { COURSE_TOPICS } from '../course/topics';

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
  /** קישור ל-PDF-המחייב ב-Drive (creator-gated). null = ממתין-להעלאה (drivePdfPending). */
  readonly pdfUrl: string | null;
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
    pdfUrl: s.driveFileId ? driveUrl(s.driveFileId) : null,
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

// ---------------------------------------------------------------------------
// מפת-נושאים — קיבוץ לפי 8 יחידות-הקורס (הכרעת-מוטי 2026-06-11)
// ---------------------------------------------------------------------------

/** מדף-נושא: יחידת-קורס + נוסחי-החקיקה ששייכים אליה. */
export interface LegislationTopicShelf {
  /** topic.id (מ-COURSE_TOPICS) או 'extra' (נוסחים ללא-יחידה). */
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  /** שם-אייקון lucide (ממופה ברכיב). */
  readonly icon: string;
  /** קישור-תרגול ל-/lesson/<topic-id> (ל-'extra' — אין). */
  readonly practiceHref?: string;
  readonly items: readonly LegislationItem[];
}

/**
 * LEGISLATION_BY_TOPIC — הקטלוג מקובץ לפי יחידות-הקורס (חקיקה↔למידה):
 * פריט משויך ליחידה ש-`topic.scopes` שלה מכיל את ה-scopeId שלו (תקנות-משנה
 * נושאות את scope-האב → נופלות לאותה-יחידה). נוסחים ללא-יחידה → מדף "נוספים".
 * נבנה פעם-אחת (module-level · נתון-סטטי).
 */
export const LEGISLATION_BY_TOPIC: readonly LegislationTopicShelf[] = (() => {
  const claimed = new Set<string>(); // displayId-ים שכבר-שובצו
  const shelves: LegislationTopicShelf[] = COURSE_TOPICS.map((t) => {
    const items = LEGISLATION_FLAT.filter((i) => t.scopes.includes(i.scopeId)).sort((a, b) =>
      compareDisplayId(a.displayId, b.displayId),
    );
    for (const i of items) claimed.add(i.displayId);
    return {
      id: t.id,
      title: t.title,
      blurb: t.blurb,
      icon: t.icon,
      practiceHref: `/lesson/${t.id}`,
      items,
    };
  }).filter((s) => s.items.length > 0);

  const extra = LEGISLATION_FLAT.filter((i) => !claimed.has(i.displayId)).sort((a, b) =>
    compareDisplayId(a.displayId, b.displayId),
  );
  if (extra.length > 0) {
    shelves.push({
      id: 'extra',
      title: 'נוספים ומשלימים',
      blurb: 'נוסחים שאינם משויכים ליחידת-תרגול (עדיין)',
      icon: 'BookMarked',
      items: extra,
    });
  }
  return shelves;
})();
