import mongoose from 'mongoose';
import { Provider, IProvider } from '../models/Provider.model';
import { Category } from '../models/Category.model';
import { Review } from '../models/Review.model';
import { SearchProvidersQuery } from '../validators/provider.validators';

export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const visible = digits.slice(-10, -5);
    return `${visible} XXXXX`;
  }
  return 'XXXXX XXXXX';
};

export const escapeRegex = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export interface SearchProvidersResult {
  providers: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ProviderService {
  async searchProviders(params: SearchProvidersQuery): Promise<SearchProvidersResult> {
    const {
      q,
      category,
      city,
      area,
      minRating,
      verifiedOnly,
      sort = 'rating',
      page = 1,
      limit = 12,
    } = params;

    const filter: Record<string, any> = {
      status: 'approved',
      isLive: true,
    };

    if (city) {
      filter.city = { $regex: new RegExp(`^${escapeRegex(city.trim())}$`, 'i') };
    }

    if (category) {
      filter.categories = category.trim().toLowerCase();
    }

    if (area) {
      const areaTrimmed = area.trim();
      const areaKey = areaTrimmed.toLowerCase();
      const safeAreaRegex = new RegExp(escapeRegex(areaTrimmed), 'i');
      filter.$or = [
        { areaKey },
        { areasServedKeys: areaKey },
        { area: { $regex: safeAreaRegex } },
        { areasServed: { $regex: safeAreaRegex } },
      ];
    }

    if (minRating !== undefined && minRating > 0) {
      filter.avgRating = { $gte: minRating };
    }

    if (verifiedOnly) {
      filter.verified = true;
    }

    if (q && q.trim()) {
      const searchTerm = escapeRegex(q.trim());
      const textConditions = [
        { nameEn: { $regex: searchTerm, $options: 'i' } },
        { nameHi: { $regex: searchTerm, $options: 'i' } },
        { bioEn: { $regex: searchTerm, $options: 'i' } },
        { bioHi: { $regex: searchTerm, $options: 'i' } },
        { 'services.nameEn': { $regex: searchTerm, $options: 'i' } },
      ];

      if (filter.$or) {
        // If we already have $or (from area), combine them with $and
        filter.$and = [{ $or: filter.$or }, { $or: textConditions }];
        delete filter.$or;
      } else {
        filter.$or = textConditions;
      }
    }

    // Determine sort order
    let sortOptions: Record<string, any> = { avgRating: -1, reviewCount: -1 };
    if (sort === 'price' || sort === 'price_asc') {
      sortOptions = { fromPrice: 1, avgRating: -1 };
    } else if (sort === 'price_desc') {
      sortOptions = { fromPrice: -1, avgRating: -1 };
    } else if (sort === 'views') {
      sortOptions = { profileViews: -1, avgRating: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Provider.countDocuments(filter),
      Provider.find(filter).sort(sortOptions).skip(skip).limit(limit),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    // Mask phone and whatsapp numbers in list response
    const providers = docs.map((doc) => {
      const json = doc.toJSON ? doc.toJSON() : doc.toObject();
      return {
        ...json,
        phone: maskPhoneNumber(json.phone),
        whatsapp: json.whatsapp ? maskPhoneNumber(json.whatsapp) : undefined,
      };
    });

    return {
      providers,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async getProviderById(id: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error(`Invalid provider id: ${id}`);
      error.statusCode = 400;
      throw error;
    }

    // Atomically increment profileViews
    const doc = await Provider.findOneAndUpdate(
      { _id: id, status: 'approved', isLive: true },
      { $inc: { profileViews: 1 } },
      { new: true }
    );

    if (!doc) {
      return null;
    }

    const json = doc.toJSON ? doc.toJSON() : doc.toObject();
    return {
      ...json,
      phone: maskPhoneNumber(json.phone),
      whatsapp: json.whatsapp ? maskPhoneNumber(json.whatsapp) : undefined,
    };
  }

  async getPublicStats(city?: string): Promise<{
    verifiedProvidersCount: number;
    categoriesCount: number;
    avgRating: number;
    totalReviews: number;
    recentReviews: any[];
  }> {
    const providerFilter: Record<string, any> = {
      status: 'approved',
      isLive: true,
    };
    if (city && city.trim() && city.trim().toLowerCase() !== 'all') {
      providerFilter.city = { $regex: new RegExp(`^${escapeRegex(city.trim())}$`, 'i') };
    }

    const [verifiedProvidersCount, categoriesCount, cityProviders] = await Promise.all([
      Provider.countDocuments(providerFilter),
      Category.countDocuments({ enabled: true }),
      Provider.find(providerFilter).select('_id nameEn nameHi area city').lean(),
    ]);

    const providerIds = cityProviders.map((p) => p._id);
    const reviewFilter = providerIds.length > 0 ? { provider: { $in: providerIds } } : {};

    const [totalReviews, ratingAgg, recentReviewDocs] = await Promise.all([
      Review.countDocuments(reviewFilter),
      Review.aggregate([
        { $match: reviewFilter },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
      Review.find(reviewFilter)
        .populate('provider', 'nameEn nameHi area city')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const avgRating =
      ratingAgg.length > 0 && ratingAgg[0].avg
        ? Number(ratingAgg[0].avg.toFixed(1))
        : 0;

    const recentReviews = recentReviewDocs.map((r: any) => ({
      id: r._id.toString(),
      customerName: r.customerName || 'Verified Customer',
      rating: r.rating,
      comment: r.comment,
      sellerReply: r.sellerReply,
      providerId: r.provider?._id?.toString() || '',
      providerNameEn: r.provider?.nameEn || 'Local Professional',
      providerNameHi: r.provider?.nameHi || r.provider?.nameEn || '',
      providerArea: r.provider?.area || '',
      createdAt: r.createdAt,
    }));

    return {
      verifiedProvidersCount,
      categoriesCount,
      avgRating,
      totalReviews,
      recentReviews,
    };
  }
}

export const providerService = new ProviderService();
