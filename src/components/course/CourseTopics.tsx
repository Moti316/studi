/**
 * <CourseTopics> — מסלול-הנושאים של מיני-קורס "ממונה בטיחות" (StudiesGo-style).
 *
 * מציג את 8 יחידות-הנושא ככרטיסי-מסלול (אייקון-תחום · כותרת · תיאור · מונה-שאלות-אמת),
 * כל אחת מקשרת ל-`/lesson/<topic-id>` (תרגול מסונן ל-scopes של הנושא). מציג ספירות-אמת
 * מה-DB (לא אחוזי-התקדמות-מדומים). RSC · RTL · design-tokens.
 */
import Link from 'next/link';
import {
  ClipboardCheck,
  Siren,
  ShieldCheck,
  HardHat,
  Zap,
  Cog,
  FlaskConical,
  Scale,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import type { CourseTopic } from '@/lib/course/topics';

const ICONS: Record<string, LucideIcon> = {
  ClipboardCheck,
  Siren,
  ShieldCheck,
  HardHat,
  Zap,
  Cog,
  FlaskConical,
  Scale,
};

export interface CourseTopicsProps {
  topics: readonly CourseTopic[];
  /** topic.id → מספר-שאלות בנושא (מה-DB). */
  counts: Record<string, number>;
  /** בסיס-קישור לתרגול-נושא (ברירת-מחדל /lesson). */
  hrefBase?: string;
}

export function CourseTopics({ topics, counts, hrefBase = '/lesson' }: CourseTopicsProps) {
  const total = topics.reduce((s, t) => s + (counts[t.id] ?? 0), 0);
  return (
    <div dir="rtl" className="flex flex-col gap-3 font-hebrew">
      <p className="text-foreground/60 text-sm">
        {topics.length} נושאים · {total} שאלות מעוגנות-חקיקה. בחר נושא והתחל לתרגל.
      </p>
      <ol className="flex flex-col gap-3" role="list">
        {topics.map((topic, i) => {
          const Icon = ICONS[topic.icon] ?? ClipboardCheck;
          const n = counts[topic.id] ?? 0;
          return (
            <li key={topic.id}>
              <Link
                href={`${hrefBase}/${topic.id}`}
                data-testid={`topic-${topic.id}`}
                className="group flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-bl from-primary-500 to-primary-600 text-white shadow-button">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                  <span className="text-xs font-bold text-accent-600">יחידה {i + 1}</span>
                  <span className="text-sm font-extrabold leading-snug text-quiz-text-primary">
                    {topic.title}
                  </span>
                  <span className="truncate text-xs text-quiz-text-secondary">{topic.blurb}</span>
                  <span className="mt-1 inline-flex w-fit items-center rounded-pill bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 ring-1 ring-inset ring-primary-100">
                    {n} שאלות
                  </span>
                </span>
                <ChevronLeft
                  aria-hidden="true"
                  className="size-5 shrink-0 text-quiz-text-secondary transition-transform group-hover:-translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
