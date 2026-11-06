import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import {
  makeUser,
  makeProvider,
  makeCategory,
  makeReview,
} from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';
import { Lead } from '../../models/Lead.model';

setupTestDB();

describe('Public Stats, Dynamic Blogs & Service Offers Routes (Features 2, 3 & 4)', () => {
  let adminUser: any;
  let sellerUser: any;
  let customerUser: any;
  let approvedProvider: any;

  beforeEach(async () => {
    adminUser = await makeUser({ role: 'admin', name: 'AraKart Admin' });
    sellerUser = await makeUser({ role: 'seller', name: 'Rajesh Kumar' });
    customerUser = await makeUser({
      role: 'customer',
      name: 'Priya Verma',
      phone: '9876500001',
    });

    await makeCategory({ slug: 'ac', nameEn: 'AC Repair', nameHi: 'एसी रिपेयर', enabled: true });

    approvedProvider = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Rajesh Cool Care',
      nameHi: 'राजेश कूल केयर',
      categories: ['ac'],
      area: 'Katira',
      city: 'ara',
      phone: '9811122233',
      status: 'approved',
      isLive: true,
      avgRating: 4.8,
      reviewCount: 1,
      fromPrice: 399,
      services: [
        {
          nameEn: 'Split AC Foam Jet Servicing',
          nameHi: 'स्प्लिट एसी फोम जेट सर्विसिंग',
          startingPrice: 599,
        } as any,
      ],
    });

    sellerUser.sellerId = approvedProvider._id;
    await sellerUser.save();
  });

  describe('Feature 2: GET /api/v1/providers/public-stats', () => {
    it('returns live city stats and recent customer reviews dynamically', async () => {
      await makeReview({
        provider: approvedProvider._id,
        customer: customerUser._id,
        customerName: 'Priya Verma',
        rating: 5,
        comment: 'Super fast AC gas refill in Katira!',
      });

      const res = await request(app).get('/api/v1/providers/public-stats?city=ara');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verifiedProvidersCount).toBe(1);
      expect(res.body.data.categoriesCount).toBe(1);
      expect(res.body.data.totalReviews).toBe(1);
      expect(res.body.data.recentReviews.length).toBe(1);
      expect(res.body.data.recentReviews[0].comment).toContain('Super fast AC gas refill');
      expect(res.body.data.recentReviews[0].customerName).toBe('Priya Verma');
    });
  });

  describe('Feature 3: Dynamic Blog CRUD (/api/v1/blogs)', () => {
    it('allows Admin to create, update, and delete blogs while sanitizing XSS, and allows public read', async () => {
      // 1. Non-admin cannot create blog
      const forbiddenRes = await request(app)
        .post('/api/v1/blogs')
        .set(authHeaderFor(customerUser))
        .send({
          titleEn: 'Unauthorized Post',
          contentEn: 'Should fail',
        });
      expect(forbiddenRes.status).toBe(403);

      // 2. Admin creates published blog (with embedded script tag to verify sanitization)
      const createRes = await request(app)
        .post('/api/v1/blogs')
        .set(authHeaderFor(adminUser))
        .send({
          titleEn: 'Top 5 Summer AC Care Tips in Ara',
          titleHi: 'आरा में गर्मियों के लिए 5 एसी टिप्स',
          contentEn: 'Clean your AC filters every 15 days.<script>alert("xss")</script>',
          category: 'Appliance Tips',
          isPublished: true,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.titleEn).toBe('Top 5 Summer AC Care Tips in Ara');
      expect(createRes.body.data.contentEn).not.toContain('<script>');
      const slug = createRes.body.data.slug;
      const blogId = createRes.body.data.id;

      // 3. Public fetches published blogs list
      const listRes = await request(app).get('/api/v1/blogs');
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.blogs.length).toBe(1);
      expect(listRes.body.data.blogs[0].slug).toBe(slug);

      // 4. Public fetches single blog by slug
      const detailRes = await request(app).get(`/api/v1/blogs/${slug}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.titleEn).toBe('Top 5 Summer AC Care Tips in Ara');

      // 5. Admin updates blog
      const updateRes = await request(app)
        .put(`/api/v1/blogs/${blogId}`)
        .set(authHeaderFor(adminUser))
        .send({
          titleEn: 'Updated AC Care Guide for Bihar',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.titleEn).toBe('Updated AC Care Guide for Bihar');

      // 6. Admin deletes blog
      const delRes = await request(app)
        .delete(`/api/v1/blogs/${blogId}`)
        .set(authHeaderFor(adminUser));
      expect(delRes.status).toBe(200);

      const emptyRes = await request(app).get('/api/v1/blogs');
      expect(emptyRes.body.data.blogs.length).toBe(0);
    });
  });

  describe('Feature 4: Service Offers & Time-Window Deals (/api/v1/offers)', () => {
    it('supports seller creating date_range + work_hours and single_day_slot offers, customer applying an offer, and admin viewing offers', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

      // 1. Rejects when offerPrice >= originalPrice
      const invalidRes = await request(app)
        .post('/api/v1/offers/seller')
        .set(authHeaderFor(sellerUser))
        .send({
          serviceTitleEn: 'Split AC Foam Jet Servicing',
          originalPrice: 500,
          offerPrice: 600,
          titleEn: 'Invalid Deal',
          scheduleType: 'date_range',
          startDate: todayStr,
          endDate: nextWeekStr,
          workHoursStart: '09:00',
          workHoursEnd: '18:00',
        });
      expect(invalidRes.status).toBe(400);

      // 2. Seller creates Date Range + Working Hours offer on a particular service
      const dateRangeOfferRes = await request(app)
        .post('/api/v1/offers/seller')
        .set(authHeaderFor(sellerUser))
        .send({
          serviceTitleEn: 'Split AC Foam Jet Servicing',
          originalPrice: 599,
          offerPrice: 399,
          titleEn: 'Summer Work-Hours AC Servicing Discount',
          scheduleType: 'date_range',
          startDate: todayStr,
          endDate: nextWeekStr,
          workHoursStart: '09:00',
          workHoursEnd: '18:00',
        });

      expect(dateRangeOfferRes.status).toBe(201);
      expect(dateRangeOfferRes.body.data.discountPercent).toBe(33);
      expect(dateRangeOfferRes.body.data.scheduleType).toBe('date_range');
      const offerId = dateRangeOfferRes.body.data.id;

      // 3. Seller creates Single Day + Particular Hour Slot offer
      const singleDayOfferRes = await request(app)
        .post('/api/v1/offers/seller')
        .set(authHeaderFor(sellerUser))
        .send({
          serviceTitleEn: 'AC Gas Top-Up',
          originalPrice: 1200,
          offerPrice: 899,
          titleEn: 'Afternoon 2PM-4PM Flash Deal',
          scheduleType: 'single_day_slot',
          singleDate: nextWeekStr,
          slotStartHour: '14:00',
          slotEndHour: '16:00',
        });

      expect(singleDayOfferRes.status).toBe(201);
      expect(singleDayOfferRes.body.data.scheduleType).toBe('single_day_slot');

      // 4. Public / Customer browses active offers for city
      const publicListRes = await request(app).get('/api/v1/offers?city=ara');
      expect(publicListRes.status).toBe(200);
      expect(publicListRes.body.data.offers.length).toBe(2);

      // 5. Customer applies the offer on the service
      const applyRes = await request(app)
        .post(`/api/v1/offers/${offerId}/apply`)
        .set(authHeaderFor(customerUser));

      expect(applyRes.status).toBe(201);
      expect(applyRes.body.data.alreadyApplied).toBe(false);
      expect(applyRes.body.data.application.claimCode).toMatch(/^ARA-[A-Z0-9]{4}$/);
      expect(applyRes.body.data.application.serviceTitleEn).toBe('Split AC Foam Jet Servicing');
      expect(applyRes.body.data.application.sellerPhone).toBe('9811122233');

      // Verify a Lead was automatically created for the seller
      const leadsInDb = await Lead.find({ provider: approvedProvider._id });
      expect(leadsInDb.length).toBe(1);
      expect(leadsInDb[0].service).toContain('OFFER');

      // 6. Customer checks "My Applied Offers" to see what offers they applied on what service
      const myAppliedRes = await request(app)
        .get('/api/v1/offers/my-applied')
        .set(authHeaderFor(customerUser));

      expect(myAppliedRes.status).toBe(200);
      expect(myAppliedRes.body.data.appliedOffers.length).toBe(1);
      expect(myAppliedRes.body.data.appliedOffers[0].serviceTitleEn).toBe(
        'Split AC Foam Jet Servicing'
      );
      expect(myAppliedRes.body.data.appliedOffers[0].offerPrice).toBe(399);

      // 7. Admin views all seller offers and customer claims on the Admin Offers tab
      const adminOffersRes = await request(app)
        .get('/api/v1/offers/admin?scheduleType=date_range')
        .set(authHeaderFor(adminUser));

      expect(adminOffersRes.status).toBe(200);
      expect(adminOffersRes.body.data.offers.length).toBe(1);
      expect(adminOffersRes.body.data.offers[0].claimsCount).toBe(1);
      expect(adminOffersRes.body.data.offers[0].appliedCustomers[0].customer.name).toBe(
        'Priya Verma'
      );
    });
  });
});
