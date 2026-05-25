// frontend/src/api/adminApi.js
import api from '../services/api';

const ADMIN_BASE = '/api/admin';

// ==================== DASHBOARD ====================
export const getDashboardStats = async () => {
    const response = await api.get(`${ADMIN_BASE}/dashboard/stats`);
    return response.data;
};

// ✅ Update admin profile
export const updateAdminProfile = async (data) => {
    try {
        const response = await api.put(`${ADMIN_BASE}/profile/update`, data);
        return response.data;
    } catch (error) {
        console.error('Update admin profile error:', error);
        throw error.response?.data || error;
    }
};

export const getPlatformAnalytics = async (period = 'week') => {
    const response = await api.get(`${ADMIN_BASE}/analytics?period=${period}`);
    return response.data;
};

// ==================== USER MANAGEMENT ====================
export const getAllUsers = async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`${ADMIN_BASE}/users?${queryParams}`);
    return response.data;
};

export const getUserDetails = async (userId) => {
    const response = await api.get(`${ADMIN_BASE}/users/${userId}`);
    return response.data;
};

export const updateUserStatus = async (userId, isBlocked, reason = '') => {
    const response = await api.put(`${ADMIN_BASE}/users/${userId}/status`, { isBlocked, reason });
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await api.delete(`${ADMIN_BASE}/users/${userId}`);
    return response.data;
};

// ==================== TEACHER MANAGEMENT ====================
export const getPendingTeachers = async () => {
    const response = await api.get(`${ADMIN_BASE}/teachers/pending`);
    return response.data;
};

export const approveTeacher = async (teacherId) => {
    const response = await api.put(`${ADMIN_BASE}/teachers/${teacherId}/approve`);
    return response.data;
};

export const rejectTeacher = async (teacherId, reason = '') => {
    const response = await api.put(`${ADMIN_BASE}/teachers/${teacherId}/reject`, { reason });
    return response.data;
};

export const getTeacherStats = async () => {
    const response = await api.get(`${ADMIN_BASE}/teachers/stats`);
    return response.data;
};

// ==================== STUDENT MANAGEMENT ====================
export const getStudentStats = async () => {
    const response = await api.get(`${ADMIN_BASE}/students/stats`);
    return response.data;
};

// ==================== CLASS MANAGEMENT ====================
export const getAllClasses = async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`${ADMIN_BASE}/classes?${queryParams}`);
    return response.data;
};

export const deleteClass = async (classId) => {
    const response = await api.delete(`${ADMIN_BASE}/classes/${classId}`);
    return response.data;
};

// ==================== QUIZ MANAGEMENT ====================
export const getAllQuizzes = async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`${ADMIN_BASE}/quizzes?${queryParams}`);
    return response.data;
};

export const deleteQuiz = async (quizId) => {
    const response = await api.delete(`${ADMIN_BASE}/quizzes/${quizId}`);
    return response.data;
};

// ==================== SETTINGS ====================
export const getSystemSettings = async () => {
    const response = await api.get(`${ADMIN_BASE}/settings`);
    return response.data;
};

export const updateSystemSettings = async (settings) => {
    const response = await api.put(`${ADMIN_BASE}/settings`, settings);
    return response.data;
};

// ==================== ACTIVITY LOGS ====================
export const getActivityLogs = async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`${ADMIN_BASE}/activities?${queryParams}`);
    return response.data;
};

// frontend/src/api/adminApi.js

// Get all teachers for admin (with teacher profiles)
export const getAllTeachersForAdmin = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`${ADMIN_BASE}/teachers/all?${queryParams}`);
        return response.data;
    } catch (error) {
        console.error('Get all teachers error:', error);
        throw error.response?.data || error;
    }
};