import { Product, Category, Combo, SiteSettings } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('pc_part_hub_admin_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('pc_part_hub_admin_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('pc_part_hub_admin_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Network response was not ok' }));
    throw new Error(errorBody.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Public
  getProducts: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        query.append(k, String(v));
      }
    });
    return request<{ products: Product[]; page: number; limit: number; count: number }>(`/products?${query.toString()}`);
  },

  getProduct: (slugOrId: string | number) => {
    return request<Product>(`/products/${slugOrId}`);
  },

  getFilters: () => {
    return request<{ brands: string[]; conditions: string[]; min_price: number; max_price: number }>('/products/filters');
  },

  getCategories: () => {
    return request<{ categories: Category[] }>('/categories');
  },

  getCombos: () => {
    return request<{ combos: Combo[] }>('/combos');
  },

  getCombo: (slugOrId: string | number) => {
    return request<Combo>(`/combos/${slugOrId}`);
  },

  getSettings: () => {
    return request<{ settings: SiteSettings }>('/settings');
  },

  trackEnquiry: (productId: number | null, productName: string, type: 'WHATSAPP' | 'CALL') => {
    return request<{ success: boolean }>('/enquiries', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, product_name: productName, type })
    }).catch(() => ({ success: false }));
  },

  // Auth
  login: (credentials: { username: string; password: string }) => {
    return request<{ token: string; admin: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getMe: () => {
    return request<{ admin: any }>('/auth/me');
  },

  changePassword: (data: { currentPassword: string; newPassword: string }) => {
    return request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  changeUsername: (data: { newUsername: string; currentPassword: string }) => {
    return request<{ success: boolean; message: string; token: string; admin: any }>('/auth/change-username', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Admin Dashboard
  getDashboardMetrics: () => {
    return request<{ metrics: any; recentProducts: any[]; recentEnquiries: any[] }>('/enquiries/dashboard');
  },

  // Admin Products
  createProduct: (productData: any) => {
    return request<{ success: boolean; id: number; slug: string; product_code: string }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct: (id: number, productData: any) => {
    return request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  updateStock: (id: number, stock_status: string) => {
    return request<{ success: boolean; stock_status: string }>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_status })
    });
  },

  duplicateProduct: (id: number) => {
    return request<{ success: boolean; id: number; slug: string; product_code: string }>(`/products/${id}/duplicate`, {
      method: 'POST'
    });
  },

  deleteProduct: (id: number) => {
    return request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Admin Categories
  createCategory: (catData: any) => {
    return request<{ success: boolean; id: number; slug: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify(catData)
    });
  },

  updateCategory: (id: number, catData: any) => {
    return request<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(catData)
    });
  },

  deleteCategory: (id: number) => {
    return request<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Admin Combos
  createCombo: (comboData: any) => {
    return request<{ success: boolean; id: number; slug: string }>('/combos', {
      method: 'POST',
      body: JSON.stringify(comboData)
    });
  },

  updateCombo: (id: number, comboData: any) => {
    return request<{ success: boolean; message: string }>(`/combos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(comboData)
    });
  },

  deleteCombo: (id: number) => {
    return request<{ success: boolean; message: string }>(`/combos/${id}`, {
      method: 'DELETE'
    });
  },

  // Admin Settings
  updateSettings: (settings: Record<string, string>) => {
    return request<{ success: boolean; message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  getDbStatus: () => {
    return request<{
      status: string;
      integrity: string;
      journalMode: string;
      engine: string;
      databaseFile: string;
      counts: { products: number; categories: number; combos: number; admins: number };
      currentAdmin: { id: number; username: string; name: string } | null;
    }>('/settings/db-status');
  },

  // Upload
  uploadImages: async (files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('images', f));

    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json() as Promise<{ success: boolean; urls: string[]; count: number }>;
  },

  // CSV Import
  previewCSV: (csvContent: string) => {
    return request<{ total: number; validCount: number; invalidCount: number; validRows: any[]; invalidRows: any[] }>('/import/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent })
    });
  },

  confirmCSVImport: (rows: any[]) => {
    return request<{ success: boolean; count: number }>('/import/confirm', {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
  }
};

export const productService = {
  getAll: (params: Record<string, any> = {}) => api.getProducts(params),
  getByIdOrSlug: (idOrSlug: string | number) => api.getProduct(idOrSlug),
};

export default api;

