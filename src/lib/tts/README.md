# src/lib/tts - ElevenLabs TTS wrapper

> **Phase**: 7 · Owner: ml-engineer

עטיפה ל-ElevenLabs API עם cache layer (SHA-256 → mp3 in Storage).

## קולות (Phase 7)

| voice | gender | tone | env var |
|---|---|---|---|
| יואב | M | חם | `ELEVENLABS_VOICE_YOAV` |
| טלי | F | בהיר | `ELEVENLABS_VOICE_TALI` |
| מיכל | F | חם | `ELEVENLABS_VOICE_MICHAL` |
| אורי | M | צעיר | `ELEVENLABS_VOICE_ORI` |

## קבצים מתוכננים

- `client.ts` - ElevenLabs SDK wrapper
- `voices.ts` - 4 voice configs + previews
- `cache.ts` - SHA-256(text+voice) → Supabase Storage path
- `synthesize.ts` - main function: text → mp3 URL

## עקרון: Cache-first

```
1. compute key = SHA-256(text + voice_id + model_id)
2. check Supabase Storage at tts-cache/{key}.mp3
3. if exists → return URL (free)
4. if not → call ElevenLabs API → upload to cache → return URL
```

זה משמעותי כי:
- אותו הסבר נשמע על-ידי הרבה משתמשים
- voice preview משמש על ידי כולם
- חוסך > 90% מהעלות אחרי trafficking ראשוני

## עלות

- ElevenLabs: ~$0.30 לדקת-אודיו
- ממוצע הסבר: 30s = $0.15
- עם cache hit rate ~90%: עלות אפקטיבית $0.015 להסבר
