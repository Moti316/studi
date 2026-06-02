# TODO · H — Phase 10 — Course-as-Product Factory

> שלב H ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: ⬜ פתוח 🎯 (מטרה מפורשת) · תלות: בנוי על קורס-מוכן (B+D) · ADR-006 · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

קורס "ממונה בטיחות" המוכן (B+D) "נולד" כמוצר מסחרי עצמאי: כל קורס שמוטי מאשר ל-publish מקבל אוטומטית landing-page ייעודית, checkout/תשלום ו-entitlement ללומד-משלם, עם SEO/OG לשיתוף. "סיום" = קורס-דמה עובר landing → checkout (תשלום-טסט) → enroll → אזור-לימוד **end-to-end תוך < שעה ואוטומטית**, Lighthouse ≥ 90 (mobile), ו-dashboard-admin מציג מטריקות פר-קורס.

## תלויות

חוסם: קורס-תוכן-מוכן (שלבים B+D) — בלי content אין מוצר. נדרש מנגנון-credits/entitlement מ-Phase 8. כלפי-מעלה: פותח את ה-Course-Site Factory (ADR-006) ל-verticals נוספים (לא רק ממונה-בטיחות). שלב H4 תלוי ב-Phase B של ADR-009 (post-deadline 2026-07-15) — אם לא הגיע, סמן "(לאמת)".

## תתי-משימות

- [ ] **H1** — landing-page לקורס "ממונה בטיחות" (template `long-form`: hero → benefits → FAQ → CTA; auto-copywriter ל-headline/subhead/benefits/faq) · קריטריון-קבלה: דף-נחיתה חי תחת route-based slug (Option B, `betichut`), עברית RTL מלאה, OG-image לשיתוף WhatsApp/Telegram/Twitter, Lighthouse ≥ 90 בכל metric (mobile) · ref: [../screens-spec/landing.md](../screens-spec/landing.md) · [../architecture/ADR-006-course-as-product-factory.md](../architecture/ADR-006-course-as-product-factory.md)
- [ ] **H2** — checkout + payment (ADR-008: Lemon Squeezy MVP → Stripe scale) + Phase-8 credits · קריטריון-קבלה: רכישה end-to-end < 90s (landing → LS hosted-checkout → גישה-מוענקת); webhook `POST /api/webhooks/lemonsqueezy` עם אימות-חתימה HMAC-SHA256 (דחיית-forged); `provider_order_id` UNIQUE = idempotency (double-fire לא יוצר double-entitlement); webhook-secret ב-`.env.local` בלבד; mobile-checkout פותח Apple/Google Pay · ref: [../architecture/ADR-008-payment-provider.md](../architecture/ADR-008-payment-provider.md)
- [ ] **H3** — ads/marketing assets · קריטריון-קבלה: הסקריפט מייצר creative + targeting-suggestions בלבד; מוטי מעלה ידנית ל-FB/Google (ads-automation מלא דחוי ל-Phase 10.4). name-clean: ללא שמות-מרצים · ref: [../architecture/ADR-006-course-as-product-factory.md](../architecture/ADR-006-course-as-product-factory.md)
- [ ] **H4** — אינטגרציית-מגן (ADR-009 Phase B): personas (מגן בלבד — שגיא internal-only) + committee_bank (31 שאלות-וועדה), **אם רלוונטי** · קריטריון-קבלה (לאמת — Phase B חל רק post-deadline 2026-07-15): `magen.system.md` מועתק ל-`src/lib/ai/personas/` עם prompt-cache; 31 שאלות-וועדה עוברות Committee-Scope-Filter (`in_scope=true` בלבד עולה ל-quiz, `false` נשמר reference) · ref: [../architecture/ADR-009-magen-integration.md](../architecture/ADR-009-magen-integration.md)

## מסמכי-ייחוס (קרא לפני עבודה)

- [../architecture/ADR-006-course-as-product-factory.md](../architecture/ADR-006-course-as-product-factory.md) — ארכיטקטורת Phase 10: factory-pipeline (render landing → copywriter → checkout → provisioning → SEO/ads), טבלת `published_courses`, 3 templates, Option B route-based ל-MVP.
- [../architecture/ADR-008-payment-provider.md](../architecture/ADR-008-payment-provider.md) — ספק-תשלום: Lemon Squeezy MoR ל-MVP (0-to-revenue, ללא עוסק-מורשה) → Stripe ל-scale; webhook/entitlement/subscription-lifecycle + security.
- [../architecture/ADR-009-magen-integration.md](../architecture/ADR-009-magen-integration.md) — Phased Convergence: Phase A side-by-side (עד 2026-07-15), Phase B megen ⊂ StudiBuilder (content-import + personas + first-public-course).
- [../screens-spec/landing.md](../screens-spec/landing.md) — מפרט landing: hero/value-prop/CTA, FeatureGrid, Footer, Acceptance (Lighthouse/SEO/OG/RTL/responsive).

## החלטות פתוחות / הערות

- **דומיין** — subdomain (`betichut.studibuilder.app`) או route-based (`/c/[slug]`)? ברירת-מחדל ADR-006: Option B (route-based) ל-MVP, מעבר ל-Option A ב-5+ קורסים. (לאמת)
- **Migration-trigger ל-Stripe** — 5+ קורסים פעילים / ₪10K+ הכנסה-חודשית / 200+ tx-חודשי. דורש עוסק-מורשה + ADR-008.1.
- **H4 timing** — Phase B חל רק אחרי deadline-הוועדה (2026-07-15) ולפי-traction; עד-אז סמן "(לאמת)". שגיא = internal-only (לא public-persona).
- name-clean: חוקים/תקנות = נחלת-כלל; חומרי-מרצה = reference בלבד, ללא שמות.
