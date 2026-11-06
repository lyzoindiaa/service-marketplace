import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { Review } from '../../models/Review.model';
import {
  makeUser,
  makeProvider,
  makeReview,
} from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Review & Rating Routes (BE-009)', () => {
  let sellerUser: any;
  let otherSellerUser: any;
  let customerUser1: any;
  let customerUser2: any;
  let adminUser: any;
  let provider: any;

  beforeEach(async () => {
    sellerUser = await makeUser({ role: 'seller' });
    otherSellerUser = await makeUser({ role: 'seller' });
    customerUser1 = await makeUser({ role: 'customer', name: 'Ravi Verma' });
    customerUser2 = await makeUser({ role: 'customer', name: 'Sunita Kumari' });
    adminUser = await makeUser({ role: 'admin' });

    provider = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Maa Tara Electricals',
      status: 'approved',
      isLive: true,
      avgRating: 0,
      reviewCount: 0,
    });
  });

  describe('POST /api/v1/reviews — Submit Customer Review', () => {
    it('creates review with customer JWT and updates provider avgRating and reviewCount', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(customerUser1))
        .send({
          providerId: provider._id.toString(),
          rating: 5,
          comment: 'Outstanding repair service, on time and very honest pricing!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        rating: 5,
        comment: 'Outstanding repair service, on time and very honest pricing!',
        customerName: 'Ravi Verma',
      });

      // Provider rating & count should be updated
      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.avgRating).toBe(5);
      expect(updatedProvider?.reviewCount).toBe(1);
    });

    it('correctly recalculates avgRating when multiple customers submit reviews', async () => {
      await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(customerUser1))
        .send({
          providerId: provider._id.toString(),
          rating: 5,
          comment: 'Perfect job!',
        });

      await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(customerUser2))
        .send({
          providerId: provider._id.toString(),
          rating: 4,
          comment: 'Good work, slight delay.',
        });

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.avgRating).toBe(4.5); // (5 + 4) / 2
      expect(updatedProvider?.reviewCount).toBe(2);
    });

    it('returns 409 conflict if customer attempts duplicate review on the same provider', async () => {
      await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(customerUser1))
        .send({
          providerId: provider._id.toString(),
          rating: 5,
          comment: 'First review',
        });

      const res = await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(customerUser1))
        .send({
          providerId: provider._id.toString(),
          rating: 4,
          comment: 'Second review attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already reviewed/i);
    });

    it('returns 403 if seller tries to review their own business', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(sellerUser))
        .send({
          providerId: provider._id.toString(),
          rating: 5,
          comment: 'Reviewing myself',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/cannot review your own/i);
    });

    it('returns 400 when rating is outside 1 to 5', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set(authHeaderFor(customerUser1))
        .send({
          providerId: provider._id.toString(),
          rating: 6,
          comment: 'Invalid rating',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .send({
          providerId: provider._id.toString(),
          rating: 5,
          comment: 'Unauthenticated review',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reviews/provider/:providerId — List Provider Reviews', () => {
    beforeEach(async () => {
      await makeReview({
        provider: provider._id,
        customer: customerUser1._id,
        customerName: 'Ravi Verma',
        rating: 5,
        comment: 'Great work!',
      });

      await makeReview({
        provider: provider._id,
        customer: customerUser2._id,
        customerName: 'Sunita Kumari',
        rating: 4,
        comment: 'Good service.',
      });
    });

    it('returns paginated reviews and rating summary breakdown', async () => {
      const res = await request(app).get(`/api/v1/reviews/provider/${provider._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.breakdown['5']).toBe(1);
      expect(res.body.data.summary.breakdown['4']).toBe(1);
    });

    it('returns 400 for malformed providerId', async () => {
      const res = await request(app).get('/api/v1/reviews/provider/invalid-id');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/reviews/:id/reply — Seller Reply', () => {
    let review: any;

    beforeEach(async () => {
      review = await makeReview({
        provider: provider._id,
        customer: customerUser1._id,
        customerName: 'Ravi Verma',
        rating: 5,
        comment: 'Very helpful service!',
      });
    });

    it('allows provider owner to reply to a review', async () => {
      const res = await request(app)
        .patch(`/api/v1/reviews/${review._id}/reply`)
        .set(authHeaderFor(sellerUser))
        .send({
          reply: 'Thank you Ravi ji for choosing us! Glad to assist.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sellerReply).toBe('Thank you Ravi ji for choosing us! Glad to assist.');
      expect(res.body.data.sellerRepliedAt).toBeDefined();
    });

    it('returns 403 when another seller or customer tries to reply', async () => {
      const res = await request(app)
        .patch(`/api/v1/reviews/${review._id}/reply`)
        .set(authHeaderFor(otherSellerUser))
        .send({
          reply: 'Intruder reply',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 409 if seller attempts to reply a second time', async () => {
      await request(app)
        .patch(`/api/v1/reviews/${review._id}/reply`)
        .set(authHeaderFor(sellerUser))
        .send({
          reply: 'First reply',
        });

      const res = await request(app)
        .patch(`/api/v1/reviews/${review._id}/reply`)
        .set(authHeaderFor(sellerUser))
        .send({
          reply: 'Second reply attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already replied/i);
    });
  });

  describe('DELETE /api/v1/reviews/:id — Admin Delete & Recalculate Rating', () => {
    let review1: any;
    let review2: any;

    beforeEach(async () => {
      review1 = await makeReview({
        provider: provider._id,
        customer: customerUser1._id,
        customerName: 'Ravi Verma',
        rating: 5,
        comment: 'Top quality work!',
      });

      review2 = await makeReview({
        provider: provider._id,
        customer: customerUser2._id,
        customerName: 'Sunita Kumari',
        rating: 1,
        comment: 'Fake review spam',
      });

      // Recalculate provider initial rating: (5 + 1) / 2 = 3.0
      await Provider.findByIdAndUpdate(provider._id, {
        avgRating: 3.0,
        reviewCount: 2,
      });
    });

    it('allows admin to delete review and atomically recalculates provider avgRating', async () => {
      const res = await request(app)
        .delete(`/api/v1/reviews/${review2._id}`)
        .set(authHeaderFor(adminUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify review removed from database
      const deleted = await Review.findById(review2._id);
      expect(deleted).toBeNull();

      // Verify provider avgRating recalculated to 5.0 and count to 1
      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.avgRating).toBe(5);
      expect(updatedProvider?.reviewCount).toBe(1);
    });

    it('returns 403 when non-admin attempts to delete review', async () => {
      const res = await request(app)
        .delete(`/api/v1/reviews/${review1._id}`)
        .set(authHeaderFor(customerUser1));

      expect(res.status).toBe(403);
    });
  });
});
