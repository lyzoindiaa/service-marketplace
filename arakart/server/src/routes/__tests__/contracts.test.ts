import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import {
  makeUser,
  makeProvider,
  makeCategory,
  makeCity,
} from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Search & Profile Data Contract Verification (INT-004)', () => {
  let sellerUser: any;
  let customerUser: any;
  let testProvider: any;
  let testCategory: any;
  let testCity: any;

  beforeEach(async () => {
    sellerUser = await makeUser({ role: 'seller' });
    customerUser = await makeUser({ role: 'customer' });

    testCategory = await makeCategory({
      slug: 'electrician',
      nameEn: 'Electrician',
      nameHi: 'इलेक्ट्रीशियन',
      icon: 'zap',
      enabled: true,
    });

    testCity = await makeCity({
      nameEn: 'Ara',
      nameHi: 'आरा',
      slug: 'ara',
      isLive: true,
    });

    testProvider = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Gupta Electrical Works',
      nameHi: 'गुप्ता इलेक्ट्रिकल वर्क्स',
      categories: ['electrician'],
      area: 'Nawada',
      areasServed: ['Nawada', 'Anaith', 'Zero Mile'],
      city: 'ara',
      phone: '9876543210',
      whatsapp: '9876543210',
      bioEn: 'Residential and commercial wiring repair and fitting in Ara.',
      experience: 7,
      workingHours: '8:00 AM - 8:00 PM',
      isAllDay: false,
      services: [
        { nameEn: 'Switchboard Repair', nameHi: 'स्विचबोर्ड रिपेयर', startingPrice: 150 },
        { nameEn: 'Inverter Installation', nameHi: 'इन्वर्टर इंस्टॉलेशन', startingPrice: 450 },
      ],
      photos: ['https://example.com/photo1.jpg'],
      avgRating: 4.8,
      reviewCount: 22,
      profileViews: 140,
      callClicks: 18,
      whatsappClicks: 12,
      status: 'approved',
      isLive: true,
      verified: true,
    });
  });

  describe('Contract: GET /api/v1/providers', () => {
    it('strictly satisfies ProviderSearchResponse contract', async () => {
      const res = await request(app).get('/api/v1/providers?category=electrician&city=ara');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toHaveProperty('providers');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.providers)).toBe(true);
      expect(data.providers.length).toBeGreaterThan(0);

      // Verify pagination contract
      expect(data.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        pages: expect.any(Number),
      });

      // Verify Provider item contract
      const provider = data.providers[0];
      expect(provider).toMatchObject({
        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
        nameEn: expect.any(String),
        categories: expect.any(Array),
        area: expect.any(String),
        areasServed: expect.any(Array),
        city: expect.any(String),
        phone: expect.stringMatching(/^\d{5} XXXXX$/), // Must be masked
        workingHours: expect.any(String),
        isAllDay: expect.any(Boolean),
        services: expect.any(Array),
        photos: expect.any(Array),
        avgRating: expect.any(Number),
        reviewCount: expect.any(Number),
        profileViews: expect.any(Number),
        callClicks: expect.any(Number),
        whatsappClicks: expect.any(Number),
        status: expect.any(String),
        isLive: expect.any(Boolean),
        verified: expect.any(Boolean),
        fromPrice: expect.any(Number),
      });

      // Sensitive fields must NOT exist
      expect(provider).not.toHaveProperty('__v');
      expect(provider).not.toHaveProperty('passwordHash');
      expect(provider).not.toHaveProperty('codeHash');
    });
  });

  describe('Contract: GET /api/v1/providers/:id', () => {
    it('strictly satisfies ProviderProfile contract with masked phone', async () => {
      const res = await request(app).get(`/api/v1/providers/${testProvider._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const provider = res.body.data;
      expect(provider.id).toBe(testProvider._id.toString());
      expect(provider.nameEn).toBe('Gupta Electrical Works');
      expect(provider.phone).toBe('98765 XXXXX'); // Masked for public
      expect(provider.fromPrice).toBe(150); // Minimum service price derived
      expect(provider.services.length).toBe(2);
      expect(provider.services[0]).toMatchObject({
        nameEn: 'Switchboard Repair',
        startingPrice: 150,
      });
      expect(provider.verified).toBe(true);
      expect(provider.profileViews).toBe(141); // Profile view atomically incremented
    });
  });

  describe('Contract: GET /api/v1/categories', () => {
    it('strictly satisfies Category[] contract', async () => {
      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const cat = res.body.data.find((c: any) => c.slug === 'electrician');
      expect(cat).toBeDefined();
      expect(cat).toMatchObject({
        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
        slug: 'electrician',
        nameEn: 'Electrician',
        nameHi: 'इलेक्ट्रीशियन',
        icon: 'zap',
        enabled: true,
      });
      expect(cat).not.toHaveProperty('__v');
    });
  });

  describe('Contract: GET /api/v1/cities', () => {
    it('strictly satisfies City[] contract', async () => {
      const res = await request(app).get('/api/v1/cities');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const city = res.body.data.find((c: any) => c.slug === 'ara');
      expect(city).toBeDefined();
      expect(city).toMatchObject({
        id: expect.stringMatching(/^[0-9a-fA-F]{24}$/),
        nameEn: 'Ara',
        nameHi: 'आरा',
        slug: 'ara',
        isLive: true,
      });
      expect(city).not.toHaveProperty('__v');
    });
  });

  describe('Contract: GET /api/v1/cities/:slug/areas', () => {
    it('strictly satisfies CityAreasResponse contract with dynamic aggregated localities', async () => {
      const res = await request(app).get('/api/v1/cities/ara/areas');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        city: 'Ara',
        slug: 'ara',
        areas: expect.any(Array),
      });

      // Should include Nawada, Anaith, Zero Mile from testProvider
      expect(res.body.data.areas).toContain('Nawada');
      expect(res.body.data.areas).toContain('Anaith');
      expect(res.body.data.areas).toContain('Zero Mile');
    });
  });

  describe('Contract: GET /api/v1/users/me/favourites', () => {
    it('satisfies Favourites contract with populated masked provider profiles', async () => {
      // Add testProvider to customer favourites
      await request(app)
        .post(`/api/v1/users/me/favourites/${testProvider._id}`)
        .set(authHeaderFor(customerUser));

      const res = await request(app)
        .get('/api/v1/users/me/favourites')
        .set(authHeaderFor(customerUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);

      const fav = res.body.data[0];
      expect(fav.id).toBe(testProvider._id.toString());
      expect(fav.phone).toBe('98765 XXXXX'); // Masked!
    });
  });
});
