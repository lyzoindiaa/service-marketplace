import mongoose from 'mongoose';
import { User, IUser } from '../models/User.model';
import { Provider } from '../models/Provider.model';
import { maskPhoneNumber } from './provider.service';

export class UserService {
  async getFavourites(userId: string): Promise<any[]> {
    const user = await User.findById(userId).populate({
      path: 'favourites',
      match: { status: 'approved', isLive: true },
    });

    if (!user || !user.favourites) {
      return [];
    }

    return (user.favourites as any[])
      .filter(Boolean)
      .map((doc) => {
        const json = doc.toJSON ? doc.toJSON() : doc;
        const id = (json.id || json._id || doc._id)?.toString();
        return {
          ...json,
          id,
          phone: maskPhoneNumber(json.phone),
        };
      });
  }

  async addFavourite(userId: string, providerId: string): Promise<string[]> {
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favourites: provider._id } },
      { new: true }
    );

    return (user?.favourites || []).map((id) => id.toString());
  }

  async removeFavourite(userId: string, providerId: string): Promise<string[]> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      const error: any = new Error('Invalid provider id');
      error.statusCode = 400;
      throw error;
    }

    const objId = new mongoose.Types.ObjectId(providerId);
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favourites: { $in: [providerId, objId] } } },
      { new: true }
    );

    return (user?.favourites || []).map((id) => id.toString());
  }
}

export const userService = new UserService();
