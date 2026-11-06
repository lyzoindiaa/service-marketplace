import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { Layout } from '../Layout';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';
import i18n from '../../../lib/i18n';

describe('Header, Footer & Layout (FE-003)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useUiStore.setState({ authModalOpen: false, selectedCity: 'all', selectedCityName: 'All Cities', language: 'en' });
    i18n.changeLanguage('en');
  });

  describe('Header', () => {
    it('renders logo, city badge, and navigation links', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.getByText('AraKart')).toBeInTheDocument();
      expect(screen.getByText('All Cities')).toBeInTheDocument();
      expect(screen.getByText('Find Services')).toBeInTheDocument();
      expect(screen.getByText('Become a Seller')).toBeInTheDocument();
    });

    it('shows "Login" button when guest and opens auth modal on click', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const loginBtn = screen.getByRole('button', { name: /login/i });
      expect(loginBtn).toBeInTheDocument();

      fireEvent.click(loginBtn);
      expect(useUiStore.getState().authModalOpen).toBe(true);
    });

    it('shows user chip and hides login button when user is authenticated', () => {
      useAuthStore.getState().setAuth(
        {
          id: 'u1',
          name: 'Sunil Kumar',
          phone: '9800011223',
          role: 'customer',
          authMethods: ['phone'],
        },
        'mock-access-token'
      );

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      expect(screen.queryByRole('button', { name: /login/i })).toBeNull();
      expect(screen.getByText('Sunil Kumar')).toBeInTheDocument();
    });

    it('toggles language between English and Hindi', () => {
      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      );

      const langBtn = screen.getByRole('button', { name: /switch language/i });
      expect(langBtn).toBeInTheDocument();

      fireEvent.click(langBtn);
      expect(i18n.language).toBe('hi');
      expect(screen.getByText('आराकार्ट')).toBeInTheDocument();

      // Click again to toggle back
      fireEvent.click(langBtn);
      expect(i18n.language).toBe('en');
    });
  });

  describe('Footer', () => {
    it('renders brand, navigation links, and copyright', () => {
      render(
        <BrowserRouter>
          <Footer />
        </BrowserRouter>
      );

      expect(screen.getByText('AraKart')).toBeInTheDocument();
      expect(screen.getByText(/Service Offers & Deals/i)).toBeInTheDocument();
      expect(screen.getByText(/Official Blogs & Guides/i)).toBeInTheDocument();
      expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('wraps header, main content, and footer', () => {
      render(
        <BrowserRouter>
          <Layout>
            <div data-testid="page-content">Home Content</div>
          </Layout>
        </BrowserRouter>
      );

      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      expect(screen.getAllByText('AraKart').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });
  });
});
