# Beta Access (Mobile entry) — `/beta-access`

> **Phase**: 1 · Full-screen variant של `auth-modal.md`

## Purpose

זה ה-URL שמשתמשים מגיעים אליו מקישור-מובייל. אותו זרימת-התחברות של auth-modal אבל ב-full screen (לא overlay).

## Relationship

- `/login` = modal overlay מעל הדף הנוכחי
- `/beta-access` = full-page (חוויית מובייל יותר נקייה)
- שניהם משתמשים באותם component-ים (`<GoogleSignInButton>`, `<MagicLinkForm>`)

## Layout

```
[full-screen, no header]
[ centered ]
  [StudiesGo logo big]
  [Bob curious mascot]

  "ברוך הבא ל-StudiBuilder"
  "צור קורסים מהמסמכים שלך"

  [המשך עם Google]
  ─── או ───
  [email input]
  [שלח קישור התחברות]

  "בהמשך אתה מסכים לתנאים..."

[footer cookie banner if needed]
```

## States

זהות ל-`auth-modal.md`: choices / email-input / magic-sent / oauth-redirect

## Components

- `<AuthLayout>` (full-screen container)
- אותם sub-components של auth-modal

## Acceptance

- [ ] mobile-first design (390px width)
- [ ] עברית RTL
- [ ] keyboard עולה כשלוחצים בשדה
- [ ] redirect ל-`/dashboard` אחרי הצלחה

## Source

מהמשתמש (URL only). מצב פתיחה ב-Messenger ראיתי ב-`docs/screens/auth_login.jpg`
