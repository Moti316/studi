# Settings — `/settings`

> **Phase**: 2 (account+display) + 6 (daily-goal) + 7 (voices) · Sectioned scroll

## Purpose

כל ההגדרות במסך אחד עם sections גלילים.

## Sections (סדר מעלה-למטה)

### 1. חשבון

- שם תצוגה (input)
- שינוי מייל
- שינוי סיסמה (אם לא רק OAuth)
- חיבור Google (status)

### 2. למידה

- יעד יומי: 4 כפתורי-בחירה: 5 / 10 / 15 / 20 דקות
  - 15 = "מאוזן" (default)

### 3. מראה (תצוגה)

- ערכת נושא: מערכת / כהה / בהיר (3 כפתורים גדולים)

### 4. קול

- toggle "השמע את ההסברים בקול"
- "קול ההקראה של בוב": 4 קולות (יואב/טלי/מיכל/אורי)
  - כל אחד עם "▶ דוגמה"
- Toast confirmation "הקול עודכן ל'יואב'"

### 5. נגישות

- toggle "הצג כפתור נגישות בכל עמוד"
- toggle "הצג גם במובייל"

### 6. התראות

- toggle "מיילים שיווקיים"
  - "עדכונים על פיצ'רים חדשים, טיפים, ותוכן מיוחד"

### 7. עזרה

- "צור קשר עם הצוות" → mailto: או chat

### 8. פעולות-חשבון

- "התנתק" (כפתור)
- "מחק חשבון" (כפתור מסוכן, confirm modal)

## Layout

```
[header: הגדרות → חשבון/למידה/מראה/קול/נגישות/התראות]
[1. חשבון] - שם תצוגה...
[2. למידה] - יעד יומי
[3. מראה] - ערכת נושא
[4. קול] - toggle + 4 voices + preview
[5. נגישות]
[6. התראות]
[7. עזרה]
[8. התנתק | מחק חשבון]
[bottom nav]
```

## Components

- `<SettingsSection>` (label + content + spacing)
- `<DailyGoalSelector>` (4 buttons)
- `<ThemeSelector>` (3 large buttons)
- `<VoiceSelector>` (4 cards with preview)
- `<ToggleRow>` (label + description + Switch)
- `<DangerButton>` (התנתק / מחק)
- `<DeleteAccountModal>` (confirm with email match)

## Data

- `user_settings` table: name, daily_goal_min, theme, tts_voice, tts_enabled, a11y_button_show, notifications_email
- POST `/api/settings/*` per section
- POST `/api/account/delete` (full delete cascade)

## Acceptance

- [ ] שינויים נשמרים מיד (debounced 500ms)
- [ ] Toast confirmation על כל save מוצלח
- [ ] מחק-חשבון = מחיקה מלאה (Right to be forgotten - GDPR)
- [ ] sections ניתנות לקיפול במובייל
- [ ] keyboard nav בין כל ה-controls

## Related

- ↗ `dashboard.md`

## Source

`docs/screens/settings_general.jpg`, `docs/screens/settings_voices.jpg`
