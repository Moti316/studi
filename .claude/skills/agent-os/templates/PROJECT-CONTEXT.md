# PROJECT-CONTEXT.md — עוגן-ההקשר

> **הקובץ הראשון שכל סוכן קורא** בתחילת כל משימה, לפני `identity.md` ו-`memory.md`.
> מקור-האמת להקשר-הפרויקט (שכבה B). אילוצים-קשיחים חוצי-כלים: [`../AGENTS.md`](../AGENTS.md).
> מבנה-הארגון: [`ORG.md`](ORG.md). בעלים: <product-owner> + <tech-lead>.
>
> **צעד-0 (כל סוכן, תחילת-משימה):** ודא ריפו-מסונכרן — `git fetch`; אם מאחור, המתן ל-`git pull` לפני עבודה. עובדים על **מספר מחשבים** → הקשר-ישן = סחף.

---

## המשימה — {{PROJECT_NAME}}

{{PROJECT_TAGLINE}}

- **דומיין:** {{DOMAIN}} · **שפה:** {{LANGUAGE}}.
- **גישה-יוצר:** מותנה ב-{{CREATOR_GATED}} — אם פעיל, רק {{CREATOR_HANDLE}} מבצע פעולות-יצירה מוגנות; שאר-המשתמשים צורכים בלבד.
- **משימת-הצוות:** {{TEAM_MISSION}}.

---

## ממשל (Governance)

- **מועצה + אישור:** הכרעות-מפתח עוברות במועצה (פרוטוקול-דיון —
  [`strategic/_debate-protocol.md`](strategic/_debate-protocol.md), {{DEBATE_MODELS_N}} מודלים);
  אישור-סופי = {{COUNCIL_MEMBER}}.
- **Working-tree בלבד:** עבודה על עץ-העבודה המקומי.
- **push ל-`{{DEFAULT_BRANCH}}` מותנה ב-{{APPROVAL_CONDITION}}:** single-branch `{{DEFAULT_BRANCH}}`, ללא ענפים, אחרי {{TYPECHECK_CMD}} + {{TEST_CMD}}.
- **ענף-בקרה (`oversight`) עצמאי — מותנה ב-{{ENABLE_OVERSIGHT}}:** גוף-ביקורת בלתי-תלוי במתווך — מדווח **ישירות למועצה** (כי המתווך מבקר את-עצמו). סמכות: **צו-עצירה** בקוורום {{OVERSIGHT_QUORUM}} + ledger (רק-{{COUNCIL_MEMBER}}-מבטל). הבקרה **רק מבקרת** (read-only). ראה [`ORG.md`](ORG.md) §ענף-בקרה · [`oversight/TEAM.md`](oversight/TEAM.md).
- היררכיה ותעבורת-דיווח: [`ORG.md`](ORG.md).

---

## עקרון-העל: קוד מול הסכמה-שבפועל

> **כותבים קוד מול ה-schema והקוד הקיימים בפועל — לא מול ADR או מסמך-תכנון.**

ADR מתעד **כוונה**; הקוד-החי הוא **המציאות**. בכל אי-התאמה — המציאות מנצחת,
וה-ADR מתעדכן בדיעבד. סוכן שמסתמך על ADR בלי לאמת מול ה-schema-שבפועל = סחף.

---

## נאמנות-למקור (Source-of-truth)

- **{{PRIMARY_SOURCE_OF_TRUTH}} = מקור-האמת.** כל קביעה עובדתית נשענת על המקור-המוסמך,
  לא על זיכרון-המודל.
- אין להמציא נתונים/ציטוטים. ספק → מאמתים מול {{PRIMARY_SOURCE_OF_TRUTH}} לפני פרסום.

---

## מה כל סוכן לוקח מכאן

קרא קובץ זה → דע: מה בונים ({{PROJECT_NAME}}, דומיין {{DOMAIN}}),
מאיפה מקור-האמת ({{PRIMARY_SOURCE_OF_TRUTH}}),
מה אסור (push בלי-{{APPROVAL_CONDITION}}, נתונים-מומצאים, secrets-בקוד, חציית-גבול-שכבות),
ומול-מה כותבים (**הסכמה-שבפועל**). ואז — `identity.md` שלך.
