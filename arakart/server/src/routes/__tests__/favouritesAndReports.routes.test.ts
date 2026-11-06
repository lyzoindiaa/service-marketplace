import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { User } from '../../models/User.model';
import { Report } from '../../models/Report.model';
import { makeUser, makeProvider } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Favourites & Report Abuse Routes (BE-013)', () => {
  let customerUser: any;
  let sellerUser: any;
  let providerDoc: any;

  beforeEach(async () => {
    customerUser = await makeUser({ role: 'customer' });
    sellerUser = await makeUser({ role: 'seller' });
    providerDoc = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Manoj Electric Works',
      phone: '9876543210',
      status: 'approved',
      isLive: true,
    });
  });

  describe('Customer Favourites Endpoints', () => {
    it('POST /api/v1/users/me/favourites/:providerId adds provider to favourites idempotently', async () => {
      // First call
      const res1 = await request(app)
        .post(`/api/v1/users/me/favourites/${providerDoc._id}`)
        .set(authHeaderFor(customerUser));

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      const userAfterFirst = await User.findById(customerUser._id);
      expect(userAfterFirst?.favourites.map((id) => id.toString())).toContain(
        providerDoc._id.toString()
      );

      // Second call (idempotent test)
      const res2 = await request(app)
        .post(`/api/v1/users/me/favourites/${providerDoc._id}`)
        .set(authHeaderFor(customerUser));

      expect(res2.status).toBe(200);
      const userAfterSecond = await User.findById(customerUser._id);
      expect(userAfterSecond?.favourites.length).toBe(1);
    });

    it('GET /api/v1/users/me/favourites returns populated list of favourites with masked phones', async () => {
      // Add favourite
      await User.findByIdAndUpdate(customerUser._id, {
        $addToSet: { favourites: providerDoc._id },
      });

      const res = await request(app)
        .get('/api/v1/users/me/favourites')
        .set(authHeaderFor(customerUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].nameEn).toBe('Manoj Electric Works');
      expect(res.body.data[0].phone).toBe('98765 XXXXX'); // Phone masked
    });

    it('DELETE /api/v1/users/me/favourites/:providerId removes provider from favourites', async () => {
      // Pre-populate favourite
      await User.findByIdAndUpdate(customerUser._id, {
        $addToSet: { favourites: providerDoc._id },
      });

      const res = await request(app)
        .delete(`/api/v1/users/me/favourites/${providerDoc._id}`)
        .set(authHeaderFor(customerUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const userAfter = await User.findById(customerUser._id);
      expect(userAfter?.favourites.map((id) => id.toString())).not.toContain(
        providerDoc._id.toString()
      );
    });

    it('returns 400 for malformed providerId in favourites endpoints', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/favourites/not-an-id')
        .set(authHeaderFor(customerUser));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when accessing favourites without authentication', async () => {
      const res = await request(app).get('/api/v1/users/me/favourites');
      expect(res.status).toBe(401);
    });
  });

  describe('Report Abuse Endpoints', () => {
    it('POST /api/v1/reports creates a report record when called with customer JWT', async () => {
      const payload = {
        providerId: providerDoc._id.toString(),
        reason: 'Misleading pricing information and rude behavior',
      };

      const res = await request(app)
        .post('/api/v1/reports')
        .set(authHeaderFor(customerUser))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reason).toBe(payload.reason);
      expect(res.body.data.status).toBe('open');

      const inDb = await Report.findOne({ provider: providerDoc._id });
      expect(inDb).not.toBeNull();
      expect(inDb?.reportedBy.toString()).toBe(customerUser._id.toString());
    });

    it('POST /api/v1/reports rejects request when reason is missing', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set(authHeaderFor(customerUser))
        .send({ providerId: providerDoc._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/reports rejects unauthenticated report submission with 401', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .send({
          providerId: providerDoc._id.toString(),
          reason: 'Spam',
        });

      expect(res.status).toBe(401);
    });
  });
});
