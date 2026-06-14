// frontend/src/api/quiz.js
import axios from 'axios';

const QUIZ_API_URL = process.env.REACT_APP_QUIZ_API_URL || 'https://holistilearn-backend.vercel.app/api';

const quizApi = axios.create({
  baseURL: QUIZ_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
  withCredentials: true,
});

// Add token interceptor
quizApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
quizApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const quizAPI = {
  // ============================================
  // QUIZ GENERATION
  // ============================================
  
  /**
   * Generate a new AI-powered quiz
   * @param {Object} data - { topic, difficulty, numQuestions }
   */
  generateQuiz: async (data) => {
    try {
      const response = await quizApi.post('/quizzes/generate', data);
      return response.data;
    } catch (error) {
      console.error('Generate quiz error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // ============================================
  // QUIZ RETRIEVAL
  // ============================================
  
  /**
   * Get quiz by ID
   * @param {string} quizId - Quiz ID
   */
  getQuizById: async (quizId) => {
    try {
      const response = await quizApi.get(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Get quiz error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get quizzes by topic
   * @param {string} topicId - Topic ID
   * @param {string} difficulty - Optional difficulty filter
   */
  getQuizzesByTopic: async (topicId, difficulty) => {
    try {
      const url = difficulty 
        ? `/quizzes/topic/${topicId}?difficulty=${difficulty}`
        : `/quizzes/topic/${topicId}`;
      const response = await quizApi.get(url);
      return response.data;
    } catch (error) {
      console.error('Get quizzes by topic error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // ============================================
  // QUIZ SUBMISSION & RESULTS
  // ============================================
  
  /**
   * Submit quiz answers
   * @param {string} quizId - Quiz ID
   * @param {Array} answers - Array of answers
   * @param {number} timeSpent - Time spent in seconds
   * @param {Object} mentalStateSnapshot - Mental state snapshot
   */
  submitQuiz: async (quizId, answers, timeSpent, mentalStateSnapshot) => {
    try {
      const response = await quizApi.post(`/quizzes/${quizId}/submit`, {
        answers,
        timeSpent,
        mentalStateSnapshot
      });
      return response.data;
    } catch (error) {
      console.error('Submit quiz error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get quiz results for a specific quiz
   * @param {string} quizId - Quiz ID
   */
  getQuizResults: async (quizId) => {
    try {
      const response = await quizApi.get(`/quizzes/${quizId}/results`);
      return response.data;
    } catch (error) {
      console.error('Get quiz results error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single quiz result by ID (from history)
   * @param {string} quizId - Quiz ID
   */
  getQuizResultById: async (quizId) => {
    try {
      const response = await quizApi.get(`/quizzes/result/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Get quiz result by ID error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // ============================================
  // QUIZ HISTORY & STATISTICS
  // ============================================
  
  /**
   * Get quiz history with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   */
  getQuizHistory: async (page = 1, limit = 20) => {
    try {
      const response = await quizApi.get('/quizzes/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get quiz history error:', error.response?.data || error);
      // Return empty data structure instead of throwing
      return {
        success: false,
        data: {
          quizzes: [],
          total: 0,
          page: 1,
          totalPages: 0,
          limit: 20
        }
      };
    }
  },

  /**
   * Get quiz statistics overview
   */
  getQuizStats: async () => {
    try {
      const response = await quizApi.get('/quizzes/stats');
      return response.data;
    } catch (error) {
      console.error('Get quiz stats error:', error.response?.data || error);
      // Return default stats structure
      return {
        success: true,
        data: {
          overview: {
            totalQuizzes: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 0,
            totalTimeSpent: 0
          },
          topicsMastered: [],
          weakTopics: []
        }
      };
    }
  },

  /**
   * Delete quiz history entry
   * @param {string} quizId - Quiz ID to delete
   */
  deleteQuizHistory: async (quizId) => {
    try {
      const response = await quizApi.delete(`/quizzes/history/${quizId}`);
      return response.data;
    } catch (error) {
      console.error('Delete quiz history error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // ============================================
  // HELPER METHODS
  // ============================================
  
  /**
   * Get all quiz attempts for a specific topic
   * @param {string} topic - Topic name
   */
  getQuizAttemptsByTopic: async (topic) => {
    try {
      const history = await quizAPI.getQuizHistory(1, 100);
      if (history.success && history.data.quizzes) {
        const filtered = history.data.quizzes.filter(quiz => quiz.topic === topic);
        return {
          success: true,
          data: filtered,
          total: filtered.length
        };
      }
      return { success: false, data: [], total: 0 };
    } catch (error) {
      console.error('Get attempts by topic error:', error);
      return { success: false, data: [], total: 0 };
    }
  },

  /**
   * Get best performance by topic
   */
  getBestPerformanceByTopic: async () => {
    try {
      const stats = await quizAPI.getQuizStats();
      if (stats.success && stats.data.topicsMastered) {
        return stats.data.topicsMastered;
      }
      return [];
    } catch (error) {
      console.error('Get best performance error:', error);
      return [];
    }
  },

  /**
   * Get weak areas
   */
  getWeakAreas: async () => {
    try {
      const stats = await quizAPI.getQuizStats();
      if (stats.success && stats.data.weakTopics) {
        return stats.data.weakTopics;
      }
      return [];
    } catch (error) {
      console.error('Get weak areas error:', error);
      return [];
    }
  }
};

export default quizApi;