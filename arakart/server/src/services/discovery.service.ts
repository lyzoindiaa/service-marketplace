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
  stateEn?: string;
  stateHi?: string;
  slug: string;
  isLive?: boolean;
  defaultAreas?: string[];
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

  private addUniqueAreaCaseInsensitive(areaMap: Map<string, string>, rawArea?: string): void {
    if (!rawArea || !rawArea.trim()) return;
    const trimmed = rawArea.trim();
    const key = trimmed.toLowerCase();
    const formatted = trimmed
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
    const existing = areaMap.get(key);
    if (!existing) {
      areaMap.set(key, formatted);
    } else if (existing === existing.toLowerCase() && formatted !== formatted.toLowerCase()) {
      areaMap.set(key, formatted);
    }
  }

  // Dynamic Seller Localities Aggregation per City
  async getCityAreas(slug: string): Promise<{
    city: string;
    cityHi: string;
    state: string;
    stateHi: string;
    slug: string;
    areas: string[];
  } | null> {
    const cleanSlug = slug.toLowerCase().trim();
    if (cleanSlug === 'all') {
      const providers = await Provider.find({
        status: 'approved',
        isLive: true,
      })
        .select('area areasServed')
        .lean();

      const areaMap = new Map<string, string>();
      providers.forEach((p) => {
        this.addUniqueAreaCaseInsensitive(areaMap, p.area);
        if (Array.isArray(p.areasServed)) {
          p.areasServed.forEach((a) => this.addUniqueAreaCaseInsensitive(areaMap, a));
        }
      });

      return {
        city: 'All Cities',
        cityHi: 'सभी शहर',
        state: 'India',
        stateHi: 'भारत',
        slug: 'all',
        areas: Array.from(areaMap.values()).sort((a, b) => a.localeCompare(b)),
      };
    }

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

    const areaMap = new Map<string, string>();

    if (Array.isArray(city.defaultAreas)) {
      city.defaultAreas.forEach((a) => {
        this.addUniqueAreaCaseInsensitive(areaMap, a);
      });
    }

    providers.forEach((p) => {
      this.addUniqueAreaCaseInsensitive(areaMap, p.area);
      if (Array.isArray(p.areasServed)) {
        p.areasServed.forEach((a) => {
          this.addUniqueAreaCaseInsensitive(areaMap, a);
        });
      }
    });

    const areas = Array.from(areaMap.values()).sort((a, b) => a.localeCompare(b));

    return {
      city: city.nameEn,
      cityHi: city.nameHi || city.nameEn,
      state: city.stateEn || 'Bihar',
      stateHi: city.stateHi || 'बिहार',
      slug: city.slug,
      areas,
    };
  }
}

export const discoveryService = new DiscoveryService();
