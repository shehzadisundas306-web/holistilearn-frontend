import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
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
        // Handle network errors
        if (!error.response) {
            console.error('Network Error - No response from server');
            return Promise.reject({ 
                success: false, 
                message: 'Network error. Please check your connection.' 
            });
        }
        
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error.response?.data || { message: error.message });
    }
);

// ==================== CLASS APIs ====================

/**
 * Join a class using class code
 * @param {string} classCode - The class code (e.g., ABC123)
 */
export const joinClassWithCode = async (classCode) => {
    try {
        const response = await api.post('/api/student/class/join', { classCode });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get all classes the student is enrolled in
 */
export const getStudentClasses = async () => {
    try {
        const response = await api.get('/api/student/classes');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get detailed information about a specific class
 * @param {string} classId - Class ID
 */
export const getStudentClassDetails = async (classId) => {
    try {
        const response = await api.get(`/api/student/classes/${classId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Leave a class
 * @param {string} classId - Class ID
 */
export const leaveClass = async (classId) => {
    try {
        const response = await api.delete(`/api/student/classes/${classId}/leave`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// frontend/src/api/studentApi.js

// ✅ Add this function to your existing studentApi.js
export const deleteQuizHistory = async (quizId) => {
  try {
    const response = await api.delete(`/api/quizzes/history/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Delete quiz history error:', error);
    throw error.response?.data || { message: 'Failed to delete quiz attempt' };
  }
};

// ==================== CHAT APIs ====================

/**
 * Get all chats for current user
 */
export const getUserChats = async () => {
    try {
        const response = await api.get('/api/chat/rooms');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Create or get existing chat with a user
 * @param {string} userId - User ID to chat with
 */
export const createOrGetChat = async (userId) => {
    try {
        const response = await api.post(`/api/chat/rooms/user/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get chat by ID with participant details
 * @param {string} chatId - Chat ID
 */
export const getChatById = async (chatId) => {
    try {
        const response = await api.get(`/api/chat/rooms/${chatId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get messages for a specific chat
 * @param {string} chatId - Chat ID
 */
export const getChatMessages = async (chatId) => {
    try {
        const response = await api.get(`/api/chat/${chatId}/messages`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Send a message (creates new chat if chatId not provided)
 * @param {Object} data - { chatId?, text, recipientId }
 */
export const sendMessage = async (data) => {
    try {
        const response = await api.post('/api/chat/send', {
            chatId: data.chatId || null,
            text: data.text,
            recipientId: data.recipientId
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Mark all messages as read in a chat
 * @param {string} chatId - Chat ID
 */
export const markMessagesAsRead = async (chatId) => {
    try {
        const response = await api.post(`/api/chat/${chatId}/read`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Mark a single message as read
 * @param {string} messageId - Message ID
 */
export const markMessageAsRead = async (messageId) => {
    try {
        const response = await api.post(`/api/chat/messages/${messageId}/read`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Send typing indicator
 * @param {Object} data - { chatId, recipientId, isTyping }
 */
export const sendTyping = async (data) => {
    try {
        const response = await api.post('/api/chat/typing', data);
        return response.data;
    } catch (error) {
        // Don't throw for typing errors - they're not critical
        console.error('Typing error:', error);
        return { success: false };
    }
};

/**
 * Delete a chat
 * @param {string} chatId - Chat ID
 */
export const deleteChat = async (chatId) => {
    try {
        const response = await api.delete(`/api/chat/rooms/${chatId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Verify access to a Firebase chat
 * @param {string} firebaseChatId - Firebase chat ID
 */
export const verifyChatAccess = async (firebaseChatId) => {
    try {
        const response = await api.get(`/api/chat/verify/${firebaseChatId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// ==================== TEACHER CHAT APIs ====================

/**
 * Get teacher's chats (for teacher dashboard)
 */
export const getTeacherChats = async () => {
    try {
        const response = await api.get('/api/chat/teacher/chats');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get messages for a specific teacher chat
 * @param {string} chatId - Chat ID
 */
export const getTeacherChatMessages = async (chatId) => {
    try {
        const response = await api.get(`/api/chat/teacher/chats/${chatId}/messages`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// ==================== QUIZ APIs ====================

// ==================== QUIZ APIs ====================

/**
 * Get quizzes for a specific class (student view)
 * @param {string} classId - Class ID
 */
export const getClassQuizzes = async (classId) => {
    try {
        const response = await api.get(`/api/quizzes/student/class/${classId}/quizzes`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get a specific quiz for taking (student view)
 * @param {string} quizId - Quiz ID
 */
export const getQuizForStudent = async (quizId) => {
    try {
        const response = await api.get(`/api/quizzes/student/quiz/${quizId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Submit quiz answers
 * @param {string} quizId - Quiz ID
 * @param {Object} data - { answers, timeSpent, mentalStateSnapshot }
 */
export const submitQuiz = async (quizId, data) => {
    try {
        const response = await api.post(`/api/quizzes/student/quiz/${quizId}/submit`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get quiz history for student
 * @param {Object} params - { page, limit }
 */
export const getQuizHistory = async (params = {}) => {
    try {
        // ✅ FIXED: Added 's' - should be /api/quizzes/history
        const response = await api.get('/api/quizzes/history', { params });
        return response.data;
    } catch (error) {
        console.error('Get quiz history error:', error);
        // Return empty data structure instead of throwing
        return {
            success: true,
            data: {
                quizzes: [],
                total: 0,
                page: 1,
                totalPages: 0
            }
        };
    }
};

/**
 * Get quiz stats for student
 */
export const getQuizStats = async () => {
    try {
        // ✅ FIXED: Added 's' - should be /api/quizzes/stats
        const response = await api.get('/api/quizzes/stats');
        return response.data;
    } catch (error) {
        console.error('Get quiz stats error:', error);
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
};


export const getQuizResult = async (quizId) => {
    try {
        console.log('getQuizResult called with quizId:', quizId);
        const response = await api.get(`/api/quizzes/result/${quizId}`);
        console.log('getQuizResult response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Get quiz result error:', error);
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Generate AI quiz
 * @param {Object} data - { topic, difficulty, numQuestions }
 */
export const generateAIQuiz = async (data) => {
    try {
        // ✅ FIXED: Added 's' - should be /api/quizzes/generate
        const response = await api.post('/api/quizzes/generate', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get student's personal practice quizzes
 */
export const getPersonalQuizzes = async () => {
    try {
        const response = await api.get('/api/quizzes/student/personal');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// ==================== PROGRESS APIs ====================

/**
 * Get student progress
 */
export const getStudentProgress = async () => {
    try {
        const response = await api.get('/api/student/progress');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

/**
 * Get student achievements
 */
export const getStudentAchievements = async () => {
    try {
        const response = await api.get('/api/student/achievements');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// ==================== ACTIVITY APIs ====================

/**
 * Get student activities
 * @param {Object} params - { page, limit, type }
 */
export const getStudentActivities = async (params = {}) => {
    try {
        const response = await api.get('/api/student/activities', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: error.message };
    }
};

// // ✅ Delete a single message
// export const deleteMessage = async (messageId, deleteForEveryone = false) => {
//     try {
//         const response = await api.delete(`/chat/messages/${messageId}`, {
//             data: { deleteForEveryone }
//         });
//         return response.data;
//     } catch (error) {
//         console.error('Delete message error:', error);
//         throw error.response?.data || error;
//     }
// };

// In studentApi.js

// ✅ Delete a single message
export const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
        // The URL should match the route: /api/chat/messages/:messageId
        const response = await api.delete(`/api/chat/messages/${messageId}`, {
            data: { deleteForEveryone }
        });
        return response.data;
    } catch (error) {
        console.error('Delete message error:', error);
        throw error.response?.data || error;
    }
};

// ✅ Clear all messages in a chat
export const clearChat = async (chatId, deleteForEveryone = false) => {
    try {
        const response = await api.delete(`/api/chats/${chatId}/clear`, {
            data: { deleteForEveryone }
        });
        return response.data;
    } catch (error) {
        console.error('Clear chat error:', error);
        throw error.response?.data || error;
    }
};

export default api;