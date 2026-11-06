import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SearchResultsPage } from '../SearchResultsPage';
import * as providerService from '../../services/providerService';
import * as discoveryService from '../../services/discoveryService';

// Mock services
vi.mock('../../services/providerService', () => ({
  searchProviders: vi.fn(),
}));

vi.mock('../../services/discoveryService', () => ({
  fetchCategories: vi.fn(),
  fetchCityAreas: vi.fn(),
}));

const mockProviders: providerService.ProviderProfile[] = [
  {
    id: 'prov1',
    nameEn: 'Maa Tara Electricals',
    nameHi: 'माँ तारा इलेक्ट्रिकल्स',
    categories: ['electrician'],
    area: 'Nawada',
    areasServed: ['Nawada', 'Anaith'],
    city: 'ara',
    phone: '98765 XXXXX',
    avgRating: 4.9,
    reviewCount: 42,
    fromPrice: 150,
    services: [{ id: 's1', nameEn: 'Switchboard Repair', startingPrice: 150 }],
    photos: [],
    profileViews: 100,
    callClicks: 10,
    whatsappClicks: 5,
    status: 'approved',
    isLive: true,
    verified: true,
    isAllDay: false,
  },
  {
    id: 'prov2',
    nameEn: 'Verma AC Services',
    nameHi: 'वर्मा एसी सर्विसेज',
    categories: ['ac-repair'],
    area: 'Anaith',
    areasServed: ['Anaith', 'Zero Mile'],
    city: 'ara',
    phone: '98765 XXXXX',
    avgRating: 4.5,
    reviewCount: 18,
    fromPrice: 299,
    services: [{ id: 's2', nameEn: 'AC Gas Refill', startingPrice: 699 }],
    photos: [],
    profileViews: 80,
    callClicks: 8,
    whatsappClicks: 4,
    status: 'approved',
    isLive: true,
    verified: false,
    isAllDay: false,
  },
];

const mockCategories = [
  { id: 'cat1', slug: 'electrician', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: 'zap', enabled: true },
  { id: 'cat2', slug: 'ac-repair', nameEn: 'AC Service & Repair', nameHi: 'एसी रिपेयर', icon: 'wind', enabled: true },
];

const mockAreas = ['Nawada', 'Anaith', 'Zero Mile', 'Gopali Chowk', 'Judge Bazar'];

describe('SearchResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(discoveryService.fetchCategories).mockResolvedValue(mockCategories);
    vi.mocked(discoveryService.fetchCityAreas).mockResolvedValue({
      city: 'Ara',
      slug: 'ara',
      areas: mockAreas,
    });
    vi.mocked(providerService.searchProviders).mockResolvedValue({
      providers: mockProviders,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      },
    });
  });

  const renderPage = (initialEntries = ['/search']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/search" element={<SearchResultsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders provider search results and filter options', async () => {
    renderPage(['/search?city=ara']);

    await waitFor(() => {
      expect(screen.getByText('Maa Tara Electricals')).toBeInTheDocument();
      expect(screen.getByText('Verma AC Services')).toBeInTheDocument();
    });

    // Check heading / count
    expect(screen.getByText(/2 providers found/i)).toBeInTheDocument();
  });

  it('reads initial query params from URL and passes to searchProviders', async () => {
    renderPage(['/search?category=electrician&area=Nawada&q=switch']);

    await waitFor(() => {
      expect(providerService.searchProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'electrician',
          area: 'Nawada',
          q: 'switch',
        })
      );
    });
  });

  it('displays empty state when no providers match criteria', async () => {
    vi.mocked(providerService.searchProviders).mockResolvedValueOnce({
      providers: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    });

    renderPage(['/search?q=nonexistent']);

    await waitFor(() => {
      expect(screen.getByText(/No service providers found/i)).toBeInTheDocument();
    });
  });

  it('renders pagination when total pages > 1', async () => {
    vi.mocked(providerService.searchProviders).mockResolvedValueOnce({
      providers: mockProviders,
      pagination: {
        page: 1,
        limit: 2,
        total: 10,
        pages: 5,
      },
    });

    renderPage(['/search']);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });
});
