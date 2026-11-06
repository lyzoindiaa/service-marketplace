import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Provider } from '../../models/Provider.model';
import { Lead } from '../../models/Lead.model';
import { makeUser, makeProvider } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';
import * as socketConfig from '../../config/socket';

setupTestDB();

describe('Lead Service & Routes (BE-008)', () => {
  let customerUser: any;
  let sellerUser: any;
  let providerDoc: any;
  let emitSpy: any;

  beforeEach(async () => {
    emitSpy = jest.spyOn(socketConfig, 'emitToSeller').mockImplementation(() => {});

    customerUser = await makeUser({
      name: 'Rohan Verma',
      phone: '9800012345',
      role: 'customer',
    });

    sellerUser = await makeUser({
      name: 'Vikram Singh',
      role: 'seller',
    });

    providerDoc = await makeProvider({
      owner: sellerUser._id,
      nameEn: 'Vikram Plumber & Sanitary',
      phone: '9876543210',
      whatsapp: '9876543210',
      callClicks: 5,
      whatsappClicks: 3,
      status: 'approved',
      isLive: true,
    });

    // Link seller's sellerId to providerDoc
    sellerUser.sellerId = providerDoc._id;
    await sellerUser.save();
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  describe('POST /api/v1/leads — Create Lead on Click', () => {
    it('creates a call lead with customer JWT, increments callClicks, emits socket event, and returns unmasked phone', async () => {
      const payload = {
        providerId: providerDoc._id.toString(),
        type: 'call',
        service: 'Pipe Repair',
      };

      const res = await request(app)
        .post('/api/v1/leads')
        .set(authHeaderFor(customerUser))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lead).toBeDefined();
      expect(res.body.data.lead.type).toBe('call');
      expect(res.body.data.lead.customerName).toBe('Rohan Verma');
      expect(res.body.data.lead.customerPhone).toBe('9800012345');
      expect(res.body.data.lead.service).toBe('Pipe Repair');

      // Unmasked phone returned so frontend can initiate tel: call
      expect(res.body.data.phone).toBe('9876543210');

      // Verify DB Lead document created
      const inDb = await Lead.findOne({ provider: providerDoc._id });
      expect(inDb).not.toBeNull();
      expect(inDb?.type).toBe('call');

      // Verify atomic click increment on provider
      const updatedProvider = await Provider.findById(providerDoc._id);
      expect(updatedProvider?.callClicks).toBe(6);

      // Verify Socket.IO emit called with seller room
      expect(emitSpy).toHaveBeenCalledWith(
        sellerUser._id.toString(),
        'newLead',
        expect.objectContaining({
          type: 'call',
          customerName: 'Rohan Verma',
        })
      );
    });

    it('creates a whatsapp lead and increments whatsappClicks', async () => {
      const payload = {
        providerId: providerDoc._id.toString(),
        type: 'whatsapp',
      };

      const res = await request(app)
        .post('/api/v1/leads')
        .set(authHeaderFor(customerUser))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.whatsapp).toBe('9876543210');

      const updatedProvider = await Provider.findById(providerDoc._id);
      expect(updatedProvider?.whatsappClicks).toBe(4);
    });

    it('returns 401 when creating lead without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({ providerId: providerDoc._id.toString(), type: 'call' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when type or providerId is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set(authHeaderFor(customerUser))
        .send({ providerId: 'invalid-id', type: 'email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/leads/seller — Seller Lead Inbox', () => {
    it('returns paginated leads for seller with seller JWT', async () => {
      // Create 2 test leads for this provider
      await Lead.create({
        provider: providerDoc._id,
        customer: customerUser._id,
        customerName: 'Customer 1',
        customerPhone: '9800011111',
        type: 'call',
        status: 'new',
      });

      await Lead.create({
        provider: providerDoc._id,
        customer: customerUser._id,
        customerName: 'Customer 2',
        customerPhone: '9800022222',
        type: 'whatsapp',
        status: 'new',
      });

      const res = await request(app)
        .get('/api/v1/leads/seller')
        .set(authHeaderFor(sellerUser));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leads.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('returns 403 when customer tries to access seller leads', async () => {
      const res = await request(app)
        .get('/api/v1/leads/seller')
        .set(authHeaderFor(customerUser));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/leads/:id/status — Update Lead Status', () => {
    it('allows seller to update status of their own lead', async () => {
      const lead = await Lead.create({
        provider: providerDoc._id,
        customer: customerUser._id,
        customerName: 'Customer Test',
        customerPhone: '9800011111',
        type: 'call',
        status: 'new',
      });

      const res = await request(app)
        .patch(`/api/v1/leads/${lead._id}/status`)
        .set(authHeaderFor(sellerUser))
        .send({ status: 'contacted' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('contacted');

      const inDb = await Lead.findById(lead._id);
      expect(inDb?.status).toBe('contacted');
    });
  });
});
