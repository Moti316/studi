# מדריך הקמה פשוט — חלק 1 (Supabase) + חלק 2 (Google Drive)

> מדריך צעד-אחר-צעד, פשוט וברור. מסומן ✅ ליד כל שלב שסיימת.
> זמן כולל: ~45 דקות. אפשר לעצור באמצע ולחזור.

---

# 🟢 חלק 1 — Supabase (יצירת טבלאות) — 15 דקות

**מה עושים פה?** מריצים פקודה אחת שיוצרת 7 טבלאות + view במסד-הנתונים.
אפשר לגמרי מהנייד.

### שלב 1.1 — היכנס ל-Supabase

1. פתח דפדפן → גש ל: **https://supabase.com/dashboard**
2. התחבר עם **motilev8@gmail.com**
3. לחץ על הפרויקט הקיים של **StudiBuilder** (זה שהשתמשנו בו ב-Phase 1)

### שלב 1.2 — פתח SQL Editor

1. בתפריט הצד — לחץ **SQL Editor**
2. לחץ **+ New query**

### שלב 1.3 — העתק את קובץ ה-SQL

1. פתח tab חדש בדפדפן וגש ל:
   **https://github.com/Moti316/studi/blob/claude/docs-business-pivot-adrs/supabase/migrations/0001_initial_schema.sql**
2. לחץ על כפתור **Copy raw file** (סמל 📋 בפינת הקובץ) — הכל הועתק

### שלב 1.4 — הדבק והרץ

1. חזור ל-tab של Supabase
2. **הדבק** את כל הקוד בחלון הריק
3. לחץ **Run** (כפתור ירוק למטה)
4. המתן ~10 שניות

### שלב 1.5 — ודא שהצליח

- צריך להופיע: **`Success. No rows returned.`** ✅
- בדיקה נוספת: תפריט → **Table Editor** → צריכות להופיע 7 טבלאות:
  `chat_sessions`, `chunks`, `content_sources`, `practice_sessions`,
  `question_attempts`, `questions`, `scenarios`

❌ אם יש שגיאה אדומה — צלם מסך ושלח לי.

> **חלק 1 הושלם** ✅

---

# 🔵 חלק 2 — Google Drive API — 30 דקות

**מה עושים פה?** נותנים לאפליקציה רשות לקרוא (קריאה-בלבד) את קבצי ה-Drive שלך.
זה דורש 3 דברים: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, ו-`GOOGLE_REFRESH_TOKEN`.

> שלבים 2.1–2.5 אפשר מהנייד. שלבים 2.6–2.9 דורשים **מחשב** (הרצת פקודה).

### שלב 2.1 — צור פרויקט ב-Google Cloud

1. גש ל: **https://console.cloud.google.com/**
2. למעלה — לחץ על שם-הפרויקט → **New Project**
3. שם: `studibuilder-drive` → **Create** → המתן 10 שניות

### שלב 2.2 — הפעל את Drive API

1. תפריט (☰) → **APIs & Services** → **Library**
2. חפש: `Google Drive API`
3. לחץ על התוצאה → **Enable**

### שלב 2.3 — הגדר OAuth consent screen

1. **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → Create
3. מלא:
   - App name: `StudiBuilder`
   - User support email: `motilev8@gmail.com`
   - Developer email: `motilev8@gmail.com`
4. **Save and Continue** עד הסוף (אפשר לדלג על האופציונליים)
5. בשלב **Test users** → **+ Add Users** → `motilev8@gmail.com` → Save
   ⚠️ בלי זה Google יחסום אותך.

### שלב 2.4 — צור OAuth client

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Desktop app** ⚠️ (חשוב! לא "Web")
4. Name: `StudiBuilder Drive Reader` → **Create**
5. ייפתח חלון עם **Client ID** ו-**Client Secret** — **שמור אותם בצד**
   (אפשר לראות אותם שוב מאוחר יותר ב-Credentials)

### שלב 2.5 — שמור ב-Vercel

1. גש ל: **https://vercel.com/dashboard** → בחר פרויקט **studibuilder**
2. **Settings** → **Environment Variables**
3. הוסף 2 משתנים (סמן **All Environments** בכל אחד):
   - `GOOGLE_CLIENT_ID` = ה-Client ID
   - `GOOGLE_CLIENT_SECRET` = ה-Client Secret
4. **Save**

---

### 💻 מכאן דרוש מחשב (התיקייה כבר אצלך):

`C:\Users\USER\OneDrive\שולחן העבודה\Google_Antigravity\studi`

### שלב 2.6 — הכנס את המפתחות ל-`.env.local`

פתח את הקובץ `.env.local` בתיקיית הפרויקט (כרגע הוא ריק) והוסף:

```
GOOGLE_CLIENT_ID=הדבק-כאן-את-ה-Client-ID
GOOGLE_CLIENT_SECRET=הדבק-כאן-את-ה-Client-Secret
```

> **קל יותר:** תגיד לי "סיימתי 2.5" ותן לי את 2 הערכים — אני אכתוב אותם
> ל-`.env.local` בשבילך. (הקובץ gitignored, לא נכנס ל-git.)

### שלב 2.7 — התקן והרץ את ה-auth

בטרמינל (PowerShell), בתיקיית הפרויקט:

```powershell
pnpm install
pnpm drive:auth
```

1. הסקריפט ידפיס **כתובת URL** — פתח אותה בדפדפן
2. בחר **motilev8@gmail.com** → אם יופיע "App isn't verified":
   לחץ **Advanced** → **Go to StudiBuilder (unsafe)** (זה תקין במצב-טסט)
3. אשר גישה → Google יציג **קוד** — העתק אותו
4. חזור לטרמינל → הדבק את הקוד → Enter
5. הסקריפט ידפיס שורה: `GOOGLE_REFRESH_TOKEN=1//0...`

### שלב 2.8 — שמור את ה-refresh token

1. הוסף את השורה `GOOGLE_REFRESH_TOKEN=...` ל-`.env.local`
2. הוסף אותה גם ב-Vercel (כמו שלב 2.5):
   - `GOOGLE_REFRESH_TOKEN` = הערך שקיבלת

### שלב 2.9 — בדיקה סופית

בטרמינל:

```powershell
pnpm drive:test
```

צריך להופיע:

```
🔍 Drive API sanity test
Test 1: ✅ Name: ... .pdf
Test 2: ✅ Found N items
✅ All tests passed. Drive API is working.
```

✅ אם עבד — **חלק 2 הושלם**.

---

## סיכום מהיר

| חלק     | משימה                 | איפה                         | זמן    |
| ------- | --------------------- | ---------------------------- | ------ |
| 1       | הרצת migration SQL    | Supabase (נייד)              | 15 דק' |
| 2.1–2.5 | יצירת OAuth + Vercel  | Google Cloud + Vercel (נייד) | 20 דק' |
| 2.6–2.9 | refresh-token + בדיקה | מחשב (טרמינל)                | 10 דק' |

**אחרי שתסיים שניהם — תכתוב לי "✅ סיימתי 1+2", ואני מתחיל לבנות את ה-import scripts (Drive → Supabase).**

## אם משהו נתקע

| בעיה                                   | פתרון                                        |
| -------------------------------------- | -------------------------------------------- |
| SQL → "syntax error"                   | לא הועתק כל הקובץ. נסה שוב "Copy raw file"   |
| `pnpm install` נכשל                    | בדוק Node 20+: `node --version`              |
| `drive:auth` → "redirect_uri_mismatch" | ודא שבחרת **Desktop app** (לא Web)           |
| Google → "App isn't verified"          | תקין במצב-טסט: Advanced → Go to StudiBuilder |
| Vercel ENV → לא תופס                   | אחרי הוספה: Deployments → Re-deploy          |

צלם מסך של כל שגיאה ושלח לי — רוב הדברים נפתרים בפחות מ-5 דקות.
