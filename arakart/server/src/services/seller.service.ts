import mongoose from 'mongoose';
import { Provider, IProvider } from '../models/Provider.model';
import { User } from '../models/User.model';
import { Lead } from '../models/Lead.model';
import { deletePhotoFromCloudinary } from '../config/cloudinary';

export class SellerService {
  async applyAsSeller(userId: string, data: any): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User account not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user already has a provider
    const existing = await Provider.findOne({ owner: user._id });
    if (existing) {
      const error: any = new Error('You have already applied or registered as a service provider');
      error.statusCode = 409;
      throw error;
    }

    const services = data.services || [];
    const minPrice =
      services.length > 0
        ? Math.min(...services.map((s: any) => s.startingPrice))
        : 99;

    const provider = await Provider.create({
      ...data,
      owner: user._id,
      city: (data.city || 'ara').toLowerCase().trim(),
      status: 'pending',
      isLive: false,
      verified: false,
      fromPrice: minPrice,
    });

    user.role = 'seller';
    user.sellerId = provider._id as any;
    await user.save();

    return provider.toJSON();
  }

  async getMyProfile(userId: string): Promise<any> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found for this user account');
      error.statusCode = 404;
      throw error;
    }

    return provider.toJSON();
  }

  async updateProfile(userId: string, updates: any): Promise<any> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found');
      error.statusCode = 404;
      throw error;
    }

    Object.assign(provider, updates);
    await provider.save();

    return provider.toJSON();
  }

  async updateCatalogue(userId: string, services: any[]): Promise<any> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found');
      error.statusCode = 404;
      throw error;
    }

    provider.services = services;
    if (services.length > 0) {
      provider.fromPrice = Math.min(...services.map((s) => s.startingPrice));
    }
    await provider.save();

    return provider.toJSON();
  }

  async toggleLive(userId: string): Promise<any> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found');
      error.statusCode = 404;
      throw error;
    }

    if (provider.status === 'pending') {
      const error: any = new Error(
        'Your seller application is currently pending approval by AraKart administrators'
      );
      error.statusCode = 403;
      throw error;
    }

    if (provider.status === 'rejected') {
      const error: any = new Error('Your seller listing has been rejected');
      error.statusCode = 403;
      throw error;
    }

    provider.isLive = !provider.isLive;
    await provider.save();

    return provider.toJSON();
  }

  async getStats(userId: string): Promise<any> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found');
      error.statusCode = 404;
      throw error;
    }

    const totalLeads = await Lead.countDocuments({ provider: provider._id });

    return {
      profileViews: provider.profileViews || 0,
      callClicks: provider.callClicks || 0,
      whatsappClicks: provider.whatsappClicks || 0,
      avgRating: provider.avgRating || 0,
      reviewCount: provider.reviewCount || 0,
      totalLeads,
      status: provider.status,
      isLive: provider.isLive,
    };
  }

  async addPhoto(userId: string, photoUrl: string): Promise<string[]> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found');
      error.statusCode = 404;
      throw error;
    }

    if (provider.photos && provider.photos.length >= 6) {
      const error: any = new Error('Maximum 6 photos allowed per provider');
      error.statusCode = 422;
      throw error;
    }

    provider.photos = [...(provider.photos || []), photoUrl];
    await provider.save();
    return provider.photos;
  }

  async deletePhoto(userId: string, photoUrl: string): Promise<string[]> {
    const provider = await Provider.findOne({ owner: userId });
    if (!provider) {
      const error: any = new Error('No provider profile found');
      error.statusCode = 404;
      throw error;
    }

    await deletePhotoFromCloudinary(photoUrl);

    provider.photos = (provider.photos || []).filter((p) => p !== photoUrl);
    await provider.save();
    return provider.photos;
  }
}

export const sellerService = new SellerService();
