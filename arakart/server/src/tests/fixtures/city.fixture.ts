import { City, ICity } from '../../models/City.model';

let cityCounter = 1;

export const makeCity = async (overrides: Partial<ICity> = {}): Promise<ICity> => {
  const count = cityCounter++;

  return await City.create({
    slug: overrides.slug || `city-${count}`,
    nameEn: overrides.nameEn || `City ${count}`,
    nameHi: overrides.nameHi || `शहर ${count}`,
    isLive: overrides.isLive ?? true,
    ...overrides,
  });
};
