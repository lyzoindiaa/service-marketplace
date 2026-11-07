import mongoose from 'mongoose';
import { Review, IReview } from '../models/Review.model';
import { Provider } from '../models/Provider.model';
import { User } from '../models/User.model';
import { emitToSeller } from '../config/socket';

export interface ProviderReviewsResult {
  reviews: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    avgRating: number;
    totalReviews: number;
    breakdown: Record<string, number>;
  };
}

export class ReviewService {
  async createReview(
    customerId: string,
    providerId: string,
    rating: number,
    comment: string
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      const error: any = new Error('Invalid provider id format');
      error.statusCode = 400;
      throw error;
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      const error: any = new Error('Provider not found');
      error.statusCode = 404;
      throw error;
    }

    if (provider.owner.toString() === customerId) {
      const error: any = new Error('You cannot review your own business');
      error.statusCode = 403;
      throw error;
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      const error: any = new Error('Customer user not found');
      error.statusCode = 404;
      throw error;
    }

    // Check existing review
    const existing = await Review.findOne({
      provider: provider._id,
      customer: customer._id,
    });

    if (existing) {
      const error: any = new Error('You have already reviewed this provider');
      error.statusCode = 409;
      throw error;
    }

    try {
      const review = await Review.create({
        provider: provider._id,
        customer: customer._id,
        customerName: customer.name || 'Verified Customer',
        rating,
        comment,
      });

      await this.recalculateProviderRating(provider._id.toString());

      const reviewJson = review.toJSON();
      emitToSeller(provider._id.toString(), 'newReview', reviewJson);
      if (provider.owner && provider.owner.toString() !== provider._id.toString()) {
        emitToSeller(provider.owner.toString(), 'newReview', reviewJson);
      }

      return reviewJson;
    } catch (err: any) {
      if (err.code === 11000) {
        const error: any = new Error('You have already reviewed this provider');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  async getProviderReviews(
    providerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ProviderReviewsResult> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      const error: any = new Error('Invalid provider id format');
      error.statusCode = 400;
      throw error;
    }

    const providerObjectId = new mongoose.Types.ObjectId(providerId);
    const skip = (page - 1) * limit;

    const [reviews, total, stats] = await Promise.all([
      Review.find({ provider: providerObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ provider: providerObjectId }),
      Review.aggregate([
        { $match: { provider: providerObjectId } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const breakdown: Record<string, number> = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    let totalScore = 0;
    stats.forEach((s) => {
      const ratingKey = String(s._id);
      if (breakdown[ratingKey] !== undefined) {
        breakdown[ratingKey] = s.count;
      }
      totalScore += s._id * s.count;
    });

    const avgRating = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0;

    return {
      reviews: reviews.map((r) => r.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      summary: {
        avgRating,
        totalReviews: total,
        breakdown,
      },
    };
  }

  async addReply(
    reviewId: string,
    userId: string,
    userRole: string,
    reply: string
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      const error: any = new Error('Invalid review id format');
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      const error: any = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    const provider = await Provider.findById(review.provider);
    if (!provider) {
      const error: any = new Error('Provider not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== 'admin' && provider.owner.toString() !== userId) {
      const error: any = new Error('Not authorized to reply to reviews for this provider');
      error.statusCode = 403;
      throw error;
    }

    if (review.sellerReply) {
      const error: any = new Error('You have already replied to this review');
      error.statusCode = 409;
      throw error;
    }

    review.sellerReply = reply;
    review.sellerRepliedAt = new Date();
    await review.save();

    return review.toJSON();
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      const error: any = new Error('Invalid review id format');
      error.statusCode = 400;
      throw error;
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      const error: any = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    const providerId = review.provider.toString();
    await Review.findByIdAndDelete(reviewId);

    await this.recalculateProviderRating(providerId);
    return true;
  }

  async recalculateProviderRating(providerId: string): Promise<void> {
    const providerObjectId = new mongoose.Types.ObjectId(providerId);

    const stats = await Review.aggregate([
      { $match: { provider: providerObjectId } },
      {
        $group: {
          _id: '$provider',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const reviewCount = stats.length > 0 ? stats[0].reviewCount : 0;

    await Provider.findByIdAndUpdate(providerId, {
      avgRating,
      reviewCount,
    });
  }
}

export const reviewService = new ReviewService();
