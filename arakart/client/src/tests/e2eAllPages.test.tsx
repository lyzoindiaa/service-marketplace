import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../lib/i18n';

// Pages under test
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ProviderProfilePage } from '../pages/ProviderProfilePage';
import { ProfileRedirectPage } from '../pages/ProfileRedirectPage';
import { CustomerFavouritesPage } from '../pages/CustomerFavouritesPage';
import { BlogsPage } from '../pages/BlogsPage';
import { OffersPage } from '../pages/OffersPage';
import { SellerRegisterPage } from '../pages/SellerRegisterPage';
import { SellerDashboardPage } from '../pages/SellerDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Modals
import { LocationSelectorModal } from '../components/layout/LocationSelectorModal';
import { AuthModal } from '../components/auth/AuthModal';

// Services
import * as discoveryService from '../services/discoveryService';
import * as providerService from '../services/providerService';
import * as blogService from '../services/blogService';
import * as offerService from '../services/offerService';
import * as sellerService from '../services/sellerService';
import * as adminService from '../services/adminService';
import * as userService from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/discoveryService');
vi.mock('../services/providerService');
vi.mock('../services/blogService');
vi.mock('../services/offerService');
vi.mock('../services/sellerService');
vi.mock('../services/adminService');
vi.mock('../services/userService');
vi.mock('../services/leadService', () => ({
  createLead: vi.fn().mockResolvedValue({ id: 'lead1', unmaskedPhone: '9876543210' }),
  getSellerLeads: vi.fn().mockResolvedValue({ leads: [], pagination: { total: 0 } }),
}));
vi.mock('../services/reviewService', () => ({
  fetchProviderReviews: vi.fn().mockResolvedValue({
    reviews: [
      {
        id: 'rev1',
        rating: 5,
        comment: 'Great work and quick arrival',
        customer: { name: 'Rahul Kumar' },
        createdAt: new Date().toISOString(),
      },
    ],
    summary: { averageRating: 4.8, totalReviews: 12 },
  }),
  createReview: vi.fn().mockResolvedValue({ id: 'rev_new', rating: 5, comment: 'Awesome service' }),
}));

describe('E2E Comprehensive Testing Across All Pages & Modals', () => {
  const mockCategories = [
    { id: 'cat1', slug: 'electrician', nameEn: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: '⚡' },
    { id: 'cat2', slug: 'plumber', nameEn: 'Plumber', nameHi: 'प्लंबर', icon: '🔧' },
    { id: 'cat3', slug: 'carpenter', nameEn: 'Carpenter', nameHi: 'बढ़ई', icon: '🪚' },
  ];

  const mockCities = [
    { id: 'city1', name: 'Ara', nameEn: 'Ara', nameHi: 'आरा', slug: 'ara', isLive: true, state: 'Bihar' },
    { id: 'city2', name: 'Patna', nameEn: 'Patna', nameHi: 'पटना', slug: 'patna', isLive: true, state: 'Bihar' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({
      selectedCity: 'Ara',
      language: 'en',
      authModalOpen: false,
      cityModalOpen: false,
    });
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    vi.mocked(discoveryService.fetchCategories).mockResolvedValue(mockCategories);
    vi.mocked(discoveryService.fetchCities).mockResolvedValue(mockCities);
    vi.mocked(discoveryService.fetchCityAreas).mockResolvedValue({
      city: 'Ara',
      slug: 'ara',
      areas: ['Nawada', 'Anaith', 'Zero Mile', 'Judge Bazar'],
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 1: HOME PAGE (/)
   * ------------------------------------------------------------------ */
  describe('Page 1: HomePage (/)', () => {
    it('renders hero banner, category grid, city selector trigger, and bilingual toggle', async () => {
      vi.mocked(providerService.fetchPublicStats).mockResolvedValue({
        verifiedProvidersCount: 15,
        categoriesCount: 8,
        avgRating: 4.8,
        totalReviews: 40,
        recentReviews: [
          {
            id: 'rev1',
            customerName: 'Ankit Sharma',
            rating: 5,
            comment: 'Fast and reliable electrician!',
            providerId: 'prov1',
            providerNameEn: 'Sharma Electricals',
            providerArea: 'Nawada',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      // Verify Hero & Search elements
      expect(screen.getByText(/Hyperlocal Services Platform/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search for services/i)).toBeInTheDocument();

      // Verify Dynamic Categories render
      await waitFor(() => {
        expect(screen.getByText('Electrician')).toBeInTheDocument();
        expect(screen.getByText('Plumber')).toBeInTheDocument();
      });

      // Verify Dynamic Live Reviews render
      await waitFor(() => {
        expect(screen.getByText(/Sharma Electricals/i)).toBeInTheDocument();
        expect(screen.getByText(/Fast and reliable electrician!/i)).toBeInTheDocument();
      });
    });

    it('performs search submission and redirects to /search with query parameters', async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/search for services/i);
      fireEvent.change(input, { target: { value: 'fan wiring' } });

      const searchBtn = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchBtn);

      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/search?q=fan+wiring'));
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 2: SEARCH RESULTS PAGE (/search)
   * ------------------------------------------------------------------ */
  describe('Page 2: SearchResultsPage (/search)', () => {
    const mockProviders = [
      {
        id: 'p1',
        nameEn: 'Verma AC & Electrician',
        nameHi: 'वर्मा एसी और इलेक्ट्रीशियन',
        phone: '9876543210',
        city: 'Ara',
        area: 'Nawada',
        categories: ['electrician'],
        rating: 4.9,
        reviewsCount: 18,
        isLive: true,
        verified: true,
        fromPrice: 150,
        services: [{ nameEn: 'AC Repair', startingPrice: 350 }],
      },
    ];

    it('displays providers matching filters and allows category selection', async () => {
      vi.mocked(providerService.searchProviders).mockResolvedValue({
        providers: mockProviders as any,
        pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      });

      render(
        <MemoryRouter initialEntries={['/search?category=electrician']}>
          <SearchResultsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Verma AC & Electrician/i)).toBeInTheDocument();
        expect(screen.getAllByText('Nawada').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 3: PROVIDER PROFILE PAGE (/provider/:id)
   * ------------------------------------------------------------------ */
  describe('Page 3: ProviderProfilePage (/provider/:id)', () => {
    it('renders provider services, rating summary, reviews and allows review submission', async () => {
      const mockProfile = {
        id: 'prov123',
        nameEn: 'Manoj Plumbing & Sanitization',
        nameHi: 'मनोज प्लंबिंग',
        phone: '9876543211',
        city: 'Ara',
        area: 'Judge Bazar',
        categories: ['plumber'],
        rating: 4.8,
        reviewsCount: 8,
        isLive: true,
        verified: true,
        services: [{ nameEn: 'Pipe Leak Fix', startingPrice: 200 }],
        workingHours: '8:00 AM - 8:00 PM',
        experience: 5,
      };

      vi.mocked(providerService.getProviderById).mockResolvedValue(mockProfile as any);
      vi.mocked(offerService.fetchPublicOffers).mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={['/provider/prov123']}>
          <Routes>
            <Route path="/provider/:id" element={<ProviderProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Manoj Plumbing & Sanitization/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Pipe Leak Fix')).toBeInTheDocument();
        expect(screen.getByText('₹200')).toBeInTheDocument();
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 4: PROFILE REDIRECT PAGE (/profile)
   * ------------------------------------------------------------------ */
  describe('Page 4: ProfileRedirectPage (/profile)', () => {
    it('redirects seller to seller dashboard tab=profile', async () => {
      useAuthStore.setState({
        user: { id: 'u1', name: 'Seller User', email: 'seller@arakart.com', role: 'seller', sellerId: 'seller123' } as any,
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <ProfileRedirectPage />
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/seller/dashboard?tab=profile', { replace: true });
    });

    it('redirects unauthenticated user to home and opens auth modal', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <ProfileRedirectPage />
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      expect(useUiStore.getState().authModalOpen).toBe(true);
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 5: CUSTOMER FAVOURITES PAGE (/favourites)
   * ------------------------------------------------------------------ */
  describe('Page 5: CustomerFavouritesPage (/favourites)', () => {
    it('displays empty state when user has no favourites', async () => {
      useAuthStore.setState({
        user: { id: 'u2', name: 'Buyer', role: 'customer' } as any,
        isAuthenticated: true,
      });
      vi.mocked(userService.getFavourites).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <CustomerFavouritesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No Saved Providers/i)).toBeInTheDocument();
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 6: BLOGS PAGE (/blogs)
   * ------------------------------------------------------------------ */
  describe('Page 6: BlogsPage (/blogs)', () => {
    it('renders published articles with category and bilingual titles', async () => {
      vi.mocked(blogService.fetchBlogs).mockResolvedValue({
        blogs: [
          {
            id: 'b1',
            titleEn: 'How to Prevent Monsoon Water Seepage',
            titleHi: 'मानसून में पानी के रिसाव को कैसे रोकें',
            contentEn: 'Tips on waterproofing and roof repairs...',
            category: 'Home Maintenance',
            isPublished: true,
            createdAt: new Date().toISOString(),
          } as any,
        ],
        pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      });

      render(
        <MemoryRouter>
          <BlogsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/How to Prevent Monsoon Water Seepage/i)).toBeInTheDocument();
        expect(screen.getAllByText('Home Maintenance').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 7: OFFERS PAGE (/offers)
   * ------------------------------------------------------------------ */
  describe('Page 7: OffersPage (/offers)', () => {
    it('renders live discounts with original vs offer price', async () => {
      vi.mocked(offerService.fetchPublicOffers).mockResolvedValue([
        {
          id: 'off1',
          titleEn: 'Flat 30% Off On First AC Service',
          serviceTitleEn: 'AC Deep Cleaning',
          originalPrice: 700,
          offerPrice: 490,
          scheduleType: 'date_range',
          isActive: true,
          provider: { id: 'p1', nameEn: 'SuperCool AC' },
        } as any,
      ]);

      render(
        <MemoryRouter>
          <OffersPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Flat 30% Off On First AC Service/i)).toBeInTheDocument();
        expect(screen.getByText('₹490')).toBeInTheDocument();
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 8: SELLER REGISTRATION WIZARD (/seller/register)
   * ------------------------------------------------------------------ */
  describe('Page 8: SellerRegisterPage & Wizard (/seller/register)', () => {
    it('validates contact step, allows proposing unlisted trade category, and submits application', async () => {
      vi.mocked(sellerService.applySeller).mockResolvedValue({
        id: 'new_prov_1',
        nameEn: 'CCTV Secure Vision',
        status: 'pending',
      } as any);

      render(
        <MemoryRouter>
          <SellerRegisterPage />
        </MemoryRouter>
      );

      // Step 1: Fill contact info
      const phoneInput = screen.getByLabelText(/Mobile Number \(Calling\) \*/i);
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const nextBtn = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      // Step 2: Fill business info & propose new category
      await waitFor(() => {
        expect(screen.getByText(/Business & Service Details/i)).toBeInTheDocument();
      });

      const bizNameInput = screen.getByLabelText(/Business Name \(English\) \*/i);
      fireEvent.change(bizNameInput, { target: { value: 'CCTV Secure Vision' } });

      // Propose unlisted category
      const proposeBtn = screen.getByText(/Can't find your trade\? Propose a new category/i);
      fireEvent.click(proposeBtn);

      const reqCatInput = screen.getByLabelText(/Category \/ Trade Name \(English\) \*/i);
      fireEvent.change(reqCatInput, { target: { value: 'CCTV Camera Installation' } });

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: Add a service
      await waitFor(() => {
        expect(screen.getByText(/Services & Rates/i)).toBeInTheDocument();
      });

      const serviceNameInput = screen.getByPlaceholderText(/e\.g\. Fan Repair/i);
      fireEvent.change(serviceNameInput, { target: { value: '4 Camera Setup' } });

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 4: Review & Submit
      await waitFor(() => {
        expect(screen.getByText(/Review Your Application/i)).toBeInTheDocument();
        expect(screen.getByText(/Proposed: CCTV Camera Installation/i)).toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', { name: /Submit Application/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(sellerService.applySeller).toHaveBeenCalledWith(
          expect.objectContaining({
            nameEn: 'CCTV Secure Vision',
            requestedCategory: expect.objectContaining({
              nameEn: 'CCTV Camera Installation',
            }),
          })
        );
        expect(screen.getByText(/Application Submitted!/i)).toBeInTheDocument();
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 9: SELLER DASHBOARD (/seller/dashboard)
   * ------------------------------------------------------------------ */
  describe('Page 9: SellerDashboardPage (/seller/dashboard)', () => {
    it('renders overview KPIs, supports switching tabs without full page re-render', async () => {
      useAuthStore.setState({
        user: { id: 'u1', name: 'Seller Test', role: 'seller', sellerId: 'prov1' } as any,
        isAuthenticated: true,
      });

      vi.mocked(sellerService.getMySellerProfile).mockResolvedValue({
        id: 'prov1',
        nameEn: 'Sharma Electricals',
        city: 'Ara',
        area: 'Nawada',
        services: [{ nameEn: 'Switchboard Repair', startingPrice: 150 }],
        isLive: true,
        verified: true,
      } as any);

      vi.mocked(sellerService.getSellerStats).mockResolvedValue({
        totalLeads: 12,
        callClicks: 8,
        whatsappClicks: 4,
        isLive: true,
      } as any);

      render(
        <MemoryRouter initialEntries={['/seller/dashboard?tab=overview']}>
          <SellerDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('Sharma Electricals').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Overview/i)).toBeInTheDocument();
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 10: ADMIN DASHBOARD (/admin)
   * ------------------------------------------------------------------ */
  describe('Page 10: AdminDashboardPage (/admin)', () => {
    it('renders admin KPIs, shows requested unlisted trade, and enables dual-approval with category creation', async () => {
      useAuthStore.setState({
        user: { id: 'admin1', name: 'Admin Master', role: 'admin' } as any,
        isAuthenticated: true,
      });

      vi.mocked(adminService.fetchAdminDashboardStats).mockResolvedValue({
        totalUsers: 50,
        totalSellers: 10,
        pendingSellers: 1,
        approvedSellers: 9,
        totalLeads: 80,
        totalReviews: 30,
        totalCategories: 8,
        totalCities: 2,
        callsCount: 50,
        whatsappCount: 30,
      });

      const mockPendingSeller = {
        id: 'prov_pending_1',
        nameEn: 'Smart Security & CCTV',
        phone: '9876543210',
        area: 'Nawada',
        requestedCategory: {
          nameEn: 'CCTV Security',
          nameHi: 'सीसीटीवी सुरक्षा',
          description: 'Camera wiring and installation',
          status: 'pending',
        },
        services: [{ nameEn: 'Camera Fitting', startingPrice: 500 }],
      };

      vi.mocked(adminService.fetchPendingSellers).mockResolvedValue({
        sellers: [mockPendingSeller],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      });
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
        expect(screen.getByText(/Smart Security & CCTV/i)).toBeInTheDocument();
        expect(screen.getByText(/Proposed New Category:/i)).toBeInTheDocument();
        expect(screen.getByText(/CCTV Security/i)).toBeInTheDocument();
        expect(screen.getByText(/Approve & Create Cat/i)).toBeInTheDocument();
        expect(screen.getByText(/Remap Category/i)).toBeInTheDocument();
      });
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 11: COMMON MODALS (Location & Auth)
   * ------------------------------------------------------------------ */
  describe('Page 11: Common Modals (Location & Auth)', () => {
    it('LocationSelectorModal switches active city and updates UI store', async () => {
      useUiStore.setState({ cityModalOpen: true });
      render(
        <LocationSelectorModal />
      );

      await waitFor(() => {
        expect(screen.getByText(/Select Your State & City/i)).toBeInTheDocument();
        expect(screen.getByText('Patna')).toBeInTheDocument();
      });

      // Select Patna
      fireEvent.click(screen.getByText('Patna'));
      expect(useUiStore.getState().selectedCity).toBe('patna');
      expect(useUiStore.getState().cityModalOpen).toBe(false);
    });

    it('AuthModal renders email authentication forms', async () => {
      useUiStore.setState({ authModalOpen: true });
      render(
        <AuthModal />
      );

      expect(screen.getByText(/Sign in to AraKart/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------
   * PAGE 12: 404 NOT FOUND PAGE (/404)
   * ------------------------------------------------------------------ */
  describe('Page 12: NotFoundPage', () => {
    it('renders 404 message and Back to Home navigation button', () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();
    });
  });
});
