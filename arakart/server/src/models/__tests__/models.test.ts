import { setupTestDB } from '../../tests/setup/testSetup';
import { User } from '../User.model';
import { Provider } from '../Provider.model';
import { VerificationCode } from '../VerificationCode.model';
import { Review } from '../Review.model';
import { Category } from '../Category.model';
import { City } from '../City.model';

setupTestDB();

describe('Mongoose Models (DB-001)', () => {
  it('creates user with email + password and removes passwordHash in toJSON', async () => {
    const user = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      passwordHash: 'hashed_pw_secret',
      authMethods: ['email'],
      role: 'customer',
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('rohan@example.com');

    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  it('rejects user without any auth credential (email, phone, googleId)', async () => {
    await expect(
      User.create({
        name: 'Invalid User',
        role: 'customer',
      })
    ).rejects.toThrow();
  });

  it('recalculates provider fromPrice as minimum service price on save', async () => {
    const user = await User.create({
      name: 'Seller Rakesh',
      phone: '9876543210',
      authMethods: ['phone'],
      role: 'seller',
    });

    const provider = await Provider.create({
      owner: user._id,
      nameEn: 'Sharma Auto Works',
      categories: ['mechanic'],
      area: 'Nawada',
      areasServed: ['Nawada', 'Katira'],
      city: 'ara',
      phone: '9876543210',
      services: [
        { nameEn: 'Wheel alignment', startingPrice: 600 },
        { nameEn: 'Brake inspection', startingPrice: 250 },
        { nameEn: 'Engine oil change', startingPrice: 450 },
      ],
    });

    expect(provider.fromPrice).toBe(250);
    expect(provider.areaKey).toBe('nawada');
    expect(provider.areasServedKeys).toEqual(['nawada', 'katira']);
  });

  it('enforces unique compound index on Review (one review per customer per provider)', async () => {
    const customer = await User.create({
      name: 'Customer Amit',
      phone: '9811122334',
      authMethods: ['phone'],
    });

    const providerUser = await User.create({
      name: 'Provider Hari',
      phone: '9822233445',
      authMethods: ['phone'],
    });

    const provider = await Provider.create({
      owner: providerUser._id,
      nameEn: 'Hari Electricals',
      categories: ['electrician'],
      area: 'Katira',
      city: 'ara',
      phone: '9822233445',
    });

    await Review.create({
      provider: provider._id,
      customer: customer._id,
      customerName: customer.name,
      rating: 5,
      comment: 'Excellent work!',
    });

    // Second review from same customer for same provider must fail unique constraint
    await expect(
      Review.create({
        provider: provider._id,
        customer: customer._id,
        customerName: customer.name,
        rating: 4,
        comment: 'Second attempt',
      })
    ).rejects.toThrow();
  });

  it('hides codeHash in VerificationCode on toJSON', async () => {
    const code = await VerificationCode.create({
      channel: 'phone',
      target: '9876543210',
      purpose: 'login',
      codeHash: 'secret_bcrypt_code_hash',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const json = code.toJSON();
    expect(json.codeHash).toBeUndefined();
    expect(json.channel).toBe('phone');
  });

  it('creates Category and City models', async () => {
    const cat = await Category.create({
      slug: 'mechanic',
      nameEn: 'Mechanic',
      nameHi: 'मैकेनिक',
      icon: 'wrench',
    });
    expect(cat.slug).toBe('mechanic');

    const city = await City.create({
      slug: 'ara',
      nameEn: 'Ara',
      nameHi: 'आरा',
      isLive: true,
    });
    expect(city.isLive).toBe(true);
  });
});
