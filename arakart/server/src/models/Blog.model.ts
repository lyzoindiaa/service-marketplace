import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface IBlog extends Document {
  _id: Types.ObjectId;
  titleEn: string;
  titleHi?: string;
  slug: string;
  summaryEn: string;
  summaryHi?: string;
  contentEn: string;
  contentHi?: string;
  coverImage?: string;
  category: string;
  authorName: string;
  isPublished: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    titleEn: {
      type: String,
      required: [true, 'Blog title (English) is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    titleHi: {
      type: String,
      trim: true,
      maxlength: [200, 'Hindi title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    summaryEn: {
      type: String,
      required: [true, 'Blog summary is required'],
      trim: true,
      maxlength: [500, 'Summary cannot exceed 500 characters'],
    },
    summaryHi: {
      type: String,
      trim: true,
      maxlength: [500, 'Hindi summary cannot exceed 500 characters'],
    },
    contentEn: {
      type: String,
      required: [true, 'Blog content is required'],
      trim: true,
    },
    contentHi: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'Local Guide',
    },
    authorName: {
      type: String,
      trim: true,
      default: 'AraKart Editorial',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

blogSchema.plugin(toJSON);

export const Blog = model<IBlog>('Blog', blogSchema);
