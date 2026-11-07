import mongoose from 'mongoose';
import crypto from 'crypto';
import { Offer } from '../models/Offer.model';
import { AppliedOffer } from '../models/AppliedOffer.model';
import { Provider } from '../models/Provider.model';
import { User } from '../models/User.model';
import { Lead } from '../models/Lead.model';
import { emitToSeller } from '../config/socket';

export const computeOfferTimeStatus = (offer: any): 'live_now' | 'upcoming' | 'expired' => {
  if (!offer.isActive) return 'expired';

  const now = new Date();
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const todayStr = istTime.toISOString().slice(0, 10);
  const currentHm = istTime.toISOString().slice(11, 16);

  if (offer.scheduleType === 'single_day_slot') {
    const singleDate = offer.singleDate || todayStr;
    const startH = offer.slotStartHour || '00:00';
    const endH = offer.slotEndHour || '23:59';

    if (todayStr < singleDate) return 'upcoming';
    if (todayStr > singleDate) return 'expired';
    if (currentHm < startH) return 'upcoming';
    if (currentHm > endH) return 'expired';
    return 'live_now';
  }

  const startD = offer.startDate || todayStr;
  const endD = offer.endDate || todayStr;
  const workStart = offer.workHoursStart || '00:00';
  const workEnd = offer.workHoursEnd || '23:59';

  if (todayStr < startD) return 'upcoming';
  if (todayStr > endD) return 'expired';
  if (currentHm < workStart) return 'upcoming';
  if (currentHm > workEnd) {
    return todayStr < endD ? 'upcoming' : 'expired';
  }
  return 'live_now';
};

const formatOfferDoc = (doc: any, appliedCustomers?: any[], hasCustomerApplied?: boolean) => {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  const computedStatus = computeOfferTimeStatus(json);
  const orig = Number(json.originalPrice) || 1;
  const disc = Number(json.offerPrice) || 0;
  const discountPercent =
    json.discountPercent || Math.max(1, Math.round(((orig - disc) / orig) * 100));

  const prov = json.provider && typeof json.provider === 'object' ? json.provider : null;
  const sellerSummary = prov
    ? {
        id: (prov.id || prov._id || '').toString(),
        nameEn: prov.nameEn || 'Verified Provider',
        nameHi: prov.nameHi || prov.nameEn || '',
        area: prov.area || '',
        city: prov.city || json.city || 'ara',
        category: Array.isArray(prov.categories) ? prov.categories[0] || '' : '',
        phone: prov.phone || '',
        rating: Number(prov.avgRating || prov.rating || 0),
        photoUrl: Array.isArray(prov.photos) ? prov.photos[0] || '' : '',
        isVerified: Boolean(prov.verified),
      }
    : null;

  return {
    ...json,
    serviceTitleEn: json.serviceName || json.serviceTitleEn || '',
    serviceTitleHi: json.serviceTitleHi || json.serviceName || '',
    discountPercent,
    claimsCount: json.appliedCount ?? json.claimsCount ?? 0,
    timeStatus: computedStatus,
    computedStatus,
    seller: sellerSummary,
    ...(appliedCustomers !== undefined ? { appliedCustomers } : {}),
    ...(hasCustomerApplied !== undefined ? { hasCustomerApplied } : {}),
  };
};

export class OfferService {
  async listPublicOffers(
    filters: {
      city?: string;
      providerId?: string;
      sellerId?: string;
      scheduleType?: string;
      customerId?: string;
    } = {}
  ): Promise<any[]> {
    const query: Record<string, any> = { isActive: true };
    if (filters.city && filters.city.trim() && filters.city.trim().toLowerCase() !== 'all') {
      query.city = {
        $regex: new RegExp(`^${filters.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      };
    }
    const targetProvId = filters.providerId || filters.sellerId;
    if (targetProvId && mongoose.Types.ObjectId.isValid(targetProvId)) {
      query.provider = targetProvId;
    }
    if (filters.scheduleType && ['date_range', 'single_day_slot'].includes(filters.scheduleType)) {
      query.scheduleType = filters.scheduleType;
    }

    const docs = await Offer.find(query)
      .populate('provider', 'nameEn nameHi area city categories verified avgRating reviewCount photos')
      .sort({ createdAt: -1 });

    let appliedOfferIds = new Set<string>();
    if (filters.customerId && mongoose.Types.ObjectId.isValid(filters.customerId)) {
      const userApplied = await AppliedOffer.find({ customer: filters.customerId }).select('offer').lean();
      appliedOfferIds = new Set(userApplied.map((a: any) => a.offer.toString()));
    }

    return docs.map((d) =>
      formatOfferDoc(d, undefined, appliedOfferIds.has(d._id.toString()))
    );
  }

  async createSellerOffer(userId: string, data: any): Promise<any> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const err: any = new Error('You must register as a seller before creating service offers');
      err.statusCode = 404;
      throw err;
    }

    const serviceName = (data.serviceName || data.serviceTitleEn || '').trim();
    const titleEn = (data.titleEn || '').trim();
    const originalPrice = Number(data.originalPrice);
    const offerPrice = Number(data.offerPrice);
    const scheduleType = data.scheduleType === 'single_day_slot' ? 'single_day_slot' : 'date_range';

    if (!serviceName || !titleEn) {
      const err: any = new Error('Service name and offer title are required');
      err.statusCode = 400;
      throw err;
    }
    if (!originalPrice || originalPrice <= 0 || isNaN(offerPrice) || offerPrice <= 0) {
      const err: any = new Error('Valid originalPrice and offerPrice are required');
      err.statusCode = 400;
      throw err;
    }
    if (offerPrice >= originalPrice) {
      const err: any = new Error('Offer price must be lower than the original price');
      err.statusCode = 400;
      throw err;
    }

    if (scheduleType === 'date_range' && (!data.startDate || !data.endDate)) {
      const err: any = new Error('Start date and end date are required for date range offers');
      err.statusCode = 400;
      throw err;
    }
    if (
      scheduleType === 'single_day_slot' &&
      (!data.singleDate || !data.slotStartHour || !data.slotEndHour)
    ) {
      const err: any = new Error(
        'Single date, start hour, and end hour are required for single-day slot offers'
      );
      err.statusCode = 400;
      throw err;
    }

    const offer = await Offer.create({
      provider: provider._id,
      seller: userId,
      city: (provider.city || 'ara').toLowerCase(),
      serviceName,
      titleEn,
      titleHi: data.titleHi?.trim() || undefined,
      descriptionEn: data.descriptionEn?.trim() || undefined,
      originalPrice,
      offerPrice,
      scheduleType,
      startDate: data.startDate,
      endDate: data.endDate,
      workHoursStart: data.workHoursStart || '09:00',
      workHoursEnd: data.workHoursEnd || '18:00',
      singleDate: data.singleDate,
      slotStartHour: data.slotStartHour || '14:00',
      slotEndHour: data.slotEndHour || '16:00',
      isActive: true,
    });

    await offer.populate(
      'provider',
      'nameEn nameHi area city categories verified avgRating reviewCount photos'
    );
    return formatOfferDoc(offer, []);
  }

  async getSellerOffers(userId: string): Promise<{ offers: any[]; appliedCustomers: any[] }> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      return { offers: [], appliedCustomers: [] };
    }

    const [offers, appliedDocs] = await Promise.all([
      Offer.find({ provider: provider._id })
        .populate('provider', 'nameEn nameHi area city categories verified avgRating reviewCount photos')
        .sort({ createdAt: -1 }),
      AppliedOffer.find({ provider: provider._id })
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 }),
    ]);

    const groupedByOffer = new Map<string, any[]>();
    for (const app of appliedDocs) {
      const offerKey = app.offer.toString();
      const cust: any = app.customer;
      const entry = {
        applicationId: app._id.toString(),
        claimCode: app.claimCode,
        status: app.status,
        appliedAt: app.createdAt,
        customer: cust
          ? {
              id: (cust.id || cust._id || '').toString(),
              name: cust.name || app.customerName,
              email: cust.email,
              phone: cust.phone || app.customerPhone,
            }
          : {
              id: '',
              name: app.customerName,
              phone: app.customerPhone,
            },
      };
      const list = groupedByOffer.get(offerKey) || [];
      list.push(entry);
      groupedByOffer.set(offerKey, list);
    }

    return {
      offers: offers.map((o) => formatOfferDoc(o, groupedByOffer.get(o._id.toString()) || [])),
      appliedCustomers: appliedDocs.map((a) => a.toJSON()),
    };
  }

  async updateSellerOffer(
    userId: string,
    role: string,
    offerId: string,
    updates: any
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      const err: any = new Error('Invalid offer ID');
      err.statusCode = 400;
      throw err;
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      const err: any = new Error('Offer not found');
      err.statusCode = 404;
      throw err;
    }

    if (role !== 'admin' && offer.seller.toString() !== userId) {
      const err: any = new Error('You do not have permission to modify this offer');
      err.statusCode = 403;
      throw err;
    }

    if (updates.titleEn !== undefined) offer.titleEn = updates.titleEn.trim();
    if (updates.titleHi !== undefined) offer.titleHi = updates.titleHi.trim();
    if (updates.descriptionEn !== undefined) offer.descriptionEn = updates.descriptionEn.trim();
    if (updates.serviceName !== undefined || updates.serviceTitleEn !== undefined) {
      offer.serviceName = (updates.serviceName || updates.serviceTitleEn).trim();
    }
    if (updates.originalPrice !== undefined) offer.originalPrice = Number(updates.originalPrice);
    if (updates.offerPrice !== undefined) offer.offerPrice = Number(updates.offerPrice);
    if (updates.scheduleType !== undefined) offer.scheduleType = updates.scheduleType;
    if (updates.startDate !== undefined) offer.startDate = updates.startDate;
    if (updates.endDate !== undefined) offer.endDate = updates.endDate;
    if (updates.workHoursStart !== undefined) offer.workHoursStart = updates.workHoursStart;
    if (updates.workHoursEnd !== undefined) offer.workHoursEnd = updates.workHoursEnd;
    if (updates.singleDate !== undefined) offer.singleDate = updates.singleDate;
    if (updates.slotStartHour !== undefined) offer.slotStartHour = updates.slotStartHour;
    if (updates.slotEndHour !== undefined) offer.slotEndHour = updates.slotEndHour;
    if (updates.isActive !== undefined) offer.isActive = Boolean(updates.isActive);

    await offer.save();
    return formatOfferDoc(offer);
  }

  async deleteOffer(userId: string, role: string, offerId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      const err: any = new Error('Invalid offer ID');
      err.statusCode = 400;
      throw err;
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      const err: any = new Error('Offer not found');
      err.statusCode = 404;
      throw err;
    }

    if (role !== 'admin' && offer.seller.toString() !== userId) {
      const err: any = new Error('You do not have permission to delete this offer');
      err.statusCode = 403;
      throw err;
    }

    await Offer.findByIdAndDelete(offerId);
    await AppliedOffer.deleteMany({ offer: offerId });
  }

  async applyOfferForCustomer(customerId: string, offerId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      const err: any = new Error('Invalid offer ID');
      err.statusCode = 400;
      throw err;
    }

    const offer = await Offer.findById(offerId);
    if (!offer || !offer.isActive) {
      const err: any = new Error('This offer is no longer active');
      err.statusCode = 404;
      throw err;
    }

    const provider = await Provider.findById(offer.provider);
    if (!provider) {
      const err: any = new Error('Provider not found');
      err.statusCode = 404;
      throw err;
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      const err: any = new Error('Customer account not found');
      err.statusCode = 404;
      throw err;
    }

    const discountPercent = Math.max(
      1,
      Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
    );

    const existing = await AppliedOffer.findOne({ offer: offer._id, customer: customer._id });
    if (existing) {
      const applicationObj = {
        id: existing._id.toString(),
        claimCode: existing.claimCode,
        status: existing.status,
        appliedAt: existing.createdAt,
        serviceTitleEn: existing.serviceName,
        serviceTitleHi: existing.serviceName,
        offerPrice: existing.offerPrice,
        originalPrice: existing.originalPrice,
        discountPercent,
        sellerName: provider.nameEn,
        sellerPhone: provider.phone,
        sellerArea: provider.area,
      };
      return {
        alreadyApplied: true,
        application: applicationObj,
        appliedOffer: applicationObj,
        unmaskedPhone: provider.phone,
      };
    }

    const claimCode = `ARA-${crypto.randomInt(1000, 9999)}`;

    const applied = await AppliedOffer.create({
      offer: offer._id,
      provider: provider._id,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone || customer.email || '',
      serviceName: offer.serviceName,
      offerTitle: offer.titleEn,
      originalPrice: offer.originalPrice,
      offerPrice: offer.offerPrice,
      claimCode,
      status: 'applied',
    });

    await Offer.updateOne({ _id: offer._id }, { $inc: { appliedCount: 1 } });

    try {
      const lead = await Lead.create({
        provider: provider._id,
        customer: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone || customer.email || 'Email User',
        type: 'call',
        service: `[OFFER ${claimCode}] ${offer.serviceName} @ ₹${offer.offerPrice}`,
        status: 'new',
      });

      emitToSeller(provider._id.toString(), 'newLead', {
        id: lead._id.toString(),
        customerName: customer.name,
        type: 'call',
        service: `[OFFER ${claimCode}] ${offer.serviceName} @ ₹${offer.offerPrice}`,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-fatal
    }

    const applicationObj = {
      id: applied._id.toString(),
      claimCode: applied.claimCode,
      status: applied.status,
      appliedAt: applied.createdAt,
      serviceTitleEn: applied.serviceName,
      serviceTitleHi: applied.serviceName,
      offerPrice: applied.offerPrice,
      originalPrice: applied.originalPrice,
      discountPercent,
      sellerName: provider.nameEn,
      sellerPhone: provider.phone,
      sellerArea: provider.area,
    };

    return {
      alreadyApplied: false,
      application: applicationObj,
      appliedOffer: applicationObj,
      unmaskedPhone: provider.phone,
    };
  }

  async getCustomerAppliedOffers(customerId: string): Promise<any[]> {
    const docs = await AppliedOffer.find({ customer: customerId })
      .populate('provider', 'nameEn nameHi area city phone whatsapp categories photos')
      .populate(
        'offer',
        'titleEn titleHi scheduleType startDate endDate workHoursStart workHoursEnd singleDate slotStartHour slotEndHour isActive'
      )
      .sort({ createdAt: -1 });

    return docs.map((d) => {
      const json: any = d.toJSON();
      const prov: any = json.provider;
      const off: any = json.offer;
      const orig = Number(json.originalPrice) || 1;
      const disc = Number(json.offerPrice) || 0;
      const discountPercent = Math.max(1, Math.round(((orig - disc) / orig) * 100));

      return {
        ...json,
        appliedAt: json.createdAt,
        serviceTitleEn: json.serviceName,
        serviceTitleHi: json.serviceName,
        discountPercent,
        offer: off
          ? {
              id: (off.id || off._id || '').toString(),
              titleEn: off.titleEn,
              titleHi: off.titleHi || off.titleEn,
              scheduleType: off.scheduleType,
              startDate: off.startDate || null,
              endDate: off.endDate || null,
              workHoursStart: off.workHoursStart || null,
              workHoursEnd: off.workHoursEnd || null,
              singleDate: off.singleDate || null,
              slotStartHour: off.slotStartHour || null,
              slotEndHour: off.slotEndHour || null,
              computedStatus: computeOfferTimeStatus(off),
            }
          : null,
        seller: prov
          ? {
              id: (prov.id || prov._id || '').toString(),
              nameEn: prov.nameEn,
              nameHi: prov.nameHi || prov.nameEn,
              area: prov.area,
              city: prov.city || 'ara',
              category: Array.isArray(prov.categories) ? prov.categories[0] || '' : '',
              phone: prov.phone || '',
              photoUrl: Array.isArray(prov.photos) ? prov.photos[0] || '' : '',
            }
          : null,
      };
    });
  }

  async getAllOffersForAdmin(
    filters: { city?: string; scheduleType?: string } = {}
  ): Promise<any[]> {
    const query: Record<string, any> = {};
    if (filters.city && filters.city.trim()) {
      query.city = {
        $regex: new RegExp(`^${filters.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      };
    }
    if (filters.scheduleType && ['date_range', 'single_day_slot'].includes(filters.scheduleType)) {
      query.scheduleType = filters.scheduleType;
    }

    const [docs, allApplied] = await Promise.all([
      Offer.find(query)
        .populate('provider', 'nameEn nameHi area city phone verified avgRating photos categories')
        .populate('seller', 'name email phone')
        .sort({ createdAt: -1 }),
      AppliedOffer.find().populate('customer', 'name email phone').sort({ createdAt: -1 }),
    ]);

    const groupedByOffer = new Map<string, any[]>();
    for (const app of allApplied) {
      const key = app.offer.toString();
      const cust: any = app.customer;
      const entry = {
        applicationId: app._id.toString(),
        claimCode: app.claimCode,
        status: app.status,
        appliedAt: app.createdAt,
        customer: cust
          ? {
              id: (cust.id || cust._id || '').toString(),
              name: cust.name || app.customerName,
              email: cust.email,
              phone: cust.phone || app.customerPhone,
            }
          : {
              id: '',
              name: app.customerName,
              phone: app.customerPhone,
            },
      };
      const list = groupedByOffer.get(key) || [];
      list.push(entry);
      groupedByOffer.set(key, list);
    }

    return docs.map((d) =>
      formatOfferDoc(d, groupedByOffer.get(d._id.toString()) || [])
    );
  }
}

export const offerService = new OfferService();
