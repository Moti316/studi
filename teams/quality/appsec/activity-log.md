# יומן-פעילות — שחר (appsec)

> פורמט רשומה: `## [תאריך שעה] משימה` ואז Outcome · What changed · Verification · Follow-ups · Verdict (PASS|CONCERNS|FAIL) · Self-check (בהקשר? סטייה? red-lines?) · Bugs/Fixes.

## [2026-05-31] הוספת `/.cache/` ו-`/logs/` ל-.gitignore

- **Outcome:** נחסם דליפת-נתונים אפשרית — תיקיות-cache ולוגי-ייבוא שמחזיקים טקסט-מסמכים מ-Drive לא ייכנסו ל-git. PASS.
- **What changed:** `studi/.gitignore` — נוספו `/.cache/` ו-`/logs/` בתוך מקטע `# Project-specific` עם הערה מסבירה, בסגנון הקיים (root-anchored כמו `/tmp/`, הערה כמו `/Todolist.md`). אין שינוי-קוד/סכמה.
- **Verification:** קראתי קודם את ה-.gitignore הקיים — שני הערכים היו חסרים (נוספו רק החסר). `git check-ignore` מאשר: `.cache/foo.txt` ו-`logs/import.log` נתפסים (ignored); `src/.cache/x` לא-נתפס (blank) — כלומר העיגון-לשורש (`/`) עובד ולא חוסם תיקיות-cache מקוננות לא-קשורות. אומת שהתיקיות עדיין לא קיימות במאגר (אין tracked-content שצריך `git rm --cached`).
- **Follow-ups:** אם בעבר נעשה commit לתוכן תחת נתיבים אלו — להריץ `git rm -r --cached .cache logs` (לא רלוונטי כעת: התיקיות לא קיימות). לא הורץ commit/push/db:push לפי התדריך.
- **Verdict:** PASS.
- **Self-check:** בהקשר (אפס-secrets/אפס-דליפת-PDF מ-Drive — תואם PROJECT-CONTEXT ו-Red-Lines)? כן. סטייה? אין. red-lines? לא הופרו (לא secrets-בקוד, לא release-עם-חור, לא push).
