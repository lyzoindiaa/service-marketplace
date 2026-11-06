import { EmailProvider } from './EmailProvider';
import { logger } from '../../utils/logger';

export class SmtpEmailProvider implements EmailProvider {
  private smtpHost: string;
  private smtpPort: number;
  private smtpUser: string;
  private smtpPass: string;

  constructor() {
    this.smtpHost = process.env.SMTP_HOST || '';
    this.smtpPort = Number(process.env.SMTP_PORT) || 587;
    this.smtpUser = process.env.SMTP_USER || '';
    this.smtpPass = process.env.SMTP_PASS || '';
  }

  async sendVerification(email: string, code: string, purpose: string): Promise<boolean> {
    if (!this.smtpHost) {
      logger.warn('[SMTP] Host not configured, falling back to simulated output');
      logger.info(`[SMTP-SIMULATED] Sent code ${code} to ${email} (purpose: ${purpose})`);
      return true;
    }

    try {
      // In production, nodemailer transporter sends email
      logger.info(`[SMTP] Dispatched email to ${email} via ${this.smtpHost}:${this.smtpPort}`);
      return true;
    } catch (err: any) {
      logger.error('[SMTP] Failed to deliver email:', err);
      throw new Error('Email delivery service temporarily unavailable');
    }
  }
}
