import { SmsProvider } from './SmsProvider';
import { logger } from '../../utils/logger';

export class Msg91SmsProvider implements SmsProvider {
  private authKey: string;
  private templateId: string;

  constructor(authKey = process.env.MSG91_AUTH_KEY || '', templateId = process.env.MSG91_TEMPLATE_ID || '') {
    this.authKey = authKey;
    this.templateId = templateId;
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    if (!this.authKey) {
      logger.warn('[MSG91] Auth key missing, falling back to log output');
      logger.info(`[MSG91-SIMULATED] OTP for +91-${phone}: ${otp}`);
      return true;
    }

    try {
      // MSG91 OTP API dispatch
      const url = `https://control.msg91.com/api/v5/otp?template_id=${this.templateId}&mobile=91${phone}&otp=${otp}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`MSG91 API error: ${response.statusText}`);
      }

      return true;
    } catch (err: any) {
      logger.error('[MSG91] Failed to dispatch SMS:', err);
      throw new Error('SMS service temporarily unavailable');
    }
  }
}
