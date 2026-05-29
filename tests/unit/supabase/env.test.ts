import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  getSupabaseEnv,
  isSupabaseConfigured,
  MissingSupabaseConfigError,
} from '@/lib/supabase/env';

const ORIGINAL = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL.url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL.anon;
});

describe('getSupabaseEnv', () => {
  it('זורק MissingSupabaseConfigError כשחסרים keys', () => {
    expect(() => getSupabaseEnv()).toThrow(MissingSupabaseConfigError);
  });

  it('זורק כשהערכים הם placeholders מ-.env.example', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJh...your-anon-key';
    expect(() => getSupabaseEnv()).toThrow(MissingSupabaseConfigError);
  });

  it('מחזיר env תקין כששני הערכים קיימים', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'real-anon-key';
    const env = getSupabaseEnv();
    expect(env.url).toBe('https://abc.supabase.co');
    expect(env.anonKey).toBe('real-anon-key');
  });
});

describe('isSupabaseConfigured', () => {
  it('false כשלא מוגדר, true כשמוגדר', () => {
    expect(isSupabaseConfigured()).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'real-anon-key';
    expect(isSupabaseConfigured()).toBe(true);
  });
});
