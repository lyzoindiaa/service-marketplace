import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { User } from '../../models/User.model';
import {
  makeUser,
  makeProvider,
} from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Seller Application & Dashboard Routes (BE-010)', () => {
  let customerUser: any;
  let sellerUser: any;
  let pendingSellerUser: any;
  let approvedProvider: any;
  let pendingProvider: any;

  beforeEach(async () => {
    customerUser = await makeUser({ role: 'customer', name: 'Alok Singh', phone: '9800011122' });

    sellerUser = await makeUser({ role: 'seller', name: 'Ramesh Mistri' });
    approvedProvider = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Ramesh Plumbing Works',
      categories: ['plumber'],
      area: 'Nawada',
      areasServed: ['Nawada', 'Anaith'],
      phone: '9812345678',
      status: 'approved',
      isLive: true,
      fromPrice: 200,
      services: [{ nameEn: 'Pipe repair', startingPrice: 200 }],
    });
    sellerUser.sellerId = approvedProvider._id;
    await sellerUser.save();

    pendingSellerUser = await makeUser({ role: 'seller', name: 'Kamal Electric' });
    pendingProvider = await makeProvider({
      owner: pendingSellerUser._id,
      nameEn: 'Kamal Electric & Wiring',
      status: 'pending',
      isLive: false,
    });
    pendingSellerUser.sellerId = pendingProvider._id;
    await pendingSellerUser.save();
  });

  describe('POST /api/v1/sellers/apply — Seller Registration', () => {
    it('creates a pending provider application and upgrades user role to seller', async () => {
      const applyPayload = {
        nameEn: 'Bhojpur AC Solution',
        nameHi: 'भोजपुर एसी सॉल्यूशन',
        categories: ['ac-repair'],
        area: 'Gopali Chowk',
        areasServed: ['Gopali Chowk', 'Judge Bazar'],
        phone: '9876501234',
        whatsapp: '9876501234',
        bioEn: 'Complete split and window AC repair in Ara.',
        experience: 6,
        workingHours: '9:00 AM - 8:00 PM',
        isAllDay: false,
        services: [
          { nameEn: 'AC Service', startingPrice: 399 },
          { nameEn: 'Gas Refill', startingPrice: 1200 },
        ],
      };

      const res = await request(app)
        .post('/api/v1/sellers/apply')
        .set(authHeaderFor(customerUser))
        .send(applyPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nameEn).toBe('Bhojpur AC Solution');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.isLive).toBe(false);
      expect(res.body.data.fromPrice).toBe(399);

      // Verify user document updated in DB
      const updatedUser = await User.findById(customerUser._id);
      expect(updatedUser?.role).toBe('seller');
      expect(updatedUser?.sellerId).toEqual(new mongoose.Types.ObjectId(res.body.data.id));
    });

    it('returns 400 when required fields (name, categories, services) are missing', async () => {
      const res = await request(app)
        .post('/api/v1/sellers/apply')
        .set(authHeaderFor(customerUser))
        .send({
          nameEn: '',
          categories: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/sellers/apply')
        .send({ nameEn: 'Unauthorized Service' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/sellers/me — Get Seller Profile', () => {
    it('returns own provider profile with unmasked phone and details', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me')
        .set(authHeaderFor(sellerUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(approvedProvider._id.toString());
      expect(res.body.data.phone).toBe('9812345678'); // Unmasked for the owner!
      expect(res.body.data.nameEn).toBe('Ramesh Plumbing Works');
    });

    it('returns 404 if user has no provider profile', async () => {
      const newUser = await makeUser({ role: 'seller' });
      const res = await request(app)
        .get('/api/v1/sellers/me')
        .set(authHeaderFor(newUser));

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/no provider profile found/i);
    });
  });

  describe('PUT /api/v1/sellers/me/catalogue — Update Catalogue & fromPrice', () => {
    it('replaces services catalogue and automatically recalculates fromPrice', async () => {
      const newServices = [
        { nameEn: 'Bathroom Pipe Leak Fix', startingPrice: 250 },
        { nameEn: 'Tap Replacement', startingPrice: 150 },
        { nameEn: 'Complete Drainage Cleaning', startingPrice: 600 },
      ];

      const res = await request(app)
        .put('/api/v1/sellers/me/catalogue')
        .set(authHeaderFor(sellerUser))
        .send({ services: newServices });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.services.length).toBe(3);
      expect(res.body.data.fromPrice).toBe(150); // derived minimum!
    });
  });

  describe('PUT /api/v1/sellers/me/toggle-live — Toggle Live Status', () => {
    it('toggles live status for an approved provider', async () => {
      expect(approvedProvider.isLive).toBe(true);

      const res1 = await request(app)
        .put('/api/v1/sellers/me/toggle-live')
        .set(authHeaderFor(sellerUser));

      expect(res1.status).toBe(200);
      expect(res1.body.data.isLive).toBe(false);

      const res2 = await request(app)
        .put('/api/v1/sellers/me/toggle-live')
        .set(authHeaderFor(sellerUser));

      expect(res2.status).toBe(200);
      expect(res2.body.data.isLive).toBe(true);
    });

    it('rejects toggle-live with 403 if provider application is still pending', async () => {
      const res = await request(app)
        .put('/api/v1/sellers/me/toggle-live')
        .set(authHeaderFor(pendingSellerUser));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/pending approval/i);
    });
  });

  describe('GET /api/v1/sellers/me/stats — Seller Dashboard KPIs', () => {
    it('returns KPI metrics including views, calls, WhatsApp clicks, rating, and leads count', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me/stats')
        .set(authHeaderFor(sellerUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        profileViews: expect.any(Number),
        callClicks: expect.any(Number),
        whatsappClicks: expect.any(Number),
        avgRating: expect.any(Number),
        reviewCount: expect.any(Number),
        totalLeads: expect.any(Number),
        status: 'approved',
        isLive: true,
      });
    });
  });
});
