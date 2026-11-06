import { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeDrafts =
      (req.query.all === 'true' || req.query.includeDrafts === 'true') &&
      req.user?.role === 'admin';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const q =
      typeof req.query.q === 'string'
        ? req.query.q
        : typeof req.query.search === 'string'
        ? req.query.search
        : undefined;
    const blogs = await blogService.listBlogs({ includeDrafts, category, q });
    sendSuccess(res, {
      blogs,
      pagination: {
        page: 1,
        limit: blogs.length || 20,
        total: blogs.length,
        pages: 1,
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch blogs', error.statusCode || 500);
  }
};

export const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const blog = await blogService.getBlogBySlugOrId(slug);
    if (!blog) {
      sendError(res, 'Blog post not found', 404);
      return;
    }
    sendSuccess(res, blog);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch blog post', error.statusCode || 500);
  }
};

export const createBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await blogService.createBlog(req.body);
    sendSuccess(res, blog, 'Blog post created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create blog post', error.statusCode || 400);
  }
};

export const updateBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const blog = await blogService.updateBlog(id, req.body);
    sendSuccess(res, blog, 'Blog post updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update blog post', error.statusCode || 400);
  }
};

export const deleteBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await blogService.deleteBlog(id);
    sendSuccess(res, { id }, 'Blog post deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete blog post', error.statusCode || 400);
  }
};
