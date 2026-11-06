import { Review, IReview } from '../../models/Review.model';
import { makeUser } from './user.fixture';
import { makeProvider } from './provider.fixture';

export const makeReview = async (overrides: Partial<IReview> = {}): Promise<IReview> => {
  let providerId = overrides.provider;
  if (!providerId) {
    const provider = await makeProvider();
    providerId = provider._id;
  }

  let customerId = overrides.customer;
  let customerName = overrides.customerName;
  if (!customerId) {
    const customer = await makeUser({ role: 'customer' });
    customerId = customer._id;
    customerName = customerName || customer.name;
  }

  return await Review.create({
    provider: providerId,
    customer: customerId,
    customerName: customerName || 'Amit Kumar',
    rating: overrides.rating ?? 5,
    comment: overrides.comment || 'Prompt and polite service, highly recommended!',
    sellerReply: overrides.sellerReply ?? null,
    sellerRepliedAt: overrides.sellerRepliedAt ?? null,
    ...overrides,
  });
};
