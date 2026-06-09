# TODO · H — Phase 10 — Course-as-Product Factory

> שלב H ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: ⬜ פתוח 🎯 (מטרה מפורשת) · תלות: בנוי על קורס-מוכן (B+D) · ADR-006 · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

קורס "ממונה בטיחות" המוכן (B+D) "נולד" כמוצר מסחרי עצמאי: כל קורס שמוטי מאשר ל-publish מקבל אוטומטית landing-page ייעודית, checkout/תשלום ו-entitlement ללומד-משלם, עם SEO/OG לשיתוף. "סיום" = קורס-דמה עובר landing → checkout (תשלום-טסט) → enroll → אזור-לימוד **end-to-end תוך < שעה ואוטומטית**, Lighthouse ≥ 90 (mobile), ו-dashboard-admin מציג מטריקות פר-קורס.

## תלויות

חוסם: קורס-תוכן-מוכן (שלבים B+D) — בלי content אין מוצר. נדרש מנגנון-credits/entitlement מ-Phase 8. כלפי-מעלה: פותח את ה-Course-Site Factory (ADR-006) ל-verticals נוספים (לא רק ממונה-בטיחות). שלב H4 תלוי ב-Phase B של ADR-009 (post-deadline 2026-07-15) — אם לא הגיע, סמן "(לאמת)".

## תתי-משימות

- [ ] **H1** — landing-page לקורס "ממונה בטיחות" (template `long-form`: hero → benefits → FAQ → CTA; auto-copywriter ל-headline/subhead/benefits/faq) · קריטריון-קבלה: דף-נחיתה חי תחת route-based slug (Option B, `betichut`), עברית RTL מלאה, OG-image לשיתוף WhatsApp/Telegram/Twitter, Lighthouse ≥ 90 בכל metric (mobile) · ref: [../screens-spec/landing.md](../screens-spec/landing.md) · [../architecture/ADR-006-course-as-product-factory.md](../architecture/ADR-006-course-as-product-factory.md)
  - 📊 **מטא:** ⏱4h · 🤖3(frontend-engineer, content-writer, visual-designer) · 💲$0 · 🟢 · ראש-צוות:strategic-lead · — · אימות:Workflow
- [ ] **H2** — checkout + payment (ADR-008: Lemon Squeezy MVP → Stripe scale) + Phase-8 credits · קריטריון-קבלה: רכישה end-to-end < 90s (landing → LS hosted-checkout → גישה-מוענקת); webhook `POST /api/webhooks/lemonsqueezy` עם אימות-חתימה HMAC-SHA256 (דחיית-forged); `provider_order_id` UNIQUE = idempotency (double-fire לא יוצר double-entitlement); webhook-secret ב-`.env.local` בלבד; mobile-checkout פותח Apple/Google Pay · ref: [../architecture/ADR-008-payment-provider.md](../architecture/ADR-008-payment-provider.md)
  - 📊 **מטא:** ⏱6h · 🤖3(backend-engineer, appsec, release-manager) · 💲$0 (תשלום-אמת בפרודקשן) · 🔴 · ראש-צוות:strategic-lead · 🚩דורש-מוטי · אימות:Workflow+security-review
- [ ] **H3** — ads/marketing assets · קריטריון-קבלה: הסקריפט מייצר creative + targeting-suggestions בלבד; מוטי מעלה ידנית ל-FB/Google (ads-automation מלא דחוי ל-Phase 10.4). name-clean: ללא שמות-מרצים · ref: [../architecture/ADR-006-course-as-product-factory.md](../architecture/ADR-006-course-as-product-factory.md)
  - 📊 **מטא:** ⏱3h · 🤖2(content-writer, visual-designer) · 💲$0 · 🟢 · ראש-צוות:strategic-lead · — · אימות:solo
- [ ] **H4** — אינטגרציית-מגן (**port-permitted** · firewall בוטל 2026-06-09): **פורט פרומפט-המאסטר name-cleaned** (megen מבודד · read-only · רק תוכן-פרומפט · לא מנוע-Python) — committee_bank + `study_plan_90days` + 4-עקרונות. מוטי בעל-שני-הריפו → אפס-licensing. שימוש: NotebookLM מעגן → פרומפט-מגן מחבר (Gemini-API · offline) → אימות-סמנטי → ייבוא · קריטריון-קבלה: PARITY מול committee_bank (31 שאלות) עדיין מומלץ; 31 השאלות עוברות Committee-Scope-Filter (`in_scope=true` בלבד עולה ל-quiz) · ref: [../architecture/ADR-009-magen-integration.md](../architecture/ADR-009-magen-integration.md) (תיקון 2026-06-09)
  - 📊 **מטא:** ⏱4h · 🤖2(ml-engineer, domain-expert) · 💲~$0–2 · 🟡 · ראש-צוות:strategic-lead · 🚩דורש-מוטי (firewall/ספק) · אימות:Workflow

> **🔓 מגן — port-permitted (עודכן 2026-06-09 · ה-firewall בוטל):** ריפו-מגן (`github.com/Moti316/megen`) — **מותר לפורט את פרומפט-המאסטר** (לחיבור-תרחישי-וועדה / סימולציה), **name-cleaned** (להסיר "מגן"/"שגיא"/Telegram/מזהי-בעלים · לשמור 4-עקרונות · Zero-Harm · common-pitfalls · 3-מצבי-תשובה). מוטי בעל-שני-הריפו → **אפס-licensing**. megen **מבודד** (clone לתיקייה-סמוכה · read-only · רק **תוכן-פרומפט** · לא מנוע-ה-Python). שימוש: NotebookLM מעגן חוק/תקנה → פרומפט-מגן מחבר (Gemini-API · offline). ⛔ ~~כלל-מגן (firewall) — השראה-בלבד · אסור-להעתיק · HYBRID~~ (בוטל). ראה `docs/architecture/ADR-009-magen-integration.md` (תיקון 2026-06-09).

## מסמכי-ייחוס (קרא לפני עבודה)

- [../architecture/ADR-006-course-as-product-factory.md](../architecture/ADR-006-course-as-product-factory.md) — ארכיטקטורת Phase 10: factory-pipeline (render landing → copywriter → checkout → provisioning → SEO/ads), טבלת `published_courses`, 3 templates, Option B route-based ל-MVP.
- [../architecture/ADR-008-payment-provider.md](../architecture/ADR-008-payment-provider.md) — ספק-תשלום: Lemon Squeezy MoR ל-MVP (0-to-revenue, ללא עוסק-מורשה) → Stripe ל-scale; webhook/entitlement/subscription-lifecycle + security.
- [../architecture/ADR-009-magen-integration.md](../architecture/ADR-009-magen-integration.md) — Phased Convergence: Phase A side-by-side (עד 2026-07-15), Phase B megen ⊂ StudiBuilder (content-import + personas + first-public-course).
- [../screens-spec/landing.md](../screens-spec/landing.md) — מפרט landing: hero/value-prop/CTA, FeatureGrid, Footer, Acceptance (Lighthouse/SEO/OG/RTL/responsive).

## החלטות פתוחות / הערות

- **דומיין** — subdomain (`betichut.studibuilder.app`) או route-based (`/c/[slug]`)? ברירת-מחדל ADR-006: Option B (route-based) ל-MVP, מעבר ל-Option A ב-5+ קורסים. (לאמת)
- **Migration-trigger ל-Stripe** — 5+ קורסים פעילים / ₪10K+ הכנסה-חודשית / 200+ tx-חודשי. דורש עוסק-מורשה + ADR-008.1.
- **H4 timing** — חל רק אחרי deadline-הוועדה (2026-07-15) ולפי-traction; עד-אז סמן "(לאמת)". **port-permitted (firewall בוטל 2026-06-09):** מותר לפורט את פרומפט-המאסטר name-cleaned (ראה H4) — megen מבודד read-only · רק תוכן-פרומפט (לא מנוע-Python); הפרסונות מנוקות-שם.
- name-clean: חוקים/תקנות = נחלת-כלל; חומרי-מרצה = reference בלבד, ללא שמות.
