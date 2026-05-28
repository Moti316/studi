# Landing — `/`

> **Phase**: 9 (לא ב-MVP - internal only) · **Public**

## Purpose

דף-בית פומבי. ניתן לצופה לא-מחובר. CTA ל-`/login` או `/beta-access`.

## States

- **default**: hero + value prop + CTA
- אין מצבי loading/empty/error משמעותיים (static)

## Layout

```
[logo StudiesGo-style]
[hero text - "צור קורסים מהמסמכים שלך"]
[primary CTA: התחבר עם Google]
[secondary: הצטרף לבטא]
[features grid - 3-4 features עם איקונים]
[footer]
```

## Components

- `<Hero>`, `<FeatureGrid>`, `<Footer>`
- `<PrimaryButton>` x 2

## Data dependencies
- None (static)

## Acceptance
- [ ] Lighthouse perf >= 95
- [ ] SEO: meta tags, OG image
- [ ] עברית RTL מלאה
- [ ] mobile + desktop responsive

## Related
- ↘ `auth-modal.md`

## Source
לא צולם - נבנה מהיסוד
