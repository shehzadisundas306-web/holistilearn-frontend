// frontend/src/api/mentalState.js
import api from '../services/api';

// Create a separate axios instance for mental state endpoints
import axios from 'axios';

const MENTAL_STATE_API_URL = process.env.REACT_APP_MENTAL_STATE_API_URL || 'https://holistilearn-backend.vercel.app/api';

const mentalStateApi = axios.create({
  baseURL: MENTAL_STATE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Add token interceptor
mentalStateApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const mentalStateAPI = {
  // Update mental state
  updateMentalState: async (data) => {
    try {
      const response = await mentalStateApi.post('/mental-state/update', data);
      return response.data;
    } catch (error) {
      console.error('Update mental state error:', error);
      throw error;
    }
  },

  // Get mental state history
  getHistory: async (days = 30) => {
    try {
      const response = await mentalStateApi.get(`/mental-state/history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Get mental state history error:', error);
      throw error;
    }
  },

  // Get mental health insights
  getInsights: async () => {
    try {
      const response = await mentalStateApi.get('/mental-state/insights');
      return response.data;
    } catch (error) {
      console.error('Get mental health insights error:', error);
      throw error;
    }
  },

  // Get mental health trends
  getTrends: async (period = 'week') => {
    try {
      const response = await mentalStateApi.get(`/mental-state/trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Get mental health trends error:', error);
      throw error;
    }
  },

  // Add journal entry
  addJournalEntry: async (data) => {
    try {
      const response = await mentalStateApi.post('/mental-state/journal', data);
      return response.data;
    } catch (error) {
      console.error('Add journal entry error:', error);
      throw error;
    }
  }
};

export default mentalStateApi;