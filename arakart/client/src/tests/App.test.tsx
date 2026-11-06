import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import i18n from '../lib/i18n';

describe('Frontend Scaffold (FE-001)', () => {
  it('renders home page headline with Ara', () => {
    render(<App />);
    expect(screen.getByText(/Hyperlocal Services Platform — Ara/i)).toBeInTheDocument();
  });

  it('resolves i18n translations in English and Hindi', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('home')).toBe('Home');
    expect(i18n.t('brand')).toBe('AraKart');

    i18n.changeLanguage('hi');
    expect(i18n.t('home')).toBe('होम');
    expect(i18n.t('brand')).toBe('आराकार्ट');

    // Reset back to English
    i18n.changeLanguage('en');
  });
});
