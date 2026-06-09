# ADR-005: NotebookLM Hybrid — Content Curation + Gemini Pipeline

> **Status**: Accepted (revised 2026-05-29 ערב after megen review)
> **Date**: 2026-05-29
> **Authors**: ml-engineer · domain-expert · motilev8
> **Phase**: 4 (pre-implementation)
> **Supersedes**: חלק מ-ADR-001 (שדחה NotebookLM)

> 🔧 **מורחב-ומדויק 2026-06-08 ע"י [ADR-015](ADR-015-notebooklm-content-engine.md)** (מנוע-תוכן NotebookLM · generate-offline→verify-G1–G5→serve-precomputed) — שלב-ה-generation עבר מ-Gemini-API-בתשלום ל-NotebookLM-מנוי; ה-data-contract עבר מ-`.md` ל-JSON-מובנה.

---

## Update — 2026-05-29 ערב

סקירת ריפו `megen` (v1.2.0) גילתה שהנחות Phase 4.0 לא היו מדויקות:

- **לא ייצוא ידני**: מוטי משתמש ב-`notebooklm-mcp` דרך Claude Code — גישה ישירה ל-NotebookLM, ללא copy-paste.
- **לא JSON מומצא**: הפורמט האמיתי הוא `scenarios/*.md` (Markdown מובנה), לא JSON schema שהגדרנו.
- **36 notebooks קיימים**: מאסטר + 33 ענפיות — workspace מוכן, לא צריך לבנות מאפס.
- **3 מצבי-תשובה תקניים** מוגדרים כבר: `[מאומת]` / `[מוסקנא]` / `[לא ידוע - נא לאמת בנבו]`.
- **System prompts ~30K תווים** (מגן + שגיא) — כוללים כללי citation מפורטים.

הקונספט הכללי (NotebookLM = curation, Gemini = generation) נשאר תקף. רק הפרטים הטכניים עודכנו.

---

## Context

ב-ADR-001 (Stack) דחינו את NotebookLM ובחרנו **Build from scratch** עם Gemini + pgvector — כדי לקבל שליטה מלאה על prompts, איכות ופורמט.

מאז התברר כי:

1. מוטי הוא **ה-creator** של הקורסים (לא משתמש-עולה-PDF סטנדרטי) — חלק י"ב בתוכנית-העל
2. יש לו כבר **NotebookLM Workspace קיים** עם curated content לקורס ממונה-בטיחות
3. **Source-grounding קריטי** לתחום-רגולציה: תשובות שגויות = כשלון-בחינה למשתמש
4. NotebookLM מצטיין ב-source-grounded citation — Gemini טוב יותר ב-presentation

המסקנה: הבחירה לא צריכה להיות "או-או" אלא **היבריד**.

---

## Decision

**NotebookLM משמש כ-content curator. Gemini משמש כ-content generator.**

### גבולות-אחריות

| שלב                        | אחראי                                              | מה הוא עושה                                                                        |
| -------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1. **Source ingestion**    | NotebookLM                                         | קולט PDFs/מסמכים מ-Drive, מבנה אינדקס פנימי                                        |
| 2. **Q&A curation**        | NotebookLM                                         | מוטי שואל שאלות, NotebookLM משיב עם ציטוטים — מוטי מאשר/דוחה                       |
| 3. **Export**              | notebooklm-mcp (Phase 4.0) / Automated (Phase 4.5) | גישה ישירה דרך Claude Code — ללא ייצוא ידני                                        |
| 4. **Import to our stack** | Our backend                                        | קריאת `scenarios/*.md` מ-megen → טבלאות `chunks`, `qa_pairs` ב-Supabase + pgvector |
| 5. **Lesson generation**   | Gemini 2.5 Pro                                     | מקבל chunks + qa_pairs כ-context → יוצר שיעורים בעברית                             |
| 6. **Question variation**  | Gemini 2.5 Pro                                     | מקבל qa אחד → יוצר 3-4 וריאציות (MCQ/matching/explanation)                         |
| 7. **Deep explanations**   | Gemini 2.5 Pro                                     | אם משתמש טועה → Gemini מסביר על-בסיס המקור המקורי                                  |
| 8. **Voice (TTS)**         | ElevenLabs (Phase 7)                               | בלי שינוי מ-ADR-001                                                                |

### Data Contract — megen → Our Import

**פורמט קלט אמיתי: `scenarios/*.md` (Markdown מובנה)**

קבצי Markdown בריפו megen (לא JSON) — דוגמה לתרחיש:

```
# תרחיש: עבודה בגובה (height)

## שאלה
מה חובת מעסיק לפני עבודה על גגות?

## תשובה [מאומת]
המעסיק חייב לספק ציוד מיגון מפני נפילה...
(מקור: תקנות הבטיחות בעבודה, סעיף 14)

## מקורות
- notebook-id: <UUID מ-NotebookLM>
- מסמך: תקנות בטיחות בעבודה, עמ' 22
```

**3 מצבי-תשובה תקניים (מגן):**

| מצב                        | משמעות                             |
| -------------------------- | ---------------------------------- |
| `[מאומת]`                  | אומת מול מקור ראשוני — ניתן לשימוש |
| `[מוסקנא]`                 | הסקה לוגית — לא מצוטט ישירות       |
| `[לא ידוע - נא לאמת בנבו]` | דורש בדיקה לפני שימוש              |

**Notebook references:**

- 36 notebooks קיימים ב-NotebookLM: UUID per notebook
- גישה דרך `notebooklm-mcp` (לא API ציבורי)

### Phase Plan

- **Phase 4.0 (notebooklm-mcp)**: מוטי קורא `scenarios/*.md` מ-megen דרך Claude Code + notebooklm-mcp — ללא ייצוא ידני. Backend מפרסר Markdown → `chunks`, `qa_pairs`. מספיק ל-MVP.
- **Phase 4.5 (semi-automated)**: pipeline שמסתנכרן אוטומטית עם megen repo (webhook/cron) בכל עדכון תרחיש.

### Committee Scope Filter (2026-05-29 לילה)

motilev8 העלה PDF עם **57 פריטי-חקיקה** (הורחב מ-21 ב-2026-05-30 לפי תוכנית-הלימודים) = ה-scope המדויק לוועדה. תיעוד מלא ב-`docs/content-scope.md`.

**אכיפה ב-import**:

- כל chunk מקבל metadata `in_scope: true|false` + `scope_refs: [{id, section}]`
- רק `in_scope=true` eligible לשאלות-וועדה
- `in_scope=false` נשמר כ-reference (יכול להגיע ל-"הסבר לעומק") אך לא ל-quiz
- megen-content שלא תואם את ה-57 מסומן `out-of-scope` ולא נמחק — נשמר ל-Phase B (Megen ⊂ StudiBuilder, post-deadline)

---

## Alternatives Considered

### Option A: NotebookLM-only

- ✅ הכי source-grounded
- ❌ אין שליטה על פורמט/UX/voice. NotebookLM ממשק קבוע
- ❌ אין gamification (XP/streak)

### Option B: Gemini-only (ADR-001 המקורי)

- ✅ שליטה מלאה
- ❌ סיכון-הזיות בתחום-רגולציה
- ❌ מאבדים את ההשקעה של מוטי ב-NotebookLM workspace

### Option C: היבריד (זה) ← **נבחר**

- ✅ מקבלים את הטוב משני העולמות
- ✅ מנצלים את ה-curation הקיים של מוטי
- ❌ תלות בכלי-צד-ג׳ (Google) שמופסק לפעמים
- ❌ ייצוא ידני בהתחלה = friction

---

## Consequences

### Positive

- כל question מיוצר מ-source-citation אמיתי → אמינות גבוהה
- מוטי שומר על role של "מומחה-תחום" (curator), Gemini עושה את ה-heavy lifting
- ניתן להחליף NotebookLM ב-RAG עצמאי בעתיד (Gemini embeddings + pgvector) בלי לשבור את ה-data contract

### Negative

- Phase 4.0 דורש workflow ידני של מוטי לכל קורס חדש (~2-4 שעות פר קורס)
- אם Google משנה את NotebookLM — נצטרך plan-B
- שני מערכות-איכות-בקרה לעקוב אחריהן

### Neutral

- ADR-001 מתעדכן (לא נמחק) — Gemini נשאר LLM יחיד אצלנו, NotebookLM הוא pre-processing

---

## Validation

- [ ] Phase 4.0: קריאת 50 qa-pairs מ-scenarios/\*.md דרך notebooklm-mcp לוקחת < 1 שעה
- [ ] Import script מפרסר Markdown בלי שגיאות על 100% מ-pairs
- [ ] רק תשובות `[מאומת]` מוזרמות לייצור ללא בדיקה נוספת; `[מוסקנא]` מסומנות; `[לא ידוע]` חסומות
- [ ] שאלות שנוצרו מ-qa-pairs שעברו human-review מקבלות ≥ 9/10 ב-spot-check (domain-expert)
- [ ] Deep explanation כוללת citation בפועל מהמקור (לא הזיה)

---

## References

- ADR-001 (Stack — Gemini+pgvector)
- ADR-006 (Course-as-Product Factory)
- ADR-009 (אם נכתב — megen integration)
- NotebookLM docs: https://notebooklm.google.com/
- megen repo: https://github.com/Moti316/megen
- megen/CLAUDE.md (גישת השם של המערכת, system prompts, notebooklm-mcp config)
- חלק י"ב בתוכנית-העל: Course-as-Product Factory
