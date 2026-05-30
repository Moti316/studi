# 🌐 Vercel: גישה ציבורית ל-POC pages

> סטטוס: ❌ POC preview-pages חסומים ב-403 `Host not in allowlist`.
> סיבה: Vercel Project Settings → Deployment Protection מופעל ל-preview deployments.

## הסבר

Vercel **Standard Protection** חוסם גישה ל-preview-deployments למי שאינו מחובר ל-Vercel team. זה ברירת-מחדל ב-Pro plans וב-Hobby plans החל מ-2024.

המגבלה היא ברמת-פרויקט ב-Vercel-dashboard, **לא ניתנת לעקיפה דרך `vercel.json`**.

## ❗ פתרון: כיבוי Deployment Protection (חד-פעמי, ידני)

מוטי — פעולה דרושה:

1. כניסה ל-Vercel Dashboard: https://vercel.com/moti316s-projects/studibuilder
2. בתפריט-עליון: **Settings**
3. בסיידבר: **Deployment Protection**
4. תחת **"Vercel Authentication"** או **"Standard Protection"**:
   - בחר **Disabled** (אם רוצים שכל-העולם יוכל לראות preview)
   - **או** הוסף את-עצמך ל-Allowed Members + תיכנס ל-Vercel-account לפני שתפתח את ה-preview-URL
5. ⚠️ אזהרה: ב-Disabled, כל-מי-שיודע-את-ה-URL רואה את ה-preview. השתמש בזה רק ל-POC קצרים.
6. **Recommended**: אחרי שתסיים-עם-POC-הזה, החזר את Standard Protection.

## אלטרנטיבה: גישה דרך Vercel-login

אם תרצה להשאיר את ה-Protection מופעלת:

1. תיכנס ל-Vercel באותו דפדפן שאתה משתמש בו לפתוח את ה-URL
2. ה-cookie של Vercel ינוטרל את ה-403
3. תיכנס ל-`https://studibuilder-git-claude-docs-business-6a8deb-moti316s-projects.vercel.app/poc/matching` ותראה תקין

## אלטרנטיבה-3: Codespaces (לא דורש Vercel)

ב-PR #4 → Code → Codespaces → "Create codespace on claude/docs-business-pivot-adrs"

זה נותן dev-server-חי + URL פומבי מ-GitHub (חינמי).

## מה ב-vercel.json הקיים

```json
{
  "framework": "nextjs",
  "headers": [
    {
      "source": "/poc/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex" },
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

- **`X-Robots-Tag: noindex`** — מונע שמירת POC ב-Google Search Index (אבטחה)
- **`Cache-Control`** — מבטיח שכל-refresh מחזיר build-עדכני

זה לא-מטפל ב-403. ה-403 חייב כיבוי-ידני ב-dashboard.
