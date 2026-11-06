import { EmailProvider } from './EmailProvider';
import { logger } from '../../utils/logger';

export class ConsoleEmailProvider implements EmailProvider {
  private lastSentMap: Map<string, string> = new Map();

  async sendVerification(email: string, code: string, purpose: string): Promise<boolean> {
    this.lastSentMap.set(email, code);
    logger.info(`[EMAIL-CONSOLE] Code for ${email} (purpose: ${purpose}): ${code}`);
    return true;
  }

  getLastSent(email: string): string | undefined {
    return this.lastSentMap.get(email);
  }
}
