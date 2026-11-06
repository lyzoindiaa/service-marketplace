import bcrypt from 'bcryptjs';

/**
 * Generate a random 6-digit numeric verification code.
 */
export const generateCode = (): string => {
  const codeNum = Math.floor(100000 + Math.random() * 900000);
  return codeNum.toString();
};

/**
 * Hash verification code with bcrypt.
 */
export const hashCode = async (code: string): Promise<string> => {
  return bcrypt.hash(code, 10);
};

/**
 * Compare plain text code with bcrypt hash.
 */
export const verifyCodeHash = async (code: string, codeHash: string): Promise<boolean> => {
  return bcrypt.compare(code, codeHash);
};
