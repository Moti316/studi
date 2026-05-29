# memory/SCHEMA.md — זיכרון אפיזודי

הזיכרון ההיברידי של ה-workspace בנוי משתי שכבות:

- **ארוך-טווח (Markdown)** — `USER.md` / `MEMORY.md` בשורש. "source-of-truth"
  שקוף, ניתן לקריאה ולעריכה אנושית.
- **אפיזודי (SQLite)** — קובץ זה מגדיר את הסכמה. רובד פר-session שעוקב אחר
  תחלופת-ההודעות, tool-calls, ועלות-טוקנים. הפרויקט מממש אותו בזמן-ריצה.

## טבלת `episodes`

| עמודה        | סוג        | תיאור                                       |
| ------------ | ---------- | ------------------------------------------- |
| `id`         | INTEGER PK | מזהה רץ                                     |
| `session_id` | TEXT       | מזהה ה-session/thread (מאונדקס)             |
| `role`       | TEXT       | user / assistant / tool                     |
| `content`    | TEXT       | תוכן ההודעה                                 |
| `metadata`   | JSON       | מטא-נתונים (model, tool-name וכו')          |
| `token_cost` | REAL       | עלות-טוקנים לאינטראקציה (ראה blueprint 9.3) |
| `created_at` | DATETIME   | חותמת-זמן                                   |

אינדקס על `session_id` לשליפה מהירה ולחישוב-עלות מצטבר פר-session.

## כללים

- `token_cost` נמשך ממקור-תמחור מוסמך (endpoints רשמיים), לא מהערכה מקומית.
- שליפת-הקשר מוגבלת (`LIMIT`) כדי למנוע הצפת חלון-הקשר.
- כשהזיכרון הארוך מתמלא — consolidation (ראה `MEMORY.md`).
