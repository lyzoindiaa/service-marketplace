import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../lib/i18n';
import { HomePage } from '../HomePage';
import * as discoveryService from '../../services/discoveryService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/discoveryService');

describe('HomePage Component (FE-005)', () => {
  const sampleCategories = [
    { id: '1', slug: 'electrician', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: 'zap' },
    { id: '2', slug: 'plumber', nameEn: 'Plumber', nameHi: 'प्लंबर', icon: 'wrench' },
    { id: '3', slug: 'mechanic', nameEn: 'Mechanic', nameHi: 'मैकेनिक', icon: 'settings' },
  ];

  const sampleAreas = ['Nawada', 'Katira', 'Anaith', 'Shivganj'];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(discoveryService.fetchCategories).mockResolvedValue(sampleCategories);
    vi.mocked(discoveryService.fetchCityAreas).mockResolvedValue({
      city: 'Ara',
      slug: 'ara',
      areas: sampleAreas,
    });
  });

  it('renders hero headline, search bar, and city localities', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Hyperlocal Services Platform/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search for services/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Nawada').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Katira').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates to search with keyword and area when submitted from hero search bar', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search for services/i);
    fireEvent.change(searchInput, { target: { value: 'ac repair' } });

    const searchBtn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchBtn);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/search?q=ac+repair'));
  });

  it('renders category grid cards and clicking navigates to category filter', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electrician')).toBeInTheDocument();
      expect(screen.getByText('Plumber')).toBeInTheDocument();
      expect(screen.getByText('Mechanic')).toBeInTheDocument();
    });

    const mechanicCard = screen.getByText('Mechanic');
    fireEvent.click(mechanicCard);

    expect(mockNavigate).toHaveBeenCalledWith('/search?category=mechanic');
  });

  it('renders How It Works section and Seller registration CTA banner', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/How AraKart Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Find & Filter/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare Transparent Prices/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect Instantly/i)).toBeInTheDocument();

    const registerSellerBtn = screen.getByRole('button', { name: /register as a service professional/i });
    expect(registerSellerBtn).toBeInTheDocument();
    fireEvent.click(registerSellerBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/register-seller');
  });
});
