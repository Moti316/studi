# DECISIONS — לוג החלטות

> החלטות-מפתח שורה-בשורה (מעבר ל-ADRs הפורמליים). חדש למעלה. מעודכן: 2026-06-09.

## 2026-06-09 (כיוון-תרחישים: סימולציית-וועדה + צינור-שאלות NotebookLM)

- **מיני-קורס-תרחישים → סימולציית-וועדה אינטראקטיבית (החלפת ה-walkthrough הסטטי):** הכיוון הוא **3 מפקחים (טכני/גיהותי/רגולטורי) בדיאלוג-חי עם המועמד** (מתודולוגיית-מגן §12 · 4 שלבים: היכרות-אישית → תרחיש-ענפי → צלילה-לחוק → השאלה-האכזרית · ציון 0-100 + חולשות). **מנוע = HYBRID** (בחירת-מוטי · AskUserQuestion): **פרה-בנוי-מסועף עכשיו** (Claude+פרומפט-מגן+NotebookLM · OFFLINE · אפס-runtime · אפס-עלות · לכל-הלומדים) + **שכבת-transport** (`SimulationEngine`) להחלפה ל-`LiveEngine` (Claude-API · דיאלוג-חופשי) בעתיד. מקור: [`../architecture/ADR-016-committee-simulation.md`](../architecture/ADR-016-committee-simulation.md). **מחליף-מרחיב את ADR-014.**
- **חיבור-תרחישים = Claude+NotebookLM, אפס-Gemini (תיקון):** מגן מחבר תרחישים כ**סוכן-Claude** המעגן ב-NotebookLM (MCP · Single Source of Truth) — **לא** דרך Gemini-API (חסום-מכסה 20/יום · אומת ב-quota-probe). הסקריפט `author-scenarios-magen.ts` (Gemini) מוחלף ב-Workflow רב-סוכני של Claude.
- **שלב-פתיחה = דיאלוג-אישי:** שלב-1 בסימולציה (`opening`) הוא **שיח-היכרות עם המפקחים** ("מי אתה? מה הרקע? איזה קורס?"), לא שאלה-טכנית.
- **לו"ז-לימוד-אישי (פיצ'ר-נלווה · נדחה-לאישור):** אינטייק (מתי הוועדה? כמה זמן ביום? חזק/חלש?) → תוכנית-הכנה מותאמת (תעדוף scopes/שיעורים). שכבת-פרסונליזציה נפרדת מהסימולציה; יוצג לאישור אחרי ה-vertical-slice.
- **מיני-קורס-שו"ת = שאלות-NotebookLM רב-סוגיות (מחליף 540):** ייצור מקורפוס-החקיקה (42 נוסחים × mcq/matching/open · per=6 · ~500) דרך **NotebookLM בלבד** (אפס-Gemini · G3-מעוגן). תשתית-תמיכה (נדחפה): generation עם checkpoint+resume · תיקון scopeId-כפול (Map<scope,statute[]> · מציל ~50 שאלות) · sidecar `.built.json` + דגל `--exclude` · `question-verification-io` · **Workflow רב-סוכני לאימות-סמנטי** (content-verifier→oversight-lead · citation-fit · **לא-Gemini**). מחיקת 540 הישן רק אחרי import+smoke.

## 2026-06-09 (ביטול firewall-מגן)

- **כלל-מגן (firewall) — בוטל (REVERSED):** ה-firewall של מגן (השראה-בלבד · אסור-להעתיק · HYBRID-ככלל) **בוטל**. כעת **מותר לפורט את פרומפט-המאסטר של מגן** (חיבור-תרחישי-וועדה / סימולציה) ל-StudiBuilder, **name-cleaned** (הסר מגן/שגיא/Telegram/מזהי-בעלים · שמור 4-עקרונות · Zero-Harm · common-pitfalls · 3-מצבי-תשובה). מוטי בעל-שני-הריפו → **אפס-licensing**. `megen` נשאר **מבודד** (clone לתיקייה-סמוכה · read-only · רק תוכן-פרומפט · לא מנוע-Python). זרימה: NotebookLM מעגן חוק/תקנה (verbatim · G3) → פרומפט-מגן מחבר (Gemini-API · offline) → אימות-סמנטי → ייבוא. מקור: `../architecture/ADR-009-magen-integration.md` (תיקון 2026-06-09). **גובר על** ההגבלה ב-"רקע" שלהלן ("מגן = subset, לא נדרש" / "Phased Convergence").

## 2026-05-31 (ערב — עדכון אסטרטגי + מעבר-מחשב)

- **אסטרטגיה (override):** StudiBuilder נבנה **end-to-end, בלי דחיות**. מבטל את מסגרת ה-"carve-out צר / Quiz-Engine-בלבד / הקפאת-phases". שני תוצרים: (1) **פלטפורמת-ייצור-קורסים** creator-gated (רק מוטי מייצר); (2) **קורס "ממונה בטיחות"** — לימוד-אישי לוועדה **וגם** מוצר לשיווק (ADR-006). תאריך-הוועדה = אבן-דרך לקורס-הראשון, לא סיבה לקצץ.
- **וידאו (היפוך):** 7 קבצי mp4 (~113MB) **נשארים ב-repo/git**. מבטל את החלטת-ההוצאה מאותו יום.
- **chachmoni:** **לא קשור** ל-StudiBuilder — הוסר ממסמכי-ההקשר; לא לשייך בשום צורה.
- **מעבר-מחשב:** מוטי עובד מכמה מחשבים. במחשב הנוכחי (`b0066820`) הוקם `.env.local` (Supabase+Drive אמיתיים; Anthropic+Voyage placeholders); git-bash blocker **לא קיים כאן** (husky לא מוגדר; commit/push עובדים).
- **מקור-תוכן:** Google Drive = source-of-truth (ADR-009/011). ריפו-מגן = subset, לא נדרש לבניית-הפלטפורמה.
- **ספק-AI (override ADR-001):** Anthropic+Voyage → **Google Gemini** (יצירה+סיווג+embeddings). מפתח-אחד `GEMINI_API_KEY` (מגן כבר על Gemini; tier חינמי). NotebookLM אינו backend אפשרי (אין API; קופסה-שחורה) — נשאר למגן בלבד. Drive = אחסון, לא תחליף ל-AI.

## 2026-05-31

- **ארכיטקטורת-הקשר:** 9 קבצים ב-`docs/context/` (שמות אנגלית, תוכן עברית). מחליפים את הפיזור הקיים.
- **git workflow:** single-branch — commit+push ל-`main` בסיום כל משימה. נמחקים כל הענפים מלבד main.
- **שפה:** כל השיחה בעברית. (נשמר ל-memory)
- **Todolist:** לתחזק `Todolist.md` גלוי (gitignored), משימות שהושלמו ✅ נשארות לעין.
- **וידאו:** ~~~113MB mp4 יוצאים מ-git~~ — **בוטל** (ראה עדכון ערב 2026-05-31: הווידאו נשאר ב-repo).
- **טיוב:** Quick-wins בלבד (לא איחוד עמוק של content docs כעת).
- **git-bash שבור:** הוחלט לא לעקוף hook (`--no-verify`) באופן אוטונומי — ממתין להחלטת מוטי.
- **autocrlf=false** + `.gitattributes` (LF ל-husky/sh) — לתיקון בעיית-CRLF ב-hooks.

## 2026-05-30

- **שימוש-חוזר בפרויקט GCP הקיים** (`studibuilder-drive`) ל-Drive, לא חדש.
- **OAuth client חדש "StudiBuilder Drive Import"** (Desktop); הישן "StudiBuilder Drive Reader" — למחיקה.
- **DATABASE_URL = Session pooler** (תומך prepared statements; Transaction pooler ישבור drizzle).
- **migration הורץ ידנית** ב-Supabase SQL Editor (7 טבלאות + coverage_tracker).

## רקע (מסשנים קודמים — מתועד ב-ADRs)

- AI pipeline = build-from-scratch (לא NotebookLM כ-engine). ADR-002/005.
- Google login-only (בלי Drive scope ב-public app); Drive scope רק ל-import script. ADR-003/011.
- Course-as-Product Factory (Phase 10). ADR-006.
- מגן integration: Phased Convergence (side-by-side עד הוועדה). ADR-009. _(עודכן 2026-06-09: ה-firewall בוטל — port-מותר · ראה הרשומה למעלה + ADR-009.)_
- Drive = source-of-truth לתוכן (לא megen-repo). ADR-009/011.
