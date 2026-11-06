import api from '../lib/axios';

export interface CreateLeadParams {
  providerId: string;
  type: 'call' | 'whatsapp';
  service?: string;
}

export interface LeadResult {
  unmaskedPhone: string;
  whatsapp?: string;
  lead: {
    id: string;
    customer: string;
    provider: string;
    type: 'call' | 'whatsapp';
    service?: string;
    status: 'new' | 'contacted' | 'completed';
    createdAt: string;
  };
}

export interface SellerLeadsResponse {
  leads: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const createLead = async (params: CreateLeadParams): Promise<LeadResult> => {
  const res = await api.post('/leads', params);
  return res.data.data;
};

export const getSellerLeads = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<SellerLeadsResponse> => {
  const res = await api.get('/leads/seller', { params });
  return res.data.data;
};

export const updateLeadStatus = async (
  leadId: string,
  status: 'new' | 'contacted' | 'completed'
): Promise<any> => {
  const res = await api.patch(`/leads/${leadId}/status`, { status });
  return res.data.data;
};
