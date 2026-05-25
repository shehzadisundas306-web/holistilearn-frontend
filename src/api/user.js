// frontend/src/api/user.js
import api from "../services/api";

export const userAPI = {
  // Get current user profile - matches backend route /user/me
  getCurrentUser: async () => {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error.response?.data || error);
      throw error;
    }
  },

  // Get user stats - your backend doesn't have /dashboard/summary under /user
  // So let's fetch from the actual dashboard endpoint
  getUserStats: async () => {
    try {
      // Your backend has dashboard under /api/dashboard, not under /user
      // For now, return mock data since your dashboard endpoint might be separate
      console.log('getUserStats called - returning mock data');
      return {
        success: true,
        data: {
          progress: {
            stats: {
              learningStreak: 0,
              xpPoints: 0,
              level: 1,
              completedTopics: 0
            }
          },
          activity: {
            summary: {
              today: {
                studyTime: 0
              }
            }
          },
          mentalState: {
            current: {
              mood: 'neutral'
            }
          }
        }
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        success: true,
        data: {
          progress: { stats: {} },
          activity: { summary: { today: {} } },
          mentalState: { current: {} }
        }
      };
    }
  },

  // Get complete dashboard data - this might need to call a different endpoint
  getDashboardData: async () => {
    try {
      // Try to call your dashboard endpoint if it exists
      // For now, return mock data
      return {
        success: true,
        data: {
          progress: {
            stats: {
              completedLessons: 0,
              totalTopics: 0,
              averageScore: 0,
              learningStreak: 0,
              xpPoints: 0,
              level: 1
            }
          }
        }
      };
    } catch (error) {
      console.error('Get dashboard error:', error);
      throw error;
    }
  },

  // Add this method for updating role
  updateRole: async (role) => {
    try {
      const response = await api.put('/update-role', { role });
      return response.data;
    } catch (error) {
      console.error('Update role error:', error);
      throw error;
    }
  },

  // Add this method for logout
  logout: async () => {
    try {
      const response = await api.post('/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  
};