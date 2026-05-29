# StudiBuilder - Build Roadmap (10 Phases)

תרשים-העל של בניית הפרויקט מקצה לקצה. כל Phase מסתיים ב-merge + deploy לפרודקשן.

## תרשים זמן

```mermaid
gantt
    title StudiBuilder Build Roadmap (~47 ימי-עבודה)
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    section Foundation
    Phase 0 Scaffold       :p0, 2026-05-29, 3d
    Phase 1 Auth & Profile :p1, after p0, 4d
    section Shell
    Phase 2 Dashboard skel :p2, after p1, 3d
    Phase 3 Upload UI      :p3, after p2, 4d
    section AI Core
    Phase 4 Course pipeline:p4, after p3, 10d
    Phase 5 Quiz engine    :p5, after p4, 7d
    section Polish
    Phase 6 Gamification   :p6, after p5, 4d
    Phase 7 TTS            :p7, after p6, 3d
    Phase 8 Credits        :p8, after p7, 4d
    Phase 9 Polish & launch:p9, after p8, 5d
```

## טבלת השלבים

| #   | Phase              | משך     | Lead            | Deliverables עיקריים                                           |
| --- | ------------------ | ------- | --------------- | -------------------------------------------------------------- |
| 0   | Foundation         | 3 ימים  | tech-lead       | Next.js scaffold, CI, Vercel deploy, RTL hello-world           |
| 1   | Auth & Profile     | 4 ימים  | backend         | Supabase Auth (Google OAuth login + Magic link), settings page |
| 2   | Dashboard skeleton | 3 ימים  | frontend        | `/dashboard`, `/courses`, `/stats`, `/settings` (UI בלבד)      |
| 3   | Upload UI          | 4 ימים  | frontend        | wizard 5 שלבים (UI), upload to Supabase Storage                |
| 4   | Course Pipeline    | 10 ימים | ml              | Parse → Chunk → Embed → Topic → Lessons → Questions            |
| 5   | Quiz Engine        | 7 ימים  | frontend        | `/lesson/[id]`, 4 סוגי שאלות, פידבק, deep-explanation          |
| 6   | Gamification       | 4 ימים  | backend         | XP/streak/levels/daily-goal פעילים                             |
| 7   | TTS                | 3 ימים  | ml              | ElevenLabs, 4 קולות עברית, cache                               |
| 8   | Credits            | 4 ימים  | backend         | DB + cost calculator + transaction log                         |
| 9   | Polish & Launch    | 5 ימים  | release-manager | a11y, Lighthouse, error boundaries, onboarding                 |

## עקרון כל-שלב

```
[Plan]  ADR מתועד ב-docs/architecture/
   ↓
[Test] בדיקות כושלות כתובות לפני הקוד (TDD)
   ↓
[Code] מימוש מינימלי שגורם לבדיקות לעבור
   ↓
[Review] לפחות 1 agent quality (test/appsec/privacy לפי רלוונטיות)
   ↓
[Gates] Gate-A → Gate-G (ראה תוכנית-בניה חלק ד.3)
   ↓
[Deploy] PR → CI → preview → merge → production
   ↓
[Retro] docs/phase-N-retrospective.md
```

## Gates (חוצים-שלבים)

לפני merge כל PR:

- **Gate-A** lint clean (0 errors)
- **Gate-B** typecheck clean (0 errors)
- **Gate-C** unit tests >= 80% coverage על קוד חדש
- **Gate-D** e2e קריטי עובר
- **Gate-E** Lighthouse >= 90 (perf/a11y/best-practices) על preview
- **Gate-F** תיעוד מעודכן (ADR + screens-spec)
- **Gate-G** קוד-סקירה ידנית של appsec/privacy על PR שנוגע ב-data sensitive

## Risk register (תזכורת)

| סיכון                              | מיטיגציה                              |
| ---------------------------------- | ------------------------------------- |
| LLM יוצר שאלות שגויות עובדתית      | RAG + validation + manual spot-check  |
| TTS עברית באיכות נמוכה             | A/B providers לפני נעילה              |
| Vercel functions timeout (10s/60s) | LLM calls תמיד דרך Inngest            |
| RTL bugs ב-3rd party libs          | בדיקה ידנית פר-component + regression |
| LLM/TTS עלויות מתפוצצות            | rate limits + cost tracking + alerts  |
| Solo dev burnout                   | phases קצרים, deploy בכל phase        |

## מסמכים-עזר פר-Phase

- `docs/architecture/ADR-NNN-*.md` - החלטות-ארכיטקטורה (1 לפחות פר-Phase)
- `docs/screens-spec/*.md` - מפרט פר-מסך
- `docs/qa/phase-N-checklist.md` - בדיקות ידניות
- `docs/phase-N-retrospective.md` - מה למדנו (נכתב בסוף phase)

## פערים מודעים שיוטפלו ב-Phase 9

- Mobile native (iOS/Android) - לא, PWA מספיק
- Multi-user / org accounts - אחרי MVP
- API ציבורי - אחרי MVP
- רב-לשוניות (i18n) - הכנה ארכיטקטונית בלבד, עברית בלבד תחילה
- Manual course editor - אחרי MVP
