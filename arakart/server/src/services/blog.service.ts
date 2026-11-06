import mongoose from 'mongoose';
import { Blog } from '../models/Blog.model';

const sanitizeText = (text?: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on(load|error|mouseover|click)\s*=/gi, '')
    .trim();
};

const makeSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return base || `blog-${Date.now()}`;
};

export interface CreateBlogInput {
  titleEn: string;
  titleHi?: string;
  slug?: string;
  summaryEn?: string;
  summaryHi?: string;
  excerptEn?: string;
  excerptHi?: string;
  contentEn: string;
  contentHi?: string;
  coverImage?: string;
  coverImageUrl?: string;
  category?: string;
  authorName?: string;
  isPublished?: boolean;
}

const formatBlogDoc = (doc: any) => {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    ...json,
    excerptEn: json.summaryEn || json.excerptEn || '',
    excerptHi: json.summaryHi || json.excerptHi || '',
    coverImageUrl: json.coverImage || json.coverImageUrl || '',
    publishedAt: json.createdAt,
  };
};

export class BlogService {
  async listBlogs(
    options: { includeDrafts?: boolean; category?: string; q?: string } = {}
  ): Promise<any[]> {
    const filter: Record<string, any> = {};
    if (!options.includeDrafts) {
      filter.isPublished = true;
    }
    if (options.category && options.category.trim() && options.category !== 'all') {
      filter.category = options.category.trim();
    }
    if (options.q && options.q.trim()) {
      const safeQ = options.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { titleEn: { $regex: safeQ, $options: 'i' } },
        { titleHi: { $regex: safeQ, $options: 'i' } },
        { summaryEn: { $regex: safeQ, $options: 'i' } },
      ];
    }

    const docs = await Blog.find(filter).sort({ createdAt: -1 });
    return docs.map(formatBlogDoc);
  }

  async getBlogBySlugOrId(slugOrId: string): Promise<any | null> {
    const query = mongoose.Types.ObjectId.isValid(slugOrId)
      ? { $or: [{ _id: slugOrId }, { slug: slugOrId.toLowerCase().trim() }] }
      : { slug: slugOrId.toLowerCase().trim() };

    const doc = await Blog.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true });
    return doc ? formatBlogDoc(doc) : null;
  }

  async createBlog(data: CreateBlogInput): Promise<any> {
    const titleEn = sanitizeText(data.titleEn);
    const contentEn = sanitizeText(data.contentEn);
    const summaryEn =
      sanitizeText(data.summaryEn || data.excerptEn) || contentEn.slice(0, 160);

    if (!titleEn || !contentEn) {
      const err: any = new Error('Title and content are required');
      err.statusCode = 400;
      throw err;
    }

    let slug = data.slug ? makeSlug(data.slug) : makeSlug(titleEn);
    const existing = await Blog.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const blog = await Blog.create({
      titleEn,
      titleHi: sanitizeText(data.titleHi) || undefined,
      slug,
      summaryEn,
      summaryHi: sanitizeText(data.summaryHi || data.excerptHi) || undefined,
      contentEn,
      contentHi: sanitizeText(data.contentHi) || undefined,
      coverImage: (data.coverImage || data.coverImageUrl || '').trim(),
      category: sanitizeText(data.category) || 'Home Maintenance',
      authorName: sanitizeText(data.authorName) || 'AraKart Admin',
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
    });

    return formatBlogDoc(blog);
  }

  async updateBlog(id: string, updates: Partial<CreateBlogInput>): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Invalid blog ID');
      err.statusCode = 400;
      throw err;
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      const err: any = new Error('Blog post not found');
      err.statusCode = 404;
      throw err;
    }

    if (updates.titleEn !== undefined) blog.titleEn = sanitizeText(updates.titleEn);
    if (updates.titleHi !== undefined) blog.titleHi = sanitizeText(updates.titleHi);
    if (updates.summaryEn !== undefined || updates.excerptEn !== undefined) {
      blog.summaryEn = sanitizeText(updates.summaryEn || updates.excerptEn);
    }
    if (updates.summaryHi !== undefined || updates.excerptHi !== undefined) {
      blog.summaryHi = sanitizeText(updates.summaryHi || updates.excerptHi);
    }
    if (updates.contentEn !== undefined) blog.contentEn = sanitizeText(updates.contentEn);
    if (updates.contentHi !== undefined) blog.contentHi = sanitizeText(updates.contentHi);
    if (updates.coverImage !== undefined || updates.coverImageUrl !== undefined) {
      blog.coverImage = (updates.coverImage ?? updates.coverImageUrl ?? '').trim();
    }
    if (updates.category !== undefined) {
      blog.category = sanitizeText(updates.category) || 'Home Maintenance';
    }
    if (updates.authorName !== undefined) {
      blog.authorName = sanitizeText(updates.authorName) || 'AraKart Admin';
    }
    if (updates.isPublished !== undefined) blog.isPublished = Boolean(updates.isPublished);

    await blog.save();
    return formatBlogDoc(blog);
  }

  async deleteBlog(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err: any = new Error('Invalid blog ID');
      err.statusCode = 400;
      throw err;
    }

    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) {
      const err: any = new Error('Blog post not found');
      err.statusCode = 404;
      throw err;
    }
  }
}

export const blogService = new BlogService();
