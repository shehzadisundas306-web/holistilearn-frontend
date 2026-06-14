// frontend/src/api/learningPath.js
import axios from 'axios';

const LEARNING_PATH_API_URL = process.env.REACT_APP_LEARNING_PATH_API_URL || 'https://holistilearn-backend.vercel.app/api';

const learningPathApi = axios.create({
  baseURL: LEARNING_PATH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Add token interceptor
learningPathApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 Learning Path API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for better error handling
learningPathApi.interceptors.response.use(
  (response) => {
    console.log(`📥 Learning Path API: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Learning Path API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const learningPathAPI = {
  /**
   * Get current learning path (main method)
   * @returns {Promise} Learning path data
   */
  getCurrentPath: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/current');
      console.log('📥 getCurrentPath response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get current learning path error:', error);
      return {
        success: false,
        data: {
          milestones: [],
          goal: '',
          description: '',
          totalProgress: 0,
          hasLearningPath: false
        }
      };
    }
  },

  /**
   * Alias for getCurrentPath (for compatibility)
   */
  getCurrentLearningPath: async () => {
    return learningPathAPI.getCurrentPath();
  },

  /**
   * Get user stats (level, XP, etc.)
   */
  getUserStats: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/stats');
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      // Fallback to default values
      return {
        success: true,
        data: {
          level: 1,
          xp: 0,
          streak: 0,
          nextLevelXP: 500,
          progressToNextLevel: 0,
          totalTopicsCompleted: 0,
          totalQuizzesTaken: 0,
          averageScore: 0
        }
      };
    }
  },

  /**
   * Update learning path progress when topic is completed
   * @param {Object} data - { topicId, milestoneId, completed }
   */
  updateProgress: async (data) => {
    try {
      const response = await learningPathApi.put('/learning-path/progress', data);
      return response.data;
    } catch (error) {
      console.error('Update learning path progress error:', error);
      throw error;
    }
  },

  /**
   * Complete a topic within a milestone
   * @param {Object} data - { milestoneId, topicIndex, timeSpent }
   */
  completeTopic: async (data) => {
    try {
      const response = await learningPathApi.post('/learning-path/complete-topic', data);
      return response.data;
    } catch (error) {
      console.error('Complete topic error:', error);
      throw error;
    }
  },

  /**
   * Get next steps (what to learn next)
   */
  getNextSteps: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/next-steps');
      return response.data;
    } catch (error) {
      console.error('Get next steps error:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  /**
   * Delete a learning path permanently
   * @param {string} pathId - The ID of the path to delete
   * @param {boolean} isActivePath - Whether this is the active path
   */
  deletePath: async (pathId, isActivePath = false) => {
    try {
      const response = await learningPathApi.delete(`/learning-path/delete/${pathId}`, {
        data: { isActivePath }
      });
      return response.data;
    } catch (error) {
      console.error('Delete path error:', error);
      throw error;
    }
  },

  /**
   * Get milestone details for review
   * @param {string} milestoneId - The ID of the milestone to review
   */
  getMilestoneForReview: async (milestoneId) => {
    try {
      const response = await learningPathApi.get(`/learning-path/milestone/${milestoneId}`);
      return response.data;
    } catch (error) {
      console.error('Get milestone for review error:', error);
      throw error;
    }
  },

  /**
   * Generate study schedule
   * @param {number} days - Number of days to generate schedule for
   */
  generateSchedule: async (days = 7) => {
    try {
      const response = await learningPathApi.get(`/learning-path/schedule?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Generate schedule error:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  /**
   * Check if user is on track
   */
  checkProgress: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/progress-check');
      return response.data;
    } catch (error) {
      console.error('Check progress error:', error);
      return {
        success: false,
        data: {
          onTrack: true,
          message: 'Unable to check progress',
          timeRemaining: null
        }
      };
    }
  },

  /**
   * Generate a new learning path (with forceCreate option)
   * @param {Object} data - { topic, difficulty, goal, timeCommitment, learningStyle, forceCreate }
   */
  generatePath: async (data) => {
    try {
      const response = await learningPathApi.post('/learning-path/generate', data);
      return response.data;
    } catch (error) {
      console.error('Generate learning path error:', error);
      throw error;
    }
  },

  /**
   * Pause the current active learning path
   */
  pauseCurrentPath: async () => {
    try {
      const response = await learningPathApi.post('/learning-path/pause');
      return response.data;
    } catch (error) {
      console.error('Pause path error:', error);
      throw error;
    }
  },

  /**
   * Alias for pauseCurrentPath
   */
  pausePath: async () => {
    return learningPathAPI.pauseCurrentPath();
  },

  /**
   * Resume a paused learning path
   * @param {string} pathId - The ID of the path to resume
   */
  resumePath: async (pathId) => {
    try {
      console.log('📤 Resuming path with ID:', pathId);
      const response = await learningPathApi.post('/learning-path/resume', { pathId });
      console.log('📥 Resume response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Resume path error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Archive a learning path
   * @param {string} goal - The goal/topic of the path to archive
   */
  archiveCurrentPath: async (goal) => {
    try {
      const response = await learningPathApi.post('/learning-path/archive', { goal });
      return response.data;
    } catch (error) {
      console.error('Archive path error:', error);
      throw error;
    }
  },

  /**
   * Alias for archiveCurrentPath
   */
  archivePath: async (goal) => {
    return learningPathAPI.archiveCurrentPath(goal);
  },

  /**
   * Get all learning paths (active, paused, completed)
   */
  getAllPaths: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/all');
      console.log('📥 getAllPaths raw response:', response.data);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            activePath: response.data.data.activePath || null,
            pausedPaths: response.data.data.pausedPaths || [],
            completedPaths: response.data.data.completedPaths || [],
            inProgressPaths: response.data.data.inProgressPaths || [],
            allPaths: response.data.data.allPaths || []
          }
        };
      }
      
      return {
        success: false,
        data: {
          activePath: null,
          pausedPaths: [],
          completedPaths: [],
          inProgressPaths: [],
          allPaths: []
        }
      };
    } catch (error) {
      console.error('Get all paths error:', error);
      return {
        success: false,
        data: {
          activePath: null,
          pausedPaths: [],
          completedPaths: [],
          inProgressPaths: [],
          allPaths: []
        }
      };
    }
  },

  /**
   * Get all completed paths (history)
   */
  getCompletedPaths: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/completed');
      return response.data;
    } catch (error) {
      console.error('Get completed paths error:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  /**
   * Switch to a previous learning path
   * @param {string} pathId - The ID of the path to switch to
   */
  switchToPath: async (pathId) => {
    try {
      const response = await learningPathApi.post(`/learning-path/switch/${pathId}`);
      return response.data;
    } catch (error) {
      console.error('Switch path error:', error);
      throw error;
    }
  },

  /**
   * Get recommended paths based on user's interests
   */
  getRecommendedPaths: async () => {
    try {
      const response = await learningPathApi.get('/learning-path/recommended');
      return response.data;
    } catch (error) {
      console.error('Get recommended paths error:', error);
      return {
        success: false,
        data: []
      };
    }
  }
};

export default learningPathApi;