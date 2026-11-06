import { ConsoleSmsProvider } from '../ConsoleSmsProvider';
import { getSmsProvider } from '../index';
import { env } from '../../../config/env';

describe('SMS Delivery Adapters (INT-006)', () => {
  it('ConsoleSmsProvider sends SMS offline and logs without network call', async () => {
    const provider = new ConsoleSmsProvider();
    const result = await provider.sendOtp('9800012345', '123456');

    expect(result).toBe(true);
    expect(provider.getLastSent('9800012345')).toBe('123456');
  });

  it('factory defaults to console provider in dev/test', () => {
    const provider = getSmsProvider();
    expect(provider).toBeInstanceOf(ConsoleSmsProvider);
  });
});
