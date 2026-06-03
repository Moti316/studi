# GOVERNANCE-V2 — תוכנית-ממשל-v2 (גיבוי-ריפו + מצב + פרומפט-המשך)

> **גיבוי-בריפו** של תוכנית-ממשל-v2 (המקור היה מקומי ב-`~/.claude/plans/`, per-machine).
> נגיש מכל מחשב. מעודכן: 2026-06-03 · בעלים: `oversight-lead` (נדב) + מוטי.
> מקור-אמת-למשימות: [`../../TODO.md`](../../TODO.md) §ממשל-v2.

---

## Context (למה)

המבנה הקודם (27 סוכנים · מועצה→מתווך→4 ראשי-צוות→22) חזק אך חסר **עצמאות-ביקורת**: המתווך
מקונסולד דיווחים _וגם_ מחליט מה מגיע למועצה — מבקר את-עצמו. מוטי ביקש 2 צוותי-בקרה עם
סמכויות-חתומות. בנוסף: TODO-מורחב, בהירות פלטפורמה↔קורס, והפקת SKILL מהארכיטקטורה.

## 3 הכרעות-מוטי (נעולות, 2026-06-03)

1. **ענף-`oversight` עצמאי** תחת המועצה, **מקביל למתווך** — מדווח ישירות למועצה, לא כפוף למתווך.
2. **צו-עצירה = חתימת-קוורום 2/3** + ראיה ב-ledger · עוצר מסלול-ספציפי עד אישור-מועצה · **רק מוטי מבטל**.
3. **הכל ברצף** (5 תוצרים), commit+push אחרי כל תוצר-ירוק.

## שיטת-עבודה (מוטי 2026-06-03)

**גיבוי-ריפו (commit+push) + עדכון-TODO + doc-לוג Drive — אחרי כל תת-משימה.**

---

## מצב-ביצוע (5 תוצרים · 3 סשנים)

| תוצר | תיאור                                            | סשן | מצב |
| ---- | ------------------------------------------------ | --- | --- |
| 4    | בהירות פלטפורמה↔קורס (PROJECT-STRUCTURE+ADR-013) | A   | ✅  |
| 3    | שדרוג-TODO מורחב (סכמת-מטא)                      | A   | ✅  |
| 1    | צוות בקרה-חיצונית (3 סוכנים)                     | B   | ✅  |
| 2    | צוות מבקר-תכנית-לימודים (3 סוכנים)               | B   | ✅  |
| 5    | **SKILL `agent-os` גנרי**                        | C   | ✅  |

**סשן-A (✅):** commits `3b01c40` (תוצר-4) · `bf9624d` (תוצר-3).
**סשן-B (✅):** ענף-בקרה `oversight` (רוסטר 27→33) — commits `448de2b` (מעקב) · `e18a40e` (OV-1) · `a9f386b` (OV-2) · `37752a5` (OV-3) · `3bb9fad` (OV-4) · `af31f7b` (OV-5) · OV-6 (קובץ-זה).
**סשן-C (✅, 2026-06-04):** תוצר-5 — SKILL `agent-os` גנרי ב-`.claude/skills/agent-os/`: SKILL.md + 12 תבניות (ORG · HOWTO · identity-12 · \_debate · \_oversight · TEAM · PROJECT-CONTEXT · agent-stub · comms · TODO-schema · quality-gates · session-context-hook) + settings-snippet. placeholders ({{PROJECT_NAME}}/{{DOMAIN}}/{{TIERS}}/...) · **firewall מאומת** (אפס מגן/stack/src/תוכן-קורס — grep + אימות-אדוורסרי 3-עדשות).

ענף-הבקרה (`teams/oversight/`): 6 סוכנים — נדב/עידו/הדס (בקרה-חיצונית) · רותם/שני/גיא (מבקר-תכנית).
🚩 **השמות = הצעה ניתנת-לשינוי-מוטי** (ההצעה המקורית אורי/יעל/אסף/מאיה התנגשה עם הרוסטר הקיים).

---

## תוצר-5 (סשן-C, נותר) — SKILL: `agent-os` (חילוץ-ארכיטקטורה גנרי)

**מתיישר לתוכנית-הקיימת** (`docs/IDEAS.md` 2026-05-31: "Agent-OS starter-kit כסקיל — חילוץ
מבנה-הסוכנים לערכה גנרית רב-פרויקטית, הקמה בפקודה-אחת"). זהו חילוץ ה-**מבנה הגנרי** —
**לא** סקיל "של StudiBuilder".

- **מבנה:** `.claude/skills/agent-os/SKILL.md` (frontmatter `name: agent-os` + `description` + הוראות-סקאפולד בפקודה-אחת) + `templates/` **גנריים פר-פרויקט** (placeholders): `ORG` (היררכיה 4-שכבות + 7-שלבים + drift-control + מחזור-חיים) · `HOWTO-add-agent` · `identity-12-fields` · `_debate-protocol` (Star-Chamber) · **`_oversight-protocol` (ענף-בקרה עצמאי + צו-עצירה — הדפוס-הגנרי שנוצר בתוצר-1/2)** · `TEAM` · `PROJECT-CONTEXT` · `agent-stub` (`.claude/agents`) · `comms-README` (JSONL) · `TODO-schema` (הסכמה-המורחבת מתוצר-3) · `quality-gates` (typecheck+test+drift+oversight) · `session-context-hook` (repo-sync).
- **כלול:** רק ה-**Agent-OS הגנרי** (ממשל · תבנית-זהות · drift-control · Star-Chamber · ענף-בקרה כדפוס · קצב-דיווח · comms · gates · TODO-schema · hook).
- **לא-כלול:** ❌ course-factory / platform↔course (ספציפי-דומיין → נשאר בפרויקט, תוצר-4) · ❌ תוכן-קורס/safety-officer · ❌ stack (Gemini/Next/Supabase) · ❌ `src/` · ❌ סודות · ❌ **כל מבנה/תוכן-מגן (firewall)**.
- **placeholders:** התבניות עם `{{PROJECT_NAME}}`/`{{DOMAIN}}`/`{{TIERS}}` — לא ערכי-StudiBuilder קשיחים.
- שימוש ב-**skill-creator** לבנייה/אימות. עדכון `docs/IDEAS.md` (💡→✅ + קישור) · `TODO.md` §עתידי (✅). מיקום: repo `.claude/skills/` (committed, multi-machine); ניתן-לקידום ל-user-level.

---

## פרומפט-המשך (סשן-C — להדבקה בסשן-חדש)

```
המשך StudiBuilder (Moti316/studi). דבר תמיד בעברית RTL. על Windows: PowerShell.
צעד-0: git pull origin main (ה-SessionStart hook מזריק TODO/SESSION-LOG/git-log; ודא סנכרון).

== מצב ==
ממשל-v2 סשן-A+B הושלמו ונדחפו. ענף-בקרה `oversight` עצמאי קיים (רוסטר 33 · 6 סוכנים ·
צו-עצירה קוורום-2/3). התוכנית-המלאה + spec תוצר-5 ב-docs/context/GOVERNANCE-V2.md (קרא אותו תחילה).

== בצע עכשיו: סשן-C = תוצר-5 בלבד ==
SKILL `agent-os` גנרי — חילוץ ארכיטקטורת-הסוכנים לערכה רב-פרויקטית (פקודה-אחת).
מבנה: .claude/skills/agent-os/SKILL.md + templates/ גנריים עם placeholders
({{PROJECT_NAME}}/{{DOMAIN}}/{{TIERS}}): ORG · HOWTO-add-agent · identity-12-fields ·
_debate-protocol · _oversight-protocol (ענף-בקרה כדפוס) · TEAM · PROJECT-CONTEXT ·
agent-stub · comms-README · TODO-schema · quality-gates · session-context-hook.
לא-כלול: course-factory/platform↔course · תוכן-קורס · stack · src/ · סודות · כל מבנה/תוכן-מגן (firewall).
השתמש ב-skill-creator. עדכן docs/IDEAS.md (💡→✅) + TODO.md §עתידי.

== כללים מוחלטים ==
plan-first (אך כאן ה-spec מאושר ב-GOVERNANCE-V2 → ישר-לביצוע אם לא השתנה) · עברית RTL ·
מגן=השראה-בלבד ומוחרג-מהסקיל (firewall) · אל תוציא כסף ללא אישור · push ל-main אחרי תוצר-ירוק ·
גיבוי-ריפו + doc-לוג Drive (id 1_GZY5fWK4z-BQRXUkySmsOUOPDnccVNw) אחרי כל תת-משימה.

== קריאה-חובה תחילה ==
docs/context/GOVERNANCE-V2.md (§תוצר-5) · docs/IDEAS.md · teams/oversight/_oversight-protocol.md
(הדפוס לחילוץ) · teams/ORG.md · teams/HOWTO-add-agent.md · CLAUDE.md (§סקילים).
```

---

## References

- [`../../teams/ORG.md`](../../teams/ORG.md) §ההיררכיה + §ענף-בקרה · [`../../teams/oversight/`](../../teams/oversight/TEAM.md) (ענף-הבקרה המלא).
- [`../../TODO.md`](../../TODO.md) §ממשל-v2 (מעקב-חי) · [`SESSION-LOG.md`](SESSION-LOG.md) (handoff).
- [`../IDEAS.md`](../IDEAS.md) (זרע תוצר-5) · [`../PROJECT-STRUCTURE.md`](../PROJECT-STRUCTURE.md) (תוצר-4, גבול פלטפורמה↔קורס).
