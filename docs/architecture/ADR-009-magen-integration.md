# ADR-009: Megen Integration — Phased Convergence Strategy

> **Status**: Accepted
> **Date**: 2026-05-29
> **Authors**: tech-lead · product-owner · motilev8
> **Phase**: Phase A — pre-deadline (now → 2026-07-15) · Phase B — Phase 10 (post-deadline)
> **References**: ADR-005 (NotebookLM hybrid), ADR-006 (Course-as-Product Factory)

---

## Context

חשיפה ב-2026-05-29: מוטי הציג את [`Moti316/megen`](https://github.com/Moti316/megen) — מערכת **v1.2.0 production-ready** הקיימת לעזרתו ללימוד וועדת-הסמכת ממונה-בטיחות (deadline: **2026-07-15**).

זו לא הצעה — זו מערכת **פועלת** עם:

- 36 NotebookLM notebooks (44 מקורות-חקיקה ישראליים)
- 2 Claude Code subagents: 🦺 מגן (Vision Zero) + 🛡️ שגיא (Zero Trust)
- Master prompts: ~30K + ~15K תווים עברית, עם 3 מצבי-תשובה (`[מאומת]`/`[מוסקנא]`/`[לא ידוע]`)
- Telegram bot Python + Gemini 2.5 Flash, 10 שכבות-אבטחה production-grade
- 7 scenarios (815 שורות): committee_bank (31 שאלות-וועדה) + 6 ענפים + study_plan_90days
- C4 architecture + STRIDE threat-model

**שאלה ארכיטקטונית קריטית:** איך megen ו-StudiBuilder יחיו יחד?

---

## Decision: **Phased Convergence**

שילוב דו-שלבי, אסטרטגיה תלוית-זמן ביחס ל-deadline של הוועדה:

### Phase A — Side-by-Side (now → 2026-07-15)

**עיקרון:** אפס-סיכון לוועדה. שני המוצרים נפרדים, חולקים רק NotebookLM.

| רכיב        | מגן                                         | StudiBuilder                  |
| ----------- | ------------------------------------------- | ----------------------------- |
| **שימוש**   | מוטי בלבד — ללימוד אישי לוועדה              | פיתוח-platform ברקע           |
| **קוד**     | Python (Telegram bot)                       | TypeScript (Next.js)          |
| **LLM**     | Gemini 2.5 Flash (bot) + Claude (subagents) | Claude Sonnet 4.6             |
| **תוכן**    | NotebookLM 36 notebooks                     | אין עדיין — Phase 4           |
| **גישה**    | Telegram + Claude Code                      | Web (studibuilder.vercel.app) |
| **משתמשים** | מוטי + 4 חברי-לימוד (allowlist)             | מוטי לבד (testing)            |

**Shared:** NotebookLM הוא single-source-of-truth. גישה דרך `notebooklm-mcp` MCP server מ-Claude Code (לשניהם).

### Phase B — Megen ⊂ StudiBuilder (post-deadline, Phase 10)

**עיקרון:** megen-content הופך לקורס-ראשון על-StudiBuilder, ייצור-מסחרי לקהל-יעד.

תהליך:

1. **Content import** — `megen/scenarios/*.md` מועלות ל-`courses/safety-officer/lessons/` ב-StudiBuilder
2. **Personas migration** — master prompts (`magen.system.md`, `shagi.system.md`) מועתקים ל-`src/lib/ai/personas/` עם **prompt-cache** (כלל-יסוד מ-CLAUDE.md)
3. **Subagents → Tutors** — 2 הסוכנים הופכים ל-AI-tutors בתוך `<LessonPlayer>` (Phase 5)
4. **Course-Site Factory** (Phase 10 / ADR-006) — landing-page אוטומטית + payment
5. **Telegram bot** — נשאר כ-personal-channel של מוטי + 4 חברים. **לא** נדחף ל-public-product

---

## Alternatives Considered

### Option 1 — Side-by-Side לטווח-ארוך (נדחה)

שני מוצרים נפרדים-לתמיד.

- ✅ אפס-תלות בין הצוותים
- ❌ זריקה של נכס-תוכן (megen-content) מ-StudiBuilder = משבר-monetization (Phase 10 לא יכול להציע "ממונה-בטיחות" בלי megen)
- ❌ Phase 10 (ADR-006) מתחייב לקורס-ראשון = ממונה-בטיחות. ללא megen, אין content

### Option 2 — Megen ⊂ StudiBuilder Immediate (נדחה)

לדחוף את ה-integration לפני הוועדה.

- ❌ סיכון-קריטי: מוטי לומד לוועדה. כל הסחה = נמוך-יותר-שיעור-הצלחה
- ❌ זמן-פיתוח (3-5 שבועות) חופף עם זמן-הלימוד (6.5 שבועות) — מתחרים על אותה bandwidth
- ✅ אם הצליח, כבר יש מוצר-מסחרי ביום-הוועדה. **אבל הסיכון לא שווה**

### Option 3 — StudiBuilder ⊂ Megen (נדחה)

להרחיב את megen Python ל-web/payment במקום StudiBuilder.

- ❌ net-loss טכני:
  - Python-web (Flask/FastAPI) פחות-בשל מ-Next.js App Router
  - Gemini Flash < Claude Sonnet 4.6 לאיכות-עברית
  - השקעת StudiBuilder Phase 0-1-2 (3+ שבועות) הופכת throwaway
- ❌ מודל-עסקי של megen (single-user) לא תומך ב-multi-user-paid

### Option 4 — Hybrid Bridge API (נדחה)

שני המוצרים ממשיכים, גשר-API ביניהם (sync משתמשים+תוכן).

- ❌ Over-engineering: גשר דורש 2 DBs מסונכרנים, auth-bridge, conflict-resolution
- ❌ ה-creator הוא יחיד (מוטי). אין צורך ב-sync — הוא יודע איפה כל-נכס
- ❌ זמן-פיתוח לא-מצדיק value (השוואה לאופציה ה-נבחרת = Phased Convergence)

---

## Key Decisions

### 1. **2 הסוכנים (מגן + שגיא) — dual-life**

- **Phase A**: נשארים Claude Code subagents (לעבודת-development שלי + לימוד-אישי של מוטי)
- **Phase B**: Master prompts מועתקים ל-`src/lib/ai/personas/{magen,shagi}.system.md` בתוך StudiBuilder, נטענים עם **prompt-cache** (חיסכון 90% עלות-טוקנים, כלל-יסוד ב-CLAUDE.md)
- **Sync mechanism**: כרגע manual (copy-paste). Phase 10.5 — script שמסנכרן git-submodule או scheduled diff

### 2. **Telegram bot — נשאר personal-tool**

- **לא נדחף ל-public-product:**
  - 10 שכבות-אבטחה (security.py) כתובות ב-Python; שכפול ל-TypeScript = 1-2 שבועות
  - Telegram-UX לא-מתאים ל-paid-learning (אין quiz-types-מורכבים, אין gamification ויזואלי)
  - מהווה risk-vector חיצוני (Telegram API דרושים אישורים, GDPR ב-EU מורכב)
- **נשאר:** מוטי + עד 5 חברי-לימוד (allowlist.json) משתמשים כיום. ימשיכו.
- **תאריך-deprecation**: TBD. סביר 2027-01 אם StudiBuilder MVP-מסחרי הוכיח-את-עצמו

### 3. **NotebookLM = SPOF מקובל**

- שני המוצרים ניגשים דרך `notebooklm-mcp` MCP server
- מוטי הוא הבעלים-היחיד של כל ה-notebooks → SPOF לא-מסכן
- אם Google מבטל NotebookLM: יש מסלול-מילוט ל-Voyage AI embeddings + pgvector עצמאי (ADR-005 חוזה-data תומך)
- Rate limit: צריך-מעקב. כיום no-limit ל-personal-account, אבל אם 2 consumers (megen-MCP + StudiBuilder-imports) → ייתכן throttling

### 4. **Hybrid Bridge — נדחה במפורש**

Red-Line של ה-Tech-Lead: לא over-engineering ל-scale שלא קיים. ה-creator הוא single-user (מוטי). אין צורך ב-2-way sync.

### 5. **Shagi persona — internal-only**

🛡️ שגיא מומחה ב-security/AppSec. רלוונטי לעבודת-development (code review, threat model) — לא לקהל-לומדים-של-בטיחות-בעבודה.

**Phase B החלטה**: לא להעלות שגיא ל-public personas. הוא נשאר Claude Code subagent של מוטי בלבד.

---

## Consequences

### Positive

- **אפס-סיכון לוועדה** — מוטי ממשיך להשתמש ב-megen כפי שהוא יודע
- **שימור-נכס** — 36 notebooks + scenarios + master-prompts לא הולכים-לאיבוד; נכנסים ל-StudiBuilder ב-Phase B
- **שני LLM providers** = redundancy (Gemini ב-bot + Claude ב-web)
- **קורס-ראשון מסחרי מובטח** — ב-Phase 10, יש לנו ready-to-launch content

### Negative

- **Manual sync** של prompts/scenarios בין megen → StudiBuilder. סיכון drift. מתועד כ-open-question.
- **2 codebases לתחזק** — לפחות עד deprecation של ה-bot
- **NotebookLM dependency** — אם Google מורידים את המוצר, יש עבודה לעבור ל-self-hosted RAG

### Neutral

- ADR-005 (NotebookLM hybrid) עודכן ב-2026-05-29 לשקף את המצב האמיתי של megen
- ADR-006 (Course-as-Product Factory) נשאר תקף — Phase B מבצע את ה-vision שלו

---

## Implementation Plan

### Phase A — מיידי (now → 2026-07-15)

- [x] ADR-009 (זה) נכתב
- [ ] עדכון `CLAUDE.md` של StudiBuilder להוסיף הפנייה ל-megen (sister-project)
- [ ] בדיקה ש-`notebooklm-mcp` עובד מ-StudiBuilder development environment (לטובת אופציה לייבא content ב-Phase 4)
- [ ] **ללא קוד חדש לפני 2026-07-15** — פיתוח-StudiBuilder ממשיך לפי MVP-plan (`docs/mvp-plan-2026-07-15.md`)

### Phase B — אחרי הוועדה (Phase 10)

1. **Content migration script** — `scripts/import-content.ts`:
   - **Source-of-truth = Google Drive** (motilev8 אישר 2026-05-29 לילה)
   - megen-repo הוא subset של Drive — לא המקור-העיקרי
   - קורא Drive folders דרך Drive API (read-only scope)
   - normalizer: Drive files → Markdown מובנה (schema ב-MVP-plan §10.2)
   - מפרסר metadata (פקודה/תקנה/קושי) מ-headings + תיוגי `[מאומת]`/`[מוסקנא]`
   - **Committee Scope Filter** (קריטי, ראה `docs/content-scope.md`): כל chunk מתויג `in_scope: true|false` + `scope_refs[]` מול 21 פריטי-החקיקה ב-PDF
   - רק `in_scope=true` עולה ל-quiz; `false` נשמר כ-reference
   - מייצר רשומות `lessons` + `questions` + `scenarios` ב-Supabase
2. **Personas integration** — העתקת `magen.system.md` + `shagi.system.md` ל-`src/lib/ai/personas/`:
   - prompt-cache config
   - persona-router (איזה persona ל-איזה lesson type)
3. **First public course** — "הכנה לוועדת ממונה-בטיחות" עולה ל-`betichut.studibuilder.app` (ADR-006 Course-as-Product Factory)

---

## Validation

- [ ] Phase A: מוטי משתמש במגן כרגיל ללא הפרעה
- [ ] Phase A: StudiBuilder dev-build מצליח לפתוח `notebooklm-mcp` ולקרוא notebook 1 (smoke test)
- [ ] Phase B: import script מייבא 100% מ-scenarios ללא loss-of-fidelity
- [ ] Phase B: persona-prompts ב-StudiBuilder מחזירים תשובות זהות-באיכות למה שמגן מחזיר ב-Telegram (spot-check)

---

## Open Questions

1. **Drift-management mechanism** — איך megen-prompts ו-StudiBuilder-personas נשארים מסונכרנים?
   - אופציות: git submodule / sync-script / manual-quarterly-diff
   - דחוי ל-Phase 10.5
2. **Telegram-bot deprecation date** — מתי לעצור את ה-bot?
   - TBD לפי-traction של StudiBuilder MVP-מסחרי
3. **NotebookLM rate-limit עם 2-consumers** — האם יש throttling?
   - דרוש-מעקב כשStudiBuilder יתחיל לייבא בפועל (Phase B)
4. **Shagi persona לקהל-ציבורי?** — לא, internal-only (decided). מצב יתקבע ב-Phase B אם יחזור-לדיון.

---

## References

- ADR-001 (Stack) · ADR-005 (NotebookLM hybrid) · ADR-006 (Course-as-Product Factory) · ADR-008 (Payment provider)
- megen repo: https://github.com/Moti316/megen
- megen CLAUDE.md: `https://github.com/Moti316/megen/blob/main/CLAUDE.md`
- megen scenarios: `https://github.com/Moti316/megen/tree/main/scenarios`
- חלק י"ג בתוכנית-העל: `/root/.claude/plans/greedy-hopping-piglet.md`
