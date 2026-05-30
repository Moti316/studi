# 🎬 סרטון 01 — Create-Course Flow

> **תוכן (לפי-תצפית-frames)**: תהליך יצירת-קורס ב-5 שלבים — drag-drop קובץ → "בודקים את המקור" + topic-confirm → page-selector (570 פריטים) → cost-confirmation עם credits → 5-stage processing animation.
> **משך**: 49 שניות · **גודל**: 16MB · **רזולוציה**: 1080×2316 (mobile portrait)

## איך-להשתמש בתיקייה הזו

1. פתח את `video.mp4` (לחץ + הורד אם נדרש)
2. העלה ל-Gemini
3. הדבק את הפרומפט מתחת
4. כשתקבל תשובה — ערוך את `gemini-response.md` (לחץ-עיפרון ב-GitHub web) והדבק שם
5. commit → אני אקרא ואטמיע

---

## 📋 פרומפט לג'מיני (העתק-הכל מהבלוק-הבא)

```
אני בונה אפליקציית-לימוד בעברית (StudiBuilder), בסגנון Duolingo. אתה מקבל
סרטון screen-recording של מסך-יצירת-קורס באפליקציה דומה (StudiesGo).
הסרטון מראה תהליך 5-שלבי: העלאת-מסמך → זיהוי-נושא → בחירת-עמודים →
אישור-עלות → עיבוד.

אנא נתח את הסרטון ותן תיאור-מפורט-בעברית של:

1. **רצף-המסכים** (סמן זמן MM:SS לכל מעבר):
   - drag-drop area: איך נראה? מה קורה כשמעלים?
   - "בודקים את המקור..." — איך נראית האנימציה של ה-loading?
   - topic-confirmation: איך מוצג ה-100% ביטחון? יש animation?
   - page-grid (570 פריטים): scroll behavior, מצב-נבחר vs לא-נבחר
   - credits-confirmation: 15 → 23 credits — איך משתנה הספירה?
   - 5-stage processing: parsing/chunking/RAG/lessons/quiz — איך עוברים בין-שלבים?

2. **אנימציות-מעבר**:
   - בין השלבים 1→2→3→4→5 — slide? fade? איזה משך?
   - הופעת-תוכן בכל-שלב — האם יש stagger animation על-cards?

3. **Micro-interactions**:
   - drag-drop file: feedback ויזואלי בזמן הגרירה?
   - לחיצה על page-item: scale? color-change? checkmark animation?
   - toggle של "צירוף עמודי-מקור": ה-credits מתעדכן בזמן-אמת? יש animation למספר?

4. **Processing animation (5 stages)**:
   - איך נראה כל-שלב? progress-bar? loader? steps עם checkmarks?
   - האם יש robot mascot שמשתנה לפי-שלב?
   - יש שינוי-צבע בין שלבים?

5. **דמות-המסקוט (רובוט)**:
   - איזה pose בכל מסך?
   - האם הרובוט מנפנף/מצמץ?
   - איזה event מפעיל איזה שינוי?

6. **Color + visual feel**:
   - dominant colors בכל מסך
   - האם יש gradient ברקע?
   - האם הכפתורים הראשיים זוהרים (glow)?

7. **Sound/haptic** (אם נשמע):
   - איזה אירועים מלווים בצליל?
   - תיאור הצליל (chime / pop / drum)

החזר בעברית, מובנה לפי 7 הסעיפים. סמן MM:SS לכל-אירוע.
תוסיף בסוף: "TL;DR — 3 האנימציות-הכי-חשובות לשחזר".
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
