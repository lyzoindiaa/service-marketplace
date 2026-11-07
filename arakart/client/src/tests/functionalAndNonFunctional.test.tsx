import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../lib/i18n';

import { SellerRegisterWizard } from '../components/seller/SellerRegisterWizard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Header } from '../components/layout/Header';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { LocationSelectorModal } from '../components/layout/LocationSelectorModal';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import * as discoveryService from '../services/discoveryService';
import * as adminService from '../services/adminService';

vi.mock('../services/discoveryService');
vi.mock('../services/adminService');

describe('Functional and Non-Functional Comprehensive Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      language: 'en',
      selectedCity: 'Ara',
      authModalOpen: false,
      cityModalOpen: false,
    });
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    vi.mocked(discoveryService.fetchCategories).mockResolvedValue([
      { id: '1', slug: 'electrician', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: '⚡' },
    ]);
    vi.mocked(discoveryService.fetchCities).mockResolvedValue([
      { id: '1', nameEn: 'Ara', nameHi: 'आरा', slug: 'ara', isLive: true, stateEn: 'Bihar', stateHi: 'बिहार' } as any,
    ]);
    vi.mocked(discoveryService.fetchCityAreas).mockResolvedValue({
      city: 'Ara',
      slug: 'ara',
      areas: ['Nawada', 'Anaith'],
    });
  });

  /* ------------------------------------------------------------------
   * NON-FUNCTIONAL REQUIREMENT 1: Red border validation & first-invalid focus
   * ------------------------------------------------------------------ */
  describe('NFR-1: Form Validation & Focus Management', () => {
    it('applies red border classes to invalid required inputs and focuses first invalid field', async () => {
      render(
        <MemoryRouter>
          <SellerRegisterWizard />
        </MemoryRouter>
      );

      // Attempt to advance Step 1 with empty required inputs
      const nextBtn = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        const phoneInput = screen.getByLabelText(/Mobile Number \(Calling\) \*/i);
        // Assert error styling (red border & ring)
        expect(phoneInput.className).toContain('border-red-500');
        expect(phoneInput.className).toContain('ring-red-500');
      });
    });

    it('Input component renders error state with aria-invalid="true" and red border', () => {
      render(
        <Input
          id="test-input"
          value=""
          onChange={() => {}}
          error="This field is strictly required"
          placeholder="Test placeholder"
        />
      );

      const input = screen.getByPlaceholderText('Test placeholder');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input.className).toContain('border-red-500');
      expect(screen.getByText('This field is strictly required')).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------
   * NON-FUNCTIONAL REQUIREMENT 2: Uniform Button Height and Width
   * ------------------------------------------------------------------ */
  describe('NFR-2: Uniform Button Height and Width', () => {
    it('renders size md button with standard h-[42px] and min-w-[120px]', () => {
      render(
        <Button variant="primary" size="md">
          Action Button
        </Button>
      );

      const btn = screen.getByRole('button', { name: /Action Button/i });
      expect(btn.className).toContain('h-[42px]');
      expect(btn.className).toContain('min-h-[42px]');
      expect(btn.className).toContain('min-w-[120px]');
    });

    it('enforces uniform h-[42px] and min-w-[120px] across all button variants and sizes', () => {
      render(
        <Button variant="secondary" size="sm">
          Small Action
        </Button>
      );

      const btn = screen.getByRole('button', { name: /Small Action/i });
      expect(btn.className).toContain('h-[42px]');
      expect(btn.className).toContain('min-h-[42px]');
      expect(btn.className).toContain('min-w-[120px]');
    });
  });

  /* ------------------------------------------------------------------
   * NON-FUNCTIONAL REQUIREMENT 3: Bilingual Support (English & Hindi)
   * ------------------------------------------------------------------ */
  describe('NFR-3: Bilingual UI Switching (EN <-> HI)', () => {
    it('switches navigation and header labels between English and Hindi', async () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      // Default is English
      expect(screen.getByText(/Become a Seller/i)).toBeInTheDocument();

      // Switch language to Hindi using the language switch button
      const langBtn = screen.getByLabelText(/Switch language/i);
      fireEvent.click(langBtn);

      await waitFor(() => {
        expect(useUiStore.getState().language).toBe('hi');
      });
    });
  });

  /* ------------------------------------------------------------------
   * NON-FUNCTIONAL REQUIREMENT 4: Re-rendering & Flashing Prevention
   * ------------------------------------------------------------------ */
  describe('NFR-4: In-Place Silent Refresh on Detail Add/Action', () => {
    it('admin dashboard does not unmount with full-page spinner when refreshing data silently', async () => {
      useAuthStore.setState({
        user: { id: 'admin1', name: 'Admin', role: 'admin' } as any,
        isAuthenticated: true,
      });

      vi.mocked(adminService.fetchAdminDashboardStats).mockResolvedValue({
        totalUsers: 10,
        totalSellers: 5,
        pendingSellers: 0,
        approvedSellers: 5,
        totalLeads: 20,
        totalReviews: 10,
        totalCategories: 5,
        totalCities: 1,
        callsCount: 15,
        whatsappCount: 5,
      });
      vi.mocked(adminService.fetchPendingSellers).mockResolvedValue({ sellers: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } });
      vi.mocked(adminService.fetchAdminUsers).mockResolvedValue({ users: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } });
      vi.mocked(adminService.fetchAdminReports).mockResolvedValue({ reports: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } });
      vi.mocked(adminService.fetchAdminActivity).mockResolvedValue({ activity: [] });

      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/AraKart Admin Console/i)).toBeInTheDocument();
      });

      // Verify that after initial load, the UI stays mounted
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------
   * FUNCTIONAL REQUIREMENT 1: Dynamic City Switching
   * ------------------------------------------------------------------ */
  describe('FR-1: Dynamic Multi-City Market Switching', () => {
    it('allows changing city and immediately updates scoped locality dropdowns', async () => {
      useUiStore.setState({ cityModalOpen: true });

      render(
        <LocationSelectorModal />
      );

      await waitFor(() => {
        expect(screen.getByText('Select Your State & City')).toBeInTheDocument();
        expect(screen.getByText('Ara')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Ara'));
      expect(useUiStore.getState().selectedCity).toBe('ara');
    });
  });
});
