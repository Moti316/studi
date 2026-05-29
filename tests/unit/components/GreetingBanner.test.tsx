import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GreetingBanner } from '@/components/dashboard/GreetingBanner';

describe('GreetingBanner', () => {
  it('מציג את שם המשתמש', () => {
    render(<GreetingBanner name="מוטי לוי" hour={9} />);
    expect(screen.getByRole('heading', { name: 'מוטי לוי!' })).toBeInTheDocument();
  });

  it('שעה 5 → "בוקר טוב"', () => {
    render(<GreetingBanner name="מוטי" hour={5} />);
    expect(screen.getByText(/בוקר טוב/)).toBeInTheDocument();
  });

  it('שעה 14 → "צהריים טובים"', () => {
    render(<GreetingBanner name="מוטי" hour={14} />);
    expect(screen.getByText(/צהריים טובים/)).toBeInTheDocument();
  });

  it('שעה 19 → "ערב טוב"', () => {
    render(<GreetingBanner name="מוטי" hour={19} />);
    expect(screen.getByText(/ערב טוב/)).toBeInTheDocument();
  });

  it('שעה 23 → "לילה טוב"', () => {
    render(<GreetingBanner name="מוטי" hour={23} />);
    expect(screen.getByText(/לילה טוב/)).toBeInTheDocument();
  });

  it('שעה 0 (חצות) → "לילה טוב"', () => {
    render(<GreetingBanner name="מוטי" hour={0} />);
    expect(screen.getByText(/לילה טוב/)).toBeInTheDocument();
  });

  it('שעה 11 (סוף הבוקר) → "בוקר טוב"', () => {
    render(<GreetingBanner name="מוטי" hour={11} />);
    expect(screen.getByText(/בוקר טוב/)).toBeInTheDocument();
  });

  it('שעה 17 (תחילת ערב) → "ערב טוב"', () => {
    render(<GreetingBanner name="מוטי" hour={17} />);
    expect(screen.getByText(/ערב טוב/)).toBeInTheDocument();
  });

  it('שם עם תו מיוחד מוצג כהלכה', () => {
    render(<GreetingBanner name='ד"ר כהן' hour={9} />);
    expect(screen.getByRole('heading', { name: 'ד"ר כהן!' })).toBeInTheDocument();
  });
});
