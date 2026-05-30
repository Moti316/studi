# מדריך-Pre-Sprint למוטי — צעד-אחר-צעד מהנייד

> כל ההוראות כתובות לעבודה מהטלפון. אין צורך במחשב לרוב השלבים.
>
> זמן-משוער: 60-90 דקות (לא רציף — בהפסקות).

---

## למה כל זה?

כדי שהאפליקציה תוכל **לקרוא קבצים מ-Drive שלך** ו**לשמור שאלות ב-Supabase**, צריך להפעיל 2 דברים פעם-אחת:

1. **טבלאות-בסיס-הנתונים** — לוחצים על כפתור ב-Supabase
2. **חיבור-Drive** — מקבלים "מפתח" מ-Google ושומרים ב-Vercel

זהו. אחרי זה הכל אוטומטי.

---

## חלק א' — Supabase Database (15 דקות)

### צעד 1: היכנס ל-Supabase מהטלפון

1. פתח דפדפן (Chrome / Safari)
2. גש ל: **https://supabase.com/dashboard**
3. התחבר עם motilev8@gmail.com (אם לא מחובר)
4. **בחר את הפרויקט הקיים** של StudiBuilder (אותו שהשתמשנו בו ב-Phase 1)

### צעד 2: פתח את ה-SQL Editor

1. בתפריט-הצד (☰ מצד שמאל) — חפש **"SQL Editor"** ☰ → 🗒️
2. לחץ על **"+ New query"** (כפתור ירוק למעלה)

### צעד 3: העתק את ה-SQL מ-GitHub

1. פתח עוד tab בדפדפן
2. גש ל: **https://github.com/Moti316/studi/blob/claude/docs-business-pivot-adrs/supabase/migrations/0001_initial_schema.sql**
3. לחץ על כפתור **"Copy raw file"** (סמל 📋 בפינה הימנית של הקובץ)
4. הכל הועתק ל-clipboard

### צעד 4: הדבק והרץ ב-Supabase

1. חזור ל-tab של Supabase (SQL Editor)
2. **הדבק** את הכל בחלון-הקוד הריק
3. לחץ **"Run"** (כפתור ירוק למטה-מימין)
4. המתן ~10 שניות

### צעד 5: בדוק שהכל עבד

מתחת לחלון-הקוד יופיע:

```
Success. No rows returned.
```

✅ אם רואים את זה — **סיימנו את חלק א'**.

❌ אם יש שגיאה אדומה — צלם screenshot ושלח לי.

### בונוס: לראות את הטבלאות

1. בתפריט-הצד — **"Table Editor"** 📊
2. אמורות להיות 7 טבלאות חדשות:
   - `chat_sessions`
   - `chunks`
   - `content_sources`
   - `practice_sessions`
   - `question_attempts`
   - `questions`
   - `scenarios`
3. וב-Database → Views: `coverage_tracker` (עם 57 שורות)

---

## חלק ב' — Google Drive API (30 דקות, חלקי-מחשב)

> **אזהרה**: חלק זה נוח-יותר ממחשב כי יש העתקת-טקסט-ארוכה.
> אבל אפשר גם מהנייד אם תעבוד עם 2 דפדפנים.

### צעד 1: יצירת פרויקט ב-Google Cloud Console

1. גש ל: **https://console.cloud.google.com/**
2. למעלה: לחץ על שם-הפרויקט (אולי "No project selected")
3. **"New Project"** → שם: `studibuilder-drive` → Create
4. המתן 10 שניות שיוטמע

### צעד 2: הפעלת Drive API

1. בתפריט (☰) → **APIs & Services** → **Library**
2. חפש: `Google Drive API`
3. לחץ על התוצאה → **Enable**
4. המתן

### צעד 3: יצירת OAuth credentials

1. **APIs & Services** → **Credentials**
2. למעלה: **"+ Create Credentials"** → **OAuth client ID**
3. אם זו פעם-ראשונה: תתבקש להגדיר **OAuth consent screen**:
   - User Type: **External**
   - App name: `StudiBuilder`
   - User support email: motilev8@gmail.com
   - Developer email: motilev8@gmail.com
   - Save and Continue × 3 (skip optional)
   - **חזור ל-Credentials** ולחץ שוב "+ Create Credentials" → "OAuth client ID"
4. Application type: **Desktop app**
5. Name: `StudiBuilder Drive Reader`
6. Create
7. תקפוץ חלונית עם **Client ID** ו-**Client Secret** — **שמור בצד** (גם תוכל לראות שוב אחר-כך)

### צעד 4: הוספת המייל שלך למשתמשי-טסט

1. **OAuth consent screen** (בתפריט-הצד) → גלול ל-**Test users**
2. **+ Add Users** → `motilev8@gmail.com` → Save
3. בלי זה Google יחסום אותך

### צעד 5: שמירת ה-credentials ב-Vercel

1. גש ל: **https://vercel.com/dashboard**
2. בחר את הפרויקט **studibuilder** (או דומה)
3. **Settings** (מצד שמאל) → **Environment Variables**
4. הוסף 2 משתנים חדשים:
   - **Key**: `GOOGLE_CLIENT_ID` · **Value**: ה-Client ID שקיבלת בצעד 3
   - **Key**: `GOOGLE_CLIENT_SECRET` · **Value**: ה-Client Secret
5. בכל אחד: בחר **All Environments** (Production + Preview + Development)
6. **Save**

### צעד 6: שמירת אותם משתנים גם ב-`.env.local` המקומי שלך

> **רק אם יש לך מחשב פתוח עם הפרויקט**. אם לא — דלג, אני אעשה זאת כשנמשיך.

הוסף ל-`.env.local`:

```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

### צעד 7: קבלת refresh-token (דורש מחשב — 5 דקות)

> חייב מחשב לצעד זה. אם אין — דלג, נמשיך כשיהיה לך מחשב פנוי.

במחשב, בתיקיית הפרויקט:

1. ודא ש-`.env.local` מעודכן (צעד 6)
2. הרץ: `pnpm install` (להתקין את ה-dependencies החדשים)
3. הרץ: `pnpm drive:auth`
4. תראה URL — פתח אותו בדפדפן
5. בחר motilev8@gmail.com → **Allow**
6. Google יציג קוד-ארוך — העתק אותו
7. הדבק בטרמינל → Enter
8. תראה: `GOOGLE_REFRESH_TOKEN=1//0...`
9. העתק את ה-token כולו

### צעד 8: שמור את ה-refresh-token

1. הוסף ל-`.env.local` במחשב
2. הוסף ל-Vercel Environment Variables (כמו צעד 5):
   - **Key**: `GOOGLE_REFRESH_TOKEN`
   - **Value**: ה-token שקיבלת

### צעד 9: בדיקה

במחשב, הרץ:

```
pnpm drive:test
```

אמור להופיע:

```
🔍 Drive API sanity test

Test 1: Get sample file metadata
  ✅ Name: Emailing מאגר שאלות הכנה לוועדה - כללי - ספטמבר 2025.pdf
  ✅ Type: application/pdf
  ✅ Size: 1.71 MB

Test 2: List "ממונה בטיחות 2025" folder
  ✅ Found 16 items:
     - ...

✅ All tests passed. Drive API is working.
```

✅ אם עבד — **חלק ב' הושלם**.

---

## חלק ג' — Manual Curation (5 שעות, יכול להתפזר)

> זה החלק שאי-אפשר לאוטומט. אתה (motilev8) צריך לכתוב תקצירים-קצרים.

יש 15 נושאים שאין להם תוכן ספציפי ב-Drive. נראה אותם ב-`docs/curriculum-coverage.md` תחת "Action Items".

### עדיפויות

| נושא                                                               | זמן-משוער | חשיבות   |
| ------------------------------------------------------------------ | --------- | -------- |
| **5.x — 5 תקני ISO** (45001, 18001, 31010, 31000, IEC 61882, OSHA) | 60 דק'    | 🔥 קריטי |
| **6.x — 5 שיטות-ניתוח** (JSA, FMEA, HAZOP, Bow Tie, Check List)    | 45 דק'    | 🔥 קריטי |
| 3.8 — רפואה תעסוקתית (פיזיולוגיה, אנטומיה)                         | 30 דק'    | חשוב     |
| 1.5.x — פקודת תאונות 1945 + 2 תקנות                                | 30 דק'    | חשוב     |
| 7.x — 4 גופים-מוסדיים                                              | 30 דק'    | בינוני   |
| 3.5.1/3.5.2/3.5.3 — בנזן + כספית + הדברה                           | 30 דק'    | בינוני   |
| 2.6.1/2.6.2 — עגורני-צריח + מלגזות                                 | 20 דק'    | בינוני   |
| 2.9/2.10/2.11.1 — גגות + דוד-קיטור + תכנון-בנייה                   | 30 דק'    | בינוני   |
| 3.7 — קרינת-לייזר                                                  | 15 דק'    | נמוך     |
| 4.5 — חוק הגז + גפ"מ                                               | 15 דק'    | נמוך     |

**סה"כ ~5 שעות**. אפשר לפזר על-פני 3-4 ימים.

### איך לכתוב כל תקציר?

לכל נושא, כתוב **5-10 משפטים** שעונים על:

1. **מה זה?** (הגדרה קצרה)
2. **למה זה חשוב?** (rationale)
3. **מספרים-מפתח** (מ-X עובדים? עד Y שעות? תקן Z?)
4. **חובות-מעשיות לממונה** (מה צריך לבדוק / לדווח / לתעד)
5. **דוגמת-שימוש בוועדה** (איזה תרחיש יכול להישאל)

### איפה לשמור?

בכל פעם שתסיים נושא, שלח לי בצ'אט:

- שם הנושא (לדוגמה: "5.1 — ת"י 45001")
- ה-5-10 משפטים

אני אאסוף את הכל ל-`docs/content_scope_extensions.md` ב-repo.

### חלופה: אם אין זמן

אם לא תספיק לכתוב ~15 תקצירים — **לא נורא**. ה-15 הנושאים פשוט ייסומנו `[לא ידוע]` ולא יעלו לבחינות ב-MVP. אתה תשלים אותם ידע מ-megen / NotebookLM כמו שאתה לומד היום.

---

## סיכום

| חלק                    | זמן                | סטטוס שלך |
| ---------------------- | ------------------ | --------- |
| א — Supabase migration | 15 דק' (מהנייד)    | ⬜        |
| ב — Drive API setup    | 30 דק' (מחשב חלקי) | ⬜        |
| ג — Manual curation    | 5 שעות (מתפזר)     | ⬜        |

**אחרי שתסיים א + ב — תכתוב לי "✅" ואני מתחיל לכתוב את ה-import scripts (חלק ג' של ה-Pre-Sprint שלי).**

---

## אם משהו נתקע

צלם screenshot של השגיאה ושלח לי. רוב הבעיות לוקח פחות מ-5 דקות לפתור.

מקרים-נפוצים:

| בעיה                                        | פתרון                                                               |
| ------------------------------------------- | ------------------------------------------------------------------- |
| SQL Editor → "syntax error"                 | סביר שלא הועתק כל הקובץ. נסה שוב "Copy raw file" מ-GitHub           |
| `pnpm install` נכשל                         | בדוק שיש Node 20+: `node --version`                                 |
| `pnpm drive:auth` → "redirect_uri_mismatch" | בצור-OAuth client בחר "Desktop app" (לא Web)                        |
| Google → "App isn't verified"               | זה תקין ב-Test mode. לחץ "Advanced" → "Go to StudiBuilder (unsafe)" |
| Vercel ENV → שינוי לא תופס                  | אחרי הוספה — Settings → Deployments → Re-deploy                     |

תצליח! 🚀
