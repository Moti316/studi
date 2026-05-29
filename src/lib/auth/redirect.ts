/**
 * sanitizeNext — הגנת open-redirect לפרמטר `next`.
 *
 * מקבל רק נתיבים פנימיים. דוחה absolute URLs, protocol-relative (`//`),
 * backslash-tricks, ו-encoded-slashes (`/%2F%2Fevil.com`) ע"י decoding
 * ובדיקה חוזרת.
 */
export function sanitizeNext(value: string | null | undefined): string {
  const fallback = '/dashboard';
  if (!value) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith('/')) return fallback; // לא נתיב פנימי / absolute URL
  if (decoded.startsWith('//')) return fallback; // protocol-relative
  if (decoded.includes('://')) return fallback; // protocol מוטמע
  if (decoded.includes('\\')) return fallback; // backslash tricks

  return decoded;
}
