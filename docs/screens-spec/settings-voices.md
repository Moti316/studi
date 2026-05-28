# Settings - Voice Selector (sub-section of settings)

> **Phase**: 7 · Sub-state of settings page

## Purpose
מאפשר למשתמש לבחור את קול-ההקראה של בוב מתוך 4 אופציות. כל אחד עם preview.

## Voices (זוהו ב-StudiesGo)

| Voice | Gender | Tone | Selected (default) |
|---|---|---|---|
| **יואב** | גברי | חם | ✓ |
| **טלי** | נשי | בהיר | |
| **מיכל** | נשי | חם | |
| **אורי** | גברי | צעיר | |

## Layout
```
"קול ההקראה של בוב"
"הקול שתשמע כאשר בוב קורא הסברים בשיעורים"

┌──────┬──────┐
│ יואב │ טלי  │
│ גברי │ נשי  │
│ חם   │ בהיר │
│  ✓   │      │
│ ▶דוגמ│ ▶דוגמ│
├──────┼──────┤
│ מיכל │ אורי │
│ נשי  │ גברי │
│ חם   │ צעיר │
│      │      │
│ ▶דוגמ│ ▶דוגמ│
└──────┴──────┘

[toast: הקול עודכן ל"יואב" ✓]
```

## Components
- `<VoiceGrid>` (2×2)
- `<VoiceCard>` (name, gender, tone, ▶ preview, selected ✓)
- `<VoicePreviewPlayer>` (plays cached mp3)
- Toast confirmation על שינוי

## Data
- `user_settings.tts_voice` (enum: yoav/tali/michal/ori)
- Preview MP3s pre-cached ב-Supabase Storage:
  - `tts-previews/yoav.mp3`
  - text: "שלום, אני בוב. אני אעזור לך להבין כל שיעור לעומק"
- POST `/api/settings/voice` { voice }

## TTS Provider
- ElevenLabs (Phase 7)
- 4 voice_ids hardcoded לקולות שתבחר
- שיטות: רישום ב-`src/lib/tts/voices.ts` עם voice_id, name, gender, tone

## Acceptance
- [ ] preview עובד תוך < 2s (cached)
- [ ] בחירה נשמרת מיד (debounce 300ms)
- [ ] toast אישור
- [ ] ניתן להאזין לכמה preview ברצף (אחת בכל פעם)
- [ ] keyboard nav: arrow keys בין voices

## Source
`docs/screens/settings_voices.jpg`
