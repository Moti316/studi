import { describe, it, expect } from 'vitest';
import { greetingByHour, MOCK_USER_PROFILE, MOCK_USER_SETTINGS } from '@/lib/mock/user';

describe('greetingByHour', () => {
  it('בוקר טוב 5-11', () => {
    expect(greetingByHour(5)).toBe('בוקר טוב');
    expect(greetingByHour(8)).toBe('בוקר טוב');
    expect(greetingByHour(11)).toBe('בוקר טוב');
  });

  it('צהריים טובים 12-16', () => {
    expect(greetingByHour(12)).toBe('צהריים טובים');
    expect(greetingByHour(15)).toBe('צהריים טובים');
    expect(greetingByHour(16)).toBe('צהריים טובים');
  });

  it('ערב טוב 17-21', () => {
    expect(greetingByHour(17)).toBe('ערב טוב');
    expect(greetingByHour(20)).toBe('ערב טוב');
    expect(greetingByHour(21)).toBe('ערב טוב');
  });

  it('לילה טוב 22-4', () => {
    expect(greetingByHour(22)).toBe('לילה טוב');
    expect(greetingByHour(0)).toBe('לילה טוב');
    expect(greetingByHour(4)).toBe('לילה טוב');
  });
});

describe('MOCK_USER_PROFILE', () => {
  it('תואם לתיאור ה-beta tester (motilev8)', () => {
    expect(MOCK_USER_PROFILE.credits).toBe(1500);
    expect(MOCK_USER_PROFILE.streakDays).toBe(3);
    expect(MOCK_USER_PROFILE.email).toBe('motilev8@gmail.com');
    expect(MOCK_USER_PROFILE.level).toBe('מתחיל');
  });
});

describe('MOCK_USER_SETTINGS', () => {
  it('יעד-יומי 15 דקות, קול=yoav, theme=system (defaults)', () => {
    expect(MOCK_USER_SETTINGS.dailyGoalMin).toBe(15);
    expect(MOCK_USER_SETTINGS.ttsVoice).toBe('yoav');
    expect(MOCK_USER_SETTINGS.theme).toBe('system');
  });
});
