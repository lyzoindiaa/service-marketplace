import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { Category } from '../../models/Category.model';
import { City } from '../../models/City.model';
import { Provider } from '../../models/Provider.model';
import { makeUser, makeProvider, makeCategory, makeCity } from '../../tests/fixtures';
import { authHeaderFor } from '../../tests/helpers/auth.helper';

setupTestDB();

describe('Discovery Routes — Categories, Cities & Dynamic Localities (BE-012)', () => {
  describe('Category Endpoints', () => {
    it('GET /api/v1/categories returns list of enabled categories publicly', async () => {
      await makeCategory({ nameEn: 'Plumber', slug: 'plumber', enabled: true });
      await makeCategory({ nameEn: 'Electrician', slug: 'electrician', enabled: true });
      await makeCategory({ nameEn: 'Draft Category', slug: 'draft', enabled: false });

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.some((c: any) => c.slug === 'plumber')).toBe(true);
      expect(res.body.data.some((c: any) => c.slug === 'draft')).toBe(false);
    });

    it('POST /api/v1/categories creates a new category when called by admin', async () => {
      const admin = await makeUser({ role: 'admin' });

      const payload = {
        nameEn: 'Carpentry Services',
        nameHi: 'बढ़ई का काम',
        slug: 'carpentry',
        icon: 'hammer',
      };

      const res = await request(app)
        .post('/api/v1/categories')
        .set(authHeaderFor(admin))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('carpentry');
      expect(res.body.data.nameEn).toBe('Carpentry Services');

      const inDb = await Category.findOne({ slug: 'carpentry' });
      expect(inDb).not.toBeNull();
    });

    it('POST /api/v1/categories returns 403 Forbidden for customer or seller users', async () => {
      const customer = await makeUser({ role: 'customer' });

      const res = await request(app)
        .post('/api/v1/categories')
        .set(authHeaderFor(customer))
        .send({
          nameEn: 'Hacking Category',
          nameHi: 'अवैध',
          slug: 'hack',
          icon: 'alert',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/v1/categories/:id/toggle flips the enabled status for admin', async () => {
      const admin = await makeUser({ role: 'admin' });
      const cat = await makeCategory({ enabled: true });

      const res = await request(app)
        .patch(`/api/v1/categories/${cat._id}/toggle`)
        .set(authHeaderFor(admin));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enabled).toBe(false);

      const updated = await Category.findById(cat._id);
      expect(updated?.enabled).toBe(false);
    });
  });

  describe('City Endpoints & Dynamic Localities Aggregation', () => {
    it('GET /api/v1/cities returns all cities publicly', async () => {
      await makeCity({ nameEn: 'Ara', nameHi: 'आरा', slug: 'ara', isLive: true });
      await makeCity({ nameEn: 'Patna', nameHi: 'पटना', slug: 'patna', isLive: false });

      const res = await request(app).get('/api/v1/cities');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('GET /api/v1/cities/:slug/areas aggregates distinct seller-defined localities for that city', async () => {
      await makeCity({ nameEn: 'Ara', nameHi: 'आरा', slug: 'ara', isLive: true });

      const seller1 = await makeUser({ role: 'seller' });
      const seller2 = await makeUser({ role: 'seller' });
      const seller3 = await makeUser({ role: 'seller' });

      // Provider 1: in Ara, active & live, covers Nawada and Katira
      await makeProvider({
        owner: seller1._id,
        city: 'Ara',
        area: 'Nawada',
        areasServed: ['Katira', 'Nawada', 'Shivganj'],
        status: 'approved',
        isLive: true,
      });

      // Provider 2: in Ara, active & live, covers Anaith and Katira (duplicate Katira)
      await makeProvider({
        owner: seller2._id,
        city: 'Ara',
        area: 'Anaith',
        areasServed: ['Katira', 'Gopali Chowk'],
        status: 'approved',
        isLive: true,
      });

      // Provider 3: in Ara, but pending approval -> localities should NOT be included
      await makeProvider({
        owner: seller3._id,
        city: 'Ara',
        area: 'Secret Unapproved Area',
        areasServed: ['Unapproved Colony'],
        status: 'pending',
        isLive: false,
      });

      const res = await request(app).get('/api/v1/cities/ara/areas');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.city).toBe('Ara');
      expect(res.body.data.slug).toBe('ara');
      expect(Array.isArray(res.body.data.areas)).toBe(true);

      const areas: string[] = res.body.data.areas;
      expect(areas).toContain('Nawada');
      expect(areas).toContain('Katira');
      expect(areas).toContain('Shivganj');
      expect(areas).toContain('Anaith');
      expect(areas).toContain('Gopali Chowk');
      expect(areas).not.toContain('Secret Unapproved Area');
      expect(areas).not.toContain('Unapproved Colony');

      // Check no duplicates and sorted alphabetically
      const uniqueCount = new Set(areas).size;
      expect(areas.length).toBe(uniqueCount);
      const sorted = [...areas].sort((a, b) => a.localeCompare(b));
      expect(areas).toEqual(sorted);
    });

    it('GET /api/v1/cities/:slug/areas returns 404 for non-existent city', async () => {
      const res = await request(app).get('/api/v1/cities/non-existent-city/areas');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/city not found/i);
    });

    it('POST /api/v1/cities creates a city when called by admin', async () => {
      const admin = await makeUser({ role: 'admin' });

      const res = await request(app)
        .post('/api/v1/cities')
        .set(authHeaderFor(admin))
        .send({
          nameEn: 'Buxar',
          nameHi: 'बक्सर',
          slug: 'buxar',
          isLive: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('buxar');

      const inDb = await City.findOne({ slug: 'buxar' });
      expect(inDb).not.toBeNull();
    });

    it('PATCH /api/v1/cities/:id/toggle flips isLive status for admin', async () => {
      const admin = await makeUser({ role: 'admin' });
      const city = await makeCity({ slug: 'testcity', isLive: false });

      const res = await request(app)
        .patch(`/api/v1/cities/${city._id}/toggle`)
        .set(authHeaderFor(admin));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isLive).toBe(true);

      const inDb = await City.findById(city._id);
      expect(inDb?.isLive).toBe(true);
    });
  });
});
