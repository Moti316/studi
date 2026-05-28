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
- [ ] לא ניתן לבצע ללא אימות-מייל
- [ ] cascade מלא (אין יתומי-נתונים)
- [ ] audit log רושם delete event
- [ ] email confirmation אחרי המחיקה ("חשבונך נמחק")
- [ ] GDPR-compliant Right to be forgotten

## Source
לא צולם - נבנה לפי best practice
