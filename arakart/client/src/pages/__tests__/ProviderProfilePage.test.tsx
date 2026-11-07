import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProviderProfilePage } from '../ProviderProfilePage';
import * as providerService from '../../services/providerService';
import * as reviewService from '../../services/reviewService';

vi.mock('../../services/providerService', () => ({
  getProviderById: vi.fn(),
}));

vi.mock('../../services/offerService', () => ({
  fetchPublicOffers: vi.fn().mockResolvedValue([]),
  applyOffer: vi.fn(),
}));

vi.mock('../../services/reviewService', () => ({
  fetchProviderReviews: vi.fn(),
  submitReview: vi.fn(),
}));

const mockProvider: providerService.ProviderProfile = {
  id: '507f1f77bcf86cd799439011',
  nameEn: 'Verma AC Services & Repair',
  nameHi: 'वर्मा एसी सर्विसेज',
  categories: ['ac-repair'],
  area: 'Nawada',
  areasServed: ['Nawada', 'Anaith', 'Judge Bazar'],
  city: 'ara',
  phone: '98765 XXXXX',
  whatsapp: '9876543210',
  bioEn: 'Top certified technician for Split and Window AC in Ara with over 10 years experience.',
  experience: 10,
  workingHours: '9:00 AM - 7:00 PM',
  isAllDay: false,
  services: [
    { id: 'srv1', nameEn: 'AC Jet Cleaning', startingPrice: 399 },
    { id: 'srv2', nameEn: 'Gas Charging & Leak Fix', startingPrice: 1200 },
  ],
  photos: ['https://example.com/ac1.jpg'],
  avgRating: 4.9,
  reviewCount: 45,
  profileViews: 320,
  callClicks: 28,
  whatsappClicks: 19,
  status: 'approved',
  isLive: true,
  verified: true,
  fromPrice: 399,
};

const mockReviewsResponse: reviewService.ProviderReviewsResponse = {
  reviews: [
    {
      id: 'rev1',
      provider: mockProvider.id,
      customer: 'cust1',
      customerName: 'Anand Singh',
      rating: 5,
      comment: 'Super fast cooling fix! Came to Nawada within 45 minutes.',
      sellerReply: 'Thank you Anand ji for trusting our service!',
      sellerRepliedAt: '2026-11-05T12:00:00Z',
      createdAt: '2026-11-04T10:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    pages: 1,
  },
  summary: {
    avgRating: 4.9,
    totalReviews: 45,
    breakdown: { '5': 40, '4': 5, '3': 0, '2': 0, '1': 0 },
  },
};

describe('ProviderProfilePage (FE-007)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providerService.getProviderById).mockResolvedValue(mockProvider);
    vi.mocked(reviewService.fetchProviderReviews).mockResolvedValue(mockReviewsResponse);
  });

  const renderPage = (providerId = '507f1f77bcf86cd799439011') => {
    return render(
      <MemoryRouter initialEntries={[`/provider/${providerId}`]}>
        <Routes>
          <Route path="/provider/:id" element={<ProviderProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('fetches and renders full provider profile details', async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Verma AC Services & Repair' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Top certified technician for Split and Window AC/i)
      ).toBeInTheDocument();
      expect(screen.getByText('AC Jet Cleaning')).toBeInTheDocument();
      expect(screen.getAllByText('₹399').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Gas Charging & Leak Fix')).toBeInTheDocument();
      expect(screen.getByText('₹1200')).toBeInTheDocument();
    });

    // Check locality & verified badge
    expect(screen.getAllByText(/Nawada/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('✓ Verified Business')).toBeInTheDocument();
  });

  it('renders reviews list with customer comments and seller reply', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Anand Singh')).toBeInTheDocument();
      expect(
        screen.getByText(/Super fast cooling fix! Came to Nawada within 45 minutes./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Thank you Anand ji for trusting our service!/i)
      ).toBeInTheDocument();
    });
  });

  it('renders sticky contact sidebar with Call and WhatsApp actions', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /call/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /whatsapp/i })).toBeInTheDocument();
    });
  });
});
