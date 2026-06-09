# Architecture Decision Records (ADRs)

תיעוד כל ההחלטות-הארכיטקטוניות המשמעותיות לפרויקט. כל החלטה מקבלת ADR לפני implementation.

## כללי

- **ADR נכתב לפני implementation**, לא אחריו
- **מקור-אמת יחיד**: ADR > תיעוד אחר > קוד
- **לא משנים ADR שאושר** - יוצרים ADR חדש שמחליף (Superseded by)
- **שפת ה-ADR**: עברית עם מונחים אנגלית-טכנית

## טמפלט

ראה [`ADR-000-template.md`](./ADR-000-template.md).

## ADRs קיימים

| #   | כותרת                                                                        | סטטוס    | Phase | תאריך      |
| --- | ---------------------------------------------------------------------------- | -------- | ----- | ---------- |
| 000 | Template                                                                     | -        | -     | -          |
| 001 | בחירת Stack - Next.js + Supabase                                             | proposed | 0     | 2026-05-29 |
| 002 | Course pipeline - build from scratch (לא NotebookLM)                         | accepted | 4     | 2026-05-29 |
| 003 | Auth - Google OAuth login-only + Magic Link                                  | accepted | 1     | 2026-05-29 |
| 004 | Dashboard Shell - BottomNav, Mock Data, Primitives                           | accepted | 2     | 2026-05-29 |
| 005 | NotebookLM Hybrid - Curation + Gemini pipeline (מורחב ע"י 015)               | accepted | 4     | 2026-05-29 |
| 006 | Course-as-Product Factory (landing + distribution)                           | accepted | 10    | 2026-05-29 |
| 007 | Brand Identity (layout, mascot, typography, theme)                           | accepted | 9     | 2026-05-29 |
| 008 | Payment Provider - Lemon Squeezy → Stripe                                    | proposed | 10    | 2026-05-29 |
| 009 | Megen Integration (firewall בוטל 2026-06-09 · port-permitted)                | accepted | A/10  | 2026-05-29 |
| 010 | Data Schema MVP - Quiz Engine                                                | proposed | 4-5   | 2026-05-30 |
| 011 | Drive Import Pipeline (`scripts/import-content.ts`)                          | proposed | 4-5   | 2026-05-30 |
| 012 | נוהלי-פיתוח (single-branch main, doc-discipline)                             | proposed | 0     | 2026-06-01 |
| 013 | תבנית-קורס (פרק=מיני-קורס×3-מצבים + capstone)                                | proposed | 10    | 2026-06-01 |
| 014 | מנוע-תרחישים (ScenarioWalkthrough · מוחלף-מורחב ע"י 016)                     | accepted | 5     | 2026-06-08 |
| 015 | מנוע-תוכן NotebookLM (generate-offline → verify-G1–G5 → serve-precomputed)   | accepted | 4     | 2026-06-08 |
| 016 | סימולציית-וועדה (3 מפקחים · 4 שלבים · ציון 0-100 · hybrid · מחליף-מורחב 014) | accepted | 5     | 2026-06-09 |

> הערה: האינדקס המלא = הקבצים בתיקייה `docs/architecture/`.

## חלוקה לפי Phase

### Phase 0

- 001 Stack
- 012 נוהלי-פיתוח

### Phase 1

- 003 Auth

### Phase 2

- 004 Dashboard Shell

### Phase 4

- 002 Course pipeline
- 005 NotebookLM Hybrid (curation + pipeline · מורחב ע"י 015)
- 010 Data Schema MVP (Quiz Engine · Phase 4-5)
- 011 Drive Import Pipeline (Phase 4-5)
- 015 מנוע-תוכן NotebookLM (generate-offline → verify → serve-precomputed)

### Phase 5

- 010 Data Schema MVP (Quiz Engine · Phase 4-5)
- 014 מנוע-תרחישים (ScenarioWalkthrough · מוחלף-מורחב ע"י 016)
- 016 סימולציית-וועדה (3 מפקחים · 4 שלבים · hybrid פרה-בנוי→LiveEngine · מחליף את ה-walkthrough הסטטי)

### Phase 9

- 007 Brand Identity

### Phase 10

- 006 Course-as-Product Factory
- 008 Payment Provider (Lemon Squeezy → Stripe)
- 013 תבנית-קורס (course template + capstone)

### Phase A / 10 (cross-phase)

- 009 Megen Integration (firewall בוטל 2026-06-09 · port-permitted)

## תהליך כתיבת ADR

1. סוכן/אדם מזהה החלטה משמעותית
2. יוצר ADR כ-`docs/architecture/ADR-NNN-name.md`
3. status = `Proposed`
4. דיון בצוות (council if needed)
5. אישור → status = `Accepted`
6. ביצוע ב-PR שמצביע ל-ADR
7. אם הוחלף בהמשך → status = `Superseded by ADR-MMM`
