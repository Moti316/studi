# TASKS — מאגר-המשימות המלא

> המאגר המלא (backlog). `Todolist.md` בשורש = תת-קבוצה פעילה של הסשן הנוכחי.
> ⬜ פתוח · 🔄 בתהליך · ✅ הושלם · ⏸️ דחוי · 🔴 חסום. מעודכן: 2026-05-31.

## עכשיו — תשתית-הקשר + ניקוי (סשן 2026-05-31)

- ✅ ארכיטקטורת-הקשר: 9 קבצי `docs/context/`
- ✅ זיכרון: העדפות (עברית · push-to-main · Todolist) + git-bash blocker
- 🔴 C1 · להנחית שיפורי-היום ל-main (auth-drive loopback, test-db, docs) — **חסום: git-bash**
- 🔴 C2 · למחוק 4 ענפים (docs-business-pivot-adrs, fix-home-redirect, phase-2-dashboard-skeleton, studiesgo-app-mapping-NLa2h) — דורש push/gh
- 🔴 C3 · להוציא ~113MB וידאו מ-git (rm --cached + .gitignore) — דורש commit
- ⬜ B · טיוב: להעביר content_scope_extensions.md→docs/internal/, לארכב מיושנים→docs/archive/, להפנות phase-tables ל-STATUS.md, Voyage ל-CLAUDE.md

## חוסם-על

- 🔴 **לפתור git-bash fork** (או להחליט על מנגנון-commit חלופי) — חוסם את כל ה-git-writes. ראה BUGS.md.
- 🔴 להפיק `ANTHROPIC_API_KEY` + `VOYAGE_API_KEY` — חוסם את ה-import pipeline.

## שלב 1 — Content Import (ADR-011)

- ⬜ `scripts/import-content.config.ts` (budget + scope keywords)
- ⬜ `src/lib/import/chunker.ts` (semantic chunking + hash)
- ⬜ `src/lib/import/scope-tagger.ts` (regex + Haiku)
- ⬜ `src/lib/import/embedder.ts` (Voyage batch)
- ⬜ `src/lib/import/report.ts` (JSONL log + summary)
- ⬜ `scripts/import-content.ts` + פקודות `import:t1`/`import:full`
- ⬜ ייבוא T1 (18 קבצים) → `questions` + scope-tagging ידני

## שלב 2 — Quiz Engine (Phase 5, לב ה-MVP)

- ⬜ `MCQLong.tsx` · `MCQShort.tsx` · `ExplanationCard.tsx`
- ⬜ `ScenarioWalkthrough.tsx` (type-5, LLM-rubric)
- ⬜ route `/lesson/[id]` + `/lesson/practice` + `/lesson/exam` (mock-exam, טיימר)
- ⬜ API: next-question · attempts · evaluate-scenario · deep-explanation (RAG)
- ⬜ טסטים ל-4 הרכיבים החדשים

## שלב 3 — Should-have

- ⬜ Spaced-Repetition (SM-2) · ⬜ Stats לפי-נושא · ⬜ Hebrew-TTS על deep-explanation

## דחוי (post-2026-07-15)

- ⏸️ Phase 3 Upload · Phase 6 Gamification מלא · Phase 7 TTS-4-voices · Phase 8 Credits · Phase 9 Polish · Phase 10 Factory
- ⏸️ כיווץ היסטוריית-git מהווידאו (drastic) · איחוד עמוק של 4 קבצי-content
