import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name: string;
  company?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Tender {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  deadline: string;
  created_by: number;
  created_at: string;
  bids_count?: number;
}

export interface Bid {
  id: number;
  tender_id: number;
  bidder_id: number;
  amount: number;
  proposal: string;
  status: string;
  created_at: string;
  bidder?: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: { email: string; password: string; full_name: string; company?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const tendersApi = {
  list: (params?: { status?: string; category?: string; include_drafts?: boolean }) =>
    api.get<Tender[]>('/tenders', { params }),
  get: (id: number) => api.get<Tender>(`/tenders/${id}`),
  create: (data: Partial<Tender>) => api.post<Tender>('/tenders', data),
  update: (id: number, data: Partial<Tender>) => api.patch<Tender>(`/tenders/${id}`, data),
  publish: (id: number) => api.post(`/tenders/${id}/publish`),
  delete: (id: number) => api.delete(`/tenders/${id}`),
};

export const bidsApi = {
  create: (data: { tender_id: number; amount: number; proposal: string }) =>
    api.post<Bid>('/bids', data),
  getByTender: (tenderId: number) => api.get<Bid[]>(`/bids/tender/${tenderId}`),
  getMy: () => api.get<Bid[]>('/bids/my'),
  updateStatus: (bidId: number, status: string) =>
    api.patch(`/bids/${bidId}/status`, { status }),
};

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  update: (id: number, data: Partial<User>) => api.patch(`/users/${id}`, data),
};

export interface LicenseStatus {
  configured: boolean;
  valid: boolean;
  message: string;
  product_name?: string;
  expires_at?: string;
}

export const licenseApi = {
  getStatus: () => api.get<LicenseStatus>('/license/status'),
  configure: (licenseKey: string) =>
    api.post<LicenseStatus>('/license/configure', { license_key: licenseKey }),
};

export default api;
