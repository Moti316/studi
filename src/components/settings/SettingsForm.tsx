'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { ToggleRow } from './ToggleRow';
import { DailyGoalSelector } from './DailyGoalSelector';
import { ThemeSelector } from './ThemeSelector';
import { VoiceGrid } from './VoiceGrid';
import type { MockUserSettings, DailyGoalMin, ThemePref, VoiceId } from '@/lib/mock/user';
import { applyTheme, getStoredTheme } from '@/lib/theme';

interface Props {
  initial: MockUserSettings;
}

/** מפתח-אחסון מקומי להגדרות (client-only · cross-device = user_settings ב-DB · Phase 6/7). */
const SETTINGS_KEY = 'studi-settings';

/** מאחד הגדרות-שמורות (חלקיות · עמיד-לסכמה-ישנה) עם ברירת-המחדל. */
function loadSaved(initial: MockUserSettings): MockUserSettings {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<MockUserSettings>;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

/**
 * SettingsForm — 5 סעיפים ניתנים-לשינוי, **עם persistence אמיתי**:
 *   - כל שינוי נשמר מיד ל-localStorage (שורד-reload) · חיווי "נשמר ✓".
 *   - ערכת-נושא מוחלת בפועל (applyTheme · class `dark` על <html>) — לא עוד דקורטיבי.
 *   - הקראת-קול (TTS) דורשת backend (ElevenLabs · Phase 7) → הבחירה נשמרת, התצוגה מסומנת.
 * סנכרון cross-device (user_settings ב-DB) = Phase 6/7.
 */
export function SettingsForm({ initial }: Props) {
  const [settings, setSettings] = useState<MockUserSettings>(initial);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // hydrate מ-localStorage (פעם-אחת · client) + יישור-theme למה-שכבר-הוחל ע"י ה-init-script.
  useEffect(() => {
    const saved = loadSaved(initial);
    saved.theme = getStoredTheme();
    setSettings(saved);
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: MockUserSettings) {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // localStorage חסום — נשאר ב-state בלבד.
    }
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1600);
  }

  function update<K extends keyof MockUserSettings>(key: K, value: MockUserSettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // אל תשמור לפני hydrate (כדי לא לדרוס שמירה-קיימת ברנדר-ראשון).
      if (hydrated.current) persist(next);
      if (key === 'theme') applyTheme(value as ThemePref);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* חיווי-שמירה (aria-live · נעלם אוטומטית) */}
      <div aria-live="polite" className="h-5">
        {savedFlash && (
          <p
            data-testid="settings-saved"
            className="inline-flex items-center gap-1 rounded-pill bg-quiz-success-bg px-2.5 py-0.5 text-xs font-bold text-success ring-1 ring-inset ring-quiz-success-border"
          >
            <Check className="size-3.5" aria-hidden="true" />
            נשמר
          </p>
        )}
      </div>

      <SettingsSection title="למידה" description="כמה דקות-לימוד אתה רוצה להשלים כל יום?">
        <DailyGoalSelector
          value={settings.dailyGoalMin}
          onChange={(v: DailyGoalMin) => update('dailyGoalMin', v)}
        />
      </SettingsSection>

      <SettingsSection title="מראה" description="ערכת-הנושא של האפליקציה — מוחלת מיד">
        <ThemeSelector value={settings.theme} onChange={(v: ThemePref) => update('theme', v)} />
      </SettingsSection>

      <SettingsSection title="קול" description="הקראת הסברים בקול בשיעורים">
        <ToggleRow
          label="השמע את ההסברים בקול"
          description="בוב יקרא את הטקסט של ההסבר כשתסיים שאלה"
          checked={settings.ttsEnabled}
          onCheckedChange={(v) => update('ttsEnabled', v)}
        />
        {settings.ttsEnabled && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-quiz-text-secondary">קול ההקראה של בוב</p>
            <VoiceGrid value={settings.ttsVoice} onChange={(v: VoiceId) => update('ttsVoice', v)} />
            <p className="text-xs text-quiz-text-secondary">
              ההקראה בקול תופעל עם חיבור מנוע-ה-TTS (בקרוב). הבחירה שלך נשמרת.
            </p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="נגישות">
        <ToggleRow
          label="הצג כפתור נגישות בכל עמוד"
          description="כפתור צף לפתיחת הגדרות-נגישות מהירות"
          checked={settings.a11yButtonShow}
          onCheckedChange={(v) => update('a11yButtonShow', v)}
        />
        <ToggleRow
          label="הצג גם במובייל"
          checked={settings.a11yButtonMobile}
          onCheckedChange={(v) => update('a11yButtonMobile', v)}
          disabled={!settings.a11yButtonShow}
        />
      </SettingsSection>

      <SettingsSection title="התראות">
        <ToggleRow
          label="מיילים שיווקיים"
          description="עדכונים על פיצ׳רים חדשים, טיפים ותוכן מיוחד"
          checked={settings.marketingEmails}
          onCheckedChange={(v) => update('marketingEmails', v)}
        />
      </SettingsSection>
    </div>
  );
}
