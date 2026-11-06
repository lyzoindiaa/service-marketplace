import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SellerDashboardPage } from '../SellerDashboardPage';
import * as sellerService from '../../services/sellerService';
import * as leadService from '../../services/leadService';
import * as reviewService from '../../services/reviewService';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../services/sellerService', () => ({
  getMySellerProfile: vi.fn(),
  getSellerStats: vi.fn(),
  updateSellerCatalogue: vi.fn(),
  toggleSellerLive: vi.fn(),
  updateSellerProfile: vi.fn(),
}));

vi.mock('../../services/leadService', () => ({
  getSellerLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
}));

vi.mock('../../services/reviewService', () => ({
  fetchProviderReviews: vi.fn(),
  replyToReview: vi.fn(),
}));

const mockProfile: any = {
  id: 'prov_test_1',
  nameEn: 'Maa Tara Electricals',
  categories: ['electrician'],
  area: 'Nawada',
  areasServed: ['Nawada', 'Anaith'],
  city: 'ara',
  phone: '9876543210',
  whatsapp: '9876543210',
  status: 'approved',
  isLive: true,
  fromPrice: 150,
  services: [{ id: 's1', nameEn: 'Switchboard Repair', startingPrice: 150 }],
  avgRating: 4.8,
  reviewCount: 12,
  profileViews: 140,
  callClicks: 16,
  whatsappClicks: 9,
};

const mockStats: sellerService.SellerStatsResponse = {
  profileViews: 140,
  callClicks: 16,
  whatsappClicks: 9,
  avgRating: 4.8,
  reviewCount: 12,
  totalLeads: 25,
  status: 'approved',
  isLive: true,
};

const mockLeadsResponse: leadService.SellerLeadsResponse = {
  leads: [
    {
      id: 'lead1',
      customer: 'cust1',
      customerName: 'Priya Verma',
      type: 'call',
      service: 'Switchboard Repair',
      status: 'new',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead2',
      customer: 'cust2',
      customerName: 'Sunil Kumar',
      type: 'whatsapp',
      service: 'Wiring',
      status: 'contacted',
      createdAt: new Date().toISOString(),
    },
  ],
  pagination: { page: 1, limit: 10, total: 2, pages: 1 },
};

describe('SellerDashboardPage (FE-009)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'usr_seller', name: 'Ravi Seller', role: 'seller', sellerId: 'prov_test_1', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    vi.mocked(sellerService.getMySellerProfile).mockResolvedValue(mockProfile);
    vi.mocked(sellerService.getSellerStats).mockResolvedValue(mockStats);
    vi.mocked(leadService.getSellerLeads).mockResolvedValue(mockLeadsResponse);
    vi.mocked(reviewService.fetchProviderReviews).mockResolvedValue({
      reviews: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 1 },
      summary: { avgRating: 4.8, totalReviews: 12, breakdown: {} },
    });
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <SellerDashboardPage />
      </BrowserRouter>
    );
  };

  it('renders seller KPI cards: profile views, call clicks, and rating', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('Maa Tara Electricals').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('140')).toBeInTheDocument(); // Profile views
      expect(screen.getByText('16')).toBeInTheDocument(); // Call clicks
      expect(screen.getByText('4.8')).toBeInTheDocument(); // Rating
    });
  });

  it('switches to Leads Inbox tab and displays leads with type pills', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('Maa Tara Electricals').length).toBeGreaterThanOrEqual(1);
    });

    // Click Leads Inbox tab
    const leadsTab = screen.getByRole('button', { name: /leads inbox/i });
    fireEvent.click(leadsTab);

    await waitFor(() => {
      expect(screen.getByText('Priya Verma')).toBeInTheDocument();
      expect(screen.getByText('Sunil Kumar')).toBeInTheDocument();
      expect(screen.getByText(/Call Inquiry/i)).toBeInTheDocument();
      expect(screen.getByText(/WhatsApp Inquiry/i)).toBeInTheDocument();
    });
  });

  it('toggles live listing status when toggle switch is clicked', async () => {
    vi.mocked(sellerService.toggleSellerLive).mockResolvedValueOnce({
      ...mockProfile,
      isLive: false,
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Listing is Live/i)).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole('switch', { name: /toggle live listing/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(sellerService.toggleSellerLive).toHaveBeenCalled();
    });
  });

  it('switches between Services & Pricing, Reviews, and Profile tabs', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('Maa Tara Electricals').length).toBeGreaterThanOrEqual(1);
    });

    // Services tab
    const catTab = screen.getByRole('button', { name: /services & pricing/i });
    fireEvent.click(catTab);
    expect(screen.getByText(/Services & Rates Catalogue/i)).toBeInTheDocument();

    // Reviews tab
    const revTab = screen.getByRole('button', { name: /customer reviews/i });
    fireEvent.click(revTab);
    expect(screen.getByText(/No Reviews Yet/i)).toBeInTheDocument();

    // Profile tab
    const profTab = screen.getByRole('button', { name: /business profile/i });
    fireEvent.click(profTab);
    expect(screen.getByText(/Edit Business Profile/i)).toBeInTheDocument();
  });
});
