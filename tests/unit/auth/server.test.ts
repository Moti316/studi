import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getUser } from '@/lib/auth/server';

/**
 * במצב mock (אין NEXT_PUBLIC_SUPABASE_*) — getUser חייב להחזיר null
 * בלי לזרוק, כדי שדפים מוגנים ינתבו ל-/beta-access באלגנטיות.
 */

const ORIG_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIG_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIG_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIG_KEY;
});

describe('getUser (mock mode)', () => {
  it('מחזיר null כשאין env (לא זורק)', async () => {
    await expect(getUser()).resolves.toBeNull();
  });
});
