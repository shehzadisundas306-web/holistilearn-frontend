// frontend/src/api/topics.js
import axios from 'axios';

// Create a separate axios instance for topics endpoints
const TOPICS_API_URL = process.env.REACT_APP_TOPICS_API_URL || 'https://holistilearn-backend.vercel.app/api';

const topicsApi = axios.create({
  baseURL: TOPICS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Add token interceptor
topicsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const topicsAPI = {
  // Get all topics with filters
  getTopics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      
      const url = params.toString() ? `/topics?${params}` : '/topics';
      const response = await topicsApi.get(url);
      return response.data;
    } catch (error) {
      console.error('Get topics error:', error.response?.data || error);
      throw error;
    }
  },

  // NEW: AI-Powered Topic Discovery
  discoverTopics: async ({ query, difficulty, goal }) => {
    try {
      console.log('🔍 Discovering topics:', { query, difficulty, goal });
      const response = await topicsApi.post('/topics/discover', { query, difficulty, goal });
      console.log('📥 Discover response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Discover topics error:', error.response?.data || error);
      throw error;
    }
  },

  // Start AI-generated topic (creates learning path)
  startAITopic: async (topicData) => {
    try {
      // This creates a learning path from AI-generated topic
      const response = await topicsApi.post('/topics/ai/start', {
        topic: topicData.title,
        difficulty: topicData.difficulty,
        goal: 'mastery',
        forceCreate: true
      });
      return response.data;
    } catch (error) {
      console.error('Start AI topic error:', error.response?.data || error);
      throw error;
    }
  },

  // Get topic by ID
  getTopicById: async (topicId) => {
    try {
      const response = await topicsApi.get(`/topics/${topicId}`);
      return response.data;
    } catch (error) {
      console.error('Get topic error:', error.response?.data || error);
      throw error;
    }
  },

  // Start a topic
  startTopic: async (topicId) => {
    try {
      const response = await topicsApi.post(`/topics/${topicId}/start`);
      return response.data;
    } catch (error) {
      console.error('Start topic error:', error.response?.data || error);
      throw error;
    }
  },
  // frontend/src/api/topics.js - Add this method
markSectionComplete: async (topicId, sectionIndex) => {
  try {
    const response = await topicsApi.post(`/topics/${topicId}/sections/${sectionIndex}/complete`);
    return response.data;
  } catch (error) {
    console.error('Mark section complete error:', error);
    throw error;
  }
},

  // Update topic progress
  updateTopicProgress: async (topicId, progress, lessonId, timeSpent) => {
    try {
      const response = await topicsApi.put(`/topics/${topicId}/progress`, {
        progress,
        lessonId,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('Update progress error:', error.response?.data || error);
      throw error;
    }
  },

  // Search topics
  searchTopics: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters.category) params.append('category', filters.category);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await topicsApi.get(`/topics/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Search topics error:', error.response?.data || error);
      throw error;
    }
  },

  // Get recommended topics
  getRecommendedTopics: async () => {
    try {
      const response = await topicsApi.get('/topics/recommended');
      return response.data;
    } catch (error) {
      console.error('Get recommended topics error:', error.response?.data || error);
      throw error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await topicsApi.get('/topics/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error.response?.data || error);
      throw error;
    }
  },

  // Get topic statistics
  getTopicStats: async () => {
    try {
      const response = await topicsApi.get('/topics/stats');
      return response.data;
    } catch (error) {
      console.error('Get topic stats error:', error.response?.data || error);
      throw error;
    }
  }
};

export default topicsApi;