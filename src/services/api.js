// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';

console.log('🔧 API URL configured:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor for error handling (includes blocked user check)
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: status,
      message: error.message,
      data: error.response?.data
    });
    
    // ✅ Token expired or invalid (401)
    if (status === 401) {
      console.log('Token expired/invalid, clearing session...');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // ✅ BLOCKED USER (403 with specific message)
    if (status === 403 && message === 'Your account has been blocked by the administrator. Please contact support.') {
      console.log('Account blocked, clearing session...');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // ✅ Generic 403 (for role-based access)
    if (status === 403 && message?.includes('not authorized')) {
      console.log('Role not authorized:', message);
      // Optionally redirect to appropriate dashboard
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'teacher') {
            window.location.href = '/teacher/dashboard';
          } else if (user.role === 'student') {
            window.location.href = '/student/dashboard';
          } else if (user.role === 'admin') {
            window.location.href = '/admin/dashboard';
          }
        } catch (e) {
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;