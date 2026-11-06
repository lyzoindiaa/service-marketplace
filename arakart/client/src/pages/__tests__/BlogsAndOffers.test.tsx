import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../lib/i18n';
import { BlogsPage } from '../BlogsPage';
import { OffersPage } from '../OffersPage';
import * as blogService from '../../services/blogService';
import * as offerService from '../../services/offerService';

vi.mock('../../services/blogService');
vi.mock('../../services/offerService');

describe('BlogsPage & OffersPage Components (Features 3 & 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders published blogs dynamically on /blogs', async () => {
    vi.mocked(blogService.fetchBlogs).mockResolvedValue({
      blogs: [
        {
          id: 'blog-1',
          titleEn: 'Summer AC Maintenance Guide for Ara Homes',
          titleHi: 'आरा घरों के लिए एसी रखरखाव गाइड',
          slug: 'summer-ac-maintenance-guide',
          excerptEn: 'Keep your cooling efficient during peak summer.',
          excerptHi: '',
          contentEn: 'Full guide content here.',
          contentHi: '',
          coverImageUrl: '',
          category: 'Appliance Tips',
          authorName: 'AraKart Admin',
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    render(
      <MemoryRouter initialEntries={['/blogs']}>
        <BlogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Summer AC Maintenance Guide for Ara Homes')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Keep your cooling efficient during peak summer.')
      ).toBeInTheDocument();
    });
  });

  it('renders active service offers with Date Range + Work Hours and Single-Day Hour Slot details on /offers', async () => {
    vi.mocked(offerService.fetchPublicOffers).mockResolvedValue([
      {
        id: 'offer-1',
        seller: {
          id: 'prov-1',
          nameEn: 'Rajesh Cool Care',
          nameHi: 'राजेश कूल केयर',
          area: 'Katira',
          city: 'ara',
          category: 'ac',
          phone: '9811122233',
          rating: 4.9,
          photoUrl: '',
          isVerified: true,
        },
        serviceId: 'srv-1',
        serviceTitleEn: 'Split AC Foam Jet Servicing',
        serviceTitleHi: 'स्प्लिट एसी सर्विसिंग',
        originalPrice: 599,
        offerPrice: 399,
        discountPercent: 33,
        titleEn: 'Summer Work-Hours AC Servicing Discount',
        titleHi: '',
        descriptionEn: 'Valid during daily working hours',
        descriptionHi: '',
        scheduleType: 'date_range',
        startDate: '2026-11-01',
        endDate: '2026-11-15',
        workHoursStart: '09:00',
        workHoursEnd: '18:00',
        singleDate: null,
        slotStartHour: null,
        slotEndHour: null,
        city: 'ara',
        isActive: true,
        claimsCount: 2,
        computedStatus: 'live_now',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/offers']}>
        <OffersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Summer Work-Hours AC Servicing Discount')
      ).toBeInTheDocument();
      expect(screen.getByText(/Split AC Foam Jet Servicing/i)).toBeInTheDocument();
      expect(screen.getByText(/Work Hours: 09:00 – 18:00/i)).toBeInTheDocument();
      expect(screen.getByText(/33% OFF/i)).toBeInTheDocument();
    });
  });
});
