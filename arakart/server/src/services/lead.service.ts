import mongoose from 'mongoose';
import { Lead, ILead, LeadType, LeadStatus } from '../models/Lead.model';
import { Provider } from '../models/Provider.model';
import { User } from '../models/User.model';
import { emitToSeller } from '../config/socket';

export interface CreateLeadResult {
  lead: any;
  phone: string;
  whatsapp?: string;
}

export interface SellerLeadsResult {
  leads: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class LeadService {
  async createLead(
    customerId: string,
    providerId: string,
    type: LeadType,
    service?: string
  ): Promise<CreateLeadResult> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      const error: any = new Error('Invalid provider id');
      error.statusCode = 400;
      throw error;
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      const error: any = new Error('Provider not found');
      error.statusCode = 404;
      throw error;
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      const error: any = new Error('Customer user not found');
      error.statusCode = 404;
      throw error;
    }

    const customerName = customer.name || 'Customer';
    const customerPhone = customer.phone || '9999999999';

    const lead = new Lead({
      provider: provider._id,
      customer: customer._id,
      customerName,
      customerPhone,
      type,
      service: service || null,
      status: 'new',
    });

    await lead.save();

    // Increment click counter on provider
    const incField = type === 'call' ? { callClicks: 1 } : { whatsappClicks: 1 };
    await Provider.findByIdAndUpdate(provider._id, { $inc: incField });

    // Emit real-time notification to the seller's room
    const leadJson = lead.toJSON ? lead.toJSON() : lead.toObject();
    emitToSeller(provider.owner.toString(), 'newLead', leadJson);

    return {
      lead: leadJson,
      phone: provider.phone,
      whatsapp: provider.whatsapp || provider.phone,
    };
  }

  async getSellerLeads(
    sellerUserId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<SellerLeadsResult> {
    // Find provider associated with this seller
    let provider = await Provider.findOne({ owner: sellerUserId });
    if (!provider) {
      const user = await User.findById(sellerUserId);
      if (user?.sellerId) {
        provider = await Provider.findById(user.sellerId);
      }
    }

    if (!provider) {
      return {
        leads: [],
        pagination: { page, limit, total: 0, pages: 1 },
      };
    }

    const filter: Record<string, any> = { provider: provider._id };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    return {
      leads: docs.map((d) => (d.toJSON ? d.toJSON() : d.toObject())),
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async updateLeadStatus(
    leadId: string,
    sellerUserId: string,
    status: LeadStatus
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      const error: any = new Error('Invalid lead id');
      error.statusCode = 400;
      throw error;
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      const error: any = new Error('Lead not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership: provider owner should match sellerUserId
    const provider = await Provider.findById(lead.provider);
    if (!provider || provider.owner.toString() !== sellerUserId) {
      const error: any = new Error('Not authorized to update this lead');
      error.statusCode = 403;
      throw error;
    }

    lead.status = status;
    await lead.save();

    return lead.toJSON ? lead.toJSON() : lead.toObject();
  }
}

export const leadService = new LeadService();
