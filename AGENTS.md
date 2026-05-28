# AGENTS.md — StudiBuilder

> קובץ-ההקשר הקנוני של ה-workspace. תקן חוצה-כלים (Claude Code / Cursor / Codex).
> **שכבת-בסיס בלבד** — אילוצים קשיחים. שמור רזה (< 300 שורות):
> מודל מאבד אמינות בציות מעל ~150-200 חוקים.

## הפרויקט
פלטפורמת AI שמחוללת קורסי-לימוד גיימיפיקטיביים בעברית מתוך מסמכי-מקור (PDF/Word/PPT) - בהשראת StudiesGo, לשימוש פנימי.
דומיין: edtech · משתמשים: המפתח עצמו (motilev8). שימוש פנימי - הוא לומד וגם מנהל המערכת. ·
שפה: he

## ארכיטקטורת-הקשר תלת-שכבתית
1. **בסיס (קובץ זה)** — אילוצים קשיחים בלבד. רזה וקבוע.
2. **לוקאלי** — `AGENTS.md` בתת-תיקיות; נטען רק בניווט אליהן.
3. **ביצוע (Skills)** — workflows מורכבים ב-`.claude/skills/`; נטענים לפי-צורך.
אל תעמיס מדריכי-עבודה לקובץ הזה — הם שייכים לשכבה 3.

## צוות-הסוכנים
21 סוכנים · טופולוגיה: **Sequential**. אינדקס: `teams/README.md`.
roster: `accessibility-i18n`, `appsec`, `backend-engineer`, `cloud-specialist`, `content-writer`, `data-engineer`, `design-system`, `devops-engineer`, `domain-expert`, `e2e-qa`, `frontend-engineer`, `interaction-designer`, `ml-engineer`, `notifications-engineer`, `privacy-officer`, `product-owner`, `release-manager`, `tech-lead`, `test-engineer`, `ux-researcher`, `visual-designer`

## זיכרון — קרא בתחילת כל סשן
- `USER.md` — פרופיל-משתמש (תקרה ~500 טוקנים).
- `MEMORY.md` — עובדות-פרויקט והחלטות (תקרה ~800 טוקנים).
- `memory/SCHEMA.md` — סכמת הזיכרון האפיזודי (SQLite פר-session).

## מודלי-עזר (טוקנומיקה)
משימות-צד מנותבות למודל זול: compression→haiku · web_extract→haiku · session_search→haiku · approval_gate→haiku.
סוכני-עזר לפי יכולת: live_research (web-search) · deep_context (large-context).
המודל הראשי אינו מבזבז טוקנים על תמצות/חילוץ.

## בלמי-בריחה (Runaway Guardrails) — מחייב
- **max_turns:** 12 — חסם איטרציות-כלים לפני עצירה.
- **max_budget_usd:** 1.0 — תקרת-תקציב; חריגה → עצירת-חירום.
- **loop-breaker:** error-hash — אותה שגיאה
  3 פעמים → CRITICAL STOP, שינוי-אסטרטגיה מאולץ.
- **הפרדת חשיבה/ביצוע:** פעולות-ביצוע דרך JSON→פונקציה דטרמיניסטית, לא ישירות.

## תקשורת בין-סוכנית
מבוססת-קבצים (`comms/`) — JSONL append-only, תגיות `<<SEND_MESSAGE>>` /
`<<BROADCAST>>`. ראה `comms/README.md`. אין תקשורת ישירה בזיכרון.

## כללים קשיחים
- secrets ב-`.env` בלבד — לעולם לא ב-config מסונכרן או בהיסטוריה.
- כל סוכן פועל מתוקף `teams/<tier>/<slug>/identity.md` — הקווים-האדומים מחייבים.
- git: commit+push אוטומטי.
