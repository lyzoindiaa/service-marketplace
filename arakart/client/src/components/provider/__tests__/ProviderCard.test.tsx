import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ProviderCard } from '../ProviderCard';
import { ProviderProfile } from '../../../services/providerService';
import * as leadService from '../../../services/leadService';
import { useAuthStore } from '../../../store/authStore';
import { useUiStore } from '../../../store/uiStore';

// Mock leadService
vi.mock('../../../services/leadService', () => ({
  createLead: vi.fn(),
}));

const mockProvider: ProviderProfile = {
  id: '507f1f77bcf86cd799439011',
  nameEn: 'Sharma Electricals & Repair',
  nameHi: 'शर्मा इलेक्ट्रिकल्स',
  categories: ['electrician'],
  area: 'Nawada',
  areasServed: ['Nawada', 'Anaith', 'Zero Mile'],
  city: 'ara',
  phone: '98765 XXXXX',
  whatsapp: '9876543210',
  bioEn: 'Expert electrician in Nawada, Ara with 8 years experience.',
  experience: 8,
  workingHours: '8:00 AM - 8:00 PM',
  isAllDay: false,
  services: [
    { id: '1', nameEn: 'Ceiling Fan Repair', startingPrice: 150 },
    { id: '2', nameEn: 'House Wiring Check', startingPrice: 350 },
  ],
  photos: [],
  avgRating: 4.8,
  reviewCount: 34,
  profileViews: 120,
  callClicks: 15,
  whatsappClicks: 8,
  status: 'approved',
  isLive: true,
  verified: true,
  fromPrice: 150,
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ProviderCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null });
    useUiStore.setState({ authModalOpen: false });
  });

  it('renders provider details: name, rating, starting price, and areas', () => {
    renderWithRouter(<ProviderCard provider={mockProvider} />);

    expect(screen.getByText('Sharma Electricals & Repair')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(34)')).toBeInTheDocument();
    expect(screen.getAllByText(/₹150/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Nawada/)).toBeInTheDocument();
    expect(screen.getByText(/8 yrs exp/i)).toBeInTheDocument();
    expect(screen.getByText('Ceiling Fan Repair')).toBeInTheDocument();
  });

  it('displays the Verified badge when provider.verified is true', () => {
    renderWithRouter(<ProviderCard provider={mockProvider} />);
    expect(screen.getByText(/Verified/i)).toBeInTheDocument();
  });

  it('opens login modal when unauthenticated guest clicks Call button', () => {
    renderWithRouter(<ProviderCard provider={mockProvider} />);

    const callButton = screen.getByRole('button', { name: /call/i });
    fireEvent.click(callButton);

    expect(useUiStore.getState().authModalOpen).toBe(true);
    expect(leadService.createLead).not.toHaveBeenCalled();
  });

  it('opens login modal when unauthenticated guest clicks WhatsApp button', () => {
    renderWithRouter(<ProviderCard provider={mockProvider} />);

    const waButton = screen.getByRole('button', { name: /whatsapp/i });
    fireEvent.click(waButton);

    expect(useUiStore.getState().authModalOpen).toBe(true);
    expect(leadService.createLead).not.toHaveBeenCalled();
  });

  it('opens login modal when unauthenticated guest clicks Favourite heart button', () => {
    renderWithRouter(<ProviderCard provider={mockProvider} />);

    const favButton = screen.getByRole('button', { name: /favourite/i });
    fireEvent.click(favButton);

    expect(useUiStore.getState().authModalOpen).toBe(true);
  });

  it('calls leadService.createLead and reveals unmasked phone when authenticated customer clicks Call', async () => {
    useAuthStore.setState({
      user: { id: 'cust1', name: 'Ravi Kumar', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    vi.mocked(leadService.createLead).mockResolvedValueOnce({
      unmaskedPhone: '9876543210',
      whatsapp: '9876543210',
      lead: {
        id: 'lead1',
        customer: 'cust1',
        provider: mockProvider.id,
        type: 'call',
        status: 'new',
        createdAt: new Date().toISOString(),
      },
    });

    renderWithRouter(<ProviderCard provider={mockProvider} />);

    const callButton = screen.getByRole('button', { name: /call/i });
    fireEvent.click(callButton);

    await waitFor(() => {
      expect(leadService.createLead).toHaveBeenCalledWith({
        providerId: mockProvider.id,
        type: 'call',
      });
    });

    // The unmasked phone should now be visible or linked
    await waitFor(() => {
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });
  });

  it('calls leadService.createLead and opens window when authenticated customer clicks WhatsApp', async () => {
    useAuthStore.setState({
      user: { id: 'cust1', name: 'Ravi Kumar', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    vi.mocked(leadService.createLead).mockResolvedValueOnce({
      unmaskedPhone: '9876543210',
      whatsapp: '9876543210',
      lead: {
        id: 'lead2',
        customer: 'cust1',
        provider: mockProvider.id,
        type: 'whatsapp',
        status: 'new',
        createdAt: new Date().toISOString(),
      },
    });

    renderWithRouter(<ProviderCard provider={mockProvider} />);

    const waButton = screen.getByRole('button', { name: /whatsapp/i });
    fireEvent.click(waButton);

    await waitFor(() => {
      expect(leadService.createLead).toHaveBeenCalledWith({
        providerId: mockProvider.id,
        type: 'whatsapp',
      });
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    windowOpenSpy.mockRestore();
  });

  it('triggers onToggleFavourite callback when authenticated customer clicks Favourite heart', () => {
    useAuthStore.setState({
      user: { id: 'cust1', name: 'Ravi Kumar', role: 'customer', authMethods: ['phone'] },
      isAuthenticated: true,
      accessToken: 'token123',
    });

    const onToggleMock = vi.fn();
    renderWithRouter(<ProviderCard provider={mockProvider} isFavourite={false} onToggleFavourite={onToggleMock} />);

    const favButton = screen.getByRole('button', { name: /favourite/i });
    fireEvent.click(favButton);

    expect(onToggleMock).toHaveBeenCalledWith(mockProvider.id);
  });
});
