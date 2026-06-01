# TODO — StudiBuilder · רשימת-משימות חיה

> **מקור-אמת יחיד למשימות.** מסונכרן ב-git (כל מחשב), נטען אוטומטית בכל סשן (SessionStart hook),
> ומשתקף ב-TodoWrite בתוך הסשן. סימון: ✅ הושלם · 🔄 בתהליך · ⬜ פתוח · ⏰ מתוזמן. מעודכן: 2026-06-02 (ריצת-לילה).

## ✅ הושלם

- **v1 (קוד):** Agent-OS (27 סוכנים) · צינור-ייבוא · admin-תיוג (`/admin/questions`) · נגן-שיעור (`/lesson/[id]`) — 393 טסטים, ב-`main`.
- **תוכן-קורס safety-officer (משימה 0):** 13 מסמכים · כיסוי-scope 48/7/2 · אינדקס-חקיקה (37 נוסחים) — ב-`main`.
- **יישור-קו** (STATUS/TASKS/MEMORY/EXECUTION-PLAN/README/PROJECTS → מציאות, `dbd9bf9`) · **SessionStart hook**.
- **M6 — code-review + security-review** (workflow · 20 סוכנים · 14 ממצאים מאומתים): תוקנו 8 (P1 discovery-gate · source_ref content-hash · admin-telemetry · scope-tagger fence+downgrade · map-question bounds · middleware /admin · sheet-width) → `a1cc051`. 3 נדחו ל-מוטי (ראה M5-doc + לוג-לילה #7).

## ⬜ פתוח — לפי סדר (מ-PLANNING-STATE)

1. **ISO** — סקירת `ISO-31010/31000-DRAFT` עם מוטי → מיקום סופי.
2. **חקיקה** — אישור טבלת-37-נוסחים → הורדת ~35 מנבו → `sources/legislation/` (לאתר 2.6.1 — עגורני-צריח, תקנות-עגורנאים 1992 תקנה 65).
3. **פרויקט-גמר** — מוטי יעלה מצגת-הנחיות → עדכון `FINAL-PROJECT.md` (פרויקט אמיתי).
4. **M5** — ייבוא בנק-השאלות (~540) + תיוג-Gemini Flash. **discovery-gate תוקן (M6)** + קוריישן מוכן: `docs/M5-discovery-curation.md` — צריך **אישורך** לרשימת-בנקי-השאלות (✅~19) → הוספה ל-`T1_FILE_IDS` → `import:t1:dry` → `import:t1` (hard-cap $5).
5. ~~**M6**~~ ✅ הושלם (ראה למעלה). נותרו 3 ממצאים שדחיתי להחלטתך: MatchingPairs grading (graded↔practice) · מונה-Gemini · a11y roving-tabindex.

## ⏰ מתוזמן

- **10/2026** — בדיקת רפורמות תשפ"ה-2025 (`courses/safety-officer/REGULATORY-WATCH.md`).

## 💡 עתידי (ראה `docs/IDEAS.md`)

- סקירת-gstack (adopt/skip list, ללא התקנה) · Agent-OS starter-kit כ-Skill · דשבורד-סוכנים (playground) · ExplanationCard/ScenarioWalkthrough · API + Spaced-Repetition · Phase 6-10.
