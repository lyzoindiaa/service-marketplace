import { setupTestDB } from '../../setup/testSetup';
import {
  makeUser,
  makeProvider,
  makeReview,
  makeLead,
  makeCategory,
  makeCity,
  makeVerificationCode,
} from '../index';
import { authHeaderFor } from '../../helpers/auth.helper';
import { verifyAccessToken } from '../../../utils/jwt.utils';

setupTestDB();

describe('Test Fixtures & Auth Helper (DB-004)', () => {
  it('creates user fixture with customizable overrides', async () => {
    const user = await makeUser({ name: 'Special Customer', role: 'customer' });
    expect(user.name).toBe('Special Customer');
    expect(user.role).toBe('customer');
    expect(user.phone).toBeDefined();
  });

  it('generates a valid Bearer token via authHeaderFor helper', async () => {
    const user = await makeUser({ role: 'seller' });
    const headers = authHeaderFor(user);

    expect(headers).toHaveProperty('Authorization');
    expect(headers.Authorization.startsWith('Bearer ')).toBe(true);

    const token = headers.Authorization.replace('Bearer ', '');
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(user._id.toString());
    expect(decoded.role).toBe('seller');
  });

  it('creates provider fixture with nested services and derived fromPrice', async () => {
    const provider = await makeProvider({
      services: [
        { nameEn: 'Basic Wash', startingPrice: 150 },
        { nameEn: 'Deep Clean', startingPrice: 400 },
      ],
    });

    expect(provider.fromPrice).toBe(150);
    expect(provider.area).toBe('Nawada');
    expect(provider.city).toBe('ara');
  });

  it('creates review and lead fixtures linked to provider', async () => {
    const review = await makeReview({ rating: 4, comment: 'Quick fix' });
    expect(review.rating).toBe(4);
    expect(review.provider).toBeDefined();

    const lead = await makeLead({ type: 'whatsapp' });
    expect(lead.type).toBe('whatsapp');
    expect(lead.status).toBe('new');
  });

  it('creates category, city and verification code fixtures', async () => {
    const cat = await makeCategory({ slug: 'electrician' });
    expect(cat.slug).toBe('electrician');

    const city = await makeCity({ slug: 'ara' });
    expect(city.slug).toBe('ara');

    const code = await makeVerificationCode({ channel: 'email', target: 'user@test.local' });
    expect(code.channel).toBe('email');
  });
});
