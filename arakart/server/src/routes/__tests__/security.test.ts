import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { User } from '../../models/User.model';
import { Lead } from '../../models/Lead.model';
import { makeUser, makeProvider } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('API Security Test Suite (QA-002)', () => {
  let customerUser: any;
  let customerAuth: { Authorization: string };
  let sellerAUser: any;
  let sellerAAuth: { Authorization: string };
  let sellerBUser: any;
  let sellerBAuth: { Authorization: string };
  let adminUser: any;
  let adminAuth: { Authorization: string };

  let providerA: any;
  let providerB: any;

  beforeEach(async () => {
    customerUser = await makeUser({ role: 'customer', phone: '9800011122', email: 'cust@test.com' });
    customerAuth = authHeaderFor(customerUser);

    sellerAUser = await makeUser({ role: 'seller', phone: '9800033344', email: 'sellerA@test.com' });
    sellerAAuth = authHeaderFor(sellerAUser);

    sellerBUser = await makeUser({ role: 'seller', phone: '9800055566', email: 'sellerB@test.com' });
    sellerBAuth = authHeaderFor(sellerBUser);

    adminUser = await makeUser({ role: 'admin', phone: '9800077788', email: 'admin@test.com' });
    adminAuth = authHeaderFor(adminUser);

    providerA = await makeProvider({
      owner: sellerAUser._id,
      nameEn: 'Seller A Electricals',
      phone: '9800033344',
      status: 'approved',
      isLive: true,
      verified: true,
    });

    providerB = await makeProvider({
      owner: sellerBUser._id,
      nameEn: 'Seller B Plumbing Works',
      phone: '9800055566',
      status: 'approved',
      isLive: true,
      verified: true,
    });
  });

  describe('1. Role-Based Access Control & Route Protection', () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/v1/sellers/me' },
      { method: 'get', path: '/api/v1/leads/seller' },
      { method: 'put', path: '/api/v1/sellers/me/toggle-live' },
      { method: 'get', path: '/api/v1/admin/kpis' },
      { method: 'get', path: '/api/v1/admin/sellers/pending' },
      { method: 'get', path: '/api/v1/admin/users' },
      { method: 'get', path: '/api/v1/admin/reports' },
      { method: 'get', path: '/api/v1/users/me/favourites' },
    ];

    it.each(protectedRoutes)(
      'rejects unauthenticated request to $method $path with 401',
      async ({ method, path }) => {
        const req = (request(app) as any)[method](path);
        const res = await req;
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    );

    it('rejects customer accessing admin routes with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kpis')
        .set(customerAuth);
      expect(res.status).toBe(403);
    });

    it('rejects customer accessing seller routes with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/sellers/me')
        .set(customerAuth);
      expect(res.status).toBe(403);
    });

    it('rejects seller accessing admin routes with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set(sellerAAuth);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Insecure Direct Object Reference (IDOR) Safeguards', () => {
    it('isolates seller leads: Seller A cannot read Seller B leads via /leads/seller', async () => {
      // Seed lead for provider B
      await Lead.create({
        provider: providerB._id,
        customerName: 'Customer X',
        customerPhone: '9800099999',
        type: 'call',
      });

      // Seller A requests their leads
      const resA = await request(app)
        .get('/api/v1/leads/seller')
        .set(sellerAAuth);
      expect(resA.status).toBe(200);
      expect(resA.body.data.leads).toHaveLength(0);

      // Seller B requests their leads
      const resB = await request(app)
        .get('/api/v1/leads/seller')
        .set(sellerBAuth);
      expect(resB.status).toBe(200);
      expect(resB.body.data.leads).toHaveLength(1);
      expect(resB.body.data.leads[0].customerName).toBe('Customer X');
    });

    it('isolates profile updates: Seller A cannot mutate Seller B provider profile', async () => {
      const updatePayload = {
        nameEn: 'Hacked Name By Seller A',
      };

      const res = await request(app)
        .put('/api/v1/sellers/me/profile')
        .set(sellerAAuth)
        .send(updatePayload);

      expect(res.status).toBe(200);

      // Provider A should be updated
      const updatedA = await Provider.findById(providerA._id);
      expect(updatedA?.nameEn).toBe('Hacked Name By Seller A');

      // Provider B must remain completely untouched
      const untouchedB = await Provider.findById(providerB._id);
      expect(untouchedB?.nameEn).toBe('Seller B Plumbing Works');
    });
  });

  describe('3. NoSQL Injection Prevention', () => {
    it('rejects NoSQL injection operator in send-otp phone field with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: { $gt: '' } });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects NoSQL injection in email login payload with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/email/login')
        .send({
          email: { $ne: null },
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Mass Assignment & Privilege Escalation Prevention', () => {
    it('strips or ignores role/status/verified escalation attempts on seller registration', async () => {
      const freshUser = await makeUser({ role: 'customer', phone: '9811122233' });
      const freshAuth = authHeaderFor(freshUser);

      const res = await request(app)
        .post('/api/v1/sellers/apply')
        .set(freshAuth)
        .send({
          nameEn: 'Privilege Escalator',
          nameHi: 'प्रिविलेज',
          categories: ['electrician'],
          area: 'Anaith',
          areasServed: ['Anaith'],
          phone: '9811122233',
          services: [{ nameEn: 'Test Service', startingPrice: 100 }],
          // Malicious fields injected to bypass admin review
          role: 'admin',
          status: 'approved',
          verified: true,
          isLive: true,
        });

      expect(res.status).toBe(201);
      const createdProvider = await Provider.findOne({ owner: freshUser._id });
      expect(createdProvider).not.toBeNull();
      // Must be pending review and unverified regardless of payload
      expect(createdProvider?.status).toBe('pending');
      expect(createdProvider?.verified).toBe(false);
      expect(createdProvider?.isLive).toBe(false);

      // User role must not become admin
      const userDoc = await User.findById(freshUser._id);
      expect(userDoc?.role).not.toBe('admin');
    });
  });

  describe('5. Brute-Force & Rate Limiting Controls', () => {
    it('locks verification record after 5 failed attempts', async () => {
      // Create a phone verification record
      await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: '9811199988' });

      // Attempt 5 incorrect OTPs
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/auth/phone/verify-otp')
          .send({ phone: '9811199988', code: '000000' });
        expect(res.status).toBe(400);
      }

      // 6th attempt must be blocked as exceeded max attempts
      const res6 = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .send({ phone: '9811199988', code: '000000' });
      expect(res6.status).toBe(400);
      expect(res6.body.error || res6.body.message).toMatch(/maximum.*exceeded|expired|no active/i);
    });
  });

  describe('6. Security Headers & Express Information Disclosure', () => {
    it('includes Helmet security headers and strips X-Powered-By', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('7. Data Privacy & Phone Masking', () => {
    it('masks phone numbers in public provider search results', async () => {
      const res = await request(app).get('/api/v1/providers');

      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBeGreaterThan(0);

      for (const prov of res.body.data.providers) {
        // Phone must be masked (contains XXXXX or asterisks)
        expect(prov.phone).toMatch(/(?:X{3,}|\*{3,})/);
        expect(prov.phone).not.toBe('9800033344');
        expect(prov.phone).not.toBe('9800055566');
      }
    });

    it('only reveals unmasked phone via click-to-contact lead generation endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set(customerAuth)
        .send({
          providerId: providerA._id.toString(),
          type: 'call',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.phone).toBe('9800033344');
    });
  });
});
