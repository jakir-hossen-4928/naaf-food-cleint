
import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// Create axios instance with security headers
const secureApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// Request interceptor for auth and security
secureApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent replay attacks
    config.headers['X-Timestamp'] = Date.now().toString();
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
secureApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message;
    
    switch (status) {
      case 401:
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        toast({
          title: 'Session Expired',
          description: 'Please log in again',
          variant: 'destructive',
        });
        break;
      case 403:
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action',
          variant: 'destructive',
        });
        break;
      case 429:
        toast({
          title: 'Too Many Requests',
          description: 'Please wait before trying again',
          variant: 'destructive',
        });
        break;
      case 500:
        toast({
          title: 'Server Error',
          description: 'Something went wrong. Please try again later.',
          variant: 'destructive',
        });
        break;
      default:
        if (status && status >= 400) {
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }
    }
    
    return Promise.reject(error);
  }
);

export { secureApiClient };
