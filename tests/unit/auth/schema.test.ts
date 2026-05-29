import { describe, it, expect } from 'vitest';
import { emailSchema, magicLinkSchema, deleteAccountSchema, isValidEmail } from '@/lib/auth/schema';

describe('emailSchema', () => {
  it('מקבל אימייל תקין', () => {
    expect(emailSchema.safeParse('motilev8@gmail.com').success).toBe(true);
  });

  it('דוחה אימייל ריק עם הודעה בעברית', () => {
    const res = emailSchema.safeParse('');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('נא להזין כתובת אימייל');
    }
  });

  it('דוחה פורמט לא-תקין עם הודעה בעברית', () => {
    const res = emailSchema.safeParse('not-an-email');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe('כתובת האימייל אינה תקינה');
    }
  });

  it('מנקה רווחים מסביב', () => {
    const res = emailSchema.safeParse('  a@b.com  ');
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe('a@b.com');
  });
});

describe('isValidEmail', () => {
  it('true לאימייל תקין, false ללא-תקין', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
  });
});

describe('magicLinkSchema / deleteAccountSchema', () => {
  it('magicLinkSchema דורש email', () => {
    expect(magicLinkSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
    expect(magicLinkSchema.safeParse({}).success).toBe(false);
  });

  it('deleteAccountSchema דורש emailConfirm תקין', () => {
    expect(deleteAccountSchema.safeParse({ emailConfirm: 'a@b.com' }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ emailConfirm: 'x' }).success).toBe(false);
  });
});
