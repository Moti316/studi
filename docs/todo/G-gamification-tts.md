# TODO · G — Phase 6 גיימיפיקציה + Phase 7 TTS

> שלב G ב-[TODO.md](../../TODO.md) · לפי [EXECUTION-PLAN.md](../context/EXECUTION-PLAN.md).
> מצב-על: ⬜ פתוח · תלות: G2 בנוי על "הסבר לעומק" (D4) · מעודכן: 2026-06-02.

## מטרה (Definition of Done)

שכבת-מעורבות חיה: XP/streak/levels/daily-goal נצברים מתוך פעילות-לימוד אמיתית ומוצגים ב-`/stats` (מצב ריק כשאין נתונים, גרפים responsive כשיש), והקראה-עברית (TTS) פעילה על טקסט "הסבר לעומק" בנגן-השיעור — בקול-אחד דרך ElevenLabs, cached ב-Storage, מוכן להרחבה ל-4 קולות עם preview ובחירה נשמרת.

## תלויות

חוסם: G2 דורש שטקסט "הסבר לעומק" קיים בנגן-השיעור (D4 / Phase 5) כקלט-להקראה. פותח: לוח-סטטיסטיקות מלא (Phase 9) ושכבת-XP/credits (Phase 8) נשענים על אירועי-הפעילות שנרשמים כאן.

## תתי-משימות

- [ ] **G1** — Phase 6 gamification (XP/streak/practice-log): רישום אירוע-פעילות לכל ניסיון/השלמת-שיעור (`attempts`, `lessons_completed`), צבירת XP + streak יומי + levels + daily-goal, והצגה ב-`/stats` עם 5 panels (XP-over-time, streak-heatmap, lessons-bar, accuracy, time-of-day). · קריטריון-קבלה: streak/XP מתעדכנים מפעולת-לומד אמיתית (לא mock); `/stats` מציג מצב-ריק כשאין נתונים (אין גרפים ריקים) ו-charts responsive (Recharts/Visx — לאמת ספרייה) כשיש; aggregate מעל `attempts`+`lessons_completed` (materialized-view `user_stats_daily` רענון-לילי — לאמת). · ref: [../screens-spec/stats.md](../screens-spec/stats.md)
  - 📊 **מטא:** ⏱4h · 🤖2(frontend-engineer, backend-engineer) · 💲$0 · 🟢 · ראש-צוות:builder-lead · — · אימות:Workflow
- [ ] **G2** — Phase 7 Hebrew-TTS על "הסבר לעומק" (ElevenLabs, קול-אחד → הרחבה ל-4, cached): wrapper ב-`src/lib/tts/` שמקריא טקסט "הסבר לעומק", רישום קולות ב-`src/lib/tts/voices.ts` (voice_id, name, gender, tone), preview-MP3 pre-cached ב-Supabase Storage (`tts-previews/<voice>.mp3`), בחירה ב-`user_settings.tts_voice` (yoav/tali/michal/ori) דרך `POST /api/settings/voice`. · קריטריון-קבלה: קול-אחד עובד end-to-end על "הסבר לעומק" ואינו עושה fetch כפול (audio cached); preview < 2s (cached); בחירה נשמרת מיד (debounce 300ms) + toast-אישור; ניתן להאזין לכמה preview ברצף (אחת בכל פעם); keyboard-nav (arrow keys) בין הקולות; AI-call/TTS תמיד עם cache (כלל-יסוד). · ref: [../screens-spec/settings-voices.md](../screens-spec/settings-voices.md)
  - 📊 **מטא:** ⏱3h · 🤖2(ml-engineer, frontend-engineer) · 💲~$1–3 (ElevenLabs, cached) · 🟡 · ראש-צוות:builder-lead · — · אימות:Workflow

## מסמכי-ייחוס (קרא לפני עבודה)

- [../screens-spec/stats.md](../screens-spec/stats.md) — מפרט `/stats`: מצב-ריק vs with-data, 5 panels, רכיבים (`StatsHeader`/`EmptyStateCard`/`XPChart`...), aggregate על `attempts`+`lessons_completed`, materialized-view `user_stats_daily`.
- [../screens-spec/settings-voices.md](../screens-spec/settings-voices.md) — בחירת-קולות: 4 voices (yoav/tali/michal/ori), `VoiceGrid` 2×2, preview-player מ-cached mp3, `user_settings.tts_voice`, `POST /api/settings/voice`, ספק ElevenLabs, קריטריוני preview/debounce/toast/keyboard.
- [../build-roadmap.md](../build-roadmap.md) — Phase 6 (gamification, ~4 ימים, lead backend) + Phase 7 (TTS, ~3 ימים, lead ml); Gates A–G; risk-register (TTS-עברית A/B providers, עלויות-TTS rate-limit+cost-tracking).

## החלטות פתוחות / הערות

- ספריית-גרפים ל-`/stats` (Recharts או Visx) — **(לאמת)** מול בחירת-frontend בפועל.
- `user_stats_daily` כ-materialized-view עם רענון-לילי — **(לאמת)** מול סכמת-ה-DB הקיימת.
- voice_ids בפועל ל-4 הקולות (ElevenLabs) — hardcoded ב-`voices.ts`, **(לאמת)** מול הקולות שייבחרו; risk-register מאשר A/B providers לפני נעילת איכות-עברית.
- שמות-הקולות (יואב/טלי/מיכל/אורי) הם voices של המוצר — לא שמות-מרצים; חומרי-מרצה נשארים reference בלבד.
