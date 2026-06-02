/**
 * scripts/legislation-manifest.ts — the 39-item legislation download manifest
 * for the safety-officer course (consumed by `scripts/fetch-legislation.ts`).
 *
 * ⚠️ SERVER-ONLY, no secrets — only public Nevo URLs (`nevo.co.il/law_html`),
 * which are public-domain government legislation (see ATTRIBUTION.md / COMPLIANCE).
 *
 * SOURCE-OF-TRUTH split:
 * - This TS manifest is the source-of-truth for the FETCH SCRIPT (typed,
 *   `isValidScopeId`-checked, no fragile Markdown-table parsing).
 * - `courses/safety-officer/LEGISLATION-SOURCES.md` is the source-of-truth for
 *   HUMANS (catalog, URLs, title-mismatch notes, special cases).
 * - `tests/unit/import/legislation-manifest.test.ts` asserts 0-drift between
 *   them (every entry validates, slugs unique, chapter known, no dup URL).
 *
 * SCOPE NOTES:
 * - `scopeId` is the CANONICAL committee scope id (validates against
 *   `scope-refs.ts`). `subId` carries the LEGISLATION-SOURCES.md sub-label when
 *   it differs from a canonical id (only `2.10b`, which is a second regulation
 *   under canonical scope `2.10` — דוד-קיטור + מתקני-לחץ).
 * - The output filename prefix is `subId ?? scopeId` so 2.10's two texts don't
 *   collide: `2.10-dod-kitor-2000.md` + `2.10b-bdikat-mitkanei-lachatz-1967.md`.
 * - `covers` records additional scope ids a single text also satisfies (the
 *   ordinance 2.0 covers 2.11 — מעליות/דרגנועים — which has no standalone text).
 *
 * SKIPPED (per the approved A2 plan): 2.6.1 + 2.11 (no standalone text; covered
 * within 2.6/2.0), 74832 (elevator-door — too narrow), 5.x ISO (paywalled).
 * The 2 pre-existing PDFs (1.5/1.5.1, 2.5 in docs/sources/laws/) are re-fetched
 * here as .md for a uniform RAG corpus; the PDFs remain as backup.
 */

import { isValidScopeId } from '../src/lib/db/constants/scope-refs';

/** The four downloadable chapter directories under sources/legislation/. */
export type ChapterDir = '1-irgun-hapikuach' | '2-pkudat-habetihut' | '3-gehut' | '4-hukei-ezer';

/** One legislation source to fetch from Nevo. */
export interface LegislationSource {
  /** Canonical committee scope id (must satisfy isValidScopeId). */
  readonly scopeId: string;
  /** LEGISLATION-SOURCES.md sub-label when it differs from a canonical id (e.g. '2.10b'). */
  readonly subId?: string;
  /** kebab-case slug: transliterated keyword + Gregorian year. */
  readonly slug: string;
  /** Target chapter directory. */
  readonly chapterDir: ChapterDir;
  /** Full Nevo law_html URL. */
  readonly url: string;
  /** Official title (verbatim from Nevo) — used for the L3 title cross-check. */
  readonly officialTitle: string;
  /** Extra scope ids this single text also satisfies (no standalone text of their own). */
  readonly covers?: readonly string[];
  /** Charset override for a known-non-UTF-8 page (detection handles the rest). */
  readonly charsetHint?: 'utf-8' | 'windows-1255';
  /**
   * Known source-completeness gap (Hebrew note) → emitted as `source_complete:
   * false` + `gap_note` in the frontmatter. Used for the תוספות that Nevo serves
   * as embedded base64 PNG images (NOT text) — the section text is complete &
   * verbatim, but the appendix table/formula is not text-extractable. Found by
   * the independent Workflow QA pass; recover later via OCR / official רשומות PDF.
   */
  readonly knownGap?: string;
}

const NEVO = 'https://www.nevo.co.il/law_html/';

/** The 39 legislation sources (37 catalog items + 1.5.1 + 2.5, re-fetched as .md). */
export const LEGISLATION_SOURCES: readonly LegislationSource[] = [
  // ── Chapter 1 — חוק ארגון הפיקוח + תקנות (scope 1.x) ──
  {
    scopeId: '1.0',
    slug: 'irgun-hapikuach-1954',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law00/74395.htm`,
    officialTitle: 'חוק ארגון הפיקוח על העבודה, תשי"ד-1954',
  },
  {
    scopeId: '1.1',
    slug: 'memunim-betihut-1996',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law01/026_009.htm`,
    officialTitle: 'תקנות ארגון הפיקוח על העבודה (ממונים על הבטיחות), תשנ"ו-1996',
  },
  {
    scopeId: '1.2',
    slug: 'tochnit-nihul-betihut-2013',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law00/121241.htm`,
    officialTitle: 'תקנות ארגון הפיקוח על העבודה (תכנית לניהול הבטיחות), תשע"ג-2013',
  },
  {
    scopeId: '1.3',
    slug: 'mesirat-meyda-hadracha-1999',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law00/74400.htm`,
    officialTitle: 'תקנות ארגון הפיקוח על העבודה (מסירת מידע והדרכת עובדים), תשנ"ט-1999',
  },
  {
    scopeId: '1.4',
    slug: 'vaadot-neemanei-betihut-1960',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law00/74396.htm`,
    officialTitle: 'תקנות ארגון הפיקוח על העבודה (ועדות בטיחות ונאמני בטיחות), תשכ"א-1960',
  },
  {
    scopeId: '1.5',
    slug: 'teunot-machalot-mishlach-yad-1945',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law01/p228_001.htm`,
    officialTitle: 'פקודת תאונות ומחלות משלח-יד (הודעה), 1945',
  },
  {
    scopeId: '1.5.1',
    slug: 'teunot-machalot-hodaa-1951',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law01/p228_002.htm`,
    officialTitle:
      'תקנות התאונות ומחלות משלח-היד (הודעה על מקרים מסוכנים במקומות עבודה), תשי"א-1951',
  },
  {
    scopeId: '1.5.2',
    slug: 'machalot-miktzoa-hodaa-1980',
    chapterDir: '1-irgun-hapikuach',
    url: `${NEVO}law01/p228_003.htm`,
    officialTitle: 'תקנות מחלות מקצוע (חובת הודעה — רשימה נוספת), תש"ם-1980',
  },

  // ── Chapter 2 — פקודת הבטיחות + תקנות (scope 2.x) ──
  {
    scopeId: '2.0',
    slug: 'pkudat-habetihut-1970',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74793.htm`,
    officialTitle: 'פקודת הבטיחות בעבודה [נוסח חדש], תש"ל-1970',
    covers: ['2.11'],
  },
  {
    scopeId: '2.1',
    slug: 'avoda-begova-2007',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74164.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (עבודה בגובה), תשס"ז-2007',
  },
  {
    scopeId: '2.2',
    slug: 'avodot-bniya-1988',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74821.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (עבודות בניה), תשמ"ח-1988',
  },
  {
    scopeId: '2.3',
    slug: 'tziyud-magen-ishi-1997',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74835.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (ציוד מגן אישי), תשנ"ז-1997',
    knownGap:
      'התוספת (טור א/ב/ג — איברים/עבודות/ציוד, תקנה 3) מוצגת בנבו כתמונת PNG מוטמעת — לא ניתנת-לחילוץ-טקסט. גוף הסעיפים 1–16 שלם. לשחזור-התוספת: OCR/PDF-רשומות.',
  },
  {
    scopeId: '2.4',
    slug: 'chashmal-1990',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74824.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (חשמל), תש"ן-1990',
  },
  {
    scopeId: '2.4.1',
    slug: 'chashmal-mitkan-chai-2014',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law01/500_998.htm`,
    officialTitle: 'תקנות החשמל (עבודה במיתקן חי או בקרבתו), תשע"ד-2014',
  },
  {
    scopeId: '2.4.2',
    slug: 'chashmal-mitkan-arai-2002',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law01/999_062.htm`,
    officialTitle:
      'תקנות החשמל (מיתקן חשמלי ארעי באתר בניה במתח שאינו עולה על מתח נמוך), תשס"ג-2002',
  },
  {
    scopeId: '2.5',
    slug: 'ezra-rishona-1988',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74822.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (עזרה ראשונה במקומות עבודה), תשמ"ח-1988',
  },
  {
    scopeId: '2.6',
    slug: 'agoranaim-atatim-1992',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law01/051_049.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (עגורנאים, מפעילי מכונות הרמה אחרות ואתתים), תשנ"ג-1992',
    covers: ['2.6.1'],
    knownGap:
      'התוספת החמישית (תקנה 18(ג) — טופס-מינוי) מוצגת בנבו כתמונה — חסרת-טקסט. סעיפים 1–23 + תוספות 1–4 שלמים. לשחזור: OCR/PDF-רשומות.',
  },
  {
    scopeId: '2.6.2',
    slug: 'haramat-bnei-adam-malgazot-1983',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74809.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (הרמת בני אדם במלגזות), תשמ"ג-1983',
  },
  {
    scopeId: '2.7',
    slug: 'gilyon-betihut-sds-1998',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74836.htm`,
    officialTitle:
      'תקנות הבטיחות בעבודה (גיליון בטיחות, סיווג, אריזה, תיווי וסימון של אריזות), תשנ"ח-1998',
  },
  {
    scopeId: '2.8',
    slug: 'mechonot-haklaiyot-1988',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74823.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (בטיחות במכונות חקלאיות), תשמ"ח-1988',
    knownGap:
      'עמוד-נבו קצר (11KB) הנקטע אחרי סעיף 18 — המשך-הסעיפים/התוספת אינם בטקסט-העמוד (כנראה תמונה/עמוד-נפרד). לאימות-שלמות ולשחזור: PDF-רשומות.',
  },
  {
    scopeId: '2.9',
    slug: 'avoda-gagot-shvirim-1986',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74818.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (עבודה על גגות שבירים או תלולים), תשמ"ו-1986',
  },
  {
    scopeId: '2.10',
    slug: 'dod-kitor-2000',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/74837.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (מפעיל דוד קיטור ודוד הסקה), התש"ס-2000',
  },
  {
    scopeId: '2.10',
    subId: '2.10b',
    slug: 'bdikat-mitkanei-lachatz-1967',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law00/40532.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (בדיקת מיתקני לחץ), תשכ"ז-1967',
  },
  {
    scopeId: '2.11.1',
    slug: 'tichnun-vehabniya-1965',
    chapterDir: '2-pkudat-habetihut',
    url: `${NEVO}law01/044_001.htm`,
    officialTitle: 'חוק התכנון והבניה, תשכ"ה-1965',
  },

  // ── Chapter 3 — תקנות גהות (scope 3.x) ──
  {
    scopeId: '3.1',
    slug: 'nitur-svivati-biologi-2011',
    chapterDir: '3-gehut',
    url: `${NEVO}law01/500_552.htm`,
    officialTitle:
      'תקנות הבטיחות בעבודה (ניטור סביבתי וניטור ביולוגי של עובדים בגורמים מזיקים), תשע"א-2011',
  },
  {
    scopeId: '3.2',
    slug: 'gehut-raash-1984',
    chapterDir: '3-gehut',
    url: `${NEVO}law00/74815.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובריאות העובדים ברעש), תשמ"ד-1984',
  },
  {
    scopeId: '3.3',
    slug: 'gehut-avak-mazik-1984',
    chapterDir: '3-gehut',
    url: `${NEVO}law01/051_033.htm`,
    officialTitle:
      'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובריאות הציבור והעובדים באבק מזיק), תשמ"ד-1984',
  },
  {
    scopeId: '3.4',
    slug: 'gehut-krina-minenet-1992',
    chapterDir: '3-gehut',
    url: `${NEVO}law01/051_047.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובריאות העוסקים בקרינה מיננת), תשנ"ג-1992',
  },
  {
    scopeId: '3.5.1',
    slug: 'gehut-benzen-1983',
    chapterDir: '3-gehut',
    url: `${NEVO}law01/051_032.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובריאות העובדים בבנזן), תשמ"ד-1983',
  },
  {
    scopeId: '3.5.2',
    slug: 'gehut-kaspit-1985',
    chapterDir: '3-gehut',
    url: `${NEVO}law00/74817.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובריאות העובדים בכספית), תשמ"ה-1985',
    knownGap:
      'התוספת השלישית (ערכי-חשיפה, תקנות 2(א)/5) ונוסחת-החישוב בסעיף 2(ב) מוצגות בנבו כתמונה — חסרות-טקסט. סעיפים 1–19 שלמים. לשחזור: OCR/PDF-רשומות.',
  },
  {
    scopeId: '3.5.3',
    slug: 'chomrei-hadbara-1964',
    chapterDir: '3-gehut',
    url: `${NEVO}law00/74799.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (עובדים בחמרי הדברה), תשכ"ד-1964',
  },
  {
    scopeId: '3.6',
    slug: 'gehut-maabadot-2001',
    chapterDir: '3-gehut',
    url: `${NEVO}law00/74839.htm`,
    officialTitle:
      'תקנות הבטיחות בעבודה (בטיחות וגיהות תעסוקתית בעבודה עם גורמים מסוכנים במעבדות רפואיות, כימיות וביולוגיות), תשס"א-2001',
  },
  {
    scopeId: '3.7',
    slug: 'gehut-krinat-laser-2005',
    chapterDir: '3-gehut',
    url: `${NEVO}law00/73936.htm`,
    officialTitle: 'תקנות הבטיחות בעבודה (גיהות תעסוקתית ובטיחות העוסקים בקרינת לייזר), תשס"ה-2005',
  },

  // ── Chapter 4 — חוקי-עזר (scope 4.x) ──
  {
    scopeId: '4.1',
    slug: 'avodat-nashim-1954',
    chapterDir: '4-hukei-ezer',
    url: `${NEVO}law00/74249.htm`,
    officialTitle: 'חוק עבודת נשים, תשי"ד-1954',
  },
  {
    scopeId: '4.2',
    slug: 'avodat-hanoar-1953',
    chapterDir: '4-hukei-ezer',
    url: `${NEVO}law00/4273.htm`,
    officialTitle: 'חוק עבודת הנוער, תשי"ג-1953',
  },
  {
    scopeId: '4.3',
    slug: 'rishuy-asakim-1968',
    chapterDir: '4-hukei-ezer',
    url: `${NEVO}law01/p212m1_001.htm`,
    officialTitle: 'חוק רישוי עסקים, תשכ"ח-1968',
  },
  {
    scopeId: '4.3.1',
    slug: 'rishuy-asakim-achsanat-neft-1976',
    chapterDir: '4-hukei-ezer',
    url: `${NEVO}law00/4865.htm`,
    officialTitle: 'תקנות רישוי עסקים (אחסנת נפט), תשל"ז-1976',
  },
  {
    scopeId: '4.4',
    slug: 'chomarim-mesukanim-1993',
    chapterDir: '4-hukei-ezer',
    url: `${NEVO}law01/154_001.htm`,
    officialTitle: 'חוק החמרים המסוכנים, תשנ"ג-1993',
  },
  {
    scopeId: '4.5',
    slug: 'chok-hagaz-1989',
    chapterDir: '4-hukei-ezer',
    url: `${NEVO}law01/058_001.htm`,
    officialTitle: 'חוק הגז (בטיחות ורישוי), תשמ"ט-1989',
  },
] as const;

/** Output filename: `<subId|scopeId>-<slug>.md` (subId disambiguates 2.10's two texts). */
export function fileNameFor(s: LegislationSource): string {
  return `${s.subId ?? s.scopeId}-${s.slug}.md`;
}

/** Repo-relative output path for a source. */
export function relPathFor(s: LegislationSource): string {
  return `courses/safety-officer/sources/legislation/${s.chapterDir}/${fileNameFor(s)}`;
}

/** Validate the manifest at module-load (fail fast on a typo'd scope/dup slug). */
export function validateManifest(
  sources: readonly LegislationSource[] = LEGISLATION_SOURCES,
): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const urls = new Set<string>();
  const fileNames = new Set<string>();
  for (const s of sources) {
    if (!isValidScopeId(s.scopeId)) errors.push(`invalid canonical scopeId: ${s.scopeId}`);
    const fn = fileNameFor(s);
    if (fileNames.has(fn)) errors.push(`duplicate filename: ${fn}`);
    fileNames.add(fn);
    if (slugs.has(s.slug)) errors.push(`duplicate slug: ${s.slug}`);
    slugs.add(s.slug);
    if (urls.has(s.url)) errors.push(`duplicate url: ${s.url}`);
    urls.add(s.url);
    if (!/^https:\/\/www\.nevo\.co\.il\/law_html\//.test(s.url)) {
      errors.push(`unexpected url host: ${s.url}`);
    }
  }
  return errors;
}
