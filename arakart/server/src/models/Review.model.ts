import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface IReview extends Document {
  _id: Types.ObjectId;
  provider: Types.ObjectId;
  customer: Types.ObjectId;
  customerName: string;
  rating: number;
  comment: string;
  sellerReply?: string | null;
  sellerRepliedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    sellerReply: {
      type: String,
      default: null,
      maxlength: [1000, 'Seller reply cannot exceed 1000 characters'],
    },
    sellerRepliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One review per customer per provider
reviewSchema.index({ provider: 1, customer: 1 }, { unique: true });

reviewSchema.plugin(toJSON);

export const Review = model<IReview>('Review', reviewSchema);
