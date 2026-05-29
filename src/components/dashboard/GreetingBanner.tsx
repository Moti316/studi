import { greetingByHour } from '@/lib/mock/user';

interface Props {
  name: string;
  /** הזרקת-שעה לטסטים ול-SSR דטרמיניסטי. ברירת-מחדל: שעה נוכחית של הדפדפן/שרת. */
  hour?: number;
}

/**
 * כותרת-קבלת-פנים תלוית-שעה.
 * "בוקר טוב, מוטי לוי!" וכדומה.
 */
export function GreetingBanner({ name, hour }: Props) {
  const h = hour ?? new Date().getHours();
  return (
    <div className="space-y-1">
      <p className="text-foreground/60 text-sm">{greetingByHour(h)},</p>
      <h1 className="text-2xl font-bold">{name}!</h1>
    </div>
  );
}
