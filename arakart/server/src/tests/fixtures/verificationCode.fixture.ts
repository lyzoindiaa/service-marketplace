import { VerificationCode, IVerificationCode } from '../../models/VerificationCode.model';

export const makeVerificationCode = async (
  overrides: Partial<IVerificationCode> = {}
): Promise<IVerificationCode> => {
  return await VerificationCode.create({
    channel: overrides.channel || 'phone',
    target: overrides.target || '9876543210',
    purpose: overrides.purpose || 'login',
    codeHash: overrides.codeHash || '$2a$10$hashed_test_code_placeholder',
    attempts: overrides.attempts ?? 0,
    expiresAt: overrides.expiresAt || new Date(Date.now() + 10 * 60 * 1000),
    ...overrides,
  });
};
