# 🎬 סרטון 05 — Quiz Types Showcase + Page-Grid

> **תוכן**: 4 סוגי-שאלות-שונים בפעולה + מסך page-grid של 570 פריטים (בחירת-עמודים ביצירת-קורס). משלים את סרטון 02.
> **משך**: 50 שניות · **גודל**: 15MB

## 🟠 עדיפות-בינונית (משלים את 02)

ראה בסרטון 02 קודם, אם משהו לא ברור — סרטון 05 משלים.

---

## 📋 פרומפט לג'מיני

```
אני בונה אפליקציית-לימוד בעברית. אתה מקבל סרטון שמראה 4 סוגי-שאלות
בפעולה (MCQ-long, MCQ-short, Matching, Explanation) + מסך page-grid
לבחירת-עמודי-תוכן (570 פריטים, סקרול אנכי).

אנא תן תיאור-בעברית-מפורט של:

1. **רצף הסוגים** (סמן MM:SS):
   - באיזה סדר מוצגים?
   - איך עוברים בין-סוגי-שאלות?

2. **MCQ-long (4 כרטיסים אנכיים)**:
   - גודל-יחסי של כל card
   - padding פנימי
   - border / shadow
   - selected state: צבע, animation
   - hover/tap: האם יש?

3. **MCQ-short (2x2 grid)**:
   - יחסי-גובה לעומת MCQ-long
   - layout grid

4. **Matching (תיוג זוגות)**:
   - 2 עמודות
   - איך מסמנים-בחירה?
   - איך משלימים-זוג?
   - color-coding?

5. **Explanation (כרטיס-טיפ)**:
   - אייקון 💡 — איך נראה?
   - הדגשת-טקסט?
   - כפתור "המשך" — סטייל?

6. **Page-grid screen (570 פריטים)**:
   - גודל-תאים? תוכן? (מספר עמוד + thumbnail?)
   - מצב נבחר vs לא-נבחר: איך נראה ה-checkmark?
   - "בחר הכל": מה קורה ויזואלית?
   - scroll behavior: smooth? sticky-header?
   - מונה "15 / 570 נבחרו" — איך מתעדכן בזמן-אמת?

7. **שינויי-מצב**:
   - מעבר מ-NOT-selected ל-SELECTED: animation? בועה? checkmark animate?
   - הסרת-בחירה: כיצד?
   - האם יש batch-select-feedback (לדוגמא: "20 פריטים נוספו")?

8. **Color tokens (מהמסך-הזה בלבד)**:
   - background של card לא-נבחר
   - background של card נבחר
   - border colors
   - text colors
   - checkmark color

החזר בעברית, מובנה לפי 8 הסעיפים-לעיל, עם MM:SS לכל-אירוע.
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
