# AGENTS.md — StudiBuilder

> קובץ-ההקשר הקנוני של ה-workspace. תקן חוצה-כלים (Claude Code / Cursor / Codex).
> **שכבת-בסיס בלבד** — אילוצים קשיחים. שמור רזה (< 300 שורות):
> מודל מאבד אמינות בציות מעל ~150-200 חוקים.

## הפרויקט

פלטפורמת AI שמחוללת קורסי-לימוד גיימיפיקטיביים בעברית מתוך מסמכי-מקור (PDF/Word/PPT).
שלב-MVP: כלי-לימוד-פנימי של motilev8 לוועדת-הסמכה ממונה-בטיחות (2026-07-15).
שלב-עתידי (Phase 10): Course-as-Product Factory לקהל-רחב — כל קורס נולד כמוצר-עצמאי.
דומיין: edtech · שפה: he-IL

## ארכיטקטורת-הקשר תלת-שכבתית

1. **בסיס (קובץ זה)** — אילוצים קשיחים בלבד. רזה וקבוע.
2. **לוקאלי** — `AGENTS.md` בתת-תיקיות; נטען רק בניווט אליהן.
3. **ביצוע (Skills)** — workflows מורכבים ב-`.claude/skills/`; נטענים לפי-צורך.
   אל תעמיס מדריכי-עבודה לקובץ הזה — הם שייכים לשכבה 3.

## צוות-הסוכנים

33 סוכנים (22 מומחי-תחום + 4 ראשי-צוות + 1 מתווך + 6 ענף-בקרה) · טופולוגיה: **Sequential**. אינדקס: `teams/README.md` · היררכיה: `teams/ORG.md`.
roster (22 מומחי-תחום): `accessibility-i18n`, `appsec`, `backend-engineer`, `cloud-specialist`, `content-verifier`, `content-writer`, `data-engineer`, `design-system`, `devops-engineer`, `domain-expert`, `e2e-qa`, `frontend-engineer`, `interaction-designer`, `ml-engineer`, `notifications-engineer`, `privacy-officer`, `product-owner`, `release-manager`, `tech-lead`, `test-engineer`, `ux-researcher`, `visual-designer`

**ענף-בקרה `oversight` (6, עצמאי — מדווח ישירות למועצה, לא דרך המתווך):** `oversight-lead`, `plan-compliance-auditor`, `process-audit-officer` (בקרה-חיצונית) · `curriculum-auditor-lead`, `coverage-auditor`, `content-drift-auditor` (מבקר-תכנית). סמכות: **צו-עצירה** קוורום-2/3 + ledger (רק-מוטי-מבטל). ראה `teams/oversight/`.

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
- git: **תחילת-סשן — `git fetch`+`git pull` לפני עבודה** (multi-machine; הקשר-ישן = סחף); commit+push אוטומטי בסיום.
- > **🔒 כלל-מגן (firewall) — השראה-בלבד:** ריפו-מגן (`github.com/Moti316/megen` · איתן+שגיא) = **השראה/reference בלבד** למבנה/תכנון (תרחישים פר-ענף · `study_plan_90days` · committee_bank · 4-עקרונות-הוועדה). **אסור להעתיק/לקחת** קוד · תוכן · prompts. **לעולם לא מתערבב** עם ריפו-StudiBuilder (קריאה → תיקייה נפרדת בלבד). נדרשת פרסונה? **HYBRID** — מחלצים את המבנה-המוכח כ-spec, כותבים **native** (name-clean·RAG·cache·ציטוט), מאמתים **parity** מול committee_bank. **ללא copy/coupling.** ספק → מוטי. (גובר על ADR-009 Phase B — העתקה-verbatim מבוטלת.)
