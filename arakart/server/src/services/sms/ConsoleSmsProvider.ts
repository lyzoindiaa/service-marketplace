import { SmsProvider } from './SmsProvider';
import { logger } from '../../utils/logger';

export class ConsoleSmsProvider implements SmsProvider {
  private lastSentMap: Map<string, string> = new Map();

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    this.lastSentMap.set(phone, otp);
    logger.info(`[SMS-CONSOLE] OTP for +91-${phone}: ${otp}`);
    return true;
  }

  getLastSent(phone: string): string | undefined {
    return this.lastSentMap.get(phone);
  }
}
