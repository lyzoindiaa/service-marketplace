import api from '../lib/axios';

export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  approvedSellers: number;
  totalLeads: number;
  totalReviews: number;
  totalCategories: number;
  totalCities: number;
  callsCount: number;
  whatsappCount: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: 'customer' | 'seller' | 'admin';
  suspended: boolean;
  createdAt: string;
}

export interface AdminReportItem {
  id: string;
  provider: {
    id: string;
    nameEn: string;
    phone: string;
    area: string;
  };
  reportedBy: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  reason: string;
  details?: string;
  status: 'open' | 'resolved' | 'dismissed';
  adminNote?: string | null;
  createdAt: string;
}

export interface AdminActivityItem {
  id: string;
  type: 'lead' | 'review' | 'seller';
  description: string;
  createdAt: string;
}

export const fetchAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const res = await api.get('/admin/dashboard');
  return res.data.data;
};

export const fetchPendingSellers = async (page = 1, limit = 20): Promise<{
  sellers: any[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const res = await api.get('/admin/sellers/pending', { params: { page, limit } });
  return res.data.data;
};

export const approveSeller = async (id: string): Promise<any> => {
  const res = await api.post(`/admin/sellers/${id}/approve`);
  return res.data.data;
};

export const rejectSeller = async (id: string, reason?: string): Promise<any> => {
  const res = await api.post(`/admin/sellers/${id}/reject`, { reason });
  return res.data.data;
};

export const fetchAdminUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}): Promise<{
  users: AdminUserItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const res = await api.get('/admin/users', { params });
  return res.data.data;
};

export const suspendUser = async (id: string, suspended: boolean): Promise<AdminUserItem> => {
  const res = await api.patch(`/admin/users/${id}/suspend`, { suspended });
  return res.data.data;
};

export const fetchAdminReports = async (status?: string, page = 1, limit = 20): Promise<{
  reports: AdminReportItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  const res = await api.get('/admin/reports', { params: { status, page, limit } });
  return res.data.data;
};

export const resolveAdminReport = async (
  id: string,
  status: 'resolved' | 'dismissed',
  adminNote?: string
): Promise<AdminReportItem> => {
  const res = await api.patch(`/admin/reports/${id}`, { status, adminNote });
  return res.data.data;
};

export const fetchAdminActivity = async (): Promise<{ activity: AdminActivityItem[] }> => {
  const res = await api.get('/admin/activity');
  return res.data.data;
};

export const createAdminCategory = async (data: {
  nameEn: string;
  nameHi: string;
  slug: string;
  icon?: string;
  descriptionEn?: string;
}): Promise<any> => {
  const res = await api.post('/categories', data);
  return res.data.data;
};

export const toggleAdminCategory = async (id: string): Promise<any> => {
  const res = await api.patch(`/categories/${id}/toggle`);
  return res.data.data;
};

export const createAdminCity = async (data: {
  name: string;
  slug: string;
  state: string;
}): Promise<any> => {
  const res = await api.post('/cities', data);
  return res.data.data;
};

export const toggleAdminCity = async (id: string): Promise<any> => {
  const res = await api.patch(`/cities/${id}/toggle`);
  return res.data.data;
};
