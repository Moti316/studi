# TODO · D — Phase 5 — השלמת Quiz Engine

> שלב D ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: 🔄 D1 רכיב-בנוי (`69d6f9a`); פתוח D2–D6 (זז בלי תלות-במוטי) · תלות: D4 deep-explanation תלוי ב-RAG (E) · תוכן-אמת מ-B מועיל · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

נגן-השיעור (`/lesson/[id]`) תומך ב-**כל 5 סוגי-השאלות** (MCQ-long · MCQ-short · matching · explanation · scenario) עם משוב מיידי, נתיבי-תרגול-ובחינה נפרדים (`/lesson/practice` + `/lesson/exam` כולל מבחן-דמה 30 שאלות וטיימר), שכבת-API מלאה (next-question · attempts · evaluate-scenario · deep-explanation), חזרה-מרווחת (SM-2) ומסך-סטטיסטיקה לפי-נושא — הכל ירוק (typecheck+vitest) ומכוסה בטסטים. "סיום" = לומד יכול לתרגל פרק שלם, להיכשל/להצליח, לקבל הסבר, ולחזור על-פי SM-2 — מקצה-לקצה.

## תלויות

חוסם חלקי: **D4 → deep-explanation** דורש RAG (שלב E) — ניתן לבנות את ה-route עם stub/feature-flag ולחבר ל-RAG כשמוכן. **D1 → evaluate-scenario** דורש Gemini-rubric (כבר זמין, לא תלוי במוטי). תוכן-אמת מ-B (בנק-השאלות המתויג `in_scope`) מעשיר אך אינו חוסם — אפשר fixtures. פותח: מצב-לימוד "תרחישים" (יישום) ו"שו"ת" (זיהוי) מ-`COURSE-DESIGN.md`, ומאפשר את הרצת-הייבוא M5.

## תתי-משימות

- [~] **D1** 🔄 — ✅ **רכיב נבנה ונבדק** (`69d6f9a`: `ScenarioWalkthrough.tsx` + `/poc/scenario` + 7 טסטים): case-study (schema `scenarios`) ב-3 שלבים work→review→done · חשיפת פתרון-מומחה · **הערכה-עצמית מול rubric** (דטרמיניסטי, `passThreshold`, חוזה `onResult`). RTL מלא · a11y (checkbox native) · design-tokens. **נותר:** (א) הערכת-LLM אוטומטית = **D4** (`evaluate-scenario`, free-text→ציון) — הרכיב מוכן ל-swap ללא שינוי-חוזה; (ב) **טעינת-`scenarios` ב-lesson-loop** (`/lesson/[id]` join + dispatch ב-`LessonPlayer`). · ref: [COURSE-DESIGN.md](../../courses/safety-officer/COURSE-DESIGN.md), [MatchingPairs.tsx](../../src/features/lesson-player/components/MatchingPairs.tsx)
  - **ספֵק תשובת-התרחיש שאושר:** **תשובה 3-חלקים:** (1) פעולה-מיידית · (2) פעולה-מנהלתית [מדרג-בקרות + תיקון-כשל-שורש] · (3) סמכות-חוקית [תקנה+סעיף מדויק פר-בקרה]. **מחוון = 4 עקרונות-הוועדה:** פעולה-מיידית · מדרג-בקרות (הנדסי לפני PPE) · גיבוי-חוקי · פעולה-ניהולית-מתקנת. תמציתי; מטריצת-JSA→capstone בלבד. השראת-מבנה: scenarios פר-ענף (מגן, reference).
- [ ] **D2** — `ExplanationCard.tsx` (type-4, כרטיס-הסבר ללא-שאלה + `TipHighlight` פנימי מובלט). · קריטריון-קבלה: `<QuizHeader>`+`<ActionsRow>`(דגל/קול/הסבר); tip-card עם background-שונה; כפתור "הבנתי, המשך →" → `+5 XP` + next-question; TTS אופציונלי autoplay לפי opt-in; 🚩 פותח report-modal; RTL. · ref: [lesson-explanation.md](../screens-spec/lesson-explanation.md)
- [ ] **D3** — routes `/lesson/practice` (תרגול-חופשי, ללא-לחץ) + `/lesson/exam` (מבחן-דמה **30 שאלות** + **טיימר** + ציון-עובר). · קריטריון-קבלה: practice = רצף next-question בלי-טיימר עם משוב-מיידי; exam = 30 שאלות, טיימר-יורד נראה, ללא-משוב-תוך-כדי, מסך-סיכום-ציון בסוף; שני המסכים RTL ומשתמשים ב-5 רכיבי-השאלה. · ref: [lesson-mcq-long.md](../screens-spec/lesson-mcq-long.md), [lesson-mcq-short.md](../screens-spec/lesson-mcq-short.md), [lesson-matching.md](../screens-spec/lesson-matching.md)
- [ ] **D4** — API: `next-question` · `attempts` · `evaluate-scenario` (Gemini rubric) · `deep-explanation` (RAG — תלוי E). · קריטריון-קבלה: `GET /api/lessons/[id]/next-question`→question-object (מסונן `in_scope` + פר-נושא); `POST /api/attempts`→`{correct, correct_index, explanation, source_chunk_id, xp_earned}` + עדכון שדות-SM-2; `POST /api/scenarios/evaluate`→ציון+מצב-תשובה לפי-rubric; `POST /api/explanations/deep`→stream מ-RAG (stub/flag עד-E); כולן עטופות try/catch+telemetry. · ref: [lesson-feedback.md](../screens-spec/lesson-feedback.md), [COURSE-DESIGN.md](../../courses/safety-officer/COURSE-DESIGN.md)
- [ ] **D5** — טסטים (vitest) ל-4 הרכיבים החדשים (Scenario · Explanation · 2 routes / רכיבי-מסך). · קריטריון-קבלה: כיסוי state-machine של Scenario (idle→result), אינטראקציות keyboard, מסלול-correct ומסלול-wrong+deep-explanation, טיימר-exam וספירת-30; כל הטסטים ירוקים ב-`pnpm test`. · ref: [MatchingPairs.tsx](../../src/features/lesson-player/components/MatchingPairs.tsx)
- [ ] **D6** — Spaced-Repetition (SM-2) — חישוב `srIntervalDays`/`srEaseFactor`/`nextReviewAt` (שדות **כבר ב-schema**: `drizzle/schema.ts` ~228-230) + תור-חזרה לפי `idx_attempts_review` + מסך Stats לפי-נושא. · קריטריון-קבלה: אלגוריתם-SM-2 מעדכן 3 השדות פר-attempt (איכות-תשובה→ease+interval); `next-question` שולף-קודם פריטים שעבר זמן-חזרתם; Stats מציג accuracy-per-topic + empty-state (אין-גרפים-ריקים). · ref: [stats.md](../screens-spec/stats.md)

## מסמכי-ייחוס (קרא לפני עבודה)

- [../screens-spec/lesson-explanation.md](../screens-spec/lesson-explanation.md) — מפרט כרטיס-הסבר (type-4) + tip + acceptance.
- [../screens-spec/lesson-mcq-short.md](../screens-spec/lesson-mcq-short.md) — מפרט MCQ-short / fill-in-blank (type-2).
- [../screens-spec/lesson-mcq-long.md](../screens-spec/lesson-mcq-long.md) — מפרט MCQ-long (type-1) + חוזה `next-question`/`attempts`.
- [../screens-spec/lesson-matching.md](../screens-spec/lesson-matching.md) — מפרט matching (type-3) + state-machine.
- [../screens-spec/lesson-feedback.md](../screens-spec/lesson-feedback.md) — מסך-פידבק + זרימת deep-explanation (RAG).
- [../screens-spec/stats.md](../screens-spec/stats.md) — מסך סטטיסטיקה/התקדמות + accuracy-per-topic + empty-state.
- [../../courses/safety-officer/COURSE-DESIGN.md](../../courses/safety-officer/COURSE-DESIGN.md) — 3 מצבי-לימוד (שו"ת/תרחישים/מורה-AI) + מתודולוגיית-מגן (מצבי-תשובה לrubric).
- [../../src/features/lesson-player/components/MatchingPairs.tsx](../../src/features/lesson-player/components/MatchingPairs.tsx) — תבנית-ייחוס (reducer · RTL · reduced-motion · feedback-sheet).

## החלטות פתוחות / הערות

- **name-clean:** ללא שמות-מרצים — חוקים/תקנות נחלת-כלל; חומרי-מרצה = reference בלבד.
- deep-explanation (D4) מומלץ מאחורי feature-flag עד-שRAG (E) מוכן — אחרת stub שמחזיר source_chunk גולמי.
- בחירת-rubric ל-evaluate-scenario לפי 3-מצבי-התשובה של מגן — לאמת ניסוח-ה-prompt מול `ADR-009` בעת-המימוש.
- > **🔒 כלל-מגן (firewall) — השראה-בלבד:** ריפו-מגן (`github.com/Moti316/megen` · איתן+שגיא) = **השראה/reference בלבד** למבנה/תכנון (תרחישים פר-ענף · `study_plan_90days` · committee_bank · 4-עקרונות-הוועדה). **אסור להעתיק/לקחת** קוד · תוכן · prompts. **לעולם לא מתערבב** עם ריפו-StudiBuilder (קריאה → תיקייה נפרדת בלבד). נדרשת פרסונה? **HYBRID** — מחלצים את המבנה-המוכח כ-spec, כותבים **native** (name-clean·RAG·cache·ציטוט), מאמתים **parity** מול committee_bank. **ללא copy/coupling.** ספק → מוטי. (גובר על ADR-009 Phase B — העתקה-verbatim מבוטלת.)
- ספי-מבחן-דמה (D3): 30 שאלות + עובר-70 (עיוני) — לאמת מול `COURSE-DESIGN.md`/curriculum בעת-המימוש (לאמת).
