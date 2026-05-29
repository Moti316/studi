# Account Delete Modal

> **Phase**: 1 (basic) + 9 (full GDPR flow) · Confirm modal

## Purpose

מחיקת חשבון מלאה. דורש אימות חוזר (הקלדת מייל) כדי למנוע מחיקה בטעות.

## States

- **confirm**: שדה למייל + אזהרה
- **confirming**: spinner + "מוחק נתונים..."
- **done**: "החשבון נמחק" + redirect ל-`/`
- **error**: alert + retry

## Layout

```
[modal backdrop]
┌─ modal card ────────────────┐
│ ⚠ מחק חשבון                │
│                              │
│ פעולה זו לא ניתנת לביטול.   │
│ כל הנתונים יימחקו לצמיתות:  │
│ • הפרופיל                    │
│ • הקורסים שיצרת              │
│ • היסטוריית הלמידה          │
│ • הקרדיטים שנותרו (1500)    │
│                              │
│ אימות:                       │
│ הקלד את המייל שלך כדי לאשר: │
│ [email input]                │
│                              │
│ [ביטול] [מחק לצמיתות]       │
└──────────────────────────────┘
```

## Components

- shadcn `<Dialog>`
- `<EmailConfirmInput>`
- `<DangerButton>` (disabled עד שהמייל מותאם)
- `<CancelButton>`

## Data

- POST `/api/account/delete`
- Cascade delete:
  - `users`
  - `user_settings`
  - `credits`, `credit_transactions`
  - `courses` + child tables
  - `attempts`, `streaks`
  - Storage: כל ה-files של המשתמש
  - Auth: revoke all sessions

## Acceptance

- [x] לא ניתן לבצע ללא אימות-מייל (email match, case-insensitive)
- [x] מחיקת ה-Auth user בפועל דרך service-role admin client (לפי user.id מה-session)
- [ ] cascade מלא לטבלאות-משנה + Storage (תלוי schema — data-engineer)
- [ ] audit log רושם delete event (Phase 1.4 — תלוי schema)
- [ ] email confirmation אחרי המחיקה ("חשבונך נמחק") (תלוי Resend — Phase 7/9)
- [x] GDPR-compliant Right to be forgotten (מחיקת זהות; cascade עם schema)

## מצב Phase 1 (mock-first)

- `deleteAccount` מאמת זהות ומוחק את **משתמש-ה-Auth** בפועל (service-role).
- אם service-role אינו מוגדר → מחזיר שגיאה מפורשת ("פנה לתמיכה"), **לא** הצלחה,
  כדי שהמשתמש לא יחשוב בטעות שנמחק.
- מחיקת טבלאות-המשנה מסומנת `TODO(Phase: schema)` ב-`src/lib/auth/actions.ts`.

## Retention exceptions (GDPR — לתיעוד לפני launch)

מחיקה מה-DB אינה מוחקת אוטומטית את אלה:

- **Supabase backups / PITR**: עותקים עד ~7 ימים; יוסרו בתום חלון ה-retention.
- **Audit log**: רישומי-delete הם עצמם PII — להגדיר retention.
- **Sentry events**: להפעיל PII scrubbing על אירועי auth (Phase 9).

## Source

לא צולם - נבנה לפי best practice
