import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface ICity extends Document {
  _id: Types.ObjectId;
  nameEn: string;
  nameHi: string;
  slug: string;
  isLive: boolean;
  createdAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    nameHi: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

citySchema.plugin(toJSON);

export const City = model<ICity>('City', citySchema);
