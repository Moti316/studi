import { signOut } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';

/**
 * כפתור התנתקות. server action — עובד גם ללא JS.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="md">
        התנתק
      </Button>
    </form>
  );
}
