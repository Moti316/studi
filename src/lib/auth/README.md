# src/lib/auth - Supabase Auth helpers

> **Phase**: 1 · Owner: backend-engineer · ADR-003

## קבצים מתוכננים

- `server.ts` - server-side: `getUser()`, `requireAuth()`, `getSession()`
- `client.ts` - browser: `useUser()`, `useSession()`, sign-in/out helpers
- `middleware.ts` - Next.js middleware: protect routes
- `magic-link.ts` - magic link send/verify
- `oauth.ts` - Google OAuth handlers (login scope only)

## עקרונות

- **JWT in HTTPOnly cookie** (Supabase default)
- **CSRF protection** מובנה
- **Rate limit**: 3 magic links/hour per email
- **Audit log**: כל login/logout נרשם
- **GDPR**: account delete = full cascade

## דוגמת-use (Phase 1)

```typescript
// Server component
import { requireAuth } from '@/lib/auth/server';

export default async function DashboardPage() {
  const user = await requireAuth(); // redirect if not authed
  return <Dashboard userId={user.id} />;
}

// Client component
import { useUser } from '@/lib/auth/client';

export function UserMenu() {
  const { user, signOut } = useUser();
  return <button onClick={signOut}>{user.email}</button>;
}
```
