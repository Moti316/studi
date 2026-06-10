# ADR-018 — LiveEngine: סימולציית-וועדה פתוחה-חיה (Claude · דיאלוג רב-תורי)

> סטטוס: **Accepted** · 2026-06-10 · בעלים: `tech-lead` (איתן) · `motilev8`
> Phase: 5 (lesson-player) / מיני-קורס-תרחישים · מרחיב את [ADR-016](ADR-016-committee-simulation.md) (סימולציה · hybrid) + [ADR-017](ADR-017-claude-live-evaluation.md) (הערכה-חיה).
> 🧠 זיכרון: `committee-simulation-direction` · `claude-live-evaluation`.

---

## הקשר

ADR-016 מימש סימולציה **פרה-בנויה** (`PrebakedEngine` · בחירה-סגורה · אפס-runtime). הכרעת-מוטי
(2026-06-09): התרגול חייב להיות **תשובה-פתוחה** — המועמד מקליד, והמפקח מגיב **כמו בוועדה אמיתית**
(הדגמת-מגן: היכרות-אישית → תרחיש-ענפי → צלילה-לחוק → השאלה-האכזרית · partial-credit "חצי-נקודה" ·
תיקון+לימוד · ציון 0-100). ADR-017 הקים את תשתית-Claude (`claudeGenerateJSON` · single-shot) לשו"ת-
פתוח, אך **לא** חיבר אותה לדיאלוג-הסימולציה. ADR-018 משלים את ה-`LiveEngine` הזה.

## ההכרעה

**קריאת-Claude אחת לכל תור, המחזירה JSON-envelope** עם `inspectorReply` (טקסט-חופשי עשיר ·
עשוי diagram-ASCII) + שדות-meta (quality · pointsAwarded · advanceStage · nextInspector ·
nextStage · nextQuestion · done · finalReport). **לא** שתי-קריאות (grade→narrate):

- **עלות/latency:** כל תור = קריאה עם transcript-גדל. שתי-קריאות מכפילות עלות+השהיה.
- **קוהרנטיות:** ההערכה _היא_ הנרטיב ("חצי-נקודה: תפסת X, פספסת Y"). מעבר-חשיבה-אחד שומר על
  עקביות בין-המספר-לפרוזה.
- **תקדים:** `gradeOpenAnswerSmart` (ADR-017) כבר מוכיח JSON-מ-Claude בריפו.

### הוזלת-Claude (תנאי-מקדים · `claude.ts`)

כל תור = קריאה → עלות מצטברת. שלושה אמצעים:

1. **prompt-caching** — ה-system (פרומפט-מגן + עיגון · קבוע לאורך הסשן) נשלח עם `cache_control:
ephemeral` → ~90% הנחה על ה-input-החוזר בכל תור-המשך (`CacheableSystem` · `toSystemParam`).
2. **`claudeConverse`** — שיח רב-תורי אמיתי (message-history) במקום single-shot.
3. **`max_tokens≈900`** — מספיק לתגובת-מפקח עשירה + envelope, בלי JSON-חתוך.
4. **skip-קצרות** — תשובה ריקה/קצרה-מאוד → nudge דטרמיניסטי (אפס-קריאה · `isTooShortToGrade`).

### שכבת-transport מקבילה (לא דוחקים ל-`SimulationEngine`)

ה-`SimulationEngine` הקיים סינכרוני + option-index (בחירה-סגורה). החי = אסינכרוני + טקסט-חופשי.
לכן **רכיב-נגן מקביל** (`LiveSimulationPlayer`) + reducer-לקוח טהור (`live-engine.ts`) — לא משנים את
`PrebakedEngine`/`SimulationPlayer` (נשארים ה-default חסר-המפתח · המוצר).

### fallback קשיח (3 שערים · `respond-live.action.ts`)

`respondLiveAction` **לעולם לא זורק**: (1) תשובה-קצרה→nudge · (2) `!isClaudeConfigured()`→
דטרמיניסטי · (3) Claude→`parseLiveTurn`; כשל→דטרמיניסטי. כך החי הוא **שדרוג-מופעל-במפתח**.

### עיגון (אנטי-הזיה)

חבילת-עיגון פר-ענף (`grounding.ts` · שם+שנה בלבד · אפס מספרי-סעיף-מומצאים). הפרומפט-מגן אוסר
המצאת-תקנות; ציטוט-לא-בטוח → [לא ידוע]. v2 יוכל למשוך ציטוט-verbatim מהקורפוס.

## מימוש

- `src/lib/ai/claude.ts` — `CacheableSystem` · `toSystemParam` · `claudeConverse` (additive · backward-compatible).
- `src/lib/ai/prompts/committee-sim/live.ts` — `buildLiveSystemPrompt` · `parseLiveTurn` · `transcriptToMessages` · `isTooShortToGrade` · fallback דטרמיניסטי.
- `src/lib/ai/prompts/committee-sim/grounding.ts` — `packForBranch` · `formatGrounding`.
- `src/features/simulation/{live-types,live-engine,respond-live.action,InspectorBubble,LiveSimulationPlayer}` .
- `src/app/preview/simulation-live/page.tsx` — dev-preview (ענף בנייה).

## השלכות / סיכון

**חיובי:** חוויית-וועדה אותנטית · הבנת-קשר-אמיתית · fallback-בטוח · המוצר (Prebaked) לא-נגוע.
**שלילי:** עלות-פר-תור (Haiku זול אך לא-אפס · caching ממתן) · stack-divergence (Claude=הערכה / Gemini=תוכן · מתועד).
**סיכון-מנוטר:** JSON-עם-טקסט-ארוך עלול להיחתך → `max_tokens=900` + `parseLiveTurn` defensive + fallback. Plan-B (אם יתגלה רעוע): פרוטוקול-sentinel `===META===` (split במקום JSON.parse).

## חלופות שנדחו

- **שתי-קריאות (grade→narrate):** עלות/latency כפול · פיצול-פרסונה. נדחה.
- **דחיקת החי ל-`SimulationEngine`:** עיוות-ממשק (סינכרוני↔אסינכרוני). נדחה — רכיב-מקביל.
- **חי-בלבד (ביטול Prebaked):** סותר "אפס-runtime-ללומד" (ADR-015/016). Prebaked נשאר ה-default.

## עדכון-סקירה (2026-06-10) — הסיכון-המנוטר התממש + הקשחות

> סקירה רב-סוכנית + **אימות-חי** של ה-LiveEngine. ראה `BUGS#liveengine-maxtokens-truncation` + `BUGS#night-run-review`.

- **★ הסיכון-המנוטר התממש:** `max_tokens=900` באמת חתך את ה-JSON (תגובת-מפקח עברית-עשירה) → `parseLiveTurn` זרק → fallback **בכל תור** → **Claude מעולם לא הגיע ללומד** (האימות-החי תפס · הסקירה-הסטטית לא). **תוקן `max_tokens=3000`** · אומת-חי `source:'claude'`.
- **הקשחות-בטיחות (עכשיו ש-Claude חי בפועל):** שומר-ציטוט-מומצא (`parseLiveTurn` — מספר-סעיף לא-מאומת מול חבילת-העיגון [שם+שנה בלבד] → `mode` יורד `מאומת`→`מוסקנא`) · prompt-injection (delimiters `---תחילת/סוף תשובת-המועמד---` + **נטרול-זיוף** [3+ מקפים→מקף-בודד] + סעיף-system "קלט-לא-מהימן") · cost-guard (`transcript>24`→דטרמיניסטי).
- **הקשחות-נכונות:** ציון-סיום אמיתי-לפי-ביצועים (גם בכפיית-קאפ · `deterministicReport` · לא 60-קבוע) · `clampLiveProgress` (turn-cap · התקדמות-מונוטונית) · `turnIndexInStage` מתאפס רק על stageChanged · auth-gate (`getUser`) · aria-live מבודד.
- **🟡 `#14` ציון-לקוח-ניתן-לזיוף — מקובל-כסיכון-נמוך:** השרת stateless → מחשב את הציון מ-`transcript`-הלקוח (כולל `pointsAwarded`). תיקון-מלא = sessions-מגובי-DB. **מקובל** כי הסימולציה **creator-gated · תרגול-עצמי-של-מוטי** (זיוף = "רמאות-עצמית" · אפס-תמריץ). יוסב לתיקון אם/כשהסימולציה תוגש ללומדים-חיצוניים עם השלכת-ציון.
