import api from '../lib/axios';

export interface BlogItem {
  id: string;
  titleEn: string;
  titleHi: string;
  slug: string;
  excerptEn: string;
  excerptHi: string;
  contentEn: string;
  contentHi: string;
  coverImageUrl: string;
  category: string;
  authorName: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogsResponse {
  blogs: BlogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateOrUpdateBlogPayload {
  titleEn: string;
  titleHi?: string;
  excerptEn?: string;
  excerptHi?: string;
  contentEn: string;
  contentHi?: string;
  coverImageUrl?: string;
  category?: string;
  authorName?: string;
  isPublished?: boolean;
}

export const fetchBlogs = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  includeDrafts?: boolean;
}): Promise<BlogsResponse> => {
  const res = await api.get('/blogs', { params });
  return res.data.data;
};

export const fetchBlogBySlug = async (slug: string): Promise<BlogItem> => {
  const res = await api.get(`/blogs/${slug}`);
  return res.data.data;
};

export const createBlog = async (payload: CreateOrUpdateBlogPayload): Promise<BlogItem> => {
  const res = await api.post('/blogs', payload);
  return res.data.data;
};

export const updateBlog = async (
  id: string,
  payload: Partial<CreateOrUpdateBlogPayload>
): Promise<BlogItem> => {
  const res = await api.put(`/blogs/${id}`, payload);
  return res.data.data;
};

export const deleteBlog = async (id: string): Promise<void> => {
  await api.delete(`/blogs/${id}`);
};
