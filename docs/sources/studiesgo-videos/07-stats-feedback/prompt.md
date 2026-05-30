# 🎬 סרטון 07 — Stats + Feedback + Skill-Tree

> **תוכן**: סטטיסטיקות-משתמש (XP/streak/level), wrong-answer-feedback מלא עם "הסבר לעומק" + skill-tree dark-mode עם נודים-מחוברים (Duolingo-style). **30 frames** ייחודיים — העשיר ביותר!
> **משך**: 44 שניות · **גודל**: 21MB

## ⚠️ זה הסרטון הכי-קריטי ל-Phase 6 (Gamification) + Dark-mode design tokens!

הכי-עשיר אנימציות. כדאי להתחיל איתו או עם 02.

---

## 📋 פרומפט לג'מיני

```
אני בונה אפליקציית-לימוד בעברית (StudiBuilder), בסגנון Duolingo. אתה
מקבל סרטון שמראה מסך-סטטיסטיקות + skill-tree (מסך קורסים) + feedback
מלא של תשובה-שגויה עם "הסבר לעומק". זה הסרטון העשיר-באנימציות.

הסרטון ב-Dark-mode עם נייבי-עמוק, כחול-זוהר, וויזואל פרימיום.

אנא תן תיאור-בעברית-מפורט-מאוד של:

1. **רצף-המסכים** (סמן MM:SS לכל מעבר):
   - איזה מסכים מוצגים?
   - איך עוברים בין-מסכים?

2. **Dark-mode design tokens (חשוב!)**:
   - background: hex משוער (נייבי-עמוק?)
   - primary blue: hex משוער (יש glow?)
   - accent (XP/streak): hex
   - text colors (לבן? אפור?)
   - האם יש gradient-עמוק ברקע?

3. **Skill-tree screen (Duolingo-style)**:
   - layout: נודים-עגולים מחוברים בקו-מעוקל
   - locked nodes (אפורים, מנעול): צבע, opacity
   - unlocked nodes: צבע (כחול-זוהר?), glow-effect
   - active/current node (יש play-button מואר): איך מבדל מהאחרים?
   - האם הקווים-המעוקלים מצוירים בהדרגה? יש animation?

4. **דמות-המסקוט (Bob - הרובוט עם cyan glow)**:
   - איזה pose בכל מסך?
   - האם יש cyan-glow מסביב לו?
   - idle animation? (idle-bobbing? מצמוץ?)
   - תגובה לאירועים? (level-up? wrong-answer?)

5. **Wrong-answer feedback (קריטי!)**:
   - איך נראה הצבע-אדום של התשובה השגויה?
   - האם יש shake animation? משך?
   - איך מופיע "התשובה הנכונה הייתה..."?
   - איך נכנס הכפתור "הסבר לעומק"?
   - מה קורה כשלוחצים? מודאל? bottom-sheet? slide-in?

6. **Deep explanation modal**:
   - איזה layout?
   - האם יש robot שמסביר?
   - האם יש citation מהמקור?
   - איך סוגרים?

7. **XP / Streak / Level indicators**:
   - XP counter: איך מתעדכן? animation?
   - Streak fire (🔥): האם מהבהבת? איזה צבע (כתום-אדום?)
   - Level badge: איך נראה?
   - האם יש progress-ring סביב הפרופיל?

8. **Stats screen**:
   - אילו metrics מוצגות (lessons done / XP earned / streak days)?
   - האם יש graphs/charts? (line chart? bar chart?)
   - האם יש calendar heatmap לימי-streak?
   - איך מנופחים-הופעת-המספרים? count-up?

9. **Bottom-navigation (glassmorphism)**:
   - 5 tabs (בית/קורסים/סטטיסטיקות/פרופיל/הגדרות)
   - האם יש backdrop-blur אמיתי?
   - active-tab indicator: איך נראה?
   - איך נראה המעבר בין-tabs?

10. **Special animations (תיאור-עומק)**:
    - level-up: איך נראה?
    - streak-milestone: ?
    - lesson-complete: ?
    - mastery-celebration: confetti?

11. **Particle effects + glows**:
    - האם יש sparks/particles כאשר משהו מצליח?
    - האם יש lens-flare על כפתורים-זוהרים?
    - האם הרקע יש subtle-ambient-animation?

12. **Sound (אם נשמע)**:
    - איזה אירועים מלווים בצליל?
    - תיאור הצליל לכל-אחד

החזר בעברית, מובנה לפי 12 הסעיפים, עם MM:SS לכל-אירוע.

בסוף, חלק TL;DR:
- "TOP-5 אנימציות הכי-מרשימות לשחזר"
- "Design-tokens של dark-mode (JSON-format)"
- "Easing-curves אופייניות לכל-קטגוריה"
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
