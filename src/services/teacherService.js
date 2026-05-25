import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class TeacherService {
  // ==================== TEACHER DISCOVERY APIs (For Students) ====================

  /**
   * Get paginated teachers with search/filter
   * Used by students to find teachers
   */
  async getTeachers({ page = 1, limit = 12, search = '', subject = '' }) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(subject && { subject })
      });
      
      const response = await api.get(`/api/teacher/discover?${params}`);
      return response.data;
    } catch (error) {
      console.error('Get teachers error:', error);
      throw error;
    }
  }

  /**
   * Get teacher by ID (for student view)
   */
  async getTeacherById(teacherId) {
    try {
      const response = await api.get(`/api/teacher/discover/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('Get teacher by ID error:', error);
      throw error;
    }
  }

  /**
   * Get all unique subjects from teachers
   * Used for filtering in discovery page
   */
  async getSubjects() {
    try {
      const response = await api.get('/api/teacher/discover/subjects');
      return response.data;
    } catch (error) {
      console.error('Get subjects error:', error);
      return { success: false, subjects: [] };
    }
  }

  // ==================== TEACHER PROFILE APIs (For Teachers) ====================

  /**
   * Create or update teacher profile
   */
  async createTeacherProfile(profileData) {
    try {
      const response = await api.post('/api/teacher/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Create teacher profile error:', error);
      throw error;
    }
  }

  /**
   * Get teacher profile
   */
  async getTeacherProfile() {
    try {
      const response = await api.get('/api/teacher/profile');
      return response.data;
    } catch (error) {
      console.error('Get teacher profile error:', error);
      throw error;
    }
  }

  /**
   * Check if teacher profile is complete
   */
  async checkProfileStatus() {
    try {
      const response = await api.get('/api/teacher/profile/status');
      return response.data;
    } catch (error) {
      console.error('Check profile status error:', error);
      throw error;
    }
  }

  /**
   * Update subjects and topics
   */
  async updateSubjectsAndTopics(data) {
    try {
      const response = await api.put('/api/teacher/profile/subjects', data);
      return response.data;
    } catch (error) {
      console.error('Update subjects error:', error);
      throw error;
    }
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(formData) {
    try {
      const response = await api.put('/api/teacher/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Update profile picture error:', error);
      throw error;
    }
  }

  /**
   * Update teacher settings
   */
  async updateTeacherSettings(settings) {
    try {
      const response = await api.put('/api/teacher/profile/settings', { settings });
      return response.data;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  // ==================== CLASS MANAGEMENT APIs ====================

  /**
   * Create a new class
   */
  async createClass(classData) {
    try {
      const response = await api.post('/api/teacher/classes', classData);
      return response.data;
    } catch (error) {
      console.error('Create class error:', error);
      throw error;
    }
  }

  /**
   * Get all classes for the teacher
   */
  async getMyClasses() {
    try {
      const response = await api.get('/api/teacher/classes');
      return response.data;
    } catch (error) {
      console.error('Get classes error:', error);
      throw error;
    }
  }

  /**
   * Get single class details
   */
  async getClassDetails(classId) {
    try {
      const response = await api.get(`/api/teacher/classes/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Get class details error:', error);
      throw error;
    }
  }

  /**
   * Update class information
   */
  async updateClass(classId, updates) {
    try {
      const response = await api.put(`/api/teacher/classes/${classId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update class error:', error);
      throw error;
    }
  }

  /**
   * Delete a class
   */
  async deleteClass(classId) {
    try {
      const response = await api.delete(`/api/teacher/classes/${classId}`);
      return response.data;
    } catch (error) {
      console.error('Delete class error:', error);
      throw error;
    }
  }

  /**
   * Regenerate class code
   */
  async regenerateClassCode(classId) {
    try {
      const response = await api.post(`/api/teacher/classes/${classId}/regenerate-code`);
      return response.data;
    } catch (error) {
      console.error('Regenerate code error:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD APIs ====================

  /**
   * Get teacher dashboard data
   */
  async getTeacherDashboard() {
    try {
      const response = await api.get('/api/teacher/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get teacher quick stats
   */
  async getTeacherStats() {
    try {
      const response = await api.get('/api/teacher/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }

  /**
   * Get class analytics
   */
  async getClassAnalytics(classId) {
    try {
      const response = await api.get(`/api/teacher/dashboard/class/${classId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Get class analytics error:', error);
      throw error;
    }
  }

  // ==================== QUIZ APIs ====================

  /**
   * Create a new quiz
   */
  async createQuiz(quizData) {
    try {
      const response = await api.post('/api/quizzes/create', quizData);
      return response.data;
    } catch (error) {
      console.error('Create quiz error:', error);
      throw error;
    }
  }

  /**
   * Get all quizzes for teacher
   */
  async getTeacherQuizzes() {
    try {
      const response = await api.get('/api/quizzes/teacher');
      return response.data;
    } catch (error) {
      console.error('Get quizzes error:', error);
      throw error;
    }
  }

  /**
   * Generate quiz with AI
   */
  async generateQuizWithAI(params) {
    try {
      const response = await api.post('/api/ai/generate-quiz', params);
      return response.data;
    } catch (error) {
      console.error('AI generate quiz error:', error);
      throw error;
    }
  }

  // ==================== CHAT APIs ====================

  /**
   * Get all teacher chats
   */
  async getTeacherChats() {
    try {
      const response = await api.get('/api/chat/teacher/chats');
      return response.data;
    } catch (error) {
      console.error('Get chats error:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat
   */
  async getChatMessages(chatId) {
    try {
      const response = await api.get(`/api/chat/messages/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(messageData) {
    try {
      const response = await api.post('/api/chat/send', messageData);
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  // ==================== EXPORT/DATA APIs ====================

  /**
   * Export teacher data
   */
  async exportTeacherData() {
    try {
      const response = await api.get('/api/teacher/export-data');
      return response.data;
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }
}

export default new TeacherService();