# StudiBuilder — צוות-הסוכנים

פרופיל: **Solo-Tool** · **27 סוכנים** = 22 מבצעים + 4 ראשי-צוות + 1 מתווך.
היררכיה, פרוטוקולים ומחזור-חיים: [`ORG.md`](ORG.md). תהליך-הקמה: [`HOWTO-add-agent.md`](HOWTO-add-agent.md).

## תרשים-היררכיה

```
                          מועצה (מוטי) — Council
                                  ▲
                          מתווך (אמיר) — mediator
                                  ▲
        ┌──────────────┬──────────┴──────────┬──────────────┐
   strategic-lead   builder-lead        quality-lead   coordinator-lead
     (אבירם)         (יונתן)              (מירב)          (דורון)
        ▲              ▲                    ▲                ▲
    3 סוכנים       13 סוכנים            5 סוכנים         1 סוכן
```

> זרימה תמיד `סוכן → ראש-צוות → מתווך → מועצה`; הכרעות חוזרות באותו ערוץ הפוך.
> חריג: הפרת red-line קריטית → דגל מיידי שעוקף ראש-צוות ישר למתווך (ראה [`ORG.md`](ORG.md)).

## רוסטר מלא

| שם    | Slug                     | תפקיד                           | Tier          | מודל     |
| ----- | ------------------------ | ------------------------------- | ------------- | -------- |
| גיל   | `accessibility-i18n`     | Accessibility & i18n Engineer   | `builder`     | `sonnet` |
| שחר   | `appsec`                 | Application Security Engineer   | `quality`     | `sonnet` |
| עומר  | `backend-engineer`       | Backend Engineer                | `builder`     | `sonnet` |
| יונתן | `builder-lead`           | ראש-צוות בנייה                  | `lead`        | `opus`   |
| טל    | `cloud-specialist`       | Cloud / Self-Hosting Specialist | `builder`     | `sonnet` |
| תמר   | `content-verifier`       | Content Verifier (accuracy)     | `quality`     | `sonnet` |
| שירה  | `content-writer`         | UX Writer / Content Designer    | `builder`     | `sonnet` |
| דורון | `coordinator-lead`       | ראש-צוות תיאום                  | `lead`        | `opus`   |
| דנה   | `data-engineer`          | Data Engineer                   | `builder`     | `sonnet` |
| מאיה  | `design-system`          | Design System Engineer          | `builder`     | `sonnet` |
| ארז   | `devops-engineer`        | DevOps Engineer                 | `builder`     | `sonnet` |
| רון   | `domain-expert`          | Domain Expert                   | `strategic`   | `opus`   |
| רוני  | `e2e-qa`                 | E2E / Manual QA Engineer        | `quality`     | `sonnet` |
| ליאור | `frontend-engineer`      | Frontend Engineer (Web)         | `builder`     | `sonnet` |
| יעל   | `interaction-designer`   | Interaction Designer            | `builder`     | `sonnet` |
| אמיר  | `mediator`               | מתווך (ניתוב/קונפליקט/סחף)       | `mediator`    | `opus`   |
| איל   | `ml-engineer`            | ML Engineer                     | `builder`     | `sonnet` |
| בר    | `notifications-engineer` | Notifications Engineer          | `builder`     | `sonnet` |
| עדן   | `privacy-officer`        | Privacy Officer                 | `quality`     | `sonnet` |
| נועה  | `product-owner`          | Product Owner                   | `strategic`   | `opus`   |
| מירב  | `quality-lead`           | ראש-צוות איכות                  | `lead`        | `opus`   |
| אסף   | `release-manager`        | Release Manager                 | `coordinator` | `sonnet` |
| אבירם | `strategic-lead`         | ראש-צוות אסטרטגיה               | `lead`        | `opus`   |
| איתן  | `tech-lead`              | Tech Lead / Architect           | `strategic`   | `opus`   |
| גלעד  | `test-engineer`          | Test Engineer                   | `quality`     | `sonnet` |
| אורי  | `ux-researcher`          | UX Researcher                   | `builder`     | `sonnet` |
| נטע   | `visual-designer`        | Visual Designer                 | `builder`     | `sonnet` |

> כל סוכן = תיקיית `teams/<tier>/<slug>/` עם 3 קבצים: `identity.md` · `memory.md` · `activity-log.md`.

## Plugins מומלצים

- **גלובלי:** claude-md-management, plugin-dev, superpowers
- **per-project:** sentry, supabase, typescript-lsp, vercel
