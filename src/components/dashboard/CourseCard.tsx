import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { coursePercent, type MockCourse } from '@/lib/mock/courses';

interface Props {
  course: MockCourse;
}

/**
 * כרטיסיית-קורס: כותרת, התקדמות, "המשך לימוד".
 */
export function CourseCard({ course }: Props) {
  const pct = coursePercent(course);

  return (
    <Link
      href={`/courses/${course.id}`}
      className="card block space-y-3 transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      <h3 className="font-bold">{course.title}</h3>
      <Progress value={pct} aria-label={`התקדמות בקורס: ${pct}%`} />
      <p className="text-foreground/60 text-xs">
        {course.completedLessons} מתוך {course.totalLessons} שיעורים ({pct}%)
      </p>
    </Link>
  );
}
