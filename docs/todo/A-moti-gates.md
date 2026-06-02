# TODO · A — שערי-מוטי — ISO · חקיקה · פרויקט-גמר

> שלב A ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: 🔴 חוסם (A3 ✅ הושלם; נותרו A1+A2) · תלות: חוסם את M5 (B) · תלוי באישורי-מוטי · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

שלושת השערים שדורשים הכרעת-מוטי נסגרו: (1) הוכרע שילוב/מיקום שתי טיוטות-ה-ISO (31010 + 31000) בתוך ה-curriculum; (2) אושרה טבלת-37-הנוסחים ו-~35 הנוסחים נחלת-הכלל הורדו מנבו לתיקיות `sources/legislation/` בשמות-קובץ תקניים; (3) התקבלה מצגת-ההנחיות ממשרד-העבודה ו-`FINAL-PROJECT.md` עודכן לפרויקט-גמר אמיתי. סגירת השלוש פותחת את M5 (ייבוא + תיוג + אימות מול הנוסחים).

## תלויות

**חוסם:** M5 (שלב B — discovery-curation + ייבוא) אינו יכול להתחיל ללא הנוסחים ב-repo (בסיס-האימות) ולא לפני הכרעת-מיקום ה-ISO. **תלוי:** שלושת הסעיפים חוסמים על אישור/קלט-מוטי (סקירת-ISO · אישור-טבלה · מצגת-הנחיות) — אינם ניתנים לביצוע-עצמאי עד הקלט. **name-clean** חל לכל אורך השלב: חקיקה = נחלת-כלל לשימוש-ישיר; חומרי-מרצה ושמות-אדם = reference/השמטה בלבד.

## תתי-משימות

- [ ] **A1 · ISO** — סקירת [`ISO-31010-DRAFT.md`](../../courses/safety-officer/ISO-31010-DRAFT.md) (scope 5.3) + [`ISO-31000-DRAFT.md`](../../courses/safety-officer/ISO-31000-DRAFT.md) (scope 5.4) עם מוטי → הכרעה על שילוב/מיקום ב-curriculum · קריטריון-קבלה: שתי הטיוטות עוברות מ-🔴 `DRAFT` למצב-מאושר עם מיקום-curriculum מוגדר (31000 = מסגרת/תהליך פרק-ט; 31010 = ארגז-כלי-ההערכה scope 6.x — 9 השיטות JSA/What-if/PHA/FMEA-FMECA/HAZOP/FTA/ETA/Bow-Tie/5M); הוכרע אם תקציר-מקורי נשאר מספיק (אין נוסח-תקן — בתשלום) או נדרש חיזוק · ref: [ISO-31010-DRAFT](../../courses/safety-officer/ISO-31010-DRAFT.md) · [ISO-31000-DRAFT](../../courses/safety-officer/ISO-31000-DRAFT.md) · [LEGISLATION-COVERAGE](../../courses/safety-officer/LEGISLATION-COVERAGE.md)
- [ ] **A2 · חקיקה** — אישור טבלת-37-נוסחים → הורדת ~35 מנבו ל-`courses/safety-officer/sources/legislation/<פרק>/<scope>-<slug>.pdf` · קריטריון-קבלה: מוטי אישר את טבלת [`LEGISLATION-SOURCES.md`](../../courses/safety-officer/LEGISLATION-SOURCES.md); ~33 הנוסחים החסרים (פרט ל-2 הקיימים 1.5.1, 2.5) הורדו לפי שם-קובץ `<scope-id>-<slug>.pdf` תחת התיקיות 1-irgun-hapikuach / 2-pkudat-habetihut / 3-gehut / 4-hukei-ezer; 2.6.1 (עגורני-צריח — אין נוסח-עצמאי) מטופל ע"י תקנות-עגורנאים תשנ"ג-1992 **תקנה 65** + פקודת-הבטיחות 2.0; כל פריט עובר 🔵→🟢 ב-SOURCES · ref: [LEGISLATION-SOURCES](../../courses/safety-officer/LEGISLATION-SOURCES.md) · [LEGISLATION-COVERAGE](../../courses/safety-officer/LEGISLATION-COVERAGE.md)
- [x] **A3 · פרויקט-גמר** ✅ — הנחיות-המשרד הועלו (2026-06-02, Drive: חומרי-לימוד/"פרויקט גמר" `1k1u…`: `פרויקטים.pdf` + 3 טמפלייטים) ושולבו ל-[`FINAL-PROJECT.md`](../../courses/safety-officer/FINAL-PROJECT.md): **8 נושאי-פרויקט** רשמיים · **פורמט-JSA** (חובה מ-19.10.2025) · **מבנה-מסמך 6-חלקים** · **מטריצת-סיכון 4×4**. נותר (לא-חוסם, מחוץ-לשער): בניית מצב-capstone בקוד (שלב D) + הכרעת-פרטיות על הדוגמה/טמפלייטים (PII). · ref: [FINAL-PROJECT](../../courses/safety-officer/FINAL-PROJECT.md) · [ATTRIBUTION](../../courses/safety-officer/ATTRIBUTION.md) · [COMPLIANCE](../compliance/COMPLIANCE.md)

## מסמכי-ייחוס (קרא לפני עבודה)

- [../../courses/safety-officer/ISO-31010-DRAFT.md](../../courses/safety-officer/ISO-31010-DRAFT.md) — טיוטת תקציר ISO/IEC 31010 (קטלוג 9 שיטות-הערכת-סיכון + מטריצת-בחירה), scope 5.3.
- [../../courses/safety-officer/ISO-31000-DRAFT.md](../../courses/safety-officer/ISO-31000-DRAFT.md) — טיוטת תקציר ISO 31000 (3 רבדים: עקרונות → מסגרת → תהליך), scope 5.4.
- [../../courses/safety-officer/LEGISLATION-SOURCES.md](../../courses/safety-officer/LEGISLATION-SOURCES.md) — אינדקס 37 נוסחי-חקיקה + URLs מנבו + מקרים-מיוחדים (2.6.1 / 2.10 / 2.11).
- [../../courses/safety-officer/LEGISLATION-COVERAGE.md](../../courses/safety-officer/LEGISLATION-COVERAGE.md) — מטריצת-כיסוי 48✅/7🟠/2🔴 (הפער-האמיתי: 5.3 + 5.4).
- [../../courses/safety-officer/FINAL-PROJECT.md](../../courses/safety-officer/FINAL-PROJECT.md) — מפרט מיני-קורס capstone (6 שלבי-ליווי) + placeholder מצגת-ההנחיות.
- [../../courses/safety-officer/ATTRIBUTION.md](../../courses/safety-officer/ATTRIBUTION.md) — כלל-זכויות (name-clean) פר-קבוצת-חומר + § פתוח-להכרעת-מוטי.
- [../compliance/COMPLIANCE.md](../compliance/COMPLIANCE.md) — מסגרת IP/זכויות (חקיקה=נחלת-כלל · ISO=תקצירים · מרצה=reference+שכתוב).

## החלטות פתוחות / הערות

- **A1:** האם ISO-31000/31010 נכנסים כפרק-curriculum מובחן או נשזרים בפרק-ט (ניהול-סיכונים) הקיים — להכרעת-מוטי. נוסח-התקן עצמו בתשלום ומוגן — תקציר-מקורי בלבד, ללא שכפול-טקסט.
- **A2:** נוסחי-נבו הם "נוסח עדכני" (מאוחד) — לציטוט-מחייב לאמת מול רשומות/קובץ-התקנות (לאמת). שכבת רפורמות-2025 חסרה בנוסחים-הישנים — לא תוכן-קורס כעת (טריגר 10/2026). 🎧 17 הקלטות-חקיקה (אודיו) זמינות בתיקיית "פודקסטים" (`UNREAD-MEDIA.md`, **עיבוד-דחוי**) — אינן מחליפות את נוסחי-ה-PDF.
- **A3:** ✅ ההנחיות התקבלו ושולבו (8 נושאים · פורמט-JSA רשמי · מבנה-מסמך 6-חלקים · מטריצת-4×4). הטמפלייטים+הדוגמה מכילים PII → reference-פנימי בלבד (הכרעת-פרטיות פתוחה ב-`ATTRIBUTION.md`). מימוש מצב-capstone = שלב D.
