# ADR-017 — LiveEngine: הערכה-סמנטית-חיה של תשובות-חופשיות (Claude API)

> סטטוס: **Accepted** · 2026-06-09 · בעלים: `tech-lead` (איתן) · `motilev8`
> Phase: 5 (lesson-player) · קשור: [ADR-016](ADR-016-committee-simulation.md) (סימולציה · ה-LiveEngine) · [ADR-001](ADR-001-stack.md) (Gemini=LLM-תוכן — מסויג כאן).
> 🧠 זיכרון: `claude-live-evaluation` · `committee-simulation-direction`.

---

## הקשר

הכרעת-מוטי (2026-06-09): התרגול חייב **תשובות-פתוחות** (המשתמש מקליד), והמערכת צריכה
**להבין קשר/רלוונטיות במשמעות** — לא מילה-במילה. "אי אפשר לצפות שהמשתמש ידע בוודאות
מילה-במילה — צריך מנגון שיאפשר לבינה לקבל את המילים ולראות אם יש קשר." חל על:

1. **שו"ת-פתוח** (`ExplanationCard`) — המשתמש כותב, ומקבל הערכת-רלוונטיות + משוב.
2. **דיאלוג-הסימולציה** (ADR-016 · ה-LiveEngine) — תשובה-חופשית לכל תור-מפקח.

הערכה-סמנטית-אמיתית (זיהוי נרדפים: "נעילה ותיוג"="LOTO" · "ציוד-מגן"="צמ"א") דורשת
**מוח-LLM בזמן-אמת**. Gemini חסום-מכסה (20/יום · free-tier) ולא משרת לומדים.

## ההכרעה

**מנוע-הערכה = Claude API חי** (נבחר ע"י מוטי · AskUserQuestion 2026-06-09).

- **תוספת-stack:** `@anthropic-ai/sdk` · `ANTHROPIC_API_KEY` (server-only). **Gemini נשאר
  ה-LLM-לתוכן** (יצירה/סיווג/embeddings); **Claude = שכבת-ההערכה-החיה בלבד.**
- **מודל-ברירת-מחדל:** Haiku (`claude-haiku-4-5` · זול+מהיר להערכה · override `ANTHROPIC_MODEL_EVAL`).
- **fallback קשיח:** בלי מפתח (או כשל-Claude) → **מנגון-דטרמיניסטי** (`keyword-match`) — אפס-
  שבירה, התנהגות-זהה-לקודם. כך השכבה-החיה היא **שדרוג אופציונלי-מופעל-במפתח**, לא תלות-קשיחה.
- **`server-only`:** `claude.ts` + `evaluate-open-answer.ts` נקראים רק מ-Server-Action /
  route — לעולם לא ל-client-bundle (אפס-דליפת-מפתח).

## מימוש

- `src/lib/ai/claude.ts` — client (lazy · `isClaudeConfigured()` · `claudeGenerateJSON`).
- `src/lib/ai/prompts/evaluate-open-answer.ts` — `gradeOpenAnswerSmart()` (Claude → {grade,
  relevant, feedback, covered, missed} · fallback דטרמיניסטי).
- `src/features/lesson-player/grade-open-answer.action.ts` — Server-Action.
- `ExplanationCard` — קורא ל-action (async · "בודק…") → משוב-בוחן + מושגי-קשר. ✅ נבדק (fallback).
- ⏭️ **טרם:** סימולציה-LiveEngine (תשובה-חופשית פר-תור-מפקח · אותו contract).

## תלות-מוטי (חוסם-הפעלה)

ה-LiveEngine **רדום עד**: מוטי מוסיף `ANTHROPIC_API_KEY` ל-`.env.local` + מפעיל billing
ב-Anthropic. עד-אז ה-fallback-הדטרמיניסטי פעיל (הכל עובד · ללא הבנת-נרדפים).

## השלכות / סיכון

**חיובי:** הבנת-קשר-אמיתית · חוויית-וועדה אותנטית · fallback-בטוח · Gemini ל-תוכן נשאר.
**שלילי:** עלות-פר-תור-לומד (Haiku זול אך לא-אפס) · תלות-ספק-שני · stack-divergence (מתועד כאן).

## חלופות שנדחו

- **דטרמיניסטי-בלבד:** אפס-עלות אך לא "מבין" (חפיפת-מילים · מחמיץ נרדפים). נשאר כ-fallback.
- **Gemini-חי:** מכסה (20/יום) חוסמת שירות-לומדים.
