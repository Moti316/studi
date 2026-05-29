import { z } from 'zod';

/**
 * סכמות-ולידציה ל-auth. הודעות בעברית RTL (אזרח-ראשון).
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'נא להזין כתובת אימייל' })
  .email({ message: 'כתובת האימייל אינה תקינה' })
  .max(254, { message: 'כתובת האימייל ארוכה מדי' });

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export const deleteAccountSchema = z.object({
  /** המשתמש מקליד את האימייל שלו כדי לאשר — מונע מחיקה בטעות. */
  emailConfirm: emailSchema,
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/**
 * בודק אם אימייל תקין מבלי לזרוק — נוח לולידציה בזמן-אמת ב-UI.
 */
export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}
