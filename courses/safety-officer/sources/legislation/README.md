# Legislation corpus — נוסחי-החקיקה (בסיס-אימות)

> טקסטי-חוק/תקנות מלאים — **נחלת-הכלל**, מקור-אמת לאימות שאלות (ADR-005). רשימת-הנדרש + סטטוס: [`../../LEGISLATION-SOURCES.md`](../../LEGISLATION-SOURCES.md).
> **מוסכמת-שמות:** `<scope-id>-<slug>.md` (למשל `2.1-avoda-begova-2007.md`) — תואם לפרסרים ול-`scope-refs.ts` (התיוג לפי שם-הקובץ, ללא תלות בסיומת).

## פורמט: `.md` verbatim + frontmatter (לא `.pdf`)

הקורפוס נמשך אוטומטית מנבו (HTML) כ-**טקסט-נקי verbatim** ב-`.md` עם frontmatter, ע"י [`scripts/fetch-legislation.ts`](../../../../scripts/fetch-legislation.ts) (מניפסט 39-פריטים ב-[`scripts/legislation-manifest.ts`](../../../../scripts/legislation-manifest.ts)). נבו לא מגיש PDF, והחילוץ דטרמיניסטי (regex לא-גנרטיבי, לא WebFetch/AI → אפס סיכון-שכתוב).

- **`.md` = קורפוס-עבודה/RAG** — "נוסח עדכני" של נבו (מאוחד/מתוקן), נכון ל-`version_date` שב-frontmatter.
- **המקור-המחייב-לציטוט = PDF מרשומות/קובץ-התקנות** — מופנה ב-`authoritative_source` שב-frontmatter. ל-ציטוט-מחייב לוועדה יש לאמת דגימתית מול הרשומות (ראה `LEGISLATION-SOURCES.md` §כיול-דיוק).

### ערובת-נאמנות ("מילה-במילה")
ה-extractor הוא **לא-גנרטיבי** → לא משכתב, רק יכול להשמיט/להוסיף בגבולות. הבקרות:
- **L1** (פנימי ב-`stripNevoHtml`): רצף-טוקנים של הפלט **זהה** לחילוץ-פרמיסיבי של אותו אזור (zero-loss) — אחרת זריקת-שגיאה.
- **L2–L5** (`pnpm legislation:verify`): רציפות-מספור, גבולות+אין-chrome, שלמות-עברית (charset), frontmatter תקין.
- **L1-חי** (`--verify-live`): diff-טוקנים מול נבו החי — אומת **39/39 identical**.

> **הערה (נוסחים מתבנית-נבו-ישנה):** חלק מהנוסחים (1.5, 1.5.1, 1.5.2, 2.11.1, 4.5) הם Word-export ללא תגי-כותרת; הם כוללים בראשם, verbatim, breadcrumb-נושאי + "תוכן ענינים" של נבו לפני גוף-החוק. זה נשמר מכוון (verbatim-לנבו; חיתוך-עריכתי מסכן השמטת-טקסט).

## מבנה

- `1-irgun-hapikuach/` — חוק ארגון הפיקוח 1954 + תקנותיו (scope 1.x) — 8 נוסחים
- `2-pkudat-habetihut/` — פקודת הבטיחות 1970 + תקנותיה (scope 2.x) — 16 נוסחים
- `3-gehut/` — תקנות גהות תעסוקתית (scope 3.x) — 9 נוסחים
- `4-hukei-ezer/` — חוקי-עזר (scope 4.x) — 6 נוסחים
- `_standards/` — ⚠️ תקני-ISO/ת"י (בתשלום, **לא** נחלת-כלל) — תקצירים-מקוריים בלבד, לא נוסח-התקן.

## סטטוס

**39 נוסחים הורדו** (8/16/9/6) ואומתו 39/39 (`legislation:verify-live`). דולגו (מכוון): 2.6.1+2.11 (אין-נוסח-עצמאי — מכוסים ב-2.6/2.0), 5.x ISO (בתשלום). הרצה-מחדש: `pnpm legislation:fetch` (idempotent; cache ב-`.cache/nevo/`).
