// frontend/src/api/dashboard.js
import api from '../services/api';

// Create a separate axios instance for dashboard endpoints
import axios from 'axios';

const DASHBOARD_API_URL = process.env.REACT_APP_DASHBOARD_API_URL || 'https://holistilearn-backend.vercel.app/api';

const dashboardApi = axios.create({
  baseURL: DASHBOARD_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Add token interceptor
dashboardApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const dashboardAPI = {
  // Get dashboard summary
  getDashboardSummary: async () => {
    try {
      const response = await dashboardApi.get('/dashboard/summary');
      return response.data;
    } catch (error) {
      console.error('Get dashboard summary error:', error);
      throw error;
    }
  },

  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await dashboardApi.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get dashboard data error:', error);
      throw error;
    }
  },

  // Get weekly activity
  getWeeklyActivity: async () => {
    try {
      const response = await dashboardApi.get('/dashboard/weekly');
      return response.data;
    } catch (error) {
      console.error('Get weekly activity error:', error);
      throw error;
    }
  },

  // Get today's focus
  getTodayFocus: async () => {
    try {
      const response = await dashboardApi.get('/dashboard/today');
      return response.data;
    } catch (error) {
      console.error('Get today focus error:', error);
      throw error;
    }
  },

  // Get insights
  getInsights: async () => {
    try {
      const response = await dashboardApi.get('/dashboard/insights');
      return response.data;
    } catch (error) {
      console.error('Get insights error:', error);
      throw error;
    }
  },

  // Get achievements
  getAchievements: async () => {
    try {
      const response = await dashboardApi.get('/dashboard/achievements');
      return response.data;
    } catch (error) {
      console.error('Get achievements error:', error);
      throw error;
    }
  }
};

export default dashboardApi;