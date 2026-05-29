import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/dashboard/EmptyState';

describe('EmptyState', () => {
  it('מציג כותרת', () => {
    render(<EmptyState title="אין קורסים עדיין" description="צור את הקורס הראשון שלך" />);
    expect(screen.getByRole('heading', { name: 'אין קורסים עדיין' })).toBeInTheDocument();
  });

  it('מציג תיאור', () => {
    render(<EmptyState title="אין קורסים עדיין" description="צור את הקורס הראשון שלך" />);
    expect(screen.getByText('צור את הקורס הראשון שלך')).toBeInTheDocument();
  });

  it('Bob Mascot מוצג (ברירת-מחדל: curious)', () => {
    render(<EmptyState title="ריק" description="אין פריטים" />);
    expect(screen.getByRole('img', { name: 'בוב, העוזר החכם' })).toBeInTheDocument();
  });

  it('pose=happy → Bob עם תווית "בוב שמח"', () => {
    render(<EmptyState title="כל הכבוד!" description="סיימת הכל" pose="happy" />);
    expect(screen.getByRole('img', { name: 'בוב שמח' })).toBeInTheDocument();
  });

  it('pose=thinking → Bob עם תווית "בוב חושב"', () => {
    render(<EmptyState title="חושב..." description="טוענים נתונים" pose="thinking" />);
    expect(screen.getByRole('img', { name: 'בוב חושב' })).toBeInTheDocument();
  });

  it('action מוצג כשמועבר', () => {
    render(
      <EmptyState title="אין קורסים" description="הוסף קורס" action={<button>צור קורס</button>} />,
    );
    expect(screen.getByRole('button', { name: 'צור קורס' })).toBeInTheDocument();
  });

  it('action לא מוצג כשלא מועבר', () => {
    render(<EmptyState title="אין קורסים" description="הוסף קורס" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('גם כותרת וגם תיאור מוצגים יחד', () => {
    render(<EmptyState title="אין סטטיסטיקות" description="למד שיעור כדי לצבור XP" />);
    expect(screen.getByRole('heading', { name: 'אין סטטיסטיקות' })).toBeInTheDocument();
    expect(screen.getByText('למד שיעור כדי לצבור XP')).toBeInTheDocument();
  });
});
