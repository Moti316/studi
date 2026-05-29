'use client';

import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { ToggleRow } from './ToggleRow';
import { DailyGoalSelector } from './DailyGoalSelector';
import { ThemeSelector } from './ThemeSelector';
import { VoiceGrid } from './VoiceGrid';
import type { MockUserSettings, DailyGoalMin, ThemePref, VoiceId } from '@/lib/mock/user';

interface Props {
  initial: MockUserSettings;
}

/**
 * SettingsForm — מרכז את 5 הסעיפים הניתנים-לשינוי (Phase 2 mock).
 * שינויים נשמרים זמנית ב-state בלבד; persistence יחובר ב-Phase 6/7
 * עם user_settings ב-DB.
 */
export function SettingsForm({ initial }: Props) {
  const [settings, setSettings] = useState<MockUserSettings>(initial);

  function update<K extends keyof MockUserSettings>(key: K, value: MockUserSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <SettingsSection title="למידה" description="כמה דקות-לימוד אתה רוצה להשלים כל יום?">
        <DailyGoalSelector
          value={settings.dailyGoalMin}
          onChange={(v: DailyGoalMin) => update('dailyGoalMin', v)}
        />
      </SettingsSection>

      <SettingsSection title="מראה" description="ערכת-הנושא של האפליקציה">
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
            <p className="text-foreground/60 text-sm font-medium">קול ההקראה של בוב</p>
            <VoiceGrid value={settings.ttsVoice} onChange={(v: VoiceId) => update('ttsVoice', v)} />
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
