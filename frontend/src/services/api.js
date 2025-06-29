import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'An error occurred';
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status >= 400) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  googleLogin: (token) => {
    const formData = new FormData();
    formData.append('token', token);
    return api.post('/api/auth/google', formData);
  },
};

export const itemsAPI = {
  reportLostItem: (formData) => {
    return api.post('/api/items/lost', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getLostItems: (params = {}) => {
    return api.get('/api/items/lost', { params });
  },
  
  getLostItem: (itemId) => {
    return api.get(`/api/items/lost/${itemId}`);
  },
  
  getCategories: () => {
    return api.get('/api/categories');
  },
};

export const messagesAPI = {
  sendMessage: (messageData) => {
    const formData = new FormData();
    formData.append('receiver_id', messageData.receiver_id);
    formData.append('item_id', messageData.item_id);
    formData.append('content', messageData.content);
    return api.post('/api/messages', formData);
  },
  
  getMessages: () => {
    return api.get('/api/messages');
  },
};

export const profileAPI = {
  getProfile: () => {
    return api.get('/api/profile');
  },
};

export default api;