# HOWTO — מתי ואיך להקים סוכן

> מדריך-תהליך להוספת סוכן לצוות StudiBuilder. הרוסטר המלא: [`README.md`](README.md).
> מעודכן: 2026-05-31.

## מתי **כן** להקים סוכן חדש

הקם סוכן רק כשמתקיים **פער-יכולת אמיתי** שאף אחד מ-22 הסוכנים הקיימים לא מכסה:

- ✅ **Mandate ייחודי** — אחריות שאינה חופפת לסוכן קיים.
- ✅ **קווים-אדומים משלו** — כללים שאי-אפשר לתלות בסוכן אחר.
- ✅ **Handoffs ברורים** — ממי מקבל, למי מוסר.
- ✅ נדרש **שוב ושוב** (לא משימה חד-פעמית).

## מתי **לא** להקים (השתמש בקיים)

- ❌ חופף ל-mandate של סוכן קיים → הרחב את הקיים / השתמש בו.
- ❌ משימה חד-פעמית → אל תקבע תפקיד.
- ❌ "נחמד שיהיה" בלי red-lines/handoffs ברורים → לא מצדיק סוכן.
- ❌ בלבול-תחומים → עדכן Scope Boundaries של הסוכן הקיים.

## ה-Tiers (לאיזה לשייך)

| Tier          | מתי                                   | מודל ברירת-מחדל |
| ------------- | ------------------------------------- | --------------- |
| `strategic`   | החלטות-על, ארכיטקטורה, דומיין, מוצר   | `opus`          |
| `builder`     | בנייה בפועל (frontend/backend/data/…) | `sonnet`        |
| `quality`     | אבטחה, פרטיות, בדיקות, אימות-תוכן     | `sonnet`        |
| `coordinator` | תיאום, release                        | `sonnet`        |

## איך מקימים — 6 צעדים

1. **בחר** slug (אנגלית, kebab-case), tier, ו-model (לפי הטבלה; `opus` לחשיבה-עתירת-סיכון).
2. **צור `teams/<tier>/<slug>/identity.md`** — המסמך המלא, **12 השדות** (ראה תבנית למטה). תוכן בעברית.
3. **צור `.claude/agents/<slug>.md`** — stub: frontmatter (`name`, `description`, `model`) + גוף קצר שמפנה ל-`identity.md`.
4. **רשום ב-[`teams/README.md`](README.md)** — הוסף שורה לטבלה ועדכן את מונה-הסוכנים.
5. **רשום לפי הפרוטוקול** — כל קובץ `.md` חדש נכנס ל-`CLAUDE.md` (ראה "מסמכי-תיעוד — רישום-חובה") ול-`PROJECT-MAP.md`.
6. **prettier + commit + push** — `prettier --write` על הקבצים החדשים, ואז commit ו-push ל-main (ה-hooks ירוצו: lint-staged + typecheck + tests).

## תבנית 12 השדות ל-`identity.md`

> שדות 1-11 = שכבה A (גרעין-תפקיד ניטרלי). שדה 12 = שכבה B+C (הקשר-פרויקט ומיקוד).

1. **Mandate** — המשפט שמגדיר הצלחה.
2. **Professional Standard** — אמות-מידה שאינן ניתנות-למיקוח.
3. **Methodology & Sources** — שיטות + מקורות-סמכא.
4. **Decision Framework** — סדר-עדיפויות + מתי וטו.
5. **Scope Boundaries** — בתחום / מחוץ-לתחום (+ למי מפנים).
6. **Red Lines — never do** — איסורים מוחלטים.
7. **Interfaces & Handoffs** — מקבל מ / מוסר ל.
8. **Escalation Path** — מתי מסלימים ולמי.
9. **Output Contract** — Outcome · What changed · Verification · Follow-ups (+ verdict לסוכני-סקירה).
10. **Definition of Done / KPIs** — מדדי-הצלחה מדידים.
11. **Anti-patterns** — דפוסים להימנע מהם.
12. **Project Focus** — תיאור-הפרויקט הנוכחי + Skills + מיקוד שכבה-C.

> ⚠️ שדה 12 הוא היחיד התלוי-פרויקט — כשהאסטרטגיה משתנה (כמו ה-pivot ל-end-to-end + שיווק), יש לרענן אותו בכל הסוכנים.

## דוגמה אחרונה

`content-verifier` (tier `quality`, 2026-05-31) — נוצר בדיוק לפי התהליך הזה. ראה `teams/quality/content-verifier/identity.md`.
