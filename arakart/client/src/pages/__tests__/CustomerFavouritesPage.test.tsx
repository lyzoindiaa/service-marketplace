import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CustomerFavouritesPage } from '../CustomerFavouritesPage';
import * as userService from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import enTranslations from '../../locales/en/translation.json';
import hiTranslations from '../../locales/hi/translation.json';

vi.mock('../../services/userService', () => ({
  getFavourites: vi.fn(),
  addFavourite: vi.fn(),
  removeFavourite: vi.fn(),
  submitReport: vi.fn(),
}));

const mockFavouriteProviders = [
  {
    id: 'prov_fav_1',
    nameEn: 'Maa Tara Plumbers',
    categories: ['plumber'],
    area: 'Anaith',
    areasServed: ['Anaith', 'Nawada'],
    city: 'ara',
    phone: '9876543210',
    status: 'approved',
    isLive: true,
    verified: true,
    fromPrice: 150,
    services: [{ nameEn: 'Pipe Fitting', startingPrice: 150 }],
    avgRating: 4.8,
    reviewCount: 14,
    profileViews: 120,
    callClicks: 15,
    whatsappClicks: 8,
    photos: [],
  },
];

describe('CustomerFavouritesPage & i18n (FE-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'usr_cust', name: 'Alok Singh', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token_cust',
    });
  });

  const renderFavourites = () => {
    return render(
      <BrowserRouter>
        <CustomerFavouritesPage />
      </BrowserRouter>
    );
  };

  it('renders empty state when customer has no saved providers', async () => {
    vi.mocked(userService.getFavourites).mockResolvedValueOnce([]);

    renderFavourites();

    await waitFor(() => {
      expect(screen.getByText(/No Saved Providers/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /explore services/i })).toBeInTheDocument();
    });
  });

  it('renders list of saved provider cards when favourites exist', async () => {
    vi.mocked(userService.getFavourites).mockResolvedValueOnce(mockFavouriteProviders as any);

    renderFavourites();

    await waitFor(() => {
      expect(screen.getByText('Maa Tara Plumbers')).toBeInTheDocument();
      expect(screen.getByText('Anaith')).toBeInTheDocument();
    });
  });

  it('allows removing a provider from favourites', async () => {
    vi.mocked(userService.getFavourites).mockResolvedValueOnce(mockFavouriteProviders as any);
    vi.mocked(userService.removeFavourite).mockResolvedValueOnce({
      favourites: [],
      message: 'Removed from favourites',
    });

    renderFavourites();

    await waitFor(() => {
      expect(screen.getByText('Maa Tara Plumbers')).toBeInTheDocument();
    });

    const removeBtn = screen.getByTitle(/remove from favourites/i);
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(userService.removeFavourite).toHaveBeenCalledWith('prov_fav_1');
      expect(screen.getByText(/No Saved Providers/i)).toBeInTheDocument();
    });
  });

  it('verifies all English translation keys exist in Hindi translation dictionary', () => {
    const enKeys = Object.keys(enTranslations);
    const hiKeys = Object.keys(hiTranslations);

    expect(enKeys.length).toBeGreaterThan(0);
    expect(hiKeys.length).toBeGreaterThan(0);

    enKeys.forEach((key) => {
      expect(hiTranslations).toHaveProperty(key);
      expect((hiTranslations as any)[key]).toBeTruthy();
    });
  });
});
