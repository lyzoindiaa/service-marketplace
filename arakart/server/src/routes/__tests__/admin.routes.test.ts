import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { User } from '../../models/User.model';
import { Report } from '../../models/Report.model';
import { Lead } from '../../models/Lead.model';
import { makeUser, makeProvider } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Admin Service & Routes (BE-011)', () => {
  let adminUser: any;
  let adminAuthHeader: { Authorization: string };
  let customerUser: any;
  let customerAuthHeader: { Authorization: string };
  let sellerUser: any;
  let sellerAuthHeader: { Authorization: string };
  let pendingProvider: any;
  let approvedProvider: any;

  beforeEach(async () => {
    adminUser = await makeUser({ role: 'admin', email: 'admin@arakart.test' });
    adminAuthHeader = authHeaderFor(adminUser);

    customerUser = await makeUser({ role: 'customer', phone: '9800011122' });
    customerAuthHeader = authHeaderFor(customerUser);

    sellerUser = await makeUser({ role: 'seller', phone: '9800033344' });
    sellerAuthHeader = authHeaderFor(sellerUser);

    pendingProvider = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Pending Mistri Works',
      status: 'pending',
      isLive: false,
      verified: false,
    });

    approvedProvider = await makeProvider({
      nameEn: 'Approved Electrician Ara',
      status: 'approved',
      isLive: true,
      verified: true,
    });
  });

  describe('Authorization Safeguards', () => {
    it('returns 403 Forbidden when a customer attempts to access admin dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set(customerAuthHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 Forbidden when a seller attempts to access admin sellers pending list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/sellers/pending')
        .set(sellerAuthHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/dashboard', () => {
    it('returns platform KPIs (users, sellers, pending, leads)', async () => {
      await Lead.create({
        provider: approvedProvider._id,
        customer: customerUser._id,
        customerName: 'Pooja Singh',
        customerPhone: '9800011122',
        type: 'call',
        status: 'new',
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('totalSellers');
      expect(res.body.data).toHaveProperty('pendingSellers');
      expect(res.body.data).toHaveProperty('totalLeads');
      expect(res.body.data.pendingSellers).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Seller Applications: Approve & Reject', () => {
    it('GET /api/v1/admin/sellers/pending returns list of pending sellers', async () => {
      const res = await request(app)
        .get('/api/v1/admin/sellers/pending')
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.sellers)).toBe(true);
      const names = res.body.data.sellers.map((s: any) => s.nameEn);
      expect(names).toContain('Pending Mistri Works');
      expect(names).not.toContain('Approved Electrician Ara');
    });

    it('POST /api/v1/admin/sellers/:id/approve marks seller approved, live, and verified', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/sellers/${pendingProvider._id}/approve`)
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.isLive).toBe(true);
      expect(res.body.data.verified).toBe(true);

      const dbRecord = await Provider.findById(pendingProvider._id);
      expect(dbRecord?.status).toBe('approved');
      expect(dbRecord?.isLive).toBe(true);
      expect(dbRecord?.verified).toBe(true);
    });

    it('POST /api/v1/admin/sellers/:id/reject marks seller rejected and unpublishes listing', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/sellers/${pendingProvider._id}/reject`)
        .set(adminAuthHeader)
        .send({ reason: 'Incomplete business documents' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.isLive).toBe(false);

      const dbRecord = await Provider.findById(pendingProvider._id);
      expect(dbRecord?.status).toBe('rejected');
      expect(dbRecord?.isLive).toBe(false);
    });
  });

  describe('User Management & Suspension', () => {
    it('GET /api/v1/admin/users lists all registered users with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=10')
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);
    });

    it('PATCH /api/v1/admin/users/:id/suspend toggles isSuspended on user', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerUser._id}/suspend`)
        .set(adminAuthHeader)
        .send({ suspended: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suspended).toBe(true);

      const dbUser = await User.findById(customerUser._id);
      expect(dbUser?.suspended).toBe(true);

      // Verify suspended user is blocked from authenticated routes
      const blockedRes = await request(app)
        .get('/api/v1/auth/me')
        .set(customerAuthHeader);

      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.message).toMatch(/suspended/i);
    });
  });

  describe('Report Moderation & Live Activity', () => {
    let testReport: any;

    beforeEach(async () => {
      testReport = await Report.create({
        provider: approvedProvider._id,
        reportedBy: customerUser._id,
        reason: 'wrong_info',
        details: 'Incorrect phone number',
        status: 'open',
      });
    });

    it('GET /api/v1/admin/reports lists open reports', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reports).toHaveLength(1);
      expect(res.body.data.reports[0].reason).toBe('wrong_info');
    });

    it('PATCH /api/v1/admin/reports/:id resolves report with admin notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${testReport._id}`)
        .set(adminAuthHeader)
        .send({ status: 'resolved', adminNote: 'Seller phone corrected' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('resolved');

      const dbReport = await Report.findById(testReport._id);
      expect(dbReport?.status).toBe('resolved');
      expect(dbReport?.adminNote).toBe('Seller phone corrected');
    });

    it('GET /api/v1/admin/activity returns recent activity log stream', async () => {
      const res = await request(app)
        .get('/api/v1/admin/activity')
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.activity)).toBe(true);
    });
  });
});
