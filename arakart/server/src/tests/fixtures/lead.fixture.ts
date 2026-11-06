import { Lead, ILead } from '../../models/Lead.model';
import { makeProvider } from './provider.fixture';

export const makeLead = async (overrides: Partial<ILead> = {}): Promise<ILead> => {
  let providerId = overrides.provider;
  if (!providerId) {
    const provider = await makeProvider();
    providerId = provider._id;
  }

  return await Lead.create({
    provider: providerId,
    customer: overrides.customer ?? null,
    customerName: overrides.customerName || 'Customer Lead',
    customerPhone: overrides.customerPhone || '9876543210',
    type: overrides.type || 'call',
    service: overrides.service ?? 'General service',
    status: overrides.status || 'new',
    ...overrides,
  });
};
