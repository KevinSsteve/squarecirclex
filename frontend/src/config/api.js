import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

// API Base URL - should be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Check if token is expired and refresh if needed
      const isExpired = await tokenManager.isTokenExpired();
      const token = isExpired 
        ? await tokenManager.refreshToken()
        : await tokenManager.getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching auth session:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401 || status === 403) {
        // Unauthorized - redirect to login
        window.location.href = '/login';
      }
      
      // Return structured error
      return Promise.reject({
        status,
        message: data?.error?.message || 'An error occurred',
        code: data?.error?.code || 'UNKNOWN_ERROR',
        details: data?.error?.details || {},
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        status: 0,
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      });
    } else {
      // Something else happened
      return Promise.reject({
        status: 0,
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      });
    }
  }
);

// API methods
export const api = {
  // Brands
  createBrand: (brandData) => apiClient.post('/brands', brandData),
  getBrand: (brandId) => apiClient.get(`/brands/${brandId}`),
  
  // Posts
  getPosts: (params) => apiClient.get('/posts', { params }),
  getPost: (postId) => apiClient.get(`/posts/${postId}`),
  updatePost: (postId, data) => apiClient.put(`/posts/${postId}`, data),
  deletePost: (postId) => apiClient.delete(`/posts/${postId}`),
  regeneratePost: (postId) => apiClient.post(`/posts/${postId}/regenerate`),
  
  // Chat
  sendChatMessage: (data) => apiClient.post('/chat', data),
  getChatHistory: () => apiClient.get('/chat/history'),
  
  // Onboarding
  sendOnboardingMessage: (data) => apiClient.post('/onboarding/message', data),
  
  // Account Management
  deleteAccount: (data) => apiClient.delete('/account', { data }),
  updateProfile: (data) => apiClient.put('/profile', data),
  
  // Admin Settings
  saveAdminSettings: (data) => apiClient.post('/admin/settings', data),
  getAdminSettings: (platform) => apiClient.get('/admin/settings', { params: { platform } }),
  
  // OAuth Connections
  getOAuthAuthorizeUrl: (platform, brandId) => 
    apiClient.get(`/oauth/authorize/${platform}`, { params: { brand_id: brandId } }),
  disconnectOAuth: (platform, brandId) => 
    apiClient.delete(`/oauth/disconnect/${platform}`, { data: { brand_id: brandId } }),
  getConnectionStatus: (brandId) => 
    apiClient.get(`/brands/${brandId}`),
};

export default apiClient;
