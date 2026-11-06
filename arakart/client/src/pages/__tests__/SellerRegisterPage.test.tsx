import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SellerRegisterPage } from '../SellerRegisterPage';
import * as discoveryService from '../../services/discoveryService';

vi.mock('../../services/discoveryService', () => ({
  fetchCategories: vi.fn(),
  fetchCityAreas: vi.fn(),
}));

describe('SellerRegisterPage (FE-008)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(discoveryService.fetchCategories).mockResolvedValue([
      { id: 'cat1', slug: 'electrician', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: 'zap' },
    ]);
    vi.mocked(discoveryService.fetchCityAreas).mockResolvedValue({
      city: 'Ara',
      slug: 'ara',
      areas: ['Nawada', 'Anaith'],
    });
  });

  it('renders the seller registration page header and registration wizard', async () => {
    render(
      <BrowserRouter>
        <SellerRegisterPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Register Your Business in Ara/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    });
  });
});
