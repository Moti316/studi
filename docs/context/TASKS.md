# TASKS — מאגר-המשימות המלא

> המאגר המלא (backlog). `TODO.md` בשורש = מקור-האמת למשימות-החיות (live). `Todolist.md` = תת-קבוצה פעילה.
> ⬜ פתוח · 🔄 בתהליך · ✅ הושלם · 🔴 חסום. מעודכן: 2026-06-02 (יישור-קו אחרי מיזוג v1, `main=93f6d79`).
> **מסגרת:** build end-to-end — אין דחיות. ראה [EXECUTION-PLAN.md](EXECUTION-PLAN.md).

## עכשיו — תשתית + ניקוי

- ✅ ארכיטקטורת-הקשר: 9 קבצי `docs/context/`
- ✅ זיכרון: העדפות (עברית · push-to-main · Todolist · build-end-to-end)
- ✅ C1 · שיפורי-היום ב-main (כבר ב-`415e149`)
- ✅ הקמת `.env.local` במחשב הנוכחי (Supabase+Drive+`GEMINI_API_KEY` — כולם מוגדרים ומאומתים)
- ✅ C2 · נמחקו כל 4 הענפים → **single-branch main**. `docs-business-pivot-adrs` אומת קובץ-קובץ כ-predecessor מוחלף (אין קבצים ייחודיים)
- ✅ C3 · **הוחלט: וידאו נשאר ב-repo/git** (מוטי 2026-05-31) — מבטל את משימת ההוצאה
- ⬜ B · טיוב: `content_scope_extensions.md`→`docs/internal/`, ארכוב מיושנים→`docs/archive/`, Voyage ל-`CLAUDE.md`

## חוסם-על

- ✅ **`GEMINI_API_KEY` מוגדר ומאומת** (50 מודלים · generateContent עובד) — ה-AI לא חסום עוד.
- ✅ Node v24.16.0 + pnpm + deps מותקנים (portable, ללא admin).
- ℹ️ git-bash blocker — **לא רלוונטי במחשב הנוכחי** (husky לא מוגדר; commit/push עובדים).

## פלטפורמת-היצירה — Content Import (Phase 4, ADR-011)

- ✅ `pnpm drive:test` עבר — Drive מחובר ו-2 התיקיות מופו (ראה `CONTENT-INDEX.md`)
- ✅ `scripts/import-content.config.ts` (budget hard-cap $5 + T1 allow-list + MIME routing)
- ✅ `src/lib/import/scope-tagger.ts` (regex + Gemini 2.5 Flash, default-deny)
- ✅ `src/lib/import/map-question.ts` + `upsert-questions.ts` (idempotent, source_ref + ON CONFLICT)
- ✅ `scripts/import-content.ts` + פקודות `import:t1` / `import:t1:dry` (dry-run = חינם, ללא Gemini/DB)
- 🔴 **M5: ייבוא T1 בפועל** (`--execute`, ~540 שאלות) — חסום: discovery רחב-מדי (dry-run מצא 69 קבצים, צריך לצמצם ל-allow-list) + תלוי אישורי מוטי 1→3
- ⬜ **RAG (טרם נכתב):** `chunker.ts` (semantic chunking) + `embedder.ts` (Gemini embeddings → pgvector) ל-"הסבר לעומק". הצינור הנוכחי = ייבוא בנק-שאלות מוכן, **לא** RAG-chunking

## חוויית-הלימוד — Quiz Engine (Phase 5)

- ✅ `MCQLong.tsx` · `MCQShort.tsx` · `McqQuestion.tsx` · `LessonPlayer.tsx` · `LessonHeader.tsx`
- ✅ route `/lesson/[id]` + admin `/admin/questions` (creator-gated, `QuestionTagger`)
- ✅ טסטים לרכיבים (כלולים ב-392)
- ⬜ `ExplanationCard.tsx`
- ⬜ `ScenarioWalkthrough.tsx` (type-5, LLM-rubric — קריטי לוועדה)
- ⬜ routes `/lesson/practice` + `/lesson/exam` (mock-exam, טיימר)
- ⬜ API: next-question · attempts · evaluate-scenario · deep-explanation (RAG)
- ⬜ Spaced-Repetition (SM-2; שדות כבר ב-schema) · Stats לפי-נושא

## השלמת הפלטפורמה (creator end-to-end)

- ⬜ Phase 3 — Upload UI ל-creator (`/create/*`): מוטי מעלה מקורות → מפעיל pipeline מה-UI
- ⬜ Phase 2 — persistence אמיתי ל-Dashboard (החלפת mock-data)
- ⬜ Phase 6 — gamification (XP/streak/practice-log)
- ⬜ Phase 7 — Hebrew-TTS על "הסבר לעומק" (קול-אחד → הרחבה ל-4)

## Course-as-Product (Phase 10, ADR-006)

- ⬜ landing-page לקורס "ממונה בטיחות"
- ⬜ checkout + payment (ADR-008) + Phase 8 credits
- ⬜ ads/marketing assets
- ⬜ אינטגרציית-מגן (ADR-009 Phase B): personas (מגן/שגיא) + committee_bank (31 שאלות), אם רלוונטי
