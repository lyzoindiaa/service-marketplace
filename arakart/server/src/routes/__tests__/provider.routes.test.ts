import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { makeUser, makeProvider } from '../../tests/fixtures';

setupTestDB();

describe('Provider Search & Profile Routes (BE-007)', () => {
  let sellerUser: any;

  beforeEach(async () => {
    sellerUser = await makeUser({ role: 'seller' });
  });

  describe('GET /api/v1/providers — Search, Filters & Pagination', () => {
    it('returns paginated list of approved, live providers with masked phone numbers', async () => {
      // Live & approved provider
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Verma Electricals',
        phone: '9876543210',
        status: 'approved',
        isLive: true,
      });

      // Pending provider (should be excluded)
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Draft Seller',
        status: 'pending',
        isLive: false,
      });

      const res = await request(app).get('/api/v1/providers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providers.length).toBe(1);
      expect(res.body.data.providers[0].nameEn).toBe('Verma Electricals');
      expect(res.body.data.providers[0].phone).toBe('98765 XXXXX'); // Masked!
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        pages: 1,
      });
    });

    it('filters providers by category', async () => {
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Patna Electrician',
        categories: ['electrician'],
        status: 'approved',
        isLive: true,
      });

      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Ara Plumber',
        categories: ['plumber'],
        status: 'approved',
        isLive: true,
      });

      const res = await request(app).get('/api/v1/providers?category=electrician');

      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBe(1);
      expect(res.body.data.providers[0].nameEn).toBe('Patna Electrician');
    });

    it('filters providers by area (primary area or areasServed)', async () => {
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Nawada Specialist',
        area: 'Nawada',
        areasServed: ['Katira'],
        status: 'approved',
        isLive: true,
      });

      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Anaith Specialist',
        area: 'Anaith',
        areasServed: ['Gopali Chowk'],
        status: 'approved',
        isLive: true,
      });

      const res = await request(app).get('/api/v1/providers?area=Nawada');

      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBe(1);
      expect(res.body.data.providers[0].nameEn).toBe('Nawada Specialist');

      // Test matching via areasServed
      const resServed = await request(app).get('/api/v1/providers?area=Katira');
      expect(resServed.status).toBe(200);
      expect(resServed.body.data.providers.length).toBe(1);
      expect(resServed.body.data.providers[0].nameEn).toBe('Nawada Specialist');
    });

    it('filters providers by minimum rating and verifiedOnly', async () => {
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Top Rated Verified Pro',
        avgRating: 4.8,
        verified: true,
        status: 'approved',
        isLive: true,
      });

      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Low Rated Pro',
        avgRating: 3.2,
        verified: false,
        status: 'approved',
        isLive: true,
      });

      // Filter minRating=4
      const resRating = await request(app).get('/api/v1/providers?minRating=4');
      expect(resRating.status).toBe(200);
      expect(resRating.body.data.providers.length).toBe(1);
      expect(resRating.body.data.providers[0].nameEn).toBe('Top Rated Verified Pro');

      // Filter verifiedOnly=true
      const resVerified = await request(app).get('/api/v1/providers?verifiedOnly=true');
      expect(resVerified.status).toBe(200);
      expect(resVerified.body.data.providers.length).toBe(1);
      expect(resVerified.body.data.providers[0].nameEn).toBe('Top Rated Verified Pro');
    });

    it('performs full-text keyword search across provider name, bio and services', async () => {
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Sharma AC Repair Centre',
        bioEn: 'Best cooling solutions in Bhojpur',
        status: 'approved',
        isLive: true,
      });

      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Gupta Home Painting',
        bioEn: 'Wall putty and painting',
        status: 'approved',
        isLive: true,
      });

      const res = await request(app).get('/api/v1/providers?q=Sharma');
      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBe(1);
      expect(res.body.data.providers[0].nameEn).toBe('Sharma AC Repair Centre');
    });

    it('sorts providers by price ascending', async () => {
      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Budget Electrician',
        services: [{ nameEn: 'Basic Inspection', startingPrice: 150 }],
        status: 'approved',
        isLive: true,
      });

      await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Premium Electrician',
        services: [{ nameEn: 'Comprehensive Work', startingPrice: 500 }],
        status: 'approved',
        isLive: true,
      });

      const res = await request(app).get('/api/v1/providers?sort=price');
      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBe(2);
      expect(res.body.data.providers[0].nameEn).toBe('Budget Electrician');
      expect(res.body.data.providers[1].nameEn).toBe('Premium Electrician');
    });

    it('paginates results accurately', async () => {
      for (let i = 1; i <= 5; i++) {
        await makeProvider({
          owner: sellerUser._id,
          nameEn: `Provider #${i}`,
          phone: `980000000${i}`,
          status: 'approved',
          isLive: true,
        });
      }

      const res = await request(app).get('/api/v1/providers?page=2&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBe(2);
      expect(res.body.data.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        pages: 3,
      });
    });
  });

  describe('GET /api/v1/providers/:id — Single Profile & View Increment', () => {
    it('returns full provider profile and atomically increments profileViews', async () => {
      const provider = await makeProvider({
        owner: sellerUser._id,
        nameEn: 'Mahesh Carpenters',
        phone: '9876543210',
        profileViews: 10,
        status: 'approved',
        isLive: true,
      });

      const res = await request(app).get(`/api/v1/providers/${provider._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nameEn).toBe('Mahesh Carpenters');
      expect(res.body.data.phone).toBe('98765 XXXXX'); // Masked

      // Verify atomic increment in database
      const inDb = await Provider.findById(provider._id);
      expect(inDb?.profileViews).toBe(11);
    });

    it('returns 404 for non-existent provider ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/providers/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/provider not found/i);
    });

    it('returns 400 bad request for malformed ObjectId', async () => {
      const res = await request(app).get('/api/v1/providers/invalid-mongo-id');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid provider id/i);
    });
  });
});
