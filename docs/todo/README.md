# docs/todo/ — TODO פר-שלב (שכבה 2)

> **היררכיית-TODO דו-שכבתית.** שכבה-1 = [`TODO.md`](../../TODO.md) בשורש (master — סקירת A–I מול תוכנית-הביצוע
> לכלל-הפרויקט). שכבה-2 = כאן — **קובץ לכל משימה-ראשית** עם פירוט תתי-המשימות, קריטריוני-קבלה, תלויות ומסמכי-ייחוס.
> סדר-השלבים נגזר מ-[`EXECUTION-PLAN.md`](../context/EXECUTION-PLAN.md) (סדר-תלויות). מעודכן: 2026-06-02.

## אינדקס השלבים

| שלב   | קובץ                                             | מצב-על               | תקציר                                                                         |
| ----- | ------------------------------------------------ | -------------------- | ----------------------------------------------------------------------------- |
| **A** | [A-moti-gates.md](A-moti-gates.md)               | 🔴 חוסם — הצעד-הבא   | שערי-מוטי: ISO 5.3/5.4 · אישור+הורדת חקיקה · מצגת פרויקט-גמר                  |
| **B** | [B-m5-import.md](B-m5-import.md)                 | 🟠 חסום (ע"י A)      | M5 — הרצת-ייבוא בנק-השאלות (~540) + תיוג                                      |
| **C** | [C-m6-deferred.md](C-m6-deferred.md)             | 🟡 פתוח (לא-חוסם)    | 3 ממצאי-M6 שנדחו + `server-only`                                              |
| **D** | [D-quiz-engine.md](D-quiz-engine.md)             | ⬜ פתוח              | Phase 5 — ScenarioWalkthrough · ExplanationCard · practice/exam · APIs · SM-2 |
| **E** | [E-rag.md](E-rag.md)                             | ⬜ פתוח              | Phase 4 — RAG chunker/embedder (pgvector)                                     |
| **F** | [F-upload-dashboard.md](F-upload-dashboard.md)   | ⬜ פתוח              | Phase 3 Upload-UI + Phase 2 persistence                                       |
| **G** | [G-gamification-tts.md](G-gamification-tts.md)   | ⬜ פתוח              | Phase 6 gamification + Phase 7 Hebrew-TTS                                     |
| **H** | [H-course-product.md](H-course-product.md)       | ⬜ פתוח 🎯           | Phase 10 — Course-as-Product (landing/checkout/ads)                           |
| **I** | [I-compliance-launch.md](I-compliance-launch.md) | ⬜ פתוח (לא-חוסם v1) | ציות: נגישות/פרטיות/צרכנות/תשלומים                                            |

## כללי-עבודה

- **מקור-אמת למצב-העל** = `TODO.md` (master). קובץ-שלב מפרט את ה-**איך**; ה-master מסכם את ה-**מה/מתי**.
- **עדכון:** סימון תת-משימה כ-✅ נעשה בקובץ-השלב; כשכל השלב נסגר — מעדכנים גם את ה-master.
- **תבנית קובץ-שלב:** כותרת+blockquote (שלב/מצב/תלות) → `מטרה (DoD)` → `תלויות` → `תתי-משימות` (checkbox + קריטריון-קבלה + ref) → `מסמכי-ייחוס` → `החלטות פתוחות`.
- **קישורים יחסיים מ-docs/todo/:** root=`../../` · context/architecture/compliance/screens-spec=`../<dir>/` · courses/src=`../../<dir>/`.
- **name-clean מוחלט:** ללא שמות-מרצים; חוקים=נחלת-כלל; חומרי-מרצה=reference בלבד.

> ה-backlog השטוח הישן ([`docs/context/TASKS.md`](../context/TASKS.md)) **הוחלף** ע"י המבנה הזה.
