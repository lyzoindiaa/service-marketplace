import { Category, ICategory } from '../../models/Category.model';

let catCounter = 1;

export const makeCategory = async (overrides: Partial<ICategory> = {}): Promise<ICategory> => {
  const count = catCounter++;

  return await Category.create({
    slug: overrides.slug || `category-${count}`,
    nameEn: overrides.nameEn || `Category ${count}`,
    nameHi: overrides.nameHi || `श्रेणी ${count}`,
    icon: overrides.icon || 'tool',
    enabled: overrides.enabled ?? true,
    ...overrides,
  });
};
