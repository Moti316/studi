# 🎬 סרטון 06 — Settings + Voice Preview

> **תוכן**: מסך-הגדרות + 4 קולות (יואב/טלי/מיכל/אורי) עם voice-preview.
> **משך**: 37 שניות · **גודל**: 14MB

---

## 📋 פרומפט לג'מיני — ניתוח פר-פריים (100ms)

```
אני בונה אפליקציית-לימוד בעברית. אתה מקבל סרטון 37 שניות של מסך-הגדרות
ב-StudiesGo, עם דגש על-בחירת-קולות-TTS. אני צריך לשחזר ב-Framer-Motion.

⚡ חובה: תיאור פר-פריים ברזולוציה של 100ms.
   זמנים: MM:SS.ms.

## חלק א' — Timeline מלא (00:00.000 → סוף, פר-100ms)

00:00.000 — [מסך-הגדרות + סקציות]
00:00.100 — [שינויים]
...

## חלק ב' — Deep-dive פר-50ms

### B1. Toggle / Switch animation
- on→off: transition פר-50ms (color, position-of-thumb, easing)
- haptic?

### B2. Theme-toggle (light/dark mode אם יש)
- transition של כל-המסך: fade? swap? משך?

### B3. Voice-card selection
- מצב default vs selected
- selection animation פר-50ms

### B4. Voice-preview "▶ דוגמה" — הכי-מעניין!
- T=0 (לחיצה): מה השתנה ראשון?
- האם המסקוט פותח-פה?
- האם יש waveform? איך נראה? איך זז?
- האם יש progress-indicator?
- T+1000ms / T+2000ms: מה קורה?
- סיום: איך חוזרים למצב-default?

### B5. Toast confirmation ("הקול עודכן ל'יואב'")
- כניסה: מאיפה? slide-from-top? bottom?
- bounce? משך-תצוגה? יציאה?

## חלק ג' — Design Tokens

Color, radius, shadows, typography של settings + voice-card.

## חלק ד' — Sound + Haptic

לכל-toggle: יש sound? haptic?
preview-voice: איזה sample נשמע? (מילה/משפט/אורך)?

## TL;DR

- "ההבדל בין הקולות (אם רואה ויזואלית)"
- "voice-preview animation מומלצת"

חזור בעברית, מפורט.
```

---

## 📥 התגובה תיכנס ל: [`gemini-response.md`](./gemini-response.md)
