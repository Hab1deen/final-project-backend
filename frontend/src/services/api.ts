import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Customers API
export const customerApi = {
  getAll: () => api.get('/customers'),
  getById: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Quotations API
export const quotationApi = {
  getAll: () => api.get('/quotations'),
  getById: (id: number) => api.get(`/quotations/${id}`),
  create: (data: any) => api.post('/quotations', data),
  update: (id: number, data: any) => api.put(`/quotations/${id}`, data),
  delete: (id: number) => api.delete(`/quotations/${id}`),
  convertToInvoice: (id: number) => api.post(`/quotations/${id}/convert-to-invoice`),
};

// Invoices API
export const invoiceApi = {
  getAll: () => api.get('/invoices'),
  getById: (id: number) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  updateStatus: (id: number, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  recordPayment: (id: number, data: any) => api.post(`/invoices/${id}/payments`, data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
};

export default api;