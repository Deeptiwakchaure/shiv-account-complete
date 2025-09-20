export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = (): string | null => {
  return localStorage.getItem('shiv-accounts-token');
};

const request = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers = new Headers(options.headers as HeadersInit);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Notify global loader
  try {
    window.dispatchEvent(new CustomEvent('api:request-start'));

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      throw new Error(message);
    }

    return data;
  } finally {
    window.dispatchEvent(new CustomEvent('api:request-end'));
  }
};

// Auth
export const loginApi = async (email: string, password: string) => {
  const resp = await request<{ success: boolean; data: { user: any; token: string } }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }
  );
  return resp.data;
};

// Taxes
export const getTaxesApi = async (params?: { page?: number; limit?: number; search?: string; applicableOn?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.applicableOn) query.set('applicableOn', params.applicableOn);
  const path = `/taxes${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: any[] }>(path);
};

export const createTaxApi = async (payload: any) => {
  return request<{ success: boolean; data: any; message?: string }>('/taxes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateTaxApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any; message?: string }>(`/taxes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteTaxApi = async (id: string) => {
  return request<{ success: boolean; message?: string }>(`/taxes/${id}`, {
    method: 'DELETE',
  });
};

// Products
export const getProductsApi = async (params?: { page?: number; limit?: number; search?: string; type?: string; category?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.type) query.set('type', params.type);
  if (params?.category) query.set('category', params.category);
  const path = `/products${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: { products: any[]; categories: string[]; pagination: any } }>(path);
};

export const createProductApi = async (payload: any) => {
  return request<{ success: boolean; data: { product: any } }>(`/products`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateProductApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: { product: any } }>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteProductApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/products/${id}`, {
    method: 'DELETE',
  });
};

// Contacts
export const getContactsApi = async (params?: { page?: number; limit?: number; search?: string; type?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.type) query.set('type', params.type);
  const path = `/contacts${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: { contacts: any[]; pagination: any } }>(path);
};

export const createContactApi = async (payload: any) => {
  return request<{ success: boolean; data: any }>(`/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateContactApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteContactApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/contacts/${id}`, {
    method: 'DELETE',
  });
};

// Purchase Orders
export const getPOsApi = async (params?: { page?: number; limit?: number; search?: string; status?: string; vendor?: string; startDate?: string; endDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.vendor) query.set('vendor', params.vendor);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const path = `/purchase-orders${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: any[]; pagination: any }>(path);
};

export const createPOApi = async (payload: any) => {
  return request<{ success: boolean; data: any }>(`/purchase-orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updatePOApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/purchase-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updatePOStatusApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/purchase-orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deletePOApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/purchase-orders/${id}`, {
    method: 'DELETE',
  });
};

export const getPOStatsApi = async () => {
  return request<{ success: boolean; data: any }>(`/purchase-orders/stats/summary`);
};

// Payments
export const getPaymentsApi = async (params?: { page?: number; limit?: number; search?: string; contact?: string; mode?: 'Cash' | 'Bank'; startDate?: string; endDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.contact) query.set('contact', params.contact);
  if (params?.mode) query.set('mode', params.mode);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const path = `/payments${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: { payments: any[]; pagination: any } }>(path);
};

export const createPaymentApi = async (payload: any) => {
  return request<{ success: boolean; data: { payment: any } }>(`/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updatePaymentApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: { payment: any } }>(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deletePaymentApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/payments/${id}`, {
    method: 'DELETE',
  });
};

export const getOutstandingByContactApi = async (contactId: string) => {
  return request<{ success: boolean; data: { invoices?: any[]; bills?: any[] } }>(`/payments/outstanding/${contactId}`);
};

export const getPaymentStatsApi = async () => {
  return request<{ success: boolean; data: any }>(`/payments/stats/summary`);
};
