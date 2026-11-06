import { SmsProvider } from './SmsProvider';
import { ConsoleSmsProvider } from './ConsoleSmsProvider';
import { Msg91SmsProvider } from './Msg91SmsProvider';

let instance: SmsProvider | null = null;

export const getSmsProvider = (): SmsProvider => {
  if (!instance) {
    const providerType = process.env.SMS_PROVIDER || 'console';
    if (providerType === 'msg91' && process.env.NODE_ENV === 'production') {
      instance = new Msg91SmsProvider();
    } else {
      instance = new ConsoleSmsProvider();
    }
  }
  return instance;
};

export * from './SmsProvider';
export * from './ConsoleSmsProvider';
export * from './Msg91SmsProvider';
