# ADR-003: Auth — Google OAuth (login-only) + Magic Link

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: backend-engineer · privacy-officer · motilev8
> **Phase**: 1

---

## Context

צריך מנגנון התחברות שיתן UX טוב במובייל ובדסקטופ. במוצר המקורי (StudiesGo) ראיתי:

- Google OAuth ("המשך עם Google")
- Magic Link דרך מייל ("שלח קישור התחברות")
- Magic Link תקף 60 דקות

מוטי החליט: **Google OAuth login-only** (בלי Drive scope) + Magic Link.

---

## Decision

**שני מסלולי-התחברות, שני פשטים:**

### 1. Google OAuth - **login scope בלבד**

- Scopes: `openid email profile`
- **NOT** included: `drive.readonly`, `drive.file`, NotebookLM scopes
- Provider: Supabase Auth built-in
- מאוחסן: provider_id, email, name, avatar URL

### 2. Magic Link

- Email-only signup
- שולחים קישור-חד-פעמי לתקף 60 דקות
- Provider: Supabase Auth + Resend (transactional email)

### 3. הגדרות session

- JWT secure HTTPOnly cookie
- expiry: 30 ימים
- refresh-on-use אחרי 7 ימים

---

## Alternatives Considered

### Option A: רק Magic Link

- ✅ פשוט יותר
- ❌ חוויית-משתמש פחות מהירה (צריך לפתוח מייל)

### Option B: OAuth + Drive scope (לקריאת קבצים מ-Drive)

- ✅ משתמש לא צריך להעלות ידנית
- ❌ consent screen מאיים יותר
- ❌ verification של Google נדרשת
- ❌ עוד track של נתונים-רגישים (Drive content)
- **מוטי דחה** - יעדיף upload ידני

### Option C: NextAuth/Auth.js במקום Supabase Auth

- ✅ יותר providers
- ❌ עוד תשתית לתחזק
- ❌ Supabase Auth מספיק

### Option D: WebAuthn/Passkeys

- ✅ עתיד
- ❌ פחות מוכר למשתמשים, complexity ב-Phase 1

---

## Consequences

### Positive

- ✅ Google sign-in מהיר (3 קליקים)
- ✅ Magic Link כ-fallback למשתמשים בלי Google
- ✅ פחות consent screens = פחות friction
- ✅ פחות PII (אין Drive metadata)

### Negative / Trade-offs

- ❌ ללא Drive - משתמש מעלה ידנית כל קובץ
- ❌ Magic Link מצריך mail-server (Resend - $20/חודש בערך)

### Neutral

- ניתן להוסיף Drive scope ב-V2 אם משתמשים יבקשו

---

## Implementation Plan

### Phase 1.1 - Supabase Project (יום 1)

- יצירת project
- enable Google OAuth (URL config)
- enable email magic link
- Email templates (Hebrew RTL)

### Phase 1.2 - Frontend (יום 2)

- `<AuthModal>` component
- `/login` page + `/beta-access` page
- `<GoogleSignInButton>` (Google branding compliant)
- `<MagicLinkForm>` (email validation)

### Phase 1.3 - Server-side (יום 3)

- `src/lib/auth/server.ts` - `getUser()`, `requireAuth()`
- `middleware.ts` - protect routes
- POST `/api/auth/magic-link`

### Phase 1.4 - Account management (יום 4)

- `/settings` account section
- Delete account flow (cascade)
- Audit logs

---

## Validation

- [ ] Google login completes < 5s end-to-end
- [ ] Magic Link מגיע למייל < 30s
- [ ] Magic Link expires after 60 minutes (אלא אם נוצל)
- [ ] Logout clears session + revokes cookies
- [ ] Account delete = full cascade (GDPR-compliant)
- [ ] No PII leak in logs (privacy-officer check)

---

## Security Considerations

- Magic Link: signed JWT, single-use, 60-minute TTL
- Rate limit: max 3 magic link sends/hour per email
- Email verification trust: rely on Google verified email
- CSRF: Supabase Auth handles
- Session fixation: rotate on login

---

## References

- ADR-001 (Stack chose Supabase Auth)
- [Supabase Auth - OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Magic Links best practices](https://web.dev/sign-in-form-best-practices/)
- [GDPR Article 17 - Right to erasure](https://gdpr.eu/article-17-right-to-be-forgotten/)
