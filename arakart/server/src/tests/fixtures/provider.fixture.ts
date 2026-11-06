import { Provider, IProvider } from '../../models/Provider.model';
import { makeUser } from './user.fixture';

let providerCounter = 1;

export const makeProvider = async (overrides: Partial<IProvider> = {}): Promise<IProvider> => {
  const count = providerCounter++;

  let ownerId = overrides.owner;
  if (!ownerId) {
    const owner = await makeUser({ role: 'seller' });
    ownerId = owner._id;
  }

  return await Provider.create({
    owner: ownerId,
    nameEn: overrides.nameEn || `Sharma Workshop ${count}`,
    nameHi: overrides.nameHi || `शर्मा वर्कशॉप ${count}`,
    categories: overrides.categories || ['mechanic'],
    area: overrides.area || 'Nawada',
    areasServed: overrides.areasServed || ['Nawada', 'Katira', 'Babu Bazar'],
    city: overrides.city || 'ara',
    phone: overrides.phone || `98${String(count).padStart(8, '1')}`,
    whatsapp: overrides.whatsapp || `98${String(count).padStart(8, '1')}`,
    bioEn: overrides.bioEn || 'Expert automotive repairs and maintenance.',
    bioHi: overrides.bioHi || 'विशेषज्ञ ऑटोमोबाइल मरम्मत सेवा।',
    experience: overrides.experience ?? 8,
    workingHours: overrides.workingHours || 'Mon–Sat, 9:00 AM – 7:00 PM',
    isAllDay: overrides.isAllDay ?? false,
    services: overrides.services || [
      { nameEn: 'General service', startingPrice: 350 },
      { nameEn: 'Brake overhaul', startingPrice: 500 },
    ],
    photos: overrides.photos || [],
    avgRating: overrides.avgRating ?? 4.8,
    reviewCount: overrides.reviewCount ?? 12,
    status: overrides.status || 'approved',
    isLive: overrides.isLive ?? true,
    verified: overrides.verified ?? true,
    ...overrides,
  });
};
