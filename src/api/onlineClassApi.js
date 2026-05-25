// frontend/src/api/onlineClassApi.js
import api from "../services/api";

// ==================== SESSION MANAGEMENT ====================

// Get all online sessions for a specific class
export const getSessionsByClass = async (classId) => {
    try {
        const response = await api.get(`/api/online-class/class/${classId}`);
        return response.data;
    } catch (error) {
        console.error('Get sessions error:', error);
        throw error.response?.data || error;
    }
};

// Create a new session (teacher only)
export const createOnlineSession = async (data) => {
    try {
        const response = await api.post('/api/online-class/create', data);
        console.log('Create session response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Create session API error:', error);
        throw error.response?.data || error;
    }
};

// Start a session (teacher only)
export const startSession = async (sessionId) => {
    try {
        const response = await api.put(`/api/online-class/${sessionId}/start`);
        return response.data;
    } catch (error) {
        console.error('Start session error:', error);
        throw error.response?.data || error;
    }
};

// End a session (teacher only) - kicks all participants
// export const endSession = async (sessionId) => {
//     try {
//         const response = await api.post(`/api/online-class/${sessionId}/end`);
//         return response.data;
//     } catch (error) {
//         console.error('End session error:', error);
//         throw error.response?.data || error;
//     }
// };

// frontend/src/api/onlineClassApi.js

// End a session (teacher only) - kicks all participants
export const endSession = async (sessionId) => {
    try {
        console.log('🔍 Ending session with ID:', sessionId);
        console.log('🔍 Token exists:', !!localStorage.getItem('token'));
        
        // ✅ Try different HTTP methods if POST fails
        const response = await api.post(`/api/online-class/${sessionId}/end`);
        
        console.log('✅ End session response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ End session error details:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            data: error.response?.data,
            config: error.config
        });
        throw error.response?.data || error;
    }
};

// Delete a scheduled session (teacher only)
export const deleteSession = async (sessionId) => {
    try {
        console.log('Deleting session with ID:', sessionId);
        const response = await api.delete(`/api/online-class/${sessionId}`);
        console.log('Delete response:', response);
        return response.data;
    } catch (error) {
        console.error('Delete session API error:', error);
        throw error.response?.data || error;
    }
};

// Check if teacher has an active live session
export const checkTeacherActiveSession = async () => {
    try {
        const response = await api.get('/api/online-class/teacher/active-session');
        return response.data;
    } catch (error) {
        console.error('Check active session error:', error);
        throw error.response?.data || error;
    }
};

// Get single session details
export const getSessionById = async (sessionId) => {
    try {
        const response = await api.get(`/api/online-class/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Get session error:', error);
        throw error.response?.data || error;
    }
};

// Join a session – returns meeting info (Jitsi URL)
export const joinSession = async (sessionId) => {
    try {
        const response = await api.post(`/api/online-class/${sessionId}/join`);
        return response.data;
    } catch (error) {
        console.error('Join session error:', error);
        throw error.response?.data || error;
    }
};

// ==================== PARTICIPANT MANAGEMENT (Real-time) ====================

// Record participant joining a session (for attendance tracking)
export const joinSessionParticipant = async (sessionId) => {
    try {
        const response = await api.post(`/api/online-class/${sessionId}/participant/join`);
        return response.data;
    } catch (error) {
        console.error('Join participant error:', error);
        throw error.response?.data || error;
    }
};

// Record participant leaving a session
export const leaveSessionParticipant = async (sessionId) => {
    try {
        const response = await api.post(`/api/online-class/${sessionId}/participant/leave`);
        return response.data;
    } catch (error) {
        console.error('Leave participant error:', error);
        throw error.response?.data || error;
    }
};

// Get all active participants in a session
export const getSessionParticipants = async (sessionId) => {
    try {
        const response = await api.get(`/api/online-class/${sessionId}/participants`);
        return response.data;
    } catch (error) {
        console.error('Get participants error:', error);
        throw error.response?.data || error;
    }
};

// ==================== EXPORT ALL ====================

export default {
    getSessionsByClass,
    createOnlineSession,
    startSession,
    endSession,
    deleteSession,
    checkTeacherActiveSession,
    getSessionById,
    joinSession,
    joinSessionParticipant,
    leaveSessionParticipant,
    getSessionParticipants,
};