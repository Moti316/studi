# QA Checklist - Phase 0: Foundation

> בדיקות-אקספטנס לפני סיום Phase 0.

## תנאי-קדם

- [x] תיעוד מלא (concept, features, sitemap, architecture)
- [x] 20 screens-spec
- [x] 3 ADRs ראשונים
- [x] Build roadmap מפורט
- [x] workspace עם 21 סוכנים

## Phase 0 specific checks

### Project bootstrap

- [ ] `pnpm install` עובר בלי שגיאות (יבדק במכונה)
- [ ] `pnpm dev` עולה ב-`localhost:3000`
- [ ] hot-reload עובד (שינוי ב-`page.tsx` משתקף)
- [ ] `pnpm build` עובר
- [ ] `pnpm start` מפעיל build prod

### Tests

- [ ] `pnpm test` עוברת (sanity test עובד)
- [ ] `pnpm test:e2e` עוברת
- [ ] `pnpm typecheck` 0 errors
- [ ] `pnpm lint` 0 errors

### RTL ועברית

- [ ] בדפדפן: `<html lang="he" dir="rtl">` ב-DOM
- [ ] טקסט מוצג מימין לשמאל
- [ ] פונט Heebo נטען (לא Times/system fallback)
- [ ] `דבדיקת RTL ועברית 🎯` מוצג נכון

### CI

- [ ] `.github/workflows/ci.yml` קיים
- [ ] `.github/workflows/e2e.yml` קיים
- [ ] בדיקת PR פתוח שבדק שכל ה-checks ירוקים (יבדק אחרי push)

### Code hygiene

- [ ] `.gitignore` מכסה: node_modules, .next, .env\*, coverage, playwright-report
- [ ] `.env.example` מתועד עם כל ה-keys הצפויים
- [ ] husky hooks מותקנים (pre-commit, pre-push)
- [ ] husky hooks הם executable

### Documentation

- [x] CLAUDE.md מעודכן (97 שורות, < 300)
- [x] USER.md מעודכן עם העדפות
- [x] MEMORY.md מעודכן עם locked decisions
- [x] README.md מציג סטטוס נוכחי
- [x] build-roadmap.md מתאר 10 phases

### Phase 0 acceptance criteria (מ-build-roadmap)

- [x] כל קבצי-ההגדרה (15 קבצים) קיימים
- [x] כל ה-workflows (2 קבצים) קיימים
- [x] CLAUDE.md מורחב מהתבנית
- [x] `src/app/layout.tsx` עם `dir="rtl"` + Heebo
- [x] Hello World עם RTL
- [ ] deploy לפרודקשן (Vercel) - יבוצע אחרי הריצה
- [ ] Sentry מחובר ושולח test event - יבוצע אחרי הריצה

## פערים שיוטפלו ב-Phase 1

- Vercel deploy ראשוני
- Sentry init + test event
- Supabase project setup
- Google OAuth credentials
- DNS configuration
- `.env.local` עם keys אמיתיים

## Sign-off

- [ ] tech-lead: stack מוכן ל-Phase 1 ✓
- [ ] devops-engineer: CI מוכן ✓
- [ ] frontend-engineer: skeleton עובד ✓
- [ ] test-engineer: tests עוברים ✓
- [ ] release-manager: PR מוכן ל-merge ✓
