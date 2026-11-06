import { VerificationCode, VerificationChannel, VerificationPurpose } from '../models/VerificationCode.model';
import { generateCode, hashCode, verifyCodeHash } from '../utils/code.utils';
import { getSmsProvider } from './sms';
import { getEmailProvider } from './email';
import { logger } from '../utils/logger';

const COOLDOWN_MS = 60 * 1000; // 60 seconds
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export interface SendCodeResult {
  success: boolean;
  message: string;
  code: string; // available in dev/testing
  cooldownSeconds: number;
}

export class VerificationService {
  /**
   * Normalizes target based on channel
   */
  private normalizeTarget(channel: VerificationChannel, target: string): string {
    if (channel === 'phone') {
      return target.replace(/\D/g, '').slice(-10);
    }
    return target.trim().toLowerCase();
  }

  /**
   * Generate, hash and save a verification code with cooldown enforcement.
   */
  async sendCode(
    channel: VerificationChannel,
    rawTarget: string,
    purpose: VerificationPurpose
  ): Promise<SendCodeResult> {
    const target = this.normalizeTarget(channel, rawTarget);

    const existing = await VerificationCode.findOne({ channel, target, purpose });

    if (existing) {
      const elapsed = Date.now() - new Date(existing.lastSentAt || existing.createdAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        throw new Error(`Please wait ${remaining} seconds before requesting a new code.`);
      }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + EXPIRY_MS);
    const now = new Date();

    if (existing) {
      existing.codeHash = codeHash;
      existing.expiresAt = expiresAt;
      existing.lastSentAt = now;
      existing.attempts = 0;
      await existing.save();
    } else {
      await VerificationCode.create({
        channel,
        target,
        purpose,
        codeHash,
        expiresAt,
        lastSentAt: now,
        attempts: 0,
      });
    }

    // Delivery via configured adapter (SMS or Email)
    if (channel === 'phone') {
      await getSmsProvider().sendOtp(target, code);
    } else {
      await getEmailProvider().sendVerification(target, code, purpose);
    }

    const isProduction = process.env.NODE_ENV === 'production';

    return {
      success: true,
      message: `Verification code sent to ${target}`,
      code: isProduction ? '' : code,
      cooldownSeconds: 60,
    };
  }

  /**
   * Verify input code against stored bcrypt hash, checking expiration and attempts.
   */
  async verifyCode(
    channel: VerificationChannel,
    rawTarget: string,
    purpose: VerificationPurpose,
    inputCode: string
  ): Promise<boolean> {
    const target = this.normalizeTarget(channel, rawTarget);

    const record = await VerificationCode.findOne({ channel, target, purpose });

    if (!record) {
      throw new Error('No active verification code found or code has expired. Please request a new one.');
    }

    if (new Date() > new Date(record.expiresAt)) {
      await VerificationCode.deleteOne({ _id: record._id });
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await VerificationCode.deleteOne({ _id: record._id });
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isMatch = await verifyCodeHash(inputCode, record.codeHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      throw new Error(`Incorrect verification code. ${MAX_ATTEMPTS - record.attempts} attempts remaining.`);
    }

    // Success: consume and delete code so it cannot be reused
    await VerificationCode.deleteOne({ _id: record._id });
    return true;
  }
}

export const verificationService = new VerificationService();
