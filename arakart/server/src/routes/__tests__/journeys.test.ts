import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { User } from '../../models/User.model';
import { Category } from '../../models/Category.model';
import { City } from '../../models/City.model';
import { Review } from '../../models/Review.model';
import { Lead } from '../../models/Lead.model';
import { Report } from '../../models/Report.model';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Critical User Journeys — E2E Integration (QA-003)', () => {
  let araCity: any;
  let electricCat: any;

  beforeEach(async () => {
    araCity = await City.create({
      nameEn: 'Ara',
      nameHi: 'आरा',
      slug: 'ara',
      isLive: true,
    });

    electricCat = await Category.create({
      nameEn: 'Electrician',
      nameHi: 'इलेक्ट्रीशियन',
      slug: 'electrician',
      icon: 'zap',
      isActive: true,
      displayOrder: 1,
    });
  });

  // =========================================================================
  // JOURNEY 1: Search, Filter, Contact & Lead Generation
  // =========================================================================
  describe('Journey 1: Customer Search -> Provider Profile -> Lead Generation', () => {
    it('allows a customer to find a provider in Ara, view masked info, login and generate lead', async () => {
      // 1. Seller registers and has approved listing
      const sellerUser = await User.create({
        name: 'Maa Tara Electricals Owner',
        phone: '9800012345',
        role: 'seller',
        phoneVerified: true,
        authMethods: ['phone'],
      });

      const provider = await Provider.create({
        owner: sellerUser._id,
        nameEn: 'Maa Tara Electricals',
        nameHi: 'माँ तारा इलेक्ट्रिकल्स',
        categories: ['electrician'],
        area: 'Anaith',
        areasServed: ['Anaith', 'Nawada'],
        city: 'Ara',
        phone: '9800012345',
        whatsapp: '9800012345',
        services: [
          { nameEn: 'Wiring Installation', startingPrice: 350 },
          { nameEn: 'Fan Repair', startingPrice: 150 },
        ],
        fromPrice: 150,
        status: 'approved',
        isLive: true,
        verified: true,
      });

      // 2. Customer searches for electrician in Ara
      const searchRes = await request(app)
        .get('/api/v1/providers')
        .query({
          city: 'Ara',
          q: 'Wiring',
          category: 'electrician',
        });

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.providers.length).toBeGreaterThan(0);
      const found = searchRes.body.data.providers.find((p: any) => p._id === provider._id.toString());
      expect(found).toBeDefined();
      expect(found.phone).toMatch(/(?:X{3,}|\*{3,})/); // Phone is masked

      // 3. Customer signs in via Phone OTP
      await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: '9800099999' });

      // Simulate customer verification
      const custUser = await User.create({
        name: 'Ramesh Kumar',
        phone: '9800099999',
        role: 'customer',
        phoneVerified: true,
        authMethods: ['phone'],
      });
      const custAuth = authHeaderFor(custUser);

      // 4. Customer clicks "Call Now"
      const leadRes = await request(app)
        .post('/api/v1/leads')
        .set(custAuth)
        .send({
          providerId: provider._id.toString(),
          type: 'call',
          service: 'Wiring Installation',
        });

      expect(leadRes.status).toBe(201);
      expect(leadRes.body.data.phone).toBe('9800012345'); // Unmasked number revealed

      // 5. Verify seller can view the lead in their inbox
      const sellerAuth = authHeaderFor(sellerUser);
      const inboxRes = await request(app)
        .get('/api/v1/leads/seller')
        .set(sellerAuth);

      expect(inboxRes.status).toBe(200);
      expect(inboxRes.body.data.leads).toHaveLength(1);
      expect(inboxRes.body.data.leads[0].customerName).toBe('Ramesh Kumar');
      expect(inboxRes.body.data.leads[0].type).toBe('call');
      expect(inboxRes.body.data.leads[0].status).toBe('new');
    });
  });

  // =========================================================================
  // JOURNEY 2: Catalogue Management & Real-Time Price Sync
  // =========================================================================
  describe('Journey 2: Seller Catalogue Update & Immediate Search Reflection', () => {
    it('updates service prices and immediately reflects them on customer profile queries', async () => {
      const sellerUser = await User.create({
        name: 'Vikas Sharma',
        phone: '9800022233',
        role: 'seller',
        phoneVerified: true,
        authMethods: ['phone'],
      });
      const sellerAuth = authHeaderFor(sellerUser);

      const provider = await Provider.create({
        owner: sellerUser._id,
        nameEn: 'Vikas Plumbing Service',
        categories: ['electrician'],
        area: 'Chowk',
        areasServed: ['Chowk'],
        city: 'Ara',
        phone: '9800022233',
        services: [{ nameEn: 'Pipe Fitting', startingPrice: 200 }],
        fromPrice: 200,
        status: 'approved',
        isLive: true,
        verified: true,
      });

      // Seller updates catalogue: changes price and adds a service
      const updateRes = await request(app)
        .put('/api/v1/sellers/me/catalogue')
        .set(sellerAuth)
        .send({
          services: [
            { nameEn: 'Pipe Fitting', startingPrice: 300 },
            { nameEn: 'Tap Repair', startingPrice: 120 },
          ],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.services).toHaveLength(2);

      // Customer fetches provider profile
      const profileRes = await request(app)
        .get(`/api/v1/providers/${provider._id}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.services).toHaveLength(2);
      expect(profileRes.body.data.fromPrice).toBe(120); // lowest service price
    });
  });

  // =========================================================================
  // JOURNEY 3: Review Submission, Rating Recalculation & Seller Reply
  // =========================================================================
  describe('Journey 3: Customer 5★ Review -> Avg Rating Update -> Seller Reply', () => {
    it('computes provider avgRating upon customer review and allows seller response', async () => {
      const sellerUser = await User.create({
        name: 'Sunil Plumber',
        phone: '9800033344',
        role: 'seller',
        phoneVerified: true,
        authMethods: ['phone'],
      });
      const sellerAuth = authHeaderFor(sellerUser);

      const provider = await Provider.create({
        owner: sellerUser._id,
        nameEn: 'Sunil Plumbing Ara',
        categories: ['electrician'],
        area: 'Pakari',
        areasServed: ['Pakari'],
        city: 'Ara',
        phone: '9800033344',
        status: 'approved',
        isLive: true,
        verified: true,
        avgRating: 0,
        reviewCount: 0,
      });

      // Customer 1 posts a 5-star review
      const custUser = await User.create({
        name: 'Aman Singh',
        phone: '9800044455',
        role: 'customer',
        phoneVerified: true,
        authMethods: ['phone'],
      });
      const custAuth = authHeaderFor(custUser);

      const reviewRes = await request(app)
        .post('/api/v1/reviews')
        .set(custAuth)
        .send({
          providerId: provider._id.toString(),
          rating: 5,
          comment: 'Outstanding repair service in Pakari, very punctual!',
        });

      expect(reviewRes.status).toBe(201);
      const createdReviewId = reviewRes.body.data._id;

      // Verify provider rating updated
      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.avgRating).toBe(5);
      expect(updatedProvider?.reviewCount).toBe(1);

      // Seller replies to the review
      const replyRes = await request(app)
        .patch(`/api/v1/reviews/${createdReviewId}/reply`)
        .set(sellerAuth)
        .send({
          reply: 'Thank you Aman ji! Always happy to assist you.',
        });

      expect(replyRes.status).toBe(200);
      expect(replyRes.body.data.sellerReply).toBe('Thank you Aman ji! Always happy to assist you.');

      // Verify public reviews listing includes seller reply
      const listReviewsRes = await request(app)
        .get(`/api/v1/reviews/provider/${provider._id}`);

      expect(listReviewsRes.status).toBe(200);
      expect(listReviewsRes.body.data.reviews[0].sellerReply).toBe(
        'Thank you Aman ji! Always happy to assist you.'
      );
    });
  });

  // =========================================================================
  // JOURNEY 4: Seller Registration & Admin Approval Lifecycle
  // =========================================================================
  describe('Journey 4: Seller Apply -> Admin Pending Queue -> Approval -> Public Live', () => {
    it('keeps provider hidden until admin approval, then activates in search', async () => {
      // 1. Applicant registers
      const applicantUser = await User.create({
        name: 'Deepak Painter',
        phone: '9800055566',
        role: 'customer',
        phoneVerified: true,
        authMethods: ['phone'],
      });
      const applicantAuth = authHeaderFor(applicantUser);

      const applyRes = await request(app)
        .post('/api/v1/sellers/apply')
        .set(applicantAuth)
        .send({
          nameEn: 'Deepak Home Painting',
          categories: ['electrician'],
          area: 'Dharhara',
          areasServed: ['Dharhara', 'Anaith'],
          phone: '9800055566',
          services: [{ nameEn: 'Interior Painting', startingPrice: 1500 }],
        });

      expect(applyRes.status).toBe(201);
      const newProviderId = applyRes.body.data._id;

      // 2. Not visible in public search yet
      const unapprovedSearch = await request(app)
        .get('/api/v1/providers')
        .query({ q: 'Deepak' });

      const foundBefore = unapprovedSearch.body.data.providers.find(
        (p: any) => p._id === newProviderId
      );
      expect(foundBefore).toBeUndefined();

      // 3. Admin checks pending queue
      const adminUser = await User.create({
        name: 'AraKart SuperAdmin',
        email: 'superadmin@arakart.in',
        role: 'admin',
        emailVerified: true,
        authMethods: ['email'],
      });
      const adminAuth = authHeaderFor(adminUser);

      const pendingRes = await request(app)
        .get('/api/v1/admin/sellers/pending')
        .set(adminAuth);

      expect(pendingRes.status).toBe(200);
      const inPending = pendingRes.body.data.sellers.find((s: any) => s._id === newProviderId);
      expect(inPending).toBeDefined();

      // 4. Admin approves seller
      const approveRes = await request(app)
        .post(`/api/v1/admin/sellers/${newProviderId}/approve`)
        .set(adminAuth);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('approved');
      expect(approveRes.body.data.isLive).toBe(true);

      // 5. Now instantly discoverable in search
      const approvedSearch = await request(app)
        .get('/api/v1/providers')
        .query({ q: 'Deepak' });

      const foundAfter = approvedSearch.body.data.providers.find(
        (p: any) => p._id === newProviderId
      );
      expect(foundAfter).toBeDefined();
      expect(foundAfter.nameEn).toBe('Deepak Home Painting');
    });
  });

  // =========================================================================
  // JOURNEY 5: Abuse Reporting, Resolution & User Suspension Safeguard
  // =========================================================================
  describe('Journey 5: Report Abuse -> Admin Resolution -> Seller Suspension', () => {
    it('records report, lets admin resolve report, and locks suspended accounts', async () => {
      const badSeller = await User.create({
        name: 'Spam Seller',
        phone: '9800077788',
        role: 'seller',
        phoneVerified: true,
        authMethods: ['phone'],
      });

      const badProvider = await Provider.create({
        owner: badSeller._id,
        nameEn: 'Fake Services Scam',
        categories: ['electrician'],
        area: 'Chowk',
        city: 'Ara',
        phone: '9800077788',
        status: 'approved',
        isLive: true,
        verified: false,
      });

      const customerUser = await User.create({
        name: 'Alert Citizen',
        phone: '9800088899',
        role: 'customer',
        phoneVerified: true,
        authMethods: ['phone'],
      });
      const custAuth = authHeaderFor(customerUser);

      // 1. Customer files report
      const reportRes = await request(app)
        .post('/api/v1/reports')
        .set(custAuth)
        .send({
          providerId: badProvider._id.toString(),
          reason: 'fraud',
          description: 'Provider demanded advance payment and did not show up.',
        });

      expect(reportRes.status).toBe(201);
      const reportId = reportRes.body.data._id;

      // 2. Admin inspects reports
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin.gov@arakart.in',
        role: 'admin',
        emailVerified: true,
        authMethods: ['email'],
      });
      const adminAuth = authHeaderFor(adminUser);

      const adminReportsRes = await request(app)
        .get('/api/v1/admin/reports')
        .set(adminAuth);

      expect(adminReportsRes.status).toBe(200);
      expect(adminReportsRes.body.data.reports.length).toBeGreaterThan(0);

      // 3. Admin resolves report
      const resolveRes = await request(app)
        .patch(`/api/v1/admin/reports/${reportId}`)
        .set(adminAuth)
        .send({
          status: 'resolved',
          adminNote: 'Confirmed fraud. Suspending user account.',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('resolved');

      // 4. Admin suspends the fraudulent seller
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/users/${badSeller._id}/suspend`)
        .set(adminAuth)
        .send({ suspended: true, reason: 'Fraudulent activity' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.suspended).toBe(true);

      // 5. Seller attempts to access dashboard -> 403 Forbidden
      const badSellerAuth = authHeaderFor(badSeller);
      const blockedRes = await request(app)
        .get('/api/v1/sellers/me')
        .set(badSellerAuth);

      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.message).toMatch(/account has been suspended/i);
    });
  });
});
