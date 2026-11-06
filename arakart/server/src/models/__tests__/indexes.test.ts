import { setupTestDB } from '../../tests/setup/testSetup';
import { syncAllIndexes } from '../../scripts/syncIndexes';
import { Provider, VerificationCode, Review, User } from '../';

setupTestDB();

describe('Database Indexes Verification (DB-002)', () => {
  beforeAll(async () => {
    await syncAllIndexes();
  });

  it('verifies Provider collection has compound search index and text index', async () => {
    const indexes = await Provider.listIndexes();
    const indexNames = indexes.map((i) => i.name);

    expect(indexNames).toContain('city_1_status_1_isLive_1_categories_1');
    expect(indexNames).toContain('city_1_areaKey_1');

    // Text index
    const textIndex = indexes.find((i) => i.name.includes('text') || i.key._fts === 'text');
    expect(textIndex).toBeDefined();
  });

  it('verifies VerificationCode collection has TTL index on expiresAt', async () => {
    const indexes = await VerificationCode.listIndexes();
    const ttlIndex = indexes.find((i) => i.key.expiresAt !== undefined);

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex?.expireAfterSeconds).toBe(0);
  });

  it('verifies Review collection has unique compound index on provider and customer', async () => {
    const indexes = await Review.listIndexes();
    const uniqueReviewIndex = indexes.find(
      (i) => i.key.provider === 1 && i.key.customer === 1
    );

    expect(uniqueReviewIndex).toBeDefined();
    expect(uniqueReviewIndex?.unique).toBe(true);
  });

  it('verifies User collection has unique sparse indexes on email, phone, and googleId', async () => {
    const indexes = await User.listIndexes();
    const emailIndex = indexes.find((i) => i.key.email === 1);
    const phoneIndex = indexes.find((i) => i.key.phone === 1);
    const googleIndex = indexes.find((i) => i.key.googleId === 1);

    expect(emailIndex?.unique).toBe(true);
    expect(emailIndex?.sparse).toBe(true);

    expect(phoneIndex?.unique).toBe(true);
    expect(phoneIndex?.sparse).toBe(true);

    expect(googleIndex?.unique).toBe(true);
    expect(googleIndex?.sparse).toBe(true);
  });
});
