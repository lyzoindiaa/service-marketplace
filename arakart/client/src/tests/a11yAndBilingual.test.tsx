import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { OfflineBanner } from '../components/common/OfflineBanner';
import i18n from '../lib/i18n';
import enDict from '../locales/en/translation.json';
import hiDict from '../locales/hi/translation.json';

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock('../services/discoveryService', () => ({
  fetchCategories: vi.fn().mockResolvedValue([]),
  fetchCities: vi.fn().mockResolvedValue([]),
  fetchCityAreas: vi.fn().mockResolvedValue({ city: 'Ara', slug: 'ara', areas: [] }),
}));

describe('Accessibility, Responsive & Bilingual Audit (QA-004)', () => {
  describe('1. Semantic HTML & ARIA Landmarks', () => {
    it('provides semantic landmarks for header, main, and footer', () => {
      render(
        <MemoryRouter>
          <Layout>
            <div data-testid="main-content">AraKart Content</div>
          </Layout>
        </MemoryRouter>
      );

      // Landmark elements
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('provides accessible names for navigation and utility buttons', () => {
      render(
        <MemoryRouter>
          <Layout>
            <div>Test</div>
          </Layout>
        </MemoryRouter>
      );

      const langBtn = screen.getByRole('button', { name: /switch language/i });
      expect(langBtn).toBeInTheDocument();

      const loginBtn = screen.getByRole('button', { name: /login/i });
      expect(loginBtn).toBeInTheDocument();
    });

    it('announces network disconnection with polite aria-live role=status', () => {
      // Mock navigator.onLine = false
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      render(<OfflineBanner />);

      const alert = screen.getByRole('status');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByText(/offline/i)).toBeInTheDocument();

      vi.restoreAllMocks();
    });
  });

  describe('2. Bilingual Parity & Devanagari Script Audit', () => {
    it('has 100% key parity between English and Hindi translation files', () => {
      const enKeys = Object.keys(enDict).sort();
      const hiKeys = Object.keys(hiDict).sort();

      expect(enKeys).toEqual(hiKeys);
      expect(enKeys.length).toBeGreaterThan(30);
    });

    it('ensures no empty or placeholder translations in either dictionary', () => {
      for (const [key, val] of Object.entries(enDict)) {
        expect(val, `English key ${key} should not be empty`).toBeTruthy();
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      }

      for (const [key, val] of Object.entries(hiDict)) {
        expect(val, `Hindi key ${key} should not be empty`).toBeTruthy();
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      }
    });

    it('verifies Hindi translations contain valid Devanagari characters', () => {
      // Sample essential keys
      const sampleHindiKeys = ['home', 'browse', 'becomeSeller', 'brand', 'heroH'];
      const devanagariRegex = /[\u0900-\u097F]/;

      for (const key of sampleHindiKeys) {
        const hindiVal = (hiDict as Record<string, string>)[key];
        expect(
          devanagariRegex.test(hindiVal),
          `Hindi translation for ${key} should contain Devanagari characters: got "${hindiVal}"`
        ).toBe(true);
      }
    });

    it('correctly switches i18n language dynamically', async () => {
      await i18n.changeLanguage('hi');
      expect(i18n.language).toBe('hi');
      expect(i18n.t('home')).toBe('होम');

      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(i18n.t('home')).toBe('Home');
    });
  });

  describe('3. Responsive Shell & Layout Constraints', () => {
    it('applies responsive max-width and padding container classes to prevent horizontal scroll', () => {
      const { container } = render(
        <MemoryRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </MemoryRouter>
      );

      // Verify max-w and responsive padding wrappers
      const outerWrapper = container.firstElementChild;
      expect(outerWrapper).toHaveClass('min-h-screen', 'flex', 'flex-col');

      const headerContainer = container.querySelector('header .max-w-7xl');
      expect(headerContainer).toBeInTheDocument();
      expect(headerContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');

      const footerContainer = container.querySelector('footer .max-w-7xl');
      expect(footerContainer).toBeInTheDocument();
    });
  });
});
