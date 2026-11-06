import { ConsoleEmailProvider } from '../ConsoleEmailProvider';
import { getEmailProvider } from '../index';

describe('Email Delivery Adapters (INT-006)', () => {
  it('ConsoleEmailProvider logs email code offline without network calls', async () => {
    const provider = new ConsoleEmailProvider();
    const result = await provider.sendVerification('test@example.com', '654321', 'verify_email');

    expect(result).toBe(true);
    expect(provider.getLastSent('test@example.com')).toBe('654321');
  });

  it('factory defaults to console provider in dev/test', () => {
    const provider = getEmailProvider();
    expect(provider).toBeInstanceOf(ConsoleEmailProvider);
  });
});
