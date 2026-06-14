// frontend/src/api/ai.js
import axios from 'axios';

// Create a separate axios instance for AI endpoints
const AI_API_URL = process.env.REACT_APP_AI_API_URL || 'https://holistilearn-backend.vercel.app/api';

const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Longer timeout for AI requests (60 seconds)
  withCredentials: true,
});

// Add token interceptor
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 AI API: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
aiApi.interceptors.response.use(
  (response) => {
    console.log(`📥 AI API: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ AI API Error:', {
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

export const aiAPI = {
  // Generate AI Study Notes
  generateNotes: async (data) => {
    try {
      const response = await aiApi.post('/ai/generate-notes', data,{
        timeout: 120000
      });
      return response.data;
    } catch (error) {
      console.error('Generate notes error:', error.response?.data || error);
      throw error;
    }
  },

  // Generate AI Quiz
  generateQuiz: async (data) => {
    try {
      const response = await aiApi.post('/ai/generate-quiz', data,{
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error('Generate quiz error:', error.response?.data || error);
      throw error;
    }
  },

  // Generate Learning Path
  // generateLearningPath: async (data) => {
  //   try {
  //     const response = await aiApi.post('/ai/generate-learning-path', data);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Generate learning path error:', error.response?.data || error);
  //     throw error;
  //   }
  // },


  // frontend/src/api/ai.js
// Increase timeout for learning path generation

  // Generate learning path with longer timeout
  generateLearningPath: async (data) => {
    try {
      const response = await aiApi.post('/ai/generate-learning-path', data, {
        timeout: 120000 // Increase to 120 seconds (2 minutes)
      });
      return response.data;
    } catch (error) {
      console.error('Generate learning path error:', error);
      
      // Handle timeout specially
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('AI service is taking longer than expected. Please try again or use fallback path.');
      }
      
      throw error.response?.data || error;
    }
  },
  // Get Topic Recommendations
  recommendTopics: async (data = {}) => {
    try {
      const response = await aiApi.post('/ai/recommend-topics', data);
      return response.data;
    } catch (error) {
      console.error('Recommend topics error:', error.response?.data || error);
      throw error;
    }
  },

  // Get Mental Health Tip
  getMentalHealthTip: async () => {
    try {
      const response = await aiApi.post('/ai/mental-health-tip');
      return response.data;
    } catch (error) {
      console.error('Get mental health tip error:', error.response?.data || error);
      throw error;
    }
  },

  // Download Notes
  downloadNotes: async (noteId, format) => {
    try {
      const response = await aiApi.get(`/ai/download/${noteId}/${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Download notes error:', error.response?.data || error);
      throw error;
    }
  },

  // ============ NEW NOTES MANAGEMENT ENDPOINTS ============

  // Get notes history with pagination
  getNotesHistory: async (page = 1, limit = 10) => {
    try {
      const response = await aiApi.get(`/ai/notes/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get notes history error:', error.response?.data || error);
      throw error;
    }
  },

  // Get single note by ID
  getNote: async (noteId) => {
    try {
      const response = await aiApi.get(`/ai/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Get note error:', error.response?.data || error);
      throw error;
    }
  },

  // Delete a note permanently
  deleteNote: async (noteId) => {
    try {
      const response = await aiApi.delete(`/ai/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Delete note error:', error.response?.data || error);
      throw error;
    }
  },

  // Archive a note (soft delete)
  archiveNote: async (noteId, isArchived = true) => {
    try {
      const response = await aiApi.put(`/ai/notes/${noteId}/archive`, { isArchived });
      return response.data;
    } catch (error) {
      console.error('Archive note error:', error.response?.data || error);
      throw error;
    }
  }
};

export default aiApi;