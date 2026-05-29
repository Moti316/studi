import { describe, it, expect } from 'vitest';
import { sanitizeNext } from '@/lib/auth/redirect';

describe('sanitizeNext (open-redirect guard)', () => {
  it('מחזיר נתיב פנימי תקין', () => {
    expect(sanitizeNext('/settings')).toBe('/settings');
    expect(sanitizeNext('/courses/1')).toBe('/courses/1');
  });

  it('ברירת-מחדל /dashboard כשחסר', () => {
    expect(sanitizeNext(null)).toBe('/dashboard');
    expect(sanitizeNext('')).toBe('/dashboard');
    expect(sanitizeNext(undefined)).toBe('/dashboard');
  });

  it('חוסם redirect חיצוני', () => {
    expect(sanitizeNext('//evil.com')).toBe('/dashboard');
    expect(sanitizeNext('https://evil.com')).toBe('/dashboard');
    expect(sanitizeNext('evil.com')).toBe('/dashboard');
  });

  it('חוסם encoded-slashes (%2F%2Fevil.com)', () => {
    expect(sanitizeNext('/%2F%2Fevil.com')).toBe('/dashboard');
    expect(sanitizeNext('%2F%2Fevil.com')).toBe('/dashboard');
  });

  it('חוסם backslash ו-protocol מוטמע', () => {
    expect(sanitizeNext('/\\evil.com')).toBe('/dashboard');
    expect(sanitizeNext('/redirect?to=https://evil.com')).toBe('/dashboard');
  });

  it('דוחה קלט עם URI encoding פגום', () => {
    expect(sanitizeNext('/%E0%A4%A')).toBe('/dashboard');
  });
});
