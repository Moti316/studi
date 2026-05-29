# StudiesGo - מפת מסכים (Sitemap)

## URLs שזוהו בסרטונים

| URL            | שם המסך                          | זמין-בלי-login? | מקור              |
| -------------- | -------------------------------- | --------------- | ----------------- |
| `/`            | Landing page (לא ראיתי בסרטונים) | כן (סביר)       | URL idea          |
| `/beta-access` | אזור הרשמה למובייל               | כן              | מהמשתמש           |
| `/dashboard`   | מסך-בית של משתמש מחובר           | לא              | `dashboard.jpg`   |
| `/create-c...` | יצירת קורס (5 צעדים)             | לא              | `create_*.jpg`    |
| `/lesson/...`  | מסך שיעור פעיל                   | לא              | `lesson_*.jpg`    |
| `/settings`    | הגדרות חשבון ולמידה              | לא              | `settings_*.jpg`  |
| `/stats`       | סטטיסטיקות התקדמות               | לא              | URL בלבד, לא נטען |

## תרשים-זרימה למשתמש חדש

```mermaid
graph TD
    Landing[/ landing/] -->|Sign up| Auth[/beta-access או popup login/]
    Auth -->|Google OAuth| Dashboard
    Auth -->|Magic Link email| EmailVerify[Click link in email]
    EmailVerify --> Dashboard

    Dashboard -->|+ קורס חדש| Create1[/create-c/ Step 1: Source]
    Create1 -->|Upload file| Create2[Step 2: Topic Detection]
    Create1 -->|Paste text| Create2
    Create2 -->|Confirm topic| Create3[Step 3: Select Pages]
    Create3 -->|Choose all| Create4[Step 4: Confirm Cost]
    Create4 -->|Create course| Create5[Step 5: Processing]
    Create5 -->|Done| Dashboard

    Dashboard -->|Pick course| LessonList[Lesson list within course]
    LessonList -->|Start lesson| Lesson[/lesson/ Quiz UI]
    Lesson -->|Continue| Lesson
    Lesson -->|Complete| LessonList

    Dashboard -->|Bottom nav| Settings[/settings/]
    Dashboard -->|Bottom nav| Stats[/stats/]
    Dashboard -->|Bottom nav| Courses[/courses?/]
```

## ניווט תחתון (Bottom Tab Bar) - לכל מסך מחובר

| Tab        | איקון    | תיאור                         |
| ---------- | -------- | ----------------------------- |
| בית        | 🏠 home  | `/dashboard`                  |
| קורסים     | 📖 book  | `/courses?` (לא ראיתי במפורש) |
| סטטיסטיקות | 📊 chart | `/stats`                      |
| הגדרות     | ⚙️ gear  | `/settings`                   |
