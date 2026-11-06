import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  slug: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  enabled: boolean;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
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
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

categorySchema.plugin(toJSON);

export const Category = model<ICategory>('Category', categorySchema);
