# M5 — Discovery Curation (צמצום ה-discovery לפני הרצת-ייבוא)

> **סטטוס:** ⏳ ממתין לאישור-מוטי. נוצר 2026-06-02 (ריצת-לילה, instance #5).
> **קשור:** [`docs/architecture/ADR-011-drive-import-pipeline.md`](architecture/ADR-011-drive-import-pipeline.md) ·
> [`scripts/import-content.ts`](../scripts/import-content.ts) · [`scripts/import-content.config.ts`](../scripts/import-content.config.ts) · `TODO.md` (משימה M5).

## הבעיה (מאומתת ב-dry-run + ב-code-review)

`pnpm import:t1:dry` (2026-06-02) גילה **71 קבצים פריכים** (PDF/DOCX/GoogleDoc) בתיקיות-Drive,
אבל רק **5** מהם נמצאים ב-allow-list המאושר (`T1_FILE_IDS`). ~66 הנותרים הם **חומרי-לימוד**
(מצגות-שיעור, נוסחי-חוק, פסקי-דין, סיכומים, SDS, פיגומים…) — **לא בנקי-שאלות**.

ה-code-review (M6) דירג זאת **P1**: ה-`discover()` סרק את תיקיות-השורש וקיבל כל MIME פריך, וה-execute
loop היה מפרסר ומכניס את כולם ל-`questions` → **זיהום ה-DB** בשאלות-זבל ממצגות/חוקים.

## מה כבר תוקן (M6, commit של תיקוני-הסקירה)

ב-[`scripts/import-content.ts`](../scripts/import-content.ts) נוסף **שער default-deny**: גם ב-dry וגם ב-execute
מפרסרים/מכניסים **רק** File-IDs שב-`T1_FILE_ID_SET`. שאר הקבצים הפריכים נרשמים ב-report כ-`skipped`
(`reason: not in T1 allow-list`). כך ה-DB מוגן ללא תלות בתוכן ה-allow-list.

**מסקנה:** הצינור עכשיו **בטוח** — אבל ה-allow-list מכיל רק 5 קבצים, אז ייבוא כרגע יביא רק אותם.
כדי להגיע ל-~540 השאלות צריך **להרחיב את ה-allow-list** לבנקי-השאלות האמיתיים. זו החלטת-קוריישן שלך 👇.

## טבלת-קוריישן — מוצע (סיווג לפי שם-קובץ; דורש אישורך)

### ✅ בנקי-שאלות מוצעים להוספה ל-`T1_FILE_IDS` (~14 + 5 קיימים = ~19)

| # | שם-קובץ | File-ID | הערה |
|---|---------|---------|------|
| 1 | Emailing שאלות סימולציה ערוך.pdf | `1CdpnnRPdsV02H474nbl0er480qr12SJr` | ✅ כבר ב-allow-list |
| 2 | לקט שאלות ותשובות למבחן הסמכה.docx | `19ZP5YxWIa2e-72VPeTgSHMP97JXQ6GOB` | ✅ כבר ב-allow-list |
| 3 | שאלות לבחינת וועדה.pdf | `1-9TTVJDSPoOWuPgYxmvPisBepjMBIlic` | ✅ כבר ב-allow-list |
| 4 | מאגר שאלות הכנה לוועדה ספט׳2025.pdf | `1BA9XpSDVNx-MVbiyQZCndeyMVROTZ0aG` | ✅ כבר ב-allow-list |
| 5 | שו"ת ציוד מגן אישי.docx | `1RP2F2x-GwqX5sybXBWUORgtbO7VPFNLP` | ✅ כבר ב-allow-list |
| 6 | שאלות למבחן הסמכה - עם תשובות - אייל-3.pdf | `1o1WV_bDpks_VW5flHlqhZnM5k8r2P4mJ` | להוסיף |
| 7 | שאלות למבחן הסמכה - עם תשובות - אייל-2.pdf | `15ri4zo7BiMt8q9hq90NI2zNujThnOc4G` | להוסיף |
| 8 | שאלות למבחן הסמכה - עם תשובות - אייל-1.pdf | `1P7D3BWzysHyHSvitQK4ratmprVx8GUFE` | להוסיף |
| 9 | שאלות למבחן הסמכה - עם תשובות - אייל.pdf | `1qbmxVzFHmhqffDyn_5_6EOy5bmfFT9GX` | להוסיף |
| 10 | שאלות מוועדות הסמכה לממונים - חשמל.pdf | `1nv0HAbLzpjESjH7oLDXxLIQIbOn-261v` | להוסיף |
| 11 | Emailing שאלות למבחן.pdf | `1D-efRZrQoqq2x-8Ojn-W3o1pmIdz4qjq` | להוסיף |
| 12 | שאלות לבחינת וועדה (Google Doc) | `1oBAi8449khJxXSMjXHkvYzyC_WOaRr1RxObC0CCljmo` | כפילות-אפשרית של #3 — לבדוק |
| 13 | שאלות למבחן אבי לוי.pdf | `1hUvTUJmckBTL5urKJN_Ypd4JZzGcQGTJ` | להוסיף |
| 14 | מבחן שיעור 1 עם תשובות.pdf | `1oH0Co3AfVLHVNMunUG0srQWzjIHLxdRq` | להוסיף |
| 15 | מבחן שיעור 1(1) עם תשובות.pdf | `1eL6QJNIrcXDLdcKkyECqG4A562T_-rIw` | כפילות-אפשרית של #14 — לבדוק |
| 16 | מבחן שיעור 2 עם תשובות.pdf | `1q2RykwKwUT4Zb4tlmzHE9LGqRXZqgljA` | להוסיף |
| 17 | מבחן שיעור 3 עם תשובות.pdf | `1RJaobK9AcEoqYpo5x8W9PwakW4bEVv_Y` | להוסיף |
| 18 | מבחן שיעור 4 עם תשובות.pdf | `1VfrbGuUtRfRy3fUJBs_MXInX3nAe-tDs` | להוסיף |

### ⚠️ גבוליים — להחלטתך (חזרה/סיכום — ייתכן Q&A או חומר)

| שם-קובץ | File-ID |
|---------|---------|
| Emailing חזרה להסמכה 2.pdf | `1CgJflwPwWUHdjRx1JEtwulzB8Du8kA5v` |
| סיכום אחרון ודי בהצלחה (2).docx | `1tnqszrNNAsmmRtwRsjIgs6QHyHgZ9YA3` |

### ❌ חומרי-לימוד (לא בנקי-שאלות) — להשאיר מחוץ ל-allow-list (~50)

מצגות-שיעור 1–5 · מצגת-חזרה (שאדי) · מצגת יום-3 2013 · נוסחי-חוק (פקודת הבטיחות 1970, חוק ארגון
פיקוח 1954, תקנות מסירת-מידע 1999, תקנות תכנית-לניהול 2013, תקנות מעבדות 2001, תקנות גיליון-בטיחות
1998) · פס"ד חלוקת-אחריות · דשבורד-חקיקה (×2) · טמפלייט תוכנית-בטיחות (×2) · תקן 45001 סיכום-שיעור (×2) ·
פיגומים (×2) · עבודה-בגובה מבוא/פירוט · ממיסים-אורגניים · ניטור-סביבתי · TLV · SDS (×2/Compliance) ·
בטיחות-תהליכית · רעש-מזיק (×2) · גהות · ריתוך-וחיתוך · עיבוד-שבבי · תאונות · סקר-סיכונים · סיכונים-ובקרות
(×2) · מערכות-אוטונומיות-ורובוטים · מבוא-לחוזק-חומרים · קטלוג-תקני-בניין · פנקס-כיס · תוכנית-לימודים ·
עסקים-טעוני-רישוי · שיעור-2-חוקים · דגשים · Emailing 4958_001 (סריקה).

> 💡 חומרים אלו שייכים ל-**T2/T3/T4** (RAG/הסבר-לעומק/הקשר) — לא לייבוא-שאלות-T1. ראה ADR-011 §Tiers.

## הצעדים-הבאים (אחרי אישורך)

1. **אשר/ערוך** את רשימת ה-✅ (ובדוק 2 הכפילויות-האפשריות #12/#15 + 2 הגבוליים).
2. אוסיף את ה-File-IDs המאושרים ל-`T1_FILE_IDS` ב-[`scripts/import-content.config.ts`](../scripts/import-content.config.ts).
3. `pnpm import:t1:dry` → לוודא שמופיעים בדיוק הקבצים המאושרים (והשאר `skipped`).
4. `pnpm import:t1` (`--execute`) → ייבוא בפועל. עלות-משוערת **« $5** (worst-case ~$1.60; ה-hard-cap נשמר).
5. תיוג ב-`/admin/questions` (scope-tagging אוטומטי = 'מוסקנא'; אימות סופי 'מאומת' = ידני, מול ה-PDF).

> ⚖️ **כלל-זהב:** PDF הוא source-of-truth. תיוג-Gemini הוא הצעה ('מוסקנא') בלבד; הקידום ל-'מאומת'
> נעשה ע"י סוקר-אנושי מול המקור (ראה תיקון scope-tagger ב-M6).
