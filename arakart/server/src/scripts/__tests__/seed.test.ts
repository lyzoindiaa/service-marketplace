import mongoose from 'mongoose';
import { setupTestDB } from '../../tests/setup/testSetup';
import { runSeed } from '../seed';
import { Category } from '../../models/Category.model';
import { City } from '../../models/City.model';
import { User } from '../../models/User.model';
import { Provider } from '../../models/Provider.model';
import { Review } from '../../models/Review.model';
import { Lead } from '../../models/Lead.model';

setupTestDB();

describe('Seed Script (DB-003)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Base Seed', () => {
    it('seeds 8 categories, Ara city live, and 1 admin user on an empty database', async () => {
      const summary = await runSeed({ demo: false });

      expect(summary.categoriesInserted).toBe(8);
      expect(summary.citiesInserted).toBeGreaterThanOrEqual(1);
      expect(summary.adminCreated).toBe(true);

      const categoryCount = await Category.countDocuments();
      expect(categoryCount).toBe(8);

      const araCity = await City.findOne({ slug: 'ara' });
      expect(araCity).not.toBeNull();
      expect(araCity?.isLive).toBe(true);
      expect(araCity?.nameHi).toBe('आरा');

      const adminUser = await User.findOne({ role: 'admin' });
      expect(adminUser).not.toBeNull();
      expect(adminUser?.role).toBe('admin');

      // Base seed should not insert any demo providers or reviews
      const providerCount = await Provider.countDocuments();
      expect(providerCount).toBe(0);
    });

    it('is strictly idempotent — running base seed twice does not duplicate records', async () => {
      await runSeed({ demo: false });
      const firstCategoryCount = await Category.countDocuments();
      const firstCityCount = await City.countDocuments();
      const firstUserCount = await User.countDocuments();

      // Second run
      const secondSummary = await runSeed({ demo: false });
      expect(secondSummary.categoriesInserted).toBe(0);
      expect(secondSummary.categoriesSkipped).toBe(8);

      const secondCategoryCount = await Category.countDocuments();
      const secondCityCount = await City.countDocuments();
      const secondUserCount = await User.countDocuments();

      expect(secondCategoryCount).toBe(firstCategoryCount);
      expect(secondCityCount).toBe(firstCityCount);
      expect(secondUserCount).toBe(firstUserCount);
    });
  });

  describe('Demo Mode Safeguards & Seeding', () => {
    it('refuses to run demo seed when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(runSeed({ demo: true })).rejects.toThrow(
        /demo seed is strictly disallowed in production/i
      );

      const providerCount = await Provider.countDocuments();
      expect(providerCount).toBe(0);
    });

    it('seeds demo customer, seller, ~12 Ara providers, reviews, and leads in demo mode', async () => {
      process.env.NODE_ENV = 'development';

      const summary = await runSeed({ demo: true });

      expect(summary.demoProvidersInserted).toBeGreaterThanOrEqual(10);
      expect(summary.demoReviewsInserted).toBeGreaterThanOrEqual(1);
      expect(summary.demoLeadsInserted).toBeGreaterThanOrEqual(1);

      const providers = await Provider.find({ city: 'ara' });
      expect(providers.length).toBeGreaterThanOrEqual(10);

      for (const p of providers) {
        expect(p.city).toBe('ara');
        expect(p.status).toBe('approved');
        expect(p.isLive).toBe(true);
        expect(p.area).toBeTruthy();
        expect(p.areaKey).toBeTruthy();
        expect(p.phone).toBeTruthy();
        expect(p.categories.length).toBeGreaterThanOrEqual(1);
      }

      // Check that distinct localities include realistic Ara localities
      const distinctAreas = await Provider.distinct('area', { city: 'ara' });
      expect(distinctAreas.length).toBeGreaterThanOrEqual(5);

      // Verify idempotency of demo seed
      const secondSummary = await runSeed({ demo: true });
      expect(secondSummary.demoProvidersInserted).toBe(0);
      const secondProviderCount = await Provider.countDocuments();
      expect(secondProviderCount).toBe(providers.length);
    });
  });
});
