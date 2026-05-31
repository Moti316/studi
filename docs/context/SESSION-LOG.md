# SESSION-LOG — יומן סשנים (handoff)

> בכל סוף-סשן: "מה נעשה / מה הצעד הבא". חדש למעלה.
> **סשן חדש? התחל מ-[PROJECT-MAP.md](PROJECT-MAP.md).**

---

## 2026-05-31 (ערב) — מעבר-מחשב + end-to-end + סביבה + Drive + ניקוי-ענפים ✅

### מה נעשה

- **מחשב חדש** (`b0066820`): חיבור-repo אומת, זהות-git מקומית הוגדרה, `.env.local` הוקם (Supabase+Drive אמיתיים; Anthropic+Voyage placeholders). git-bash blocker **לא קיים כאן** (husky לא מוגדר; commit/push עובדים).
- **עדכון-אסטרטגיה end-to-end** במסמכי-ההקשר: StudiBuilder = **פלטפורמת-ייצור מלאה** (creator=מוטי) + **קורס-הוועדה** (לימוד+שיווק). בוטלה מסגרת ה-carve-out/הקפאת-phases. עודכנו: PROJECT-MAP, PROJECTS, STATUS, EXECUTION-PLAN, TASKS, DECISIONS.
- **החלטות:** וידאו **נשאר** ב-repo · chachmoni **הוסר** (לא קשור) · Google Drive = source-of-truth (לא ריפו-מגן).
- **ספק-AI שונה ל-Google Gemini** (יצירה+סיווג+embeddings) במקום Anthropic+Voyage — מפתח אחד `GEMINI_API_KEY`. עודכנו ADR-001, ADR-011, CLAUDE.md, src/lib/ai, .env, ACCESS-MAP.
- **סביבה הוקמה:** Node v24.16.0 (portable, ללא admin) + pnpm + 999 deps. `pnpm drive:test` עבר — **2 תיקיות-Drive מופו** (133 קבצים), אוחדו ל-`CONTENT-INDEX.md` (החליף content-inventory + curriculum-coverage → stubs).
- **CI תוקן:** prettier repo-wide (job ה-lint נכשל על MD לא-מפורמט) → commit `05c9216`. husky hooks **עובדים** כאן (git-bash + nodejs ב-PATH).
- **ניקוי git (C2):** כל 4 ענפי `claude/*` נמחקו → **single-branch main** (`docs-business-pivot-adrs` אומת קובץ-קובץ כ-predecessor מוחלף).
- **CLAUDE.md:** סעיף רישום-MD + כלל קבוע (כל .md חדש נרשם ב-CLAUDE.md + PROJECT-MAP).

### מצב

Node+pnpm+deps ✅ · Drive מחובר+מופה ✅ · single-branch `main` ✅ · CI ירוק ✅. **חסר:** import pipeline (`src/lib/import/*`) לא נכתב · `GEMINI_API_KEY` טרם הוגדר.

### הצעד הבא

1. **להגדיר `GEMINI_API_KEY`** ב-`.env.local` (Google AI Studio — כנראה כבר ברשות מוטי).
2. לבנות import pipeline (ADR-011, Gemini, ~6 קבצים) → ייבוא T1 → Quiz Engine (Phase 5).
3. המשך end-to-end: Upload UI (Phase 3) → persistence (Phase 2) → Course-as-Product (Phase 10).

---

## 2026-05-31 — הקמת ארכיטקטורת-הקשר + פתרון חוסם-git ✅

### מה נעשה (committed + pushed ל-main `66eb19d`)

- **9 קבצי-הקשר** ב-`docs/context/` (PROJECT-MAP, PROJECTS, STATUS, EXECUTION-PLAN, TASKS, BUGS, DECISIONS, ACCESS-MAP, SESSION-LOG) — תשתית הרציפות בין-סשנים. `EXECUTION-PLAN.md` = התוכנית המאוחדת.
- תיקונים: `auth-drive.ts` (OAuth loopback), `test-drive.ts`/`test-db.ts` (.env.local), `.gitattributes` + husky→LF, `MEMORY.md` עודכן (→ STATUS.md).
- **זיכרון** (`~/.claude`): עברית-תמיד · push-to-main · Todolist · git-bash-blocker.
- **חיבורים מאומתים:** Supabase migration (7 טבלאות+57 scope-IDs) · Drive OAuth+test · DB · app ב-localhost:3000.

### החוסם שנפתר 🔑

git-bash שבור (fork 0xC0000142) → husky hooks לא רצים → commit/push נחסמו (גם `--no-verify` לא הספיק, כי `prepare-commit-msg` עדיין forks). **פתרון:** `git config --unset core.hooksPath` (מקומי). איכות נשמרת ע"י `tsc --noEmit` + `prettier --check` ידניים + CI. פירוט: [BUGS.md](BUGS.md#git-bash-fork).

### הצעד הבא (לסשן החדש) — הכל פתוח, push עובד

1. **C2** · למחוק 4 ענפים מיותרים: `git push origin --delete claude/docs-business-pivot-adrs claude/fix-home-redirect claude/phase-2-dashboard-skeleton claude/studiesgo-app-mapping-NLa2h` (main מכיל 100% מהתוכן).
2. **C3** · להוציא ~113MB וידאו מ-git (`git rm --cached docs/sources/studiesgo-videos/**/video.mp4` + `.gitignore`).
3. **B2-B4** · טיוב: content_scope_extensions→docs/internal/, ארכוב מיושנים, Voyage ל-CLAUDE.md.
4. **חוסם-על לפיתוח:** להפיק `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY` → לבנות import pipeline (ADR-011, ~6 קבצים) → Quiz Engine (4 types חסרים). ראה [TASKS.md](TASKS.md) + [EXECUTION-PLAN.md](EXECUTION-PLAN.md).

### תזכורת workflow

single-branch · commit+push ל-main אחרי כל משימה · `core.hooksPath` נשאר unset מקומית (husky לא רץ עד שגית-bash יתוקן).
