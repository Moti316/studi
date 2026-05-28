# Stats — `/stats`

> **Phase**: 9 (full) / Phase 2 (empty state) · States: empty / with-data

## Purpose
דשבורד התקדמות-לימודית של המשתמש. גרפים, מגמות, הישגים.

## States
- **empty**: Bob + "עוד אין הרבה לדווח - בוא נתחיל ללמוד והסטטיסטיקות יתמלאו כאן"
- **with-data**: 4-5 panels:
  1. XP over time (line chart, 30 days)
  2. Streak history (calendar heatmap)
  3. Lessons completed per course (bar)
  4. Accuracy rate per topic (radar/bar)
  5. Time-of-day pattern (when do you study)

## Layout (empty state)
```
[Bob mascot] [→ icon back]
"התקדמות / סטטיסטיקות"
"אהלן מוטי, המסע שלך בלמידה במבט אחד"

┌─ Bob waving ───────────┐
│ עוד אין הרבה לדווח 🚀 │
│ בוא נתחיל ללמוד        │
│ והסטטיסטיקות יתמלאו   │
│ כאן                    │
└────────────────────────┘

[bottom nav]
```

## Components
- `<StatsHeader>` (greeting + back)
- `<EmptyStateCard>`
- `<XPChart>`, `<StreakHeatmap>`, `<LessonsBar>`, `<AccuracyRadar>` (Phase 9)

## Data
- Aggregate queries over `attempts` and `lessons_completed`
- Materialized view: `user_stats_daily` (refreshed nightly)

## Acceptance
- [ ] empty state כאשר אין נתונים (אין גרפים ריקים)
- [ ] charts responsive (Recharts או Visx)
- [ ] export-data button (CSV) ב-Phase 9

## Source
`docs/screens/` - frame_005 of `06_chrome_230810`
