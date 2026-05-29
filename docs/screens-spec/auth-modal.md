# Auth Modal — popup overlay

> **Phase**: 1 · States: choices / email-input / magic-sent / oauth-redirect

## Purpose

מודאל-התחברות שמופיע מעל הדף הנוכחי. שתי דרכי-התחברות: Google OAuth (login scope בלבד) + Magic Link.

## States

### choices (default)

- לוגו StudiesGo + רובוט Bob
- "בחר אפשרות התחברות"
- כפתור "המשך עם Google" (כחול-לבן)
- מפריד "או"
- שדה "אימייל" (input)
- כפתור "שלח קישור התחברות" (gradient כחול)
- כותרת-תחתית: "בהמשך אתה מסכים לתנאי השימוש ומדיניות הפרטיות"

### email-input

- שדה ממוקד, מקלדת נפתחת במובייל
- validation בזמן-אמת

### magic-sent

- רובוט "שמח"
- "בדוק את המייל שלך!"
- "שלחנו קישור התחברות ל-{email}"
- "הקישור תקף ל-60 דקות"
- קישור: "שלח שוב / שנה אימייל"

### oauth-redirect

- spinner קצר אחרי לחיצה על Google
- redirect אל Google consent screen

## Layout

```
┌─ overlay backdrop ─────┐
│  ┌─ modal card ─────┐  │
│  │  [Bob] StudiesGo │  │
│  │                  │  │
│  │  בחר אפשרות      │  │
│  │  [Google btn]    │  │
│  │  ─── או ───      │  │
│  │  [email input]   │  │
│  │  [send btn]      │  │
│  │                  │  │
│  │  [tos link]      │  │
│  └──────────────────┘  │
└────────────────────────┘
```

## Components

- `<AuthModal>` wrapper (shadcn Dialog)
- `<GoogleSignInButton>` (with Google branding compliant)
- `<MagicLinkForm>`
- `<BobMascot pose="curious">`

## Data dependencies

- POST `/api/auth/magic-link` { email }
- GET `/api/auth/google` → redirect
- DB: `users`, `auth_tokens`

## Acceptance

- [ ] Magic link מגיע למייל תוך < 30s
- [ ] Google OAuth מסיים בהפניה ל-`/dashboard`
- [ ] שגיאות validation מוצגות בעברית
- [ ] keyboard nav: Tab בין שדות
- [ ] axe-core 0 violations
- [ ] צילום תואם `docs/screens/auth_login.jpg`

## Related

- ↗ `landing.md` / `dashboard.md` (after auth)
- ↘ `auth-magic-sent.md` (state shown above)

## Source

`docs/screens/auth_login.jpg`, `docs/screens/auth_magic_link.jpg`
