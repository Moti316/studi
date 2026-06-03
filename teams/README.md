# StudiBuilder — צוות-הסוכנים

פרופיל: **Solo-Tool** · **33 סוכנים** = 22 מבצעים + 4 ראשי-צוות + 1 מתווך + 6 ענף-בקרה (`oversight`).
היררכיה, פרוטוקולים ומחזור-חיים: [`ORG.md`](ORG.md). תהליך-הקמה: [`HOWTO-add-agent.md`](HOWTO-add-agent.md).

## תרשים-היררכיה

```
                          מועצה (מוטי) — Council
                                  ▲
              ┌───────────────────┴────────────────────┐
        מתווך (אמיר) — mediator         ענף-בקרה (oversight) — עצמאי
                                        oversight-lead (נדב) · מדווח ישירות למועצה
        ┌──────────┴──────────┐         ┌──────────┴──────────┐
   strategic builder quality coord     בקרה-חיצונית    מבקר-תכנית
     -lead    -lead   -lead  -lead      עידו · הדס      רותם·שני·גיא
        ▲       ▲       ▲      ▲
    3 →      13 →     5 →     1   =  22 מבצעים          6 מבקרים
```

> זרימת-ביצוע תמיד `סוכן → ראש-צוות → מתווך → מועצה`; הכרעות חוזרות באותו ערוץ הפוך.
> חריג: הפרת red-line קריטית → דגל מיידי שעוקף ראש-צוות ישר למתווך (ראה [`ORG.md`](ORG.md)).
> **ענף-הבקרה עצמאי:** מדווח ישירות למועצה (`oversight-report.md`), לא דרך המתווך — שכן הוא מבקר את המתווך עצמו.

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
| אמיר  | `mediator`               | מתווך (ניתוב/קונפליקט/סחף)      | `mediator`    | `opus`   |
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

### ענף-בקרה `oversight` — 6 סוכנים (עצמאי · מדווח ישירות למועצה)

| שם   | Slug                      | תפקיד                                       | זרוע         | מודל     |
| ---- | ------------------------- | ------------------------------------------- | ------------ | -------- |
| נדב  | `oversight-lead`          | מבקר-ראשי — צו-עצירה · ledger · דו"ח-למועצה | ראש-ענף      | `opus`   |
| עידו | `plan-compliance-auditor` | סטייה-מתוכנית (activity-log ↔ TODO/PLAN)    | בקרה-חיצונית | `opus`   |
| הדס  | `process-audit-officer`   | שלמות-זרימת-דיווח · דגלים-שנבלעו            | בקרה-חיצונית | `opus`   |
| רותם | `curriculum-auditor-lead` | מבקר-תכנית-ראשי — קורס ↔ PROGRAM            | מבקר-תכנית   | `opus`   |
| שני  | `coverage-auditor`        | כיסוי 905018 + 57-scope                     | מבקר-תכנית   | `sonnet` |
| גיא  | `content-drift-auditor`   | אפס out-of-curriculum · regulatory-watch    | מבקר-תכנית   | `sonnet` |

> כל סוכן = תיקיית `teams/<tier>/<slug>/` עם 3 קבצים: `identity.md` · `memory.md` · `activity-log.md`.
> ענף-הבקרה: [`oversight/TEAM.md`](oversight/TEAM.md) · [`oversight/_oversight-protocol.md`](oversight/_oversight-protocol.md) · [`oversight/_curriculum-audit-protocol.md`](oversight/_curriculum-audit-protocol.md).

## Plugins מומלצים

- **גלובלי:** claude-md-management, plugin-dev, superpowers
- **per-project:** sentry, supabase, typescript-lsp, vercel
