// frontend/src/api/assignmentApi.js

import api from "../services/api";


// ==================== TEACHER APIS ====================

// Create a new assignment
export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/api/assignments', assignmentData);
    return response.data;
  } catch (error) {
    console.error('Create assignment error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create assignment'
    };
  }
};

// Get all assignments for a class (teacher view)
export const getClassAssignments = async (classId) => {
  try {
    const response = await api.get(`/api/assignments/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Get class assignments error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to load assignments',
      data: []
    };
  }
};

// Get submissions for a specific assignment (teacher view)
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    const response = await api.get(`/api/assignments/${assignmentId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Get submissions error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to load submissions',
      data: []
    };
  }
};

// Grade a submission
export const gradeSubmission = async (submissionId, gradeData) => {
  try {
    const response = await api.put(`/api/assignments/submissions/${submissionId}/grade`, gradeData);
    return response.data;
  } catch (error) {
    console.error('Grade submission error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to save grade'
    };
  }
};

// Delete assignment
export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await api.delete(`/api/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error('Delete assignment error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete assignment'
    };
  }
};

// ==================== STUDENT APIS ====================

// Get assignments for student (student view)
export const getStudentAssignments = async (classId) => {
  try {
    const response = await api.get(`/api/assignments/student/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error('Get student assignments error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to load assignments',
      data: []
    };
  }
};

// Submit assignment (student)
export const submitAssignment = async (assignmentId, submissionData) => {
  try {
    const response = await api.post(`/api/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  } catch (error) {
    console.error('Submit assignment error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to submit assignment'
    };
  }
};

// Get student's submission for an assignment
export const getStudentSubmission = async (assignmentId) => {
  try {
    const response = await api.get(`/api/assignments/${assignmentId}/submission`);
    return response.data;
  } catch (error) {
    console.error('Get student submission error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to load submission',
      data: null
    };
  }
};