/**
 * Mock-data לפיתוח Phase 2. יחליף backend אמיתי ב-Phase 3-6.
 * דמות-המשתמש: motilev8 (beta tester).
 */

export type ThemePref = 'system' | 'dark' | 'light';
export type VoiceId = 'yoav' | 'tali' | 'michal' | 'ori';
export type DailyGoalMin = 5 | 10 | 15 | 20;

export interface MockUserProfile {
  displayName: string;
  email: string;
  credits: number;
  xpToday: number;
  xpDailyGoal: number;
  lessonsToday: number;
  lessonsDailyGoal: number;
  streakDays: number;
  level: string;
}

export interface MockUserSettings {
  dailyGoalMin: DailyGoalMin;
  theme: ThemePref;
  ttsEnabled: boolean;
  ttsVoice: VoiceId;
  a11yButtonShow: boolean;
  a11yButtonMobile: boolean;
  marketingEmails: boolean;
}

export const MOCK_USER_PROFILE: MockUserProfile = {
  displayName: 'מוטי לוי',
  email: 'motilev8@gmail.com',
  credits: 1500,
  xpToday: 0,
  xpDailyGoal: 20,
  lessonsToday: 0,
  lessonsDailyGoal: 1,
  streakDays: 3,
  level: 'מתחיל',
};

export const MOCK_USER_SETTINGS: MockUserSettings = {
  dailyGoalMin: 15,
  theme: 'system',
  ttsEnabled: true,
  ttsVoice: 'yoav',
  a11yButtonShow: false,
  a11yButtonMobile: false,
  marketingEmails: true,
};

/**
 * greetingByHour — "בוקר טוב" / "צהריים טובים" / "ערב טוב" / "לילה טוב".
 * הזרקת-זמן (לא Date.now() בתוך component) — דטרמיניסטי לטסטים ו-SSR.
 */
export function greetingByHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'בוקר טוב';
  if (hour >= 12 && hour < 17) return 'צהריים טובים';
  if (hour >= 17 && hour < 22) return 'ערב טוב';
  return 'לילה טוב';
}
