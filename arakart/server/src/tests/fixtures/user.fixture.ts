import { User, IUser } from '../../models/User.model';

let userCounter = 1;

export const makeUser = async (overrides: Partial<IUser> = {}): Promise<IUser> => {
  const count = userCounter++;
  const defaultPhone = `98${String(count).padStart(8, '0')}`;
  const defaultEmail = `testuser${count}@example.com`;

  return await User.create({
    name: overrides.name || `Test User ${count}`,
    email: overrides.email !== undefined ? overrides.email : defaultEmail,
    emailVerified: overrides.emailVerified ?? true,
    phone: overrides.phone !== undefined ? overrides.phone : defaultPhone,
    phoneVerified: overrides.phoneVerified ?? true,
    authMethods: overrides.authMethods || ['phone'],
    role: overrides.role || 'customer',
    suspended: overrides.suspended ?? false,
    favourites: overrides.favourites || [],
    ...overrides,
  });
};
