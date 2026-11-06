import { EmailProvider } from './EmailProvider';
import { ConsoleEmailProvider } from './ConsoleEmailProvider';
import { SmtpEmailProvider } from './SmtpEmailProvider';

let instance: EmailProvider | null = null;

export const getEmailProvider = (): EmailProvider => {
  if (!instance) {
    const providerType = process.env.EMAIL_PROVIDER || 'console';
    if (providerType === 'smtp' && process.env.NODE_ENV === 'production') {
      instance = new SmtpEmailProvider();
    } else {
      instance = new ConsoleEmailProvider();
    }
  }
  return instance;
};

export * from './EmailProvider';
export * from './ConsoleEmailProvider';
export * from './SmtpEmailProvider';
