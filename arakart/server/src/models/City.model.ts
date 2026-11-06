import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface ICity extends Document {
  _id: Types.ObjectId;
  nameEn: string;
  nameHi: string;
  stateEn: string;
  stateHi: string;
  slug: string;
  isLive: boolean;
  defaultAreas: string[];
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
    stateEn: {
      type: String,
      default: 'Bihar',
      trim: true,
    },
    stateHi: {
      type: String,
      default: 'बिहार',
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
    defaultAreas: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

citySchema.plugin(toJSON);

export const City = model<ICity>('City', citySchema);
