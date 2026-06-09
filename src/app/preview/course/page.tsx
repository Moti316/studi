/**
 * /preview/course — תצוגה-מקדימה זמנית (ציבורית · dev) של מסך מיני-קורס-לפי-נושאים,
 * להדגמה למוטי לפני שילוב במסלול-המוגן `/courses/safety-officer`. ספירות-אמת מה-DB.
 */
import { CourseTopics } from '@/components/course/CourseTopics';
import { COURSE_TOPICS } from '@/lib/course/topics';
import { loadTopicCounts } from '@/lib/course/topic-counts';

export const dynamic = 'force-dynamic';

export default async function PreviewCoursePage() {
  const counts = await loadTopicCounts();
  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-2xl space-y-4 px-4 py-8 font-hebrew">
      <header className="space-y-1">
        <span className="text-xs font-bold text-accent-600">מיני-קורס</span>
        <h1 className="text-2xl font-bold">ממונה בטיחות בעבודה</h1>
        <p className="text-foreground/60 text-sm">
          שו"ת רב-סוגי מקורפוס-החקיקה — מחולק לנושאים. כל נושא הוא יחידת-תרגול מעוגנת.
        </p>
      </header>
      <CourseTopics topics={COURSE_TOPICS} counts={counts} />
    </main>
  );
}
