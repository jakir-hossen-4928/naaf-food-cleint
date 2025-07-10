
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth endpoints
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', credentials).then(res => res.data),
  
  getCurrentUser: () =>
    apiClient.get('/api/auth/me').then(res => res.data),

  // Orders endpoints
  getOrders: () =>
    apiClient.get('/api/orders').then(res => res.data),
  
  createOrder: (orderData: any) =>
    apiClient.post('/api/orders', orderData).then(res => res.data),
  
  updateOrder: (id: string, orderData: any) =>
    apiClient.put(`/api/orders/${id}`, orderData).then(res => res.data),
  
  deleteOrder: (id: string) =>
    apiClient.delete(`/api/orders/${id}`).then(res => res.data),
  
  sendToSteadfast: (id: string) =>
    apiClient.post(`/api/orders/${id}/dispatch`).then(res => res.data),

  // Products endpoints
  getProducts: () =>
    apiClient.get('/api/products').then(res => res.data),
  
  createProduct: (productData: any) =>
    apiClient.post('/api/products', productData).then(res => res.data),
  
  updateProduct: (id: string, productData: any) =>
    apiClient.put(`/api/products/${id}`, productData).then(res => res.data),
  
  deleteProduct: (id: string) =>
    apiClient.delete(`/api/products/${id}`).then(res => res.data),

  // Users endpoints
  getUsers: () =>
    apiClient.get('/api/users').then(res => res.data),
  
  createUser: (userData: any) =>
    apiClient.post('/api/users', userData).then(res => res.data),
  
  updateUser: (id: string, userData: any) =>
    apiClient.put(`/api/users/${id}`, userData).then(res => res.data),
  
  deleteUser: (id: string) =>
    apiClient.delete(`/api/users/${id}`).then(res => res.data),

  // Tasks endpoints
  getTasks: () =>
    apiClient.get('/api/tasks').then(res => res.data),
  
  createTask: (taskData: any) =>
    apiClient.post('/api/tasks', taskData).then(res => res.data),
  
  updateTask: (id: string, taskData: any) =>
    apiClient.put(`/api/tasks/${id}`, taskData).then(res => res.data),
  
  deleteTask: (id: string) =>
    apiClient.delete(`/api/tasks/${id}`).then(res => res.data),

  // Follow-ups endpoints
  getFollowUps: () =>
    apiClient.get('/api/follow-ups').then(res => res.data),
  
  createFollowUp: (followUpData: any) =>
    apiClient.post('/api/follow-ups', followUpData).then(res => res.data),
  
  updateFollowUp: (id: string, followUpData: any) =>
    apiClient.put(`/api/follow-ups/${id}`, followUpData).then(res => res.data),
  
  deleteFollowUp: (id: string) =>
    apiClient.delete(`/api/follow-ups/${id}`).then(res => res.data),

  // SMS endpoints
  sendSMS: (data: { number: string; message: string }) =>
    apiClient.post('/sendSMS', data).then(res => res.data),
  
  getBalance: () =>
    apiClient.get('/getBalance').then(res => res.data),
};
