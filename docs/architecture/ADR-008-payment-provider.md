# ADR-008: Payment Provider — Lemon Squeezy ל-MVP, Stripe ל-Scale

> **Status**: Proposed (להחלטת motilev8)
> **Date**: 2026-05-29
> **Authors**: tech-lead · motilev8
> **Phase**: 10

---

## Context

ADR-006 הגדיר את Phase 10 כ-"Course-Site Factory" — כל קורס שמוטי מאשר ל-publish מקבל site ייעודי עם תהליך-רכישה. דרוש payment provider.

### דרישות-עסק

- **קהל-יעד**: ישראלים שקונים קורסי-הכשרה (החל מ-ממונה-בטיחות)
- **טווח-מחירים**: ₪199-399 one-time, או ₪49/חודש subscription
- **שלב**: MVP = קורס-יחיד בפיילוט (Phase 10.0). עתיד = 5+ קורסים פעילים
- **Status של מוטי**: יחיד (לא חברה, אולי לא עוסק-מורשה עדיין)

### Constraint קריטי

מוטי לא רוצה להפוך לפני MVP את עצמו לעוסק-מורשה רק כדי לבדוק שהקורס נמכר. צריך פתרון "0-to-revenue" מהיר.

---

## Decision

**שני-שלבים:**

### שלב 1 — MVP (Phase 10.0, קורס-יחיד): **Lemon Squeezy**

Merchant-of-Record (MoR) שמטפל ב-VAT/מע"מ/חשבוניות גלובלית. מוטי לא צריך עוסק-מורשה — Lemon Squeezy הם הסוחר-הרשום מול הלקוח, ומשלמים לו payout כספק.

### שלב 2 — Scale (Phase 10.4+, 5+ קורסים פעילים או הכנסה > ₪10K/חודש): **Stripe**

מעבר ל-Stripe דורש עוסק-מורשה ישראלי + חברה (או Atlas). חיסכון של ~3% בעמלות. אינטגרציה חזקה יותר ל-subscriptions ו-coupons.

### Tranzila/Cardcom — נדחו

ראה Alternatives למטה.

---

## Options Reviewed

### Option A — Stripe

| ממד                   | פירוט                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| **עמלות**             | 2.9% + ₪1.20 per transaction (ILS). +0.5% ל-bank transfer/recurring    |
| **דרישות-עסק**        | עוסק-מורשה ישראלי + verification, או Stripe Atlas (חברה Delaware $500) |
| **UX checkout**       | מצוין — Stripe Checkout hosted, mobile-first, Apple/Google Pay native  |
| **תמיכה ב-ILS**       | Native (settlement ב-ILS, אין FX)                                      |
| **Subscriptions**     | First-class (billing portal, dunning, proration)                       |
| **ניהול-מס/VAT**      | **לא** — אתה אחראי על חשבונית/מע"מ. Stripe Tax = $0.50/tx נוסף         |
| **מורכבות-אינטגרציה** | 16-24 שעות (webhook, customer portal, RTL בדפי-checkout)               |
| **זמן-payout**        | 7 ימים (ניתן לקצר ל-2)                                                 |

### Option B — Tranzila / Cardcom

| ממד                   | פירוט                                                              |
| --------------------- | ------------------------------------------------------------------ |
| **עמלות**             | 1.5-2.5% + ₪0.40-1.00 per tx (משתנה לפי הסכם)                      |
| **דרישות-עסק**        | עוסק-מורשה ישראלי (כל ת.ז). חתימת-הסכם פיזי, KYC 1-3 שבועות        |
| **UX checkout**       | **מיושן** — iframe redirect, לא mobile-first, אין Apple/Google Pay |
| **תמיכה ב-ILS**       | Native                                                             |
| **Subscriptions**     | תמיכה בסיסית ("חיוב חוזר") — אין dunning/proration                 |
| **ניהול-מס/VAT**      | **לא** — חשבונית-עברית נפרדת (אינטגרציה ל-iCount/EZcount נדרשת)    |
| **מורכבות-אינטגרציה** | 30-50 שעות (תיעוד חלקי, אין SDK מודרני, RTL ידני)                  |
| **זמן-payout**        | 1-3 ימי-עסקים                                                      |

### Option C — Lemon Squeezy (Merchant-of-Record)

| ממד                   | פירוט                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| **עמלות**             | 5% + ₪1.80 per transaction (גבוה — אבל כולל VAT/fraud/חשבונית)        |
| **דרישות-עסק**        | **כלום** — חשבון-בנק בלבד (מוטי כיחיד, Form W-8BEN)                   |
| **UX checkout**       | מצוין — hosted, mobile-first, Apple/Google Pay, RTL חלקי              |
| **תמיכה ב-ILS**       | Display ב-ILS, settlement ב-USD (FX ~1% נוסף)                         |
| **Subscriptions**     | First-class (billing portal, license keys, dunning)                   |
| **ניהול-מס/VAT**      | **כן — מלא** — LS אוסף VAT אירופאי, מע"מ ישראלי לא רלוונטי (LS=המוכר) |
| **מורכבות-אינטגרציה** | 6-10 שעות (SDK מצוין, webhooks פשוטים)                                |
| **זמן-payout**        | חודשי (1st of month) — net-30                                         |

---

## Alternatives Considered

### למה לא Stripe מההתחלה

- ❌ דורש עוסק-מורשה — מוטי לא רוצה לפתוח אחד לפני שראה שהקורס נמכר
- ❌ Atlas = $500 + תחזוקה שנתית של חברה Delaware (overkill ל-MVP)
- ❌ חשבונית-מע"מ-עברית = אינטגרציה נוספת ל-iCount (עוד 10-15 שעות)

### למה לא Tranzila/Cardcom

- ❌ UX checkout מיושן — קריטי בקהל-יעד שלא רגיל ל-checkout-קלאסי (מובייל-first)
- ❌ Onboarding ארוך (1-3 שבועות חתימת-הסכם) חוסם את ה-MVP
- ❌ אין Apple/Google Pay → conversion נמוך ב-20-30% במובייל
- ❌ SDK חלש, RTL ידני, תיעוד עברי בלבד

### למה לא Paddle (MoR נוסף)

- ✅ דומה ל-Lemon Squeezy, עמלות דומות
- ❌ קשה יותר ל-onboarding (דורש domain verification, KYC ארוך)
- ❌ אין יתרון מובהק על LS ל-MVP

### למה לא PayPlus / Meshulam (ישראלי-חדש)

- ✅ UX טוב יותר מ-Tranzila
- ❌ עדיין דורש עוסק-מורשה
- ❌ ecosystem קטן, פחות תיעוד
- ❌ אין יתרון על Stripe אחרי שמוטי הופך לעוסק

---

## Consequences

### Positive (Lemon Squeezy ל-MVP)

- 0-to-revenue ב-יום אחד (אין KYC ממושך)
- מוטי לא צריך להפוך לעוסק-מורשה לפני שיש validation
- LS מטפל ב-VAT/fraud/chargebacks — פחות עומס תפעולי
- אינטגרציה 6-10 שעות בלבד

### Negative / Trade-offs

- עמלה גבוהה (5% + FX 1% ≈ 6% effective vs 3% של Stripe) → על ₪299 = ₪18 vs ₪9
- Payout חודשי (cash flow איטי בהתחלה)
- Settlement ב-USD → חשיפת FX קטנה
- Migration ל-Stripe בעתיד = איבוד customer-id-ים (כל subscription נצרך re-subscribe)

### Neutral

- ב-MVP, על 50 רכישות/חודש = ₪450 הפרש בעמלות. סביר לשלב-validation.
- ברגע שיש 5+ קורסים פעילים = כ-200+ tx/חודש → ₪3,600/חודש הפרש → migration ל-Stripe משתלמת.

---

## Implementation Plan

### Phase 10.0 — Lemon Squeezy MVP (יום 1-2)

- חשבון LS + הגדרת store
- מוצרי-קורסים ב-LS (one-time + subscription variants)
- Webhook endpoint: `POST /api/webhooks/lemonsqueezy` (signature verify)
- DB: עדכון `purchases` table — `provider`, `provider_order_id`, `status`
- Checkout button → LS hosted checkout (redirect)
- Post-purchase: webhook יוצר entitlement → user מקבל גישה לקורס

### Phase 10.0.1 — License & Access (יום 3)

- `entitlements` table: `user_id`, `course_id`, `granted_at`, `expires_at`, `source`
- middleware ב-`/course/[slug]/learn` בודק entitlement

### Phase 10.0.2 — Subscription Lifecycle (יום 4)

- webhook events: `subscription_created`, `subscription_cancelled`, `subscription_payment_failed`
- billing portal link ב-`/settings/billing` (LS hosted)

### Migration Trigger ל-Stripe (Phase 10.4+)

- **Trigger**: 5+ קורסים פעילים, או ₪10K+ הכנסה/חודש, או 200+ tx/חודש
- אז: ADR-008.1 (migration plan) — מוטי פותח עוסק-מורשה, חשבון Stripe, ו-`stripe_price_id` שכבר קיים ב-schema (ראה ADR-006 line 71) נכנס לפעולה.

---

## Validation

- [ ] רכישה end-to-end < 90s (landing → checkout → access granted)
- [ ] Webhook signature verification עובד (rejection על forged payload)
- [ ] Mobile checkout פותח Apple Pay על Safari ו-Google Pay על Chrome
- [ ] Refund flow ידני דרך LS dashboard מבטל entitlement תוך 5 דקות
- [ ] Subscription cancellation שומר גישה עד end-of-period (לא immediate revoke)
- [ ] חשבונית-LS מגיעה ללקוח אוטומטית (בדיקת inbox)

---

## Security Considerations

- Webhook secret ב-`.env.local` בלבד (LEMONSQUEEZY_WEBHOOK_SECRET)
- Signature verification (HMAC-SHA256) — דחיית כל webhook ללא חתימה תקינה
- Idempotency: `provider_order_id` UNIQUE במסד — webhook double-fire לא יוצר double-entitlement
- אין PAN/card data נוגעת בשרת שלנו (PCI-DSS scope = SAQ-A)
- Customer email מ-webhook מאומת מול user.email לפני grant — מניעת account takeover

---

## Open Questions (לא חוסם החלטה)

1. **Hebrew invoice** — האם הלקוח הישראלי ידרוש חשבונית-מע"מ-עברית מ-LS (שהיא חברה אמריקאית/אסטונית)? צריך תשובה משפטית. Workaround: ניתן להוציא חשבונית "קבלה על שירות" מ-iCount ידנית במידת-הצורך.
2. **Pricing display** — להציג ₪ כולל-מע"מ או כולל-עמלה? LS מציג מחיר-מוצר ומוסיף VAT בנפרד.
3. **קורס-ראשון** — מתי moti יודע שזה זמן-המעבר ל-Stripe? KPI מומלץ: 200+ tx/חודש רצוף 3 חודשים.

---

## References

- ADR-001 (Stack — Supabase + Vercel)
- ADR-006 (Course-as-Product Factory — Phase 10 context, schema עם `stripe_price_id` placeholder)
- [Lemon Squeezy — Merchant of Record explained](https://www.lemonsqueezy.com/learn/what-is-a-merchant-of-record)
- [Stripe Israel — supported countries](https://stripe.com/global)
- [Tranzila integration docs](https://docs.tranzila.com)
- [Lemon Squeezy webhook reference](https://docs.lemonsqueezy.com/help/webhooks)
