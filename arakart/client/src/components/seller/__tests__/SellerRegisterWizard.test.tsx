import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SellerRegisterWizard } from '../SellerRegisterWizard';
import * as sellerService from '../../../services/sellerService';
import * as discoveryService from '../../../services/discoveryService';
import { useAuthStore } from '../../../store/authStore';

vi.mock('../../../services/sellerService', () => ({
  applySeller: vi.fn(),
}));

vi.mock('../../../services/discoveryService', () => ({
  fetchCategories: vi.fn(),
  fetchCityAreas: vi.fn(),
}));

const mockCategories = [
  { id: 'cat1', slug: 'electrician', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: 'zap' },
  { id: 'cat2', slug: 'plumber', nameEn: 'Plumber', nameHi: 'प्लंबर', icon: 'tool' },
];

const mockAreas = ['Nawada', 'Anaith', 'Zero Mile'];

describe('SellerRegisterWizard Component (FE-008)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(discoveryService.fetchCategories).mockResolvedValue(mockCategories);
    vi.mocked(discoveryService.fetchCityAreas).mockResolvedValue({
      city: 'Ara',
      slug: 'ara',
      areas: mockAreas,
    });
    useAuthStore.setState({
      user: { id: 'usr1', name: 'Alok Kumar', phone: '9876543210', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });
  });

  const renderWizard = () => {
    return render(
      <BrowserRouter>
        <SellerRegisterWizard />
      </BrowserRouter>
    );
  };

  it('renders Step 1 with user contact details pre-filled for authenticated customer', async () => {
    renderWizard();

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('9876543210').length).toBeGreaterThanOrEqual(1);
    });

    // Clicking Next moves to Step 2
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Business Name \(English\)/i)).toBeInTheDocument();
    });
  });

  it('allows adding and removing catalogue services in Step 3', async () => {
    renderWizard();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name \(English\)/i)).toBeInTheDocument();
    });

    // Fill Step 2
    fireEvent.change(screen.getByLabelText(/Business Name \(English\)/i), {
      target: { value: 'Shree Ram Electricals' },
    });
    // Select Category
    fireEvent.click(screen.getByText('Electrician'));
    // Select Area
    fireEvent.change(screen.getByLabelText(/Primary Locality/i), {
      target: { value: 'Nawada' },
    });

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Service/i)).toBeInTheDocument();
    });

    // Add service row
    const addBtn = screen.getByText(/Add Service/i);
    fireEvent.click(addBtn);

    // Verify service inputs appear
    expect(screen.getAllByPlaceholderText(/e\.g\. Fan Repair/i).length).toBeGreaterThanOrEqual(1);
  });

  it('submits application successfully and displays pending approval status', async () => {
    vi.mocked(sellerService.applySeller).mockResolvedValueOnce({
      id: 'prov_new',
      nameEn: 'Shree Ram Electricals',
      categories: ['electrician'],
      area: 'Nawada',
      areasServed: ['Nawada'],
      city: 'ara',
      phone: '9876543210',
      status: 'pending',
      isLive: false,
      verified: false,
      fromPrice: 150,
      services: [{ nameEn: 'Switchboard Repair', startingPrice: 150 }],
      photos: [],
      avgRating: 0,
      reviewCount: 0,
      profileViews: 0,
      callClicks: 0,
      whatsappClicks: 0,
    } as any);

    renderWizard();

    // Step 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2 inputs
    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name \(English\)/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Business Name \(English\)/i), {
      target: { value: 'Shree Ram Electricals' },
    });
    fireEvent.click(screen.getByText('Electrician'));
    fireEvent.change(screen.getByLabelText(/Primary Locality/i), {
      target: { value: 'Nawada' },
    });

    // Step 2 -> 3
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3 inputs
    await waitFor(() => {
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Fan Repair/i), {
      target: { value: 'Switchboard Repair' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Price/i), {
      target: { value: '150' },
    });

    // Step 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 4: Review & Submit
    await waitFor(() => {
      expect(screen.getByText(/Step 4 of 4/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

    await waitFor(() => {
      expect(sellerService.applySeller).toHaveBeenCalled();
      expect(screen.getByText(/Application Submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/Under Review/i)).toBeInTheDocument();
    });
  });
});
