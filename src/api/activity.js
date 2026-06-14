// frontend/src/api/activity.js
import axios from 'axios';

const ACTIVITY_API_URL = process.env.REACT_APP_ACTIVITY_API_URL || 'https://holistilearn-backend.vercel.app/api';

const activityApi = axios.create({
  baseURL: ACTIVITY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Add token interceptor
activityApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const activityAPI = {
  // Get recent activities with pagination
  getRecentActivities: async (limit = 10, skip = 0) => {
    try {
      // ✅ FIX: Send both limit and skip for proper pagination
      const response = await activityApi.get(`/activity/recent?limit=${limit}&skip=${skip}`);
      return response.data;
    } catch (error) {
      console.error('Get recent activities error:', error);
      throw error;
    }
  },

  // Mark activity as read
  markActivityAsRead: async (activityId) => {
    try {
      const response = await activityApi.put(`/activity/${activityId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark activity read error:', error);
      throw error;
    }
  },

  // Delete a single activity
  deleteActivity: async (activityId) => {
    try {
      const response = await activityApi.delete(`/activity/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Delete activity error:', error);
      throw error;
    }
  },

  // Bulk delete activities
  bulkDeleteActivities: async (activityIds) => {
    try {
      const response = await activityApi.delete('/activity/bulk-delete', {
        data: { activityIds }
      });
      return response.data;
    } catch (error) {
      console.error('Bulk delete activities error:', error);
      throw error;
    }
  },

  // Clear all activities
  clearAllActivities: async () => {
    try {
      const response = await activityApi.delete('/activity/clear-all');
      return response.data;
    } catch (error) {
      console.error('Clear all activities error:', error);
      throw error;
    }
  }
};

export default activityApi;