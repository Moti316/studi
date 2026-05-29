# [Screen Name] — `/url-path`

> **Phase**: N · **State variants**: loading / empty / populated / error · **Mobile-first**

## Purpose

[משפט-שניים על מה המסך עושה ומי המשתמש שלו]

## States

### loading

- skeleton / spinner
- [ספציפי למסך]

### empty

- [תוכן ראשון/onboarding/CTA]

### populated

- [תוכן רגיל]

### error

- [error message + retry CTA]

## Layout (mobile portrait 390×844)

```
┌─────────────────┐
│   header        │
│                 │
│   content       │
│                 │
│                 │
│ bottom nav      │
└─────────────────┘
```

## Components used

- `<ComponentA>` (from `src/components/...`)
- shadcn primitive: `Button`, `Card`, ...

## Data dependencies

- API: `GET /api/...`
- DB tables: `...`
- Realtime channel: `...` (אם רלוונטי)

## Acceptance criteria

- [ ] RTL נכון
- [ ] keyboard nav עובד
- [ ] axe-core 0 violations
- [ ] צילום-מסך תואם ל-`docs/screens/...`

## Related screens

- ↗ `[prev-screen].md`
- ↘ `[next-screen].md`

## Source

צילום-מסך מקור: `docs/screens/[file].jpg`
