import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
    (config) => {
        // Try multiple token storage locations (for compatibility)
        const token = localStorage.getItem('accessToken') || 
                      localStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ==================== ASSIGNMENT APIs ====================

/**
 * Create a new assignment (Teacher)
 * @param {Object} assignmentData - { classId, title, description, dueDate, totalPoints, attachment }
 */
export const createAssignment = async (assignmentData) => {
    try {
        const response = await api.post('/api/assignments', assignmentData);
        return response.data;
    } catch (error) {
        console.error('Create assignment error:', error);
        throw error;
    }
};

/**
 * Get all assignments for a class (Teacher view)
 * @param {string} classId - Class ID
 */
export const getClassAssignments = async (classId) => {
    try {
        const response = await api.get(`/api/assignments/class/${classId}`);
        return response.data;
    } catch (error) {
        console.error('Get class assignments error:', error);
        throw error;
    }
};

/**
 * Get submissions for a specific assignment (Teacher view)
 * @param {string} assignmentId - Assignment ID
 */
export const getAssignmentSubmissions = async (assignmentId) => {
    try {
        const response = await api.get(`/api/assignments/${assignmentId}/submissions`);
        return response.data;
    } catch (error) {
        console.error('Get assignment submissions error:', error);
        throw error;
    }
};

/**
 * Grade a submission (Teacher)
 * @param {string} submissionId - Submission ID
 * @param {Object} gradeData - { marks, feedback }
 */
export const gradeSubmission = async (submissionId, gradeData) => {
    try {
        const response = await api.put(`/api/assignments/submissions/${submissionId}/grade`, gradeData);
        return response.data;
    } catch (error) {
        console.error('Grade submission error:', error);
        throw error;
    }
};

/**
 * Delete an assignment (Teacher)
 * @param {string} assignmentId - Assignment ID
 */
export const deleteAssignment = async (assignmentId) => {
    try {
        const response = await api.delete(`/api/assignments/${assignmentId}`);
        return response.data;
    } catch (error) {
        console.error('Delete assignment error:', error);
        throw error;
    }
};

/**
 * Get assignments for student (Student view)
 * @param {string} classId - Class ID
 */
export const getStudentAssignments = async (classId) => {
    try {
        const response = await api.get(`/api/assignments/student/class/${classId}`);
        return response.data;
    } catch (error) {
        console.error('Get student assignments error:', error);
        throw error;
    }
};

/**
 * Submit assignment (Student)
 * @param {string} assignmentId - Assignment ID
 * @param {Object} submissionData - { submissionFile }
 */
export const submitAssignment = async (assignmentId, submissionData) => {
    try {
        const response = await api.post(`/api/assignments/${assignmentId}/submit`, submissionData);
        return response.data;
    } catch (error) {
        console.error('Submit assignment error:', error);
        throw error;
    }
};

/**
 * Get student's submission for an assignment (Student view)
 * @param {string} assignmentId - Assignment ID
 */
export const getStudentSubmission = async (assignmentId) => {
    try {
        const response = await api.get(`/api/assignments/${assignmentId}/submission`);
        return response.data;
    } catch (error) {
        console.error('Get student submission error:', error);
        throw error;
    }
};

// ==================== UPLOAD APIs ====================

/**
 * Upload a file
 * @param {File} file - File to upload
 * @param {string} type - File type (assignment, submission, chat, general)
 */
export const uploadFile = async (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
        const response = await api.post('/api/upload/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

// ==================== TEACHER PROFILE APIs ====================

/**
 * Create or update teacher profile
 * @param {Object} profileData - { degree, specialization, experience, bio }
 */
export const createTeacherProfile = async (profileData) => {
    try {
        const response = await api.post('/api/teacher/profile', profileData);
        return response.data;
    } catch (error) {
        console.error('Create teacher profile error:', error);
        throw error;
    }
};

/**
 * Get teacher profile
 */
export const getTeacherProfile = async () => {
    try {
        const response = await api.get('/api/teacher/profile');
        return response.data;
    } catch (error) {
        console.error('Get teacher profile error:', error);
        throw error.response?.data || error;
    }
};

/**
 * Check if teacher profile is complete
 */
export const checkProfileStatus = async () => {
    try {
        const response = await api.get('/api/teacher/profile/status');
        return response.data;
    } catch (error) {
        console.error('Check profile status error:', error);
        throw error;
    }
};

/**
 * Update teacher subjects and topics
 * @param {Object} data - { subjects: [], topics: [] }
 */
export const updateSubjectsAndTopics = async (data) => {
    try {
        const response = await api.put('/api/teacher/profile/subjects', data);
        return response.data;
    } catch (error) {
        console.error('Update subjects error:', error);
        throw error;
    }
};

// frontend/src/api/teacherApi.js

/**
 * Update profile picture
 * @param {FormData} formData - FormData containing the image file
 */
export const updateProfilePicture = async (formData) => {
    try {
        const response = await api.put('/api/teacher/profile/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Update profile picture error:', error);
        throw error;
    }
};

/**
 * Update teacher settings
 * @param {Object} settings - { emailNotifications, pushNotifications, profileVisibility }
 */
export const updateTeacherSettings = async (settings) => {
    try {
        const response = await api.put('/api/teacher/profile/settings', { settings });
        return response.data;
    } catch (error) {
        console.error('Update settings error:', error);
        throw error;
    }
};

// ==================== CLASS MANAGEMENT APIs ====================

/**
 * Create a new class
 * @param {Object} classData - { className, subject, topic, description }
 */
export const createClass = async (classData) => {
    try {
        const response = await api.post('/api/teacher/classes', classData);
        return response.data;
    } catch (error) {
        console.error('Create class error:', error);
        throw error;
    }
};

/**
 * Get all classes for the teacher
 */
export const getMyClasses = async () => {
    try {
        const response = await api.get('/api/teacher/classes');
        return response.data;
    } catch (error) {
        console.error('Get classes error:', error);
        throw error;
    }
};

/**
 * Get single class details
 * @param {string} classId - Class ID
 */
export const getClassDetails = async (classId) => {
    try {
        const response = await api.get(`/api/teacher/classes/${classId}`);
        return response.data;
    } catch (error) {
        console.error('Get class details error:', error);
        throw error;
    }
};

/**
 * Update class information
 * @param {string} classId - Class ID
 * @param {Object} updates - Fields to update
 */
export const updateClass = async (classId, updates) => {
    try {
        const response = await api.put(`/api/teacher/classes/${classId}`, updates);
        return response.data;
    } catch (error) {
        console.error('Update class error:', error);
        throw error;
    }
};

/**
 * Delete a class
 * @param {string} classId - Class ID
 */
export const deleteClass = async (classId) => {
    try {
        const response = await api.delete(`/api/teacher/classes/${classId}`);
        return response.data;
    } catch (error) {
        console.error('Delete class error:', error);
        throw error;
    }
};

/**
 * Regenerate class code
 * @param {string} classId - Class ID
 */
export const regenerateClassCode = async (classId) => {
    try {
        const response = await api.post(`/api/teacher/classes/${classId}/regenerate-code`);
        return response.data;
    } catch (error) {
        console.error('Regenerate code error:', error);
        throw error;
    }
};

// ==================== DASHBOARD APIs ====================

/**
 * Get teacher dashboard data (stats, activity, charts)
 */
export const getTeacherDashboard = async () => {
    try {
        const response = await api.get('/api/teacher/dashboard');
        return response.data;
    } catch (error) {
        console.error('Get dashboard error:', error);
        throw error;
    }
};

/**
 * Get teacher quick stats (for header cards)
 */
export const getTeacherStats = async () => {
    try {
        const response = await api.get('/api/teacher/dashboard/stats');
        return response.data;
    } catch (error) {
        console.error('Get stats error:', error);
        throw error;
    }
};

/**
 * Get class analytics (performance data)
 * @param {string} classId - Class ID
 */
export const getClassAnalytics = async (classId) => {
    try {
        const response = await api.get(`/api/teacher/dashboard/class/${classId}/analytics`);
        return response.data;
    } catch (error) {
        console.error('Get class analytics error:', error);
        throw error;
    }
};

// ==================== TEACHER DISCOVERY APIs ====================

/**
 * Get all teachers (for student discovery)
 * @param {Object} params - { page, limit, subject, search }
 */
export const getAllTeachers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/api/teacher/discover${queryParams ? `?${queryParams}` : ''}`);
        return response.data;
    } catch (error) {
        console.error('Get all teachers error:', error);
        throw error;
    }
};

/**
 * Get teacher by ID (for student view)
 * @param {string} teacherId - Teacher ID
 */
export const getTeacherById = async (teacherId) => {
    try {
        const response = await api.get(`/api/teacher/discover/${teacherId}`);
        return response.data;
    } catch (error) {
        console.error('Get teacher by ID error:', error);
        throw error;
    }
};

// ==================== TEACHER CHAT APIs ====================

/**
 * Get all chats for teacher (direct messages)
 */
export const getTeacherChats = async () => {
    try {
        const response = await api.get('/api/chat/teacher/chats');
        return response.data;
    } catch (error) {
        console.error('Get teacher chats error:', error);
        throw error;
    }
};

/**
 * Get messages for a specific teacher chat
 * @param {string} chatId - Chat ID
 */
export const getTeacherChatMessages = async (chatId) => {
    try {
        const response = await api.get(`/api/chat/teacher/chats/${chatId}/messages`);
        console.log('Raw messages response:', response);
        
        // Handle different response structures
        if (response.data && response.data.success) {
            return {
                success: true,
                messages: response.data.messages || response.data.data?.messages || []
            };
        }
        
        return response.data;
    } catch (error) {
        console.error('Get teacher chat messages error:', error);
        // Try fallback endpoint
        try {
            const fallbackResponse = await api.get(`/api/chat/${chatId}/messages`);
            return fallbackResponse.data;
        } catch (fallbackError) {
            throw error.response?.data || { message: error.message };
        }
    }
};

/**
 * Create or get existing chat with a student
 * @param {string} studentId - Student ID to chat with
 */
export const createOrGetTeacherChat = async (studentId) => {
    try {
        const response = await api.post(`/api/chat/rooms/user/${studentId}`);
        return response.data;
    } catch (error) {
        console.error('Create teacher chat error:', error);
        throw error;
    }
};

/**
 * Send message as teacher
 * @param {Object} data - { chatId, text, recipientId }
 */
export const sendTeacherMessage = async (data) => {
    try {
        const response = await api.post('/api/chat/send', {
            chatId: data.chatId || null,
            text: data.text,
            recipientId: data.recipientId
        });
        return response.data;
    } catch (error) {
        console.error('Send teacher message error:', error);
        throw error;
    }
};

/**
 * Mark messages as read in a teacher chat
 * @param {string} chatId - Chat ID
 */
export const markTeacherChatRead = async (chatId) => {
    try {
        const response = await api.post(`/api/chat/${chatId}/read`);
        return response.data;
    } catch (error) {
        console.error('Mark chat read error:', error);
        throw error;
    }
};

/**
 * Send typing indicator as teacher
 * @param {Object} data - { chatId, recipientId, isTyping }
 */
export const sendTeacherTyping = async (data) => {
    try {
        const response = await api.post('/api/chat/typing', data);
        return response.data;
    } catch (error) {
        // Don't throw for typing errors
        console.error('Teacher typing error:', error);
        return { success: false };
    }
};

/**
 * Delete a teacher chat
 * @param {string} chatId - Chat ID
 */
export const deleteTeacherChat = async (chatId) => {
    try {
        const response = await api.delete(`/api/chat/rooms/${chatId}`);
        return response.data;
    } catch (error) {
        console.error('Delete teacher chat error:', error);
        throw error;
    }
};

/**
 * Get chat by ID with participant details
 * @param {string} chatId - Chat ID
 */
export const getTeacherChatById = async (chatId) => {
    try {
        const response = await api.get(`/api/chat/rooms/${chatId}`);
        return response.data;
    } catch (error) {
        console.error('Get chat by ID error:', error);
        throw error;
    }
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @param {boolean} deleteForEveryone - Delete for everyone or just for me
 */
export const deleteTeacherMessage = async (messageId, deleteForEveryone = false) => {
    try {
        const response = await api.delete(`/api/chat/messages/${messageId}`, {
            data: { deleteForEveryone }
        });
        return response.data;
    } catch (error) {
        console.error('Delete message error:', error);
        throw error.response?.data || error;
    }
};

// Export the api instance for custom use
export default api;