import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { Layout } from '../components/layout/Layout';
import { SearchBar } from '../components/search/SearchBar';

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
  fetchCityAreas: vi.fn().mockResolvedValue({ city: 'Ara', slug: 'ara', areas: ['Anaith', 'Nawada'] }),
}));

describe('Responsive Polish & Multi-Viewport Testing (FE-012 / QA-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Network Offline Banner', () => {
    it('renders offline warning banner when network connection is lost', () => {
      render(<OfflineBanner />);

      // Initially online
      expect(screen.queryByText(/You are currently offline/i)).not.toBeInTheDocument();

      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

      // Trigger online event
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(screen.queryByText(/You are currently offline/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Mobile Viewport (375px — Small Smartphones)', () => {
    beforeEach(() => {
      // Simulate mobile screen width
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));
    });

    it('renders mobile hamburger menu button with accessible label', () => {
      render(
        <MemoryRouter>
          <Layout>
            <div>Mobile View</div>
          </Layout>
        </MemoryRouter>
      );

      const hamburgerBtn = screen.getByRole('button', { name: /open mobile menu/i });
      expect(hamburgerBtn).toBeInTheDocument();
      // Should have md:hidden class
      expect(hamburgerBtn).toHaveClass('md:hidden');
    });

    it('renders search bar with flexible responsive wrapping classes', () => {
      const { container } = render(
        <MemoryRouter>
          <SearchBar />
        </MemoryRouter>
      );

      // Form wrapper should have flex responsive layout
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('flex');
    });
  });

  describe('3. Tablet Viewport (768px — Medium Screens)', () => {
    beforeEach(() => {
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));
    });

    it('applies tablet container padding and responsive constraints', () => {
      const { container } = render(
        <MemoryRouter>
          <Layout>
            <div>Tablet View</div>
          </Layout>
        </MemoryRouter>
      );

      const headerContainer = container.querySelector('header .max-w-7xl');
      expect(headerContainer).toHaveClass('sm:px-6');
    });
  });

  describe('4. Desktop Viewport (1280px — Large Screens)', () => {
    beforeEach(() => {
      window.innerWidth = 1280;
      window.innerHeight = 800;
      window.dispatchEvent(new Event('resize'));
    });

    it('displays desktop navigation menu with hidden hamburger on large screens', () => {
      render(
        <MemoryRouter>
          <Layout>
            <div>Desktop View</div>
          </Layout>
        </MemoryRouter>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('hidden', 'md:flex');
    });

    it('constrains content width to max-w-7xl to prevent extreme stretching', () => {
      const { container } = render(
        <MemoryRouter>
          <Layout>
            <div>Desktop Content</div>
          </Layout>
        </MemoryRouter>
      );

      const desktopWrapper = container.querySelector('header .max-w-7xl');
      expect(desktopWrapper).toHaveClass('max-w-7xl', 'lg:px-8');
    });
  });
});
