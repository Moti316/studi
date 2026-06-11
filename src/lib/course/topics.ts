/**
 * src/lib/course/topics.ts — חלוקת מיני-קורס "ממונה בטיחות בעבודה" ל-8 יחידות-נושא
 * (mini-within-mini · ADR-016/UX-2026-06-09). כל יחידה מקבצת scope-ids של קורפוס-
 * החקיקה, כך שהלומד מתקדם נושא-אחר-נושא במקום בנק-שטוח אקראי.
 *
 * מקור-ה-scopes: 35 ה-scopes שיש להם שאלות-NotebookLM ב-DB (444 · 2026-06-09).
 * טהור (data בלבד) — נצרך גם ע"י דף-הקורס (RSC) וגם ע"י resolve ב-/lesson/[id].
 */

/** יחידת-נושא בקורס. icon = שם-אייקון lucide (ממופה בדף). */
export interface CourseTopic {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  readonly icon: string;
  readonly scopes: readonly string[];
}

export const COURSE_TOPICS: readonly CourseTopic[] = [
  {
    id: 'argun',
    title: 'ארגון הפיקוח וניהול הבטיחות',
    blurb: 'ממונה בטיחות · תכנית-ניהול · הדרכה · ועדות ונאמני-בטיחות',
    icon: 'ClipboardCheck',
    scopes: ['1.0', '1.1', '1.2', '1.3', '1.4'],
  },
  {
    id: 'teunot',
    title: 'תאונות, מחלות ודיווח',
    blurb: 'דיווח מקרים-מסוכנים ותאונות · מחלות-מקצוע',
    icon: 'Siren',
    scopes: ['1.5', '1.5.1', '1.5.2'],
  },
  {
    id: 'pkuda',
    title: 'פקודת הבטיחות, צמ"א ועזרה ראשונה',
    blurb: 'פקודת-הבטיחות · ציוד-מגן-אישי · עזרה-ראשונה',
    icon: 'ShieldCheck',
    scopes: ['2.0', '2.3', '2.5'],
  },
  {
    id: 'gova',
    title: 'עבודה בגובה, בנייה ותכנון',
    blurb: 'עבודה-בגובה · עבודות-בנייה · גגות-שבירים · תכנון-ובנייה',
    icon: 'HardHat',
    scopes: ['2.1', '2.2', '2.9', '2.11.1'],
  },
  {
    id: 'chashmal',
    title: 'חשמל',
    blurb: 'בטיחות-בחשמל · מיתקן-חי · מיתקן-ארעי באתר',
    icon: 'Zap',
    scopes: ['2.4', '2.4.1', '2.4.2'],
  },
  {
    id: 'mechonot',
    title: 'מכונות, הרמה ועגורנים',
    blurb: 'מכונות-חקלאיות · אגורנאים-עגורנים · הרמת-אדם · דוודי-קיטור',
    icon: 'Cog',
    scopes: ['2.6', '2.6.1', '2.6.2', '2.8', '2.10'],
  },
  {
    id: 'gehut',
    title: 'גיהות תעסוקתית וחומ"ס',
    blurb: 'גיליון-בטיחות SDS · רעש · אבק · קרינה · בנזן · כספית · מעבדות · לייזר',
    icon: 'FlaskConical',
    scopes: ['2.7', '3.1', '3.2', '3.3', '3.4', '3.5.1', '3.5.2', '3.5.3', '3.6', '3.7'],
  },
  {
    id: 'hukei-ezer',
    title: 'חוקי-עזר: נשים, נוער ורישוי',
    blurb: 'עבודת-נשים · עבודת-הנוער · רישוי-עסקים',
    icon: 'Scale',
    scopes: ['4.1', '4.2', '4.3'],
  },
];

const TOPIC_BY_ID = new Map(COURSE_TOPICS.map((t) => [t.id, t]));

/** מאחזר יחידת-נושא לפי id (או undefined). */
export function getTopic(id: string): CourseTopic | undefined {
  return TOPIC_BY_ID.get(id);
}

/** האם id הוא מזהה-נושא תקף (default-deny ב-routing). */
export function isTopicId(id: string): boolean {
  return TOPIC_BY_ID.has(id);
}
