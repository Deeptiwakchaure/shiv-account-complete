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

    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      // Network-level failure (CORS, server down, DNS, etc.)
      // Log diagnostic info
      // eslint-disable-next-line no-console
      console.error('[API] Network error', {
        url: `${API_URL}${path}`,
        method: options.method || 'GET',
        error: networkErr?.message || networkErr,
      });
      throw new Error('Network error. Please verify the server is running and CORS is configured.');
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText || 'Request failed';
      // eslint-disable-next-line no-console
      console.error('[API] Request failed', {
        url: `${API_URL}${path}`,
        method: options.method || 'GET',
        status: res.status,
        statusText: res.statusText,
        response: data,
      });
      throw new Error(message);
    }

    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') {
      console.debug('[API] Request success', {
        url: `${API_URL}${path}`,
        method: options.method || 'GET',
        status: res.status,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
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

export const registerApi = async (payload: { name: string; email: string; password: string; role?: string }) => {
  const resp = await request<{ success: boolean; data: { user: any; token?: string } }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload)
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
export const getPaymentsApi = async (params?: { page?: number; limit?: number; search?: string; contact?: string; type?: 'Received' | 'Paid'; paymentMethod?: string; startDate?: string; endDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.contact) query.set('contact', params.contact);
  if (params?.type) {
    // Convert frontend type to backend type
    const backendType = params.type === 'Received' ? 'Receipt' : 'Payment';
    query.set('type', backendType);
  }
  if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const path = `/payments${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: any[]; pagination: any }>(path);
};

export const createPaymentApi = async (payload: any) => {
  // Get document details first to get the document number
  let documentNumber = '';
  if (payload.document) {
    try {
      if (payload.type === 'Received') {
        const invoiceResp = await request<{ success: boolean; data: any }>(`/customer-invoices/${payload.document}`);
        documentNumber = invoiceResp.data.invoiceNumber || `INV-${payload.document.slice(-6)}`;
      } else {
        const billResp = await request<{ success: boolean; data: any }>(`/vendor-bills/${payload.document}`);
        documentNumber = billResp.data.billNumber || `BILL-${payload.document.slice(-6)}`;
      }
    } catch (error) {
      // Fallback to generated number if API call fails
      documentNumber = `${payload.type === 'Received' ? 'INV' : 'BILL'}-${payload.document.slice(-6)}`;
    }
  }

  // Transform frontend payload to backend format
  const backendPayload = {
    ...payload,
    type: payload.type === 'Received' ? 'Receipt' : 'Payment',
    // If document is provided, create linkedDocuments array
    linkedDocuments: payload.document ? [{
      documentType: payload.type === 'Received' ? 'Invoice' : 'Expense',
      documentId: payload.document,
      documentNumber: documentNumber,
      allocatedAmount: payload.amount
    }] : []
  };
  delete backendPayload.document; // Remove document field as it's now in linkedDocuments
  
  return request<{ success: boolean; data: any }>(`/payments`, {
    method: 'POST',
    body: JSON.stringify(backendPayload),
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

// Sales Orders
export const getSOsApi = async (params?: { page?: number; limit?: number; search?: string; status?: string; customer?: string; startDate?: string; endDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.customer) query.set('customer', params.customer);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const path = `/sales-orders${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: any[]; pagination: any }>(path);
};

export const createSOApi = async (payload: any) => {
  return request<{ success: boolean; data: any }>(`/sales-orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateSOApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/sales-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updateSOStatusApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/sales-orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteSOApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/sales-orders/${id}`, {
    method: 'DELETE',
  });
};

export const getSOStatsApi = async () => {
  return request<{ success: boolean; data: any }>(`/sales-orders/stats/summary`);
};

// Customer Invoices
export const getInvoicesApi = async (params?: { page?: number; limit?: number; search?: string; status?: string; customer?: string; startDate?: string; endDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.customer) query.set('customer', params.customer);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const path = `/customer-invoices${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: any[]; pagination: any }>(path);
};

export const createInvoiceApi = async (payload: any) => {
  return request<{ success: boolean; data: any }>(`/customer-invoices`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateInvoiceApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/customer-invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updateInvoiceStatusApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/customer-invoices/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteInvoiceApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/customer-invoices/${id}`, {
    method: 'DELETE',
  });
};

// Vendor Bills
export const getBillsApi = async (params?: { page?: number; limit?: number; search?: string; status?: string; vendor?: string; startDate?: string; endDate?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.vendor) query.set('vendor', params.vendor);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  const path = `/vendor-bills${query.toString() ? `?${query.toString()}` : ''}`;
  return request<{ success: boolean; data: any[]; pagination: any }>(path);
};

export const createBillApi = async (payload: any) => {
  return request<{ success: boolean; data: any }>(`/vendor-bills`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateBillApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/vendor-bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updateBillStatusApi = async (id: string, payload: any) => {
  return request<{ success: boolean; data: any }>(`/vendor-bills/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteBillApi = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/vendor-bills/${id}`, {
    method: 'DELETE',
  });
};
