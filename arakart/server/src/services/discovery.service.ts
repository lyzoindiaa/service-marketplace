import { Category, ICategory } from '../models/Category.model';
import { City, ICity } from '../models/City.model';
import { Provider } from '../models/Provider.model';

export interface CreateCategoryInput {
  nameEn: string;
  nameHi: string;
  slug: string;
  icon: string;
  enabled?: boolean;
}

export interface CreateCityInput {
  nameEn: string;
  nameHi: string;
  slug: string;
  isLive?: boolean;
}

export class DiscoveryService {
  // Categories
  async getCategories(includeDisabled: boolean = false): Promise<ICategory[]> {
    const filter = includeDisabled ? {} : { enabled: true };
    return Category.find(filter).sort({ nameEn: 1 });
  }

  async createCategory(data: CreateCategoryInput): Promise<ICategory> {
    const slug = data.slug.toLowerCase().trim();
    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new Error(`Category with slug '${slug}' already exists`);
    }
    const cat = new Category({ ...data, slug });
    return cat.save();
  }

  async toggleCategory(id: string): Promise<ICategory | null> {
    const cat = await Category.findById(id);
    if (!cat) return null;
    cat.enabled = !cat.enabled;
    return cat.save();
  }

  // Cities
  async getCities(): Promise<ICity[]> {
    return City.find().sort({ isLive: -1, nameEn: 1 });
  }

  async createCity(data: CreateCityInput): Promise<ICity> {
    const slug = data.slug.toLowerCase().trim();
    const existing = await City.findOne({ slug });
    if (existing) {
      throw new Error(`City with slug '${slug}' already exists`);
    }
    const city = new City({ ...data, slug });
    return city.save();
  }

  async toggleCity(id: string): Promise<ICity | null> {
    const city = await City.findById(id);
    if (!city) return null;
    city.isLive = !city.isLive;
    return city.save();
  }

  // Dynamic Seller Localities Aggregation per City
  async getCityAreas(slug: string): Promise<{ city: string; slug: string; areas: string[] } | null> {
    const cleanSlug = slug.toLowerCase().trim();
    const city = await City.findOne({ slug: cleanSlug });
    if (!city) {
      return null;
    }

    // Find all approved and live providers in this city using .lean() for fast read performance
    const providers = await Provider.find({
      city: { $regex: new RegExp(`^${city.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      status: 'approved',
      isLive: true,
    })
      .select('area areasServed')
      .lean();

    const areaSet = new Set<string>();

    providers.forEach((p) => {
      if (p.area && p.area.trim()) {
        areaSet.add(p.area.trim());
      }
      if (Array.isArray(p.areasServed)) {
        p.areasServed.forEach((a) => {
          if (a && a.trim()) {
            areaSet.add(a.trim());
          }
        });
      }
    });

    const areas = Array.from(areaSet).sort((a, b) => a.localeCompare(b));

    return {
      city: city.nameEn,
      slug: city.slug,
      areas,
    };
  }
}

export const discoveryService = new DiscoveryService();
