import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { Provider } from '../models/Provider.model';
import { Lead } from '../models/Lead.model';
import { Review } from '../models/Review.model';
import { Report } from '../models/Report.model';
import { Category } from '../models/Category.model';
import { City } from '../models/City.model';

export class AdminService {
  async getDashboardStats(): Promise<any> {
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      totalLeads,
      totalReviews,
      totalCategories,
      totalCities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      Provider.countDocuments({ status: 'pending' }),
      Provider.countDocuments({ status: 'approved' }),
      Lead.countDocuments(),
      Review.countDocuments(),
      Category.countDocuments({ enabled: true }),
      City.countDocuments({ isLive: true }),
    ]);

    const leadTypeAggregation = await Lead.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const callsCount = leadTypeAggregation.find((a) => a._id === 'call')?.count || 0;
    const whatsappCount = leadTypeAggregation.find((a) => a._id === 'whatsapp')?.count || 0;

    return {
      totalUsers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      totalLeads,
      totalReviews,
      totalCategories,
      totalCities,
      callsCount,
      whatsappCount,
    };
  }

  async getPendingSellers(page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [sellers, total] = await Promise.all([
      Provider.find({ status: 'pending' })
        .populate('owner', 'name email phone createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Provider.countDocuments({ status: 'pending' }),
    ]);

    return {
      sellers: sellers.map((s) => s.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async approveSeller(providerId: string): Promise<any> {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      const err: any = new Error('Provider not found');
      err.statusCode = 404;
      throw err;
    }

    provider.status = 'approved';
    provider.isLive = true;
    provider.verified = true;
    if (provider.requestedCategory && provider.requestedCategory.status === 'pending') {
      provider.requestedCategory.status = 'approved';
    }
    await provider.save();

    // Automatically activate the city market if it was draft/hidden
    if (provider.city) {
      await City.updateOne(
        { slug: provider.city.toLowerCase().trim() },
        { isLive: true }
      );
    }

    // Assign seller role and default login password Test@123 if user has no password
    const user = await User.findById(provider.owner);
    if (user) {
      user.role = 'seller';
      user.sellerId = provider._id as any;
      if (!user.passwordHash) {
        user.passwordHash = await bcrypt.hash('Test@123', 10);
      }
      user.emailVerified = true;
      if (user.email && !user.authMethods.includes('email')) {
        user.authMethods.push('email');
      }
      await user.save();
    }

    return provider.toJSON();
  }

  async approveSellerWithCategory(
    providerId: string,
    options: {
      action: 'create' | 'remap';
      categoryData?: {
        nameEn: string;
        nameHi?: string;
        icon?: string;
        slug?: string;
      };
      targetCategorySlug?: string;
    }
  ): Promise<any> {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      const err: any = new Error('Provider not found');
      err.statusCode = 404;
      throw err;
    }

    let assignedSlug: string;

    if (options.action === 'create') {
      const { nameEn, nameHi, icon, slug } = options.categoryData || {};
      if (!nameEn || nameEn.trim().length < 2) {
        const err: any = new Error('Category English name is required (min 2 characters)');
        err.statusCode = 400;
        throw err;
      }

      const generatedSlug =
        (slug && slug.trim()) ||
        nameEn
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      assignedSlug = generatedSlug;

      let category = await Category.findOne({ slug: assignedSlug });
      if (!category) {
        category = await Category.create({
          slug: assignedSlug,
          nameEn: nameEn.trim(),
          nameHi: (nameHi && nameHi.trim()) || nameEn.trim(),
          icon: (icon && icon.trim()) || '🔧',
          enabled: true,
        });
      }

      if (provider.requestedCategory) {
        provider.requestedCategory.status = 'approved';
      }
    } else if (options.action === 'remap') {
      const targetSlug = options.targetCategorySlug?.trim().toLowerCase();
      if (!targetSlug) {
        const err: any = new Error('Target category slug is required for remapping');
        err.statusCode = 400;
        throw err;
      }

      const category = await Category.findOne({ slug: targetSlug });
      if (!category) {
        const err: any = new Error(`Target category '${targetSlug}' not found`);
        err.statusCode = 404;
        throw err;
      }

      assignedSlug = targetSlug;

      if (provider.requestedCategory) {
        provider.requestedCategory.status = 'remapped';
      }
    } else {
      const err: any = new Error("Invalid action. Must be 'create' or 'remap'");
      err.statusCode = 400;
      throw err;
    }

    const existingCats = provider.categories || [];
    if (!existingCats.includes(assignedSlug)) {
      provider.categories = [...existingCats, assignedSlug];
    }

    provider.status = 'approved';
    provider.isLive = true;
    provider.verified = true;
    await provider.save();

    if (provider.city) {
      await City.updateOne(
        { slug: provider.city.toLowerCase().trim() },
        { isLive: true }
      );
    }

    const user = await User.findById(provider.owner);
    if (user) {
      user.role = 'seller';
      user.sellerId = provider._id as any;
      if (!user.passwordHash) {
        user.passwordHash = await bcrypt.hash('Test@123', 10);
      }
      user.emailVerified = true;
      if (user.email && !user.authMethods.includes('email')) {
        user.authMethods.push('email');
      }
      await user.save();
    }

    return provider.toJSON();
  }

  async rejectSeller(providerId: string, reason?: string): Promise<any> {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      const err: any = new Error('Provider not found');
      err.statusCode = 404;
      throw err;
    }

    provider.status = 'rejected';
    provider.isLive = false;
    await provider.save();

    return provider.toJSON();
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<any> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.role) {
      query.role = params.role;
    }
    if (params.search) {
      const escapedSearch = params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users: users.map((u) => u.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async suspendUser(userId: string, suspended: boolean, adminUserId?: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'admin' && suspended) {
      const err: any = new Error('Cannot suspend an administrator account');
      err.statusCode = 403;
      throw err;
    }

    user.suspended = suspended;
    if (suspended) {
      user.refreshTokenHash = null;
    }
    await user.save();

    // If suspending a seller, automatically take their provider listing offline
    if (suspended) {
      await Provider.updateMany({ owner: user._id }, { $set: { isLive: false } });
    }

    return user.toJSON();
  }

  async getReports(status?: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('provider', 'nameEn phone area')
        .populate('reportedBy', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(query),
    ]);

    return {
      reports: reports.map((r) => r.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async resolveReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    adminNote?: string
  ): Promise<any> {
    const report = await Report.findById(reportId);
    if (!report) {
      const err: any = new Error('Report not found');
      err.statusCode = 404;
      throw err;
    }

    report.status = status;
    if (adminNote) {
      report.adminNote = adminNote;
    }
    await report.save();

    return report.toJSON();
  }

  async getActivityLog(): Promise<any> {
    const [recentLeads, recentReviews, recentProviders] = await Promise.all([
      Lead.find()
        .populate('provider', 'nameEn')
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Review.find()
        .populate('provider', 'nameEn')
        .sort({ createdAt: -1 })
        .limit(10),
      Provider.find()
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const events: any[] = [];

    recentLeads.forEach((l) => {
      events.push({
        id: `lead_${l._id}`,
        type: 'lead',
        description: `Customer inquiry (${l.type}) for ${(l.provider as any)?.nameEn || 'Provider'}`,
        createdAt: l.createdAt,
      });
    });

    recentReviews.forEach((r) => {
      events.push({
        id: `review_${r._id}`,
        type: 'review',
        description: `New ${r.rating}★ review left for ${(r.provider as any)?.nameEn || 'Provider'}`,
        createdAt: r.createdAt,
      });
    });

    recentProviders.forEach((p) => {
      events.push({
        id: `prov_${p._id}`,
        type: 'seller',
        description: `New seller application: ${p.nameEn} (${p.status})`,
        createdAt: p.createdAt,
      });
    });

    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return events.slice(0, 20);
  }
}

export const adminService = new AdminService();
