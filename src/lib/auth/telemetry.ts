/**
 * telemetry — עטיפת-שגיאות אחידה. "שגיאות הן מצב מתוכנן" (CLAUDE.md).
 *
 * כל פעולת-משתמש עוטפת ב-try/catch וקוראת ל-logError. אם Sentry מחובר
 * (Phase 9) — נדווח אליו; בינתיים console + מבנה אחיד.
 */

export interface ErrorContext {
  /** היכן קרתה השגיאה, למשל 'auth.sendMagicLink' */
  scope: string;
  /** מטא-דאטה לא-רגיש (לעולם לא PII גולמי כמו אימייל מלא) */
  meta?: Record<string, unknown>;
}

/**
 * מדווח שגיאה בצורה אחידה. מחזיר את ה-Error כדי לאפשר rethrow נוח.
 */
export function logError(error: unknown, context: ErrorContext): Error {
  const err = error instanceof Error ? error : new Error(String(error));

  // Sentry hook — מופעל ב-Phase 9 כשה-DSN יוגדר.
  // import('@sentry/nextjs').then((S) => S.captureException(err, { tags: { scope } }))
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${context.scope}]`, err.message, context.meta ?? {});
  }

  return err;
}

/**
 * ממסך אימייל ללוגים: a***@gmail.com — מונע דליפת PII (privacy-officer).
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}
