import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyProgressCard } from '@/components/dashboard/DailyProgressCard';

describe('DailyProgressCard', () => {
  it('מציג את כותרת הכרטיס', () => {
    render(<DailyProgressCard title="XP יומי" current={0} goal={20} />);
    expect(screen.getByRole('heading', { name: 'XP יומי' })).toBeInTheDocument();
  });

  it('מציג current/goal בתצוגה', () => {
    render(<DailyProgressCard title="שיעורים" current={3} goal={5} />);
    expect(screen.getByLabelText('3 מתוך 5')).toBeInTheDocument();
  });

  it('progress bar מחושב נכון: 5/20 → 25%', () => {
    render(<DailyProgressCard title="XP יומי" current={5} goal={20} />);
    const progressBar = screen.getByLabelText(/התקדמות: 25%/);
    expect(progressBar).toBeInTheDocument();
  });

  it('progress bar: 10/10 → 100%', () => {
    render(<DailyProgressCard title="XP יומי" current={10} goal={10} />);
    expect(screen.getByLabelText(/התקדמות: 100%/)).toBeInTheDocument();
  });

  it('progress bar: עבר מטרה (current > goal) → מוגבל ל-100%', () => {
    render(<DailyProgressCard title="XP יומי" current={25} goal={20} />);
    expect(screen.getByLabelText(/התקדמות: 100%/)).toBeInTheDocument();
  });

  it('edge case: goal=0 לא גורם לחלוקה באפס (0%)', () => {
    render(<DailyProgressCard title="XP יומי" current={5} goal={0} />);
    // safeGoal=1, value=min(100, round(5/1*100))=100
    expect(screen.getByLabelText(/התקדמות: 100%/)).toBeInTheDocument();
  });

  it('encouragement מוצג כשמועבר', () => {
    render(
      <DailyProgressCard
        title="XP יומי"
        current={5}
        goal={20}
        encouragement="עוד 15 XP להשלמת היעד!"
      />,
    );
    expect(screen.getByText('עוד 15 XP להשלמת היעד!')).toBeInTheDocument();
  });

  it('encouragement לא מוצג כשלא מועבר', () => {
    render(<DailyProgressCard title="XP יומי" current={5} goal={20} />);
    expect(screen.queryByText(/XP להשלמת/)).not.toBeInTheDocument();
  });

  it('progress bar: ערכים אפס (0/20) → 0%', () => {
    render(<DailyProgressCard title="XP יומי" current={0} goal={20} />);
    expect(screen.getByLabelText(/התקדמות: 0%/)).toBeInTheDocument();
  });

  it('מציג current ו-goal כמספרים נכונים בתוויות', () => {
    render(<DailyProgressCard title="שיעורים" current={1} goal={3} />);
    expect(screen.getByLabelText('1 מתוך 3')).toBeInTheDocument();
  });
});
