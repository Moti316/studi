import { describe, it, expect } from 'vitest';
import { __test } from '@/lib/supabase/middleware';

const { isProtected, isAuthRoute } = __test;

describe('isProtected', () => {
  it('מזהה routes מוגנים', () => {
    expect(isProtected('/dashboard')).toBe(true);
    expect(isProtected('/settings')).toBe(true);
    expect(isProtected('/courses/123')).toBe(true);
    expect(isProtected('/create/upload')).toBe(true);
  });

  it('לא חוסם routes ציבוריים', () => {
    expect(isProtected('/')).toBe(false);
    expect(isProtected('/login')).toBe(false);
    expect(isProtected('/beta-access')).toBe(false);
  });

  it('לא מתבלבל מ-prefix חלקי', () => {
    expect(isProtected('/dashboardx')).toBe(false);
    expect(isProtected('/settings-help')).toBe(false);
  });
});

describe('isAuthRoute', () => {
  it('מזהה routes של התחברות', () => {
    expect(isAuthRoute('/login')).toBe(true);
    expect(isAuthRoute('/beta-access')).toBe(true);
  });

  it('false לשאר', () => {
    expect(isAuthRoute('/dashboard')).toBe(false);
    expect(isAuthRoute('/')).toBe(false);
  });
});
