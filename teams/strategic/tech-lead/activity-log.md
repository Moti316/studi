# יומן-פעילות — איתן (tech-lead)

> פורמט רשומה: `## [תאריך שעה] משימה` ואז Outcome · What changed · Verification · Follow-ups · Verdict (PASS|CONCERNS|FAIL) · Self-check (בהקשר? סטייה? red-lines?) · Bugs/Fixes.

## [2026-06-01] ניקוי-תיעוד G — Gemini ספק-יחיד (Claude/Anthropic/Voyage/Haiku → Gemini · 21→57)

**Outcome:** עודכן כל איזכור-ספק מיושן בנתיב-המשתמש/הצינור ל-Gemini, ומונים מיושנים (21→57, 13→12 ADRs, 21→27 סוכנים) ב-7 קבצים. נשמרו במכוון איזכורי-Claude-Code הלגיטימיים (dev-tooling / notebooklm-mcp / megen subagents / amendment-transition).

**What changed (קבצים + שורות):**

- `docs/architecture/ADR-005-notebooklm-hybrid.md`:
  - שורה 1 (כותרת): "Claude Pipeline" → "Gemini Pipeline".
  - שורות 21, 27, 34, 42, 52-54, 117, 137, 148, 164: ספק-generation Claude → Gemini (טבלת-אחריות שלבים 5-7 → Gemini 2.5 Pro; Option B → "Gemini-only").
  - שורה 138: "Voyage embeddings" → "Gemini embeddings".
  - שורות 98, 105: scope 21 → 57 (שורה 98 משמרת "הורחב מ-21" כהקשר-היסטורי).
  - נשמרו (לגיטימי): שורות 15/50/93 (Claude Code = creator-side), 169 (megen/CLAUDE.md).
- `docs/architecture/ADR-009-magen-integration.md`:
  - שורה 40 (טבלת-LLM, עמודת StudiBuilder): "Claude Sonnet 4.6" → "Gemini 2.5 Pro".
  - שורה 85: "Gemini Flash < Claude Sonnet 4.6" → "Gemini Flash (bot) < Gemini 2.5 Pro (StudiBuilder)".
  - שורה 120: "Voyage AI embeddings" → "Gemini embeddings".
  - שורה 141: "שני LLM providers (Gemini ב-bot + Claude ב-web)" → "ספק-LLM אחיד (Gemini+Gemini)".
  - שורה 174: scope 21 → 57.
  - נשמרו (לגיטימי): שורות 18/40(מגן)/42/45/103/131 (Claude Code subagents = dev-side).
- `docs/architecture/ADR-010-data-schema-mvp.md`:
  - שורה 96: הערת-vector "Voyage AI" → "Gemini embedding" (נשמר `vector(1024)` כי זו הסכמה-שבפועל ב-drizzle/schema.ts + migrations/0001).
  - שורה 242: "פידבק מ-Claude" → "מ-Gemini".
  - שורה 312: "Claude Sonnet" (Mode-C) → "Gemini 2.5 Pro".
- `docs/architecture/ADR-011-drive-import-pipeline.md`:
  - Haiku → Gemini 2.5 Flash: שורות 38, 92, 94, 102, 169(דיאגרמה), 199, 279(geminiVerifyScope), 380.
  - voyage-3 → gemini-embedding-001: שורות 203, 294-295.
  - Voyage → Gemini: שורות 53, 128, 147, 169, 311, 375, 481, 509, 519, 538(קישור).
  - Claude → Gemini: שורות 3, 30, 138, 457, 461; config key `maxClaudeCallsPerRun` → `maxGeminiCallsPerRun` (שורות 127 + 502).
  - scope 21 → 57: שורות 29, 80, 88, 98, 365, 532.
  - נשמרו (לגיטימי): שורה 11 (amendment-transition "במקום Claude Haiku/voyage-3/@anthropic-ai/sdk"), שורות 57/431 (notebooklm-mcp = Claude-Code MCP).
- `docs/context/PROJECT-MAP.md`: שורה 41 "13 ADRs" → "12 ADRs (000-template + 001-011)". scope=57 כבר היה תקין (שורה 36).
- `docs/content-scope.md`: שורה 7 "~50 פריטים" → "57 פריטים" (מדויק, תואם סיכום-קוונטיטטיבי שורה 154).
- `AGENTS.md`: שורות 23-24 "21 סוכנים" → "27 סוכנים (22 מומחי-תחום + 4 ראשי-צוות + 1 מתווך)"; הוסף `content-verifier` לרוסטר (היה חסר; תואם ORG.md = 22 מומחי-תחום + 27 סה"כ identity.md).

**Verification:**
- Grep פר-קובץ אחרי כל סדרת-עריכות: אפס Claude-Sonnet/Voyage/voyage-3/Haiku/Anthropic נותרים בנתיב-המשתמש/הצינור (היחיד שנותר = amendment-transition ADR-011 שורה 11, מכוון).
- מול הסכמה-שבפועל: `drizzle/schema.ts:33-36` + `supabase/migrations/0001_initial_schema.sql:67` שניהם `vector(1024)` → לא שיניתי ממד, רק שם-מודל ל-Gemini + הערה שהממד יותאם (תואם amendment ADR-011 ולא ממציא ממד שלא קיים בקוד).
- מונה-סוכנים 27 אומת מול 27 קבצי identity.md (Glob) ומול ORG.md (22 מומחים + 4 leads + 1 mediator).
- מונה-ADR 12 אומת מול Glob (ADR-000..ADR-011).
- יישור-עמודות דיאגרמת-ASCII ב-ADR-011 שורה 169 נשמר (14 תווים פר-תא).

**Follow-ups (נדחה + סיבה):**
- ADR-010 seed-data: ה-CTE `scope_ids` (שורות 359-364) + `SCOPE_REFS` ב-`src/lib/db/constants/scope-refs.ts` עדיין מונים ~23 IDs (סט-21-הישן), ושורות 20/463/501/569/621 עדיין "21". **נדחה מכוון** — מחוץ ל-scope-המשימה לקובץ זה (המשימה הגבילה את ADR-010 ל"הערת-vector/Voyage + ייחוסי-Claude"); הרחבה ל-57 דורשת את רשימת-57-ה-IDs המלאה (כולל sub-IDs 1.5.1/2.6.1/...) מ-content-scope.md — שינוי-תוכן-מהותי שמצריך החלטת-data-engineer, לא find/replace. דגל ל-`data-engineer` (אלון).
- ADR-001 Amendment עצמו לא נגעתי (לא ברשימת-המשימה); מומלץ לאמת שה-Amendment כבר מצהיר Gemini כספק-יחיד (ADR-011 שורה 11 מפנה אליו).

**Verdict:** PASS — כל 7 הקבצים עודכנו לפי-המשימה; תוכן-היסטורי-לגיטימי נשמר; אפס סתירות-ספק שנותרו בנתיב-המשתמש.

**Self-check:** בהקשר? כן (G — Gemini ספק-יחיד, עקרון-הברזל ב-PROJECT-CONTEXT שורות 30/34). סטייה? לא. red-lines? לא הורצו commit/push/db:push; לא נמחק תוכן-היסטורי; נכתב מול הסכמה-שבפועל (vector(1024) לא שונה). אזהרה: discrepancy-21→57 ב-ADR-010 seed-data דווח כ-follow-up ולא טופל (מחוץ-ל-scope + סיכון-תוכן).
