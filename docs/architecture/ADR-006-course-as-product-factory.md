# ADR-006: Course-as-Product Factory — Auto-Generated Landing + Distribution

> **Status**: Accepted (concept)
> **Date**: 2026-05-29
> **Authors**: tech-lead · product-owner · motilev8
> **Phase**: 10 (new — to be added to roadmap)

---

## Context

**הפיווט-העסקי:** StudiBuilder לא תהיה "פלטפורמת קורסים פתוחה" שמשתמשים מעלים אליה PDFs. במקום זאת:

- **מוטי = ה-creator היחיד** — יוצר קורסים מהידע שלו (החל מ-ממונה-בטיחות)
- **כל קורס שמוטי מסיים → "נולד" אוטומטית כמוצר מסחרי עצמאי**:
  - Landing page ייעודית
  - Checkout/תשלום
  - SEO + קמפיינים ברשתות
- **קהל-יעד** = הציבור (לומדים שמשלמים)
- **המודל**: Course-as-Product Factory

חלק י"ב בתוכנית-העל מתעד את הפיווט. ADR זה מתעד את **הארכיטקטורה**.

---

## Decision

**הוספת Phase 10 חדש ל-roadmap: "Course-Site Factory"** — סקריפט/pipeline שמייצר site ייעודי לכל קורס שמוטי מאשר ל-publish.

### ארכיטקטורה ברמת-העל

```
[Moti — Studio (StudiBuilder admin)]
      │ creates + previews + approves course
      │
      ▼ POST /api/courses/{id}/publish
[Factory Pipeline (Inngest async job)]
      │
      ├── 1. Render landing page from template + course metadata
      ├── 2. Generate marketing copy (Claude Sonnet)
      │     prompts: headline, subhead, FAQ, benefits-list
      ├── 3. Create Stripe Product + Price + Checkout link
      ├── 4. Deploy subdomain to Vercel (REST API)
      │     example: betichut.studibuilder.app
      ├── 5. Push SEO meta + sitemap.xml
      ├── 6. (Optional) Trigger ad campaigns via FB/Google Ads API
      │
      ▼
[Public Course Site]
      │ visitor → landing → checkout → enroll → learning area
      │
      ▼
[StudiBuilder Learning Area] (Phase 5-7 quiz engine)
      │ user takes lessons, gains XP, completes course
      │
      ▼
[Admin Dashboard (Moti)]
      │ per-course: revenue, conversions, completion rate
```

### חוזה-Data — `published_courses` table

```sql
CREATE TABLE published_courses (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  slug TEXT UNIQUE NOT NULL,           -- "betichut", "niihul-eichut"
  domain TEXT NOT NULL,                -- "betichut.studibuilder.app"
  vercel_project_id TEXT,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  price_ils INTEGER NOT NULL,
  landing_template TEXT NOT NULL,      -- "long-form" | "video-hero" | "comparison"
  marketing_copy JSONB,                -- {headline, subhead, faq, benefits}
  seo_meta JSONB,
  ad_campaigns JSONB,                  -- [{platform, campaign_id, status}]
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ
);
```

### Templates (Phase 10.1)

3 templates ראשונים:

1. **`long-form`** — דף-נחיתה ארוך (hero → benefits → testimonials → FAQ → CTA). מתאים לקורסים מקצועיים-רציניים.
2. **`video-hero`** — וידיאו-מבוא בראש + סיכום-קצר + CTA. מתאים אם יש וידיאו של מוטי מציג.
3. **`comparison`** — טבלת השוואה למתחרים + CTA. מתאים לקורסים נישתיים שמתחרים בקורסים אחרים.

כל template = `src/templates/course-site/{name}/` עם `page.tsx`, `metadata.ts`, `og-image.tsx`.

### Auto-Copywriter (Phase 10.2)

```
Input: course metadata
{
  title: "הכנה לוועדת ממונה-בטיחות",
  audience_persona: "מועמדים בני 25-45 שלמדו קורס בסיסי",
  unique_value: "התוכן היחיד שמבוסס על מבחני-עבר אמיתיים",
  price_ils: 299
}

→ Claude Sonnet (cached prompt)

Output: marketing_copy JSON
{
  "headline": "...",
  "subhead": "...",
  "benefits": ["...", "...", "..."],
  "faq": [{ q, a }, ...],
  "cta_text": "..."
}
```

### Vercel Provisioning (Phase 10.3)

- **Option A**: 1 Vercel project פר קורס → subdomain via Vercel UI/API
- **Option B**: 1 Vercel project לכולם, route-based: `/c/[slug]/...` → קל יותר אבל פחות-נקי SEO

**ברירת-מחדל**: Option B (route-based) ל-MVP. עוברים ל-Option A כשיש 5+ קורסים פעילים.

### Payment Provider — להכרעה ב-ADR-008

ראה ADR-008 (טרם נכתב): Stripe / Tranzila / Lemon Squeezy. **הצעה**: Lemon Squeezy ל-MVP (פשוט, תומך בישראל ב-Merchant-of-Record model — אין צורך בעוסק-מורשה ארה"בי).

### Ads Automation — דחוי ל-Phase 10.4

הסקריפט יבנה את ה-creative ויעלה ל-FB/Google Ads API. דורש:

- אישור-חשבון-מודעות (כמה שבועות)
- תקציב-מינימום ($50-100/יום פר קמפיין)
- A/B testing infra

**ל-MVP**: מוטי מנהל ידנית. הסקריפט רק יוצר את ה-creative + targeting suggestions, ומוטי מעלה ידני.

---

## Alternatives Considered

### Option A: ידני לחלוטין

מוטי בונה landing page לכל קורס ב-Webflow/WordPress, מחבר ל-StudiBuilder ידנית.

- ✅ הכי גמיש, conversion גבוה (custom design)
- ❌ 1-2 שבועות פר קורס launch — לא scaleable

### Option B: סקריפט אוטומטי (זה) ← **נבחר**

- ✅ launch תוך שעה פר קורס
- ✅ scaleable ל-10+ קורסים
- ❌ conversion בינוני (template-based), צריך A/B
- ❌ מורכבות הקמה (Phase 10 = שבוע+)

### Option C: SaaS חיצוני (Podia/Teachable)

מעלים את הקורס שם, הם מספקים landing+checkout.

- ✅ אפס-פיתוח לפיווט
- ❌ אין שליטה על UX, branding, או pricing-flexibility
- ❌ נחיתים על-הם 10-20% מההכנסות

---

## Consequences

### Positive

- מוטי = מנוע-תוכן, StudiBuilder = מנוע-הפצה. הפרדה נקייה
- כל קורס משלם על עצמו (paid ads → conversion → revenue)
- ניתן להוסיף verticals בקלות (מ-ממונה-בטיחות ל-בודק-שכר, וכו׳)

### Negative

- Phase 10 דורש 7-10 ימי-פיתוח (גדול)
- תלות ב-API חיצוניים (Stripe/Vercel/FB/Google) — כל אחד יכול לשבור
- צריך עסק רשום לתשלומים (לפחות עוסק-מורשה)
- ניהול-מותג-פר-קורס (האם כל קורס מותג נפרד? או "StudiBuilder presents...")?

### Neutral

- אם הסקריפט לא מוכן, מוטי יכול לבנות landing ידנית בינתיים — לא חוסם MVP
- ה-decision על דומיין (subdomain vs custom) ניתן לדחות

---

## Validation

- [ ] קורס דמה → factory מייצר landing+checkout+enroll-flow תוך < 1 שעה (אוטומטית)
- [ ] landing page Lighthouse ≥ 90 בכל metric (mobile)
- [ ] checkout-to-enroll עובד end-to-end עם תשלום-טסט
- [ ] meta-tags מאפשרים שיתוף-יפה ב-WhatsApp/Telegram/Twitter (OG image)
- [ ] dashboard-admin מציג מטריקות פר-קורס בזמן-אמת

---

## Open Questions (להחלטה לפני Phase 10)

1. **Payment provider** — Stripe / Tranzila / Lemon Squeezy? → `ADR-008-payment-provider.md`
2. **דומיין** — subdomain (`betichut.studibuilder.app`) או דומיין נפרד פר-קורס?
3. **Pricing model** — one-time, subscription, או freemium?
4. **קורס-ראשון לפיילוט** — ממונה-בטיחות? תאריך-יעד?

---

## References

- ADR-001 (Stack), ADR-005 (NotebookLM hybrid), ADR-007 (Brand Identity)
- חלק י"ב בתוכנית-העל
- TODO: `ADR-008-payment-provider.md` (Stripe vs Tranzila vs LS)
