# Magic Link Sent (state) — within auth-modal / beta-access

> **Phase**: 1 · State of auth flow

## Purpose

מסך-אישור שמופיע אחרי שמשתמש שולח את ה-magic link. מודיע ש-email נשלח.

## Layout

```
[Bob smiling mascot]

"בדוק את המייל שלך! ✉"
"שלחנו קישור התחברות ל-"
**motilev8@gmail.com**

"הקישור תקף ל-60 דקות"

[שלח שוב | שנה אימייל]

[X close button - top right]
```

## Components

- `<BobMascot pose="happy">`
- `<EmailDisplay>` (kept as-typed, masked-display optional)
- `<ResendButton>` (rate limited: 60s between sends)
- `<ChangeEmailLink>` (back to email input)

## Data

- POST `/api/auth/magic-link` { email }
- DB: `auth_tokens` (token_hash, expires_at=NOW()+60min, type='magic')
- Email: Resend / Postmark template

## Acceptance

- [ ] resend rate-limit 60s
- [ ] expiry clear (60 דקות)
- [ ] BACK button חוזר למצב choices
- [ ] לא מציג את ה-token עצמו, רק שנשלח
- [ ] graceful: אם משתמש לחץ פעמיים על "שלח" מהר - יראה toast "כבר שלחנו"

## Source

`docs/screens/auth_magic_link.jpg`
