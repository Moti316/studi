# Raw Frames — StudiesGo Reference

> חולצו מ-7 סרטוני-screen-recording של StudiesGo Mobile. שימוש: **רפרנס-עיצוב פנימי** בלבד.

## איך חולצו

```bash
ffmpeg -i <video.mp4> \
  -vf "fps=2,mpdecimate=hi=64*200:lo=64*100:frac=0.5,scale=540:-1" \
  -vsync vfr -q:v 5 frame-%03d.jpg
```

- 2fps sampling
- `mpdecimate` מסיר frames-זהים-עוקבים
- Resize ל-540px-רוחב (חצי מהמקור 1080×2316)
- JPEG quality 5 (~40KB-50KB לקובץ)

## אינדקס (7 סרטונים, 83 frames, 3.7MB)

| תיקייה                   | תוכן (לפי-תצפית)                                                        | frames | גודל |
| ------------------------ | ----------------------------------------------------------------------- | ------ | ---- |
| `01-create-course-flow/` | תהליך יצירת-קורס: drag-drop → topic-confirm → select-pages → processing | 6      | 208K |
| `02-lesson-flow/`        | שיעור פעיל: MCQ / Matching / Explanation / wrong-answer feedback        | 4      | 216K |
| `03-messenger/`          | שיתוף קישור-קורס דרך Messenger (UX integration)                         | 6      | 208K |
| `04-onboarding/`         | First-time user-experience: welcome → permissions → empty-state         | 20     | 1.2M |
| `05-quiz-types/`         | 4 סוגי-שאלות בפעולה + create-course page-grid (570 פריטים)              | 7      | 296K |
| `06-settings-voices/`    | מסך-הגדרות + voice-preview (יואב/טלי/מיכל/אורי)                         | 10     | 392K |
| `07-stats-feedback/`     | סטטיסטיקות / streak / XP / level-up / wrong-answer-deep-explanation     | 30     | 1.3M |

**סה"כ**: 83 frames-ייחודיים · ~3.7MB

## שימוש (לסוכני-עיצוב)

| תרחיש               | איזה frames לפתוח                                               |
| ------------------- | --------------------------------------------------------------- |
| לעצב מסך-יצירת-קורס | `01-create-course-flow/` + `05-quiz-types/f001.jpg` (page-grid) |
| לעצב lesson-player  | `02-lesson-flow/` + `07-stats-feedback/` (feedback)             |
| לעצב onboarding     | `04-onboarding/` (20 frames - העשירה ביותר)                     |
| לעצב settings       | `06-settings-voices/`                                           |
| לעצב XP/streak      | `07-stats-feedback/`                                            |

## הבדל מ-`docs/screens/*.jpg` ה-curated

|       | curated (`docs/screens/`) | raw-frames (כאן)       |
| ----- | ------------------------- | ---------------------- |
| כמות  | 14 frames מובחרים         | 83 frames גולמיים      |
| מטרה  | רפרנס-מהיר ל-spec         | tracing מלא של flows   |
| איכות | high-res (jpg-90)         | mobile-res (jpg-q5)    |
| בחירה | manual curation           | scene-change-detection |

## נסיון-עתידי

אם יש frames-מעניינים שלא נכנסו (mpdecimate החסיר) → אפשר להריץ שוב עם:

```bash
ffmpeg -i <video> -vf "fps=4,mpdecimate=hi=64*100" frame-%03d.jpg  # רגיש-יותר
```

או צפייה ישירה ב-mp4 לחילוץ ידני.

**המקור** (מ-Drive / Google Photos של motilev8) — לא בריפו. גודל-מקורי ~115MB.
