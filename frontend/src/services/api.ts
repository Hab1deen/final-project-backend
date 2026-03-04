import axios from 'axios';
import { config } from '../config/config';

// สร้าง axios instance
const api = axios.create({
  baseURL: config.apiUrl, // ใช้จาก config
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor - เพิ่ม token ก่อนส่ง request ทุกครั้ง
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Interceptor - จัดการกรณี token หมดอายุ (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ลบข้อมูล token + user ออกจาก localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // redirect ไปหน้า login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  getAll: (params?: any) => api.get('/quotations', { params }),
  getById: (id: number) => api.get(`/quotations/${id}`),
  create: (data: any) => api.post('/quotations', data),
  update: (id: number, data: any) => api.put(`/quotations/${id}`, data),
  delete: (id: number) => api.delete(`/quotations/${id}`),
  convertToInvoice: (id: number) => api.post(`/quotations/${id}/convert-to-invoice`),
  addSignature: (id: number, data: any) => api.post(`/quotations/${id}/signature`, data),
};

// Invoices API
export const invoiceApi = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getById: (id: number) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: number, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  recordPayment: (id: number, data: any) => api.post(`/invoices/${id}/payments`, data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
  addSignature: (id: number, data: any) => api.post(`/invoices/${id}/signature`, data),
};

// Receipts API
export const receiptApi = {
  getAll: () => api.get('/receipts'),
  getById: (id: number) => api.get(`/receipts/${id}`),
  getByInvoiceId: (invoiceId: number) => api.get(`/receipts/invoice/${invoiceId}`),
  create: (data: any) => api.post('/receipts', data),
  delete: (id: number) => api.delete(`/receipts/${id}`),
  addSignature: (id: number, data: any) => api.post(`/receipts/${id}/signature`, data),
};

// Upload API
export const uploadApi = {
  uploadSingle: (formData: FormData) => {
    return axios.post(`${config.apiBaseUrl}/api/upload/single`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  single: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return axios.post(`${config.apiBaseUrl}/api/upload/single`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  multiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return axios.post(`${config.apiBaseUrl}/api/upload/multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (filename: string) => api.delete(`/upload/${filename}`)
};



// Admin API
export const adminApi = {
  // Get statistics
  getStatistics: () => api.get('/admin/statistics'),

  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id: number) => api.get(`/admin/users/${id}`),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  resetUserPassword: (id: number, newPassword: string) =>
    api.put(`/admin/users/${id}/reset-password`, { newPassword })
};

export default api;