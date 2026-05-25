import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { getClassDetails, getClassAnalytics, updateClass } from '../../api/teacherApi';
import { getSessionsByClass, createOnlineSession, startSession, deleteSession, endSession } from '../../api/onlineClassApi';
import { getClassAssignments, getAssignmentSubmissions, deleteAssignment, gradeSubmission } from '../../api/assignmentApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import socketService from '../../services/socketService';
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  MessageSquare,
  Copy,
  RefreshCw,
  ChevronLeft,
  TrendingUp,
  Award,
  Clock,
  Calendar,
  UserPlus,
  Settings,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Send,
  MoreVertical,
  Trash2,
  Link,
  ChevronRight,
  Video,
  Plus,
  Play,
  LogIn,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { useGetData } from '../../context/userContext';
import '../../styles/teacher/TeacherClassDetail.css';
import UploadAssignmentModal from '../../components/teacher/assignments/UploadAssignmentModal';

// ✅ FIXED: Assignment Card Component with proper download handling
const AssignmentCard = ({ assignment, onViewSubmissions, onDelete }) => {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ✅ Get backend URL from environment
  const API_BASE = process.env.REACT_APP_API_URL1 || 'http://localhost:5000';
  
  // ✅ Fix: Get full file URL
  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const handleDownload = (e, url, fileName) => {
    e.stopPropagation();
    const fullUrl = getFullFileUrl(url);
    console.log('📥 Downloading from:', fullUrl);
    
    // Open in new tab for PDF, download for others
    if (url?.endsWith('.pdf')) {
      window.open(fullUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${assignment.title}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      const result = await deleteAssignment(assignment._id);
      if (result.success) {
        toast.success('Assignment deleted successfully');
        if (onDelete) onDelete(assignment._id);
      } else {
        toast.error(result.message || 'Failed to delete assignment');
      }
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="assignment-card"
      style={{
        background: 'rgba(16, 46, 80, 0.8)',
        borderRadius: '20px',
        padding: '1.25rem',
        border: '1px solid rgba(245, 196, 94, 0.2)',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: 'none',
          borderRadius: '8px',
          padding: '4px 8px',
          color: '#ef4444',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.7rem',
          zIndex: 10
        }}
      >
        <Trash2 size={14} />
        {isDeleting ? '...' : 'Delete'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingRight: '60px' }}>
        <FileText size={20} color="#F5C45E" />
        <h3 style={{ color: 'white', fontSize: '1rem', margin: 0 }}>{assignment.title}</h3>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.4' }}>
        {assignment.description?.substring(0, 100)}...
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          <Calendar size={12} />
          Due: {dueDate.toLocaleDateString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          <Clock size={12} />
          {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          <Users size={12} />
          {assignment.submissionsCount || 0} submitted
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          <FileText size={12} />
          Points: {assignment.totalPoints || 100}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={(e) => handleDownload(e, assignment.attachment?.url, assignment.attachment?.fileName)}
          style={{
            flex: 1,
            background: 'rgba(245, 196, 94, 0.15)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem',
            color: '#F5C45E',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Download size={12} /> Download
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onViewSubmissions(); }}
          style={{
            flex: 1,
            background: 'rgba(59, 130, 246, 0.15)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Eye size={12} /> Submissions
        </button>
      </div>
    </div>
  );
};

const TeacherClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { token } = useGetData();
  const { loadTeacherClasses } = useTeacher();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [showSettings, setShowSettings] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [editForm, setEditForm] = useState({
    className: '',
    description: ''
  });

  // ==================== ASSIGNMENTS STATE ====================
  const [assignments, setAssignments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  // ==================== LIVE CLASSES STATE ====================
  const [sessions, setSessions] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
  });

  // ✅ Get backend URL
  const API_BASE = process.env.REACT_APP_API_URL1 || 'http://localhost:5000';

  // ✅ Auto-refresh every 30 seconds
  useEffect(() => {
    fetchClassData();
    setupSocketListeners();
    loadSessions();
    loadAssignments();
     const cleanupSocketListeners = () => {
  if (!socketService) return;
  
  socketService.off('quiz:submitted', handleQuizSubmitted);
  socketService.off('class:student-joined', handleStudentJoined);
  socketService.off('class:student-left', handleStudentLeft);
  socketService.off('class:updated', handleClassUpdated);
  socketService.off('new-online-session', handleNewSession);
  socketService.off('session-started', handleSessionStarted);
  
  // ✅ Remove new listeners
  socketService.off('student:online-status', handleStudentOnlineStatus);
  socketService.off('student:progress-updated', handleStudentProgressUpdated);
  socketService.off('student:quiz-completed', handleStudentQuizCompleted);
};
    
    const interval = setInterval(() => {
      if (!refreshing && !loading && document.visibilityState === 'visible') {
        refreshClassData();
        loadSessions();
        loadAssignments();
      }
    }, 30000);
    
    return () => {
      cleanupSocketListeners();
      clearInterval(interval);
    };
  }, [classId]);

  // Check socket connection
  useEffect(() => {
    setIsOnline(socketService?.getConnectionStatus() || false);
    
    const unsubscribe = socketService?.on('socket:connected', () => {
      setIsOnline(true);
      refreshClassData();
      loadSessions();
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ==================== ASSIGNMENTS FUNCTIONS ====================
  const loadAssignments = async () => {
    try {
      const res = await getClassAssignments(classId);
      if (res.success) {
        setAssignments(res.data || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssignmentCreated = () => {
    loadAssignments();
  };

  const handleAssignmentDeleted = (assignmentId) => {
    setAssignments(prev => prev.filter(a => a._id !== assignmentId));
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const res = await getAssignmentSubmissions(assignment._id);
      if (res.success) {
        setSubmissions(res.data);
        setShowSubmissionsModal(true);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    }
  };

  const handleGradeSubmission = async (submissionId, marks, feedback) => {
    const loadingToast = toast.loading('Saving grade...');
    try {
      const res = await gradeSubmission(submissionId, { marks, feedback });
      if (res.success) {
        toast.success('Grade saved successfully', { id: loadingToast });
        // Refresh submissions
        if (selectedAssignment) {
          const updatedRes = await getAssignmentSubmissions(selectedAssignment._id);
          if (updatedRes.success) {
            setSubmissions(updatedRes.data);
          }
        }
      } else {
        toast.error(res.message || 'Failed to save grade', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Failed to save grade', { id: loadingToast });
      console.error('Grade error:', error);
    }
  };

  // ==================== LIVE CLASSES FUNCTIONS ====================
  const loadSessions = async () => {
    try {
      const res = await getSessionsByClass(classId);
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Add this helper function at the top of your TeacherClassDetails component
const getCurrentDateTimeLocal = () => {
    const now = new Date();
    // Add 5 minutes buffer to prevent immediate past selection
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
};



// Add this useEffect to update end date min when start date changes
useEffect(() => {
    if (newSession.scheduledStart) {
        const startDate = new Date(newSession.scheduledStart);
        const minEndDate = new Date(startDate);
        minEndDate.setMinutes(minEndDate.getMinutes() + 15); // Minimum 15 minutes later
        
        // If current end date is before the new min end date, update it
        if (newSession.scheduledEnd && new Date(newSession.scheduledEnd) < minEndDate) {
            setNewSession(prev => ({
                ...prev,
                scheduledEnd: minEndDate.toISOString().slice(0, 16)
            }));
        } else if (!newSession.scheduledEnd) {
            setNewSession(prev => ({
                ...prev,
                scheduledEnd: minEndDate.toISOString().slice(0, 16)
            }));
        }
    }
}, [newSession.scheduledStart]);

// Update handleCreateSession function
const handleCreateSession = async () => {
    // ✅ Validate required fields
    if (!newSession.title || !newSession.scheduledStart || !newSession.scheduledEnd) {
        toast.error('Title, start time, and end time are required');
        return;
    }

    const startDate = new Date(newSession.scheduledStart);
    const endDate = new Date(newSession.scheduledEnd);
    const now = new Date();

    // ✅ VALIDATION 1: Cannot schedule in the past
    if (startDate < now) {
        toast.error('Cannot schedule a live class in the past. Please select a future date and time.');
        return;
    }

    // ✅ VALIDATION 2: End time must be after start time
    if (endDate <= startDate) {
        toast.error('End time must be after start time');
        return;
    }

    // ✅ VALIDATION 3: Duration must be at least 15 minutes
    const durationMs = endDate - startDate;
    const durationMinutes = durationMs / (1000 * 60);
    if (durationMinutes < 15) {
        toast.error('Session duration must be at least 15 minutes');
        return;
    }

    // ✅ VALIDATION 4: Duration cannot exceed 8 hours
    if (durationMinutes > 8 * 60) {
        toast.error('Session duration cannot exceed 8 hours');
        return;
    }

    // ✅ VALIDATION 5: Cannot schedule more than 6 months in advance
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    if (startDate > sixMonthsLater) {
        toast.error('Cannot schedule a class more than 6 months in advance');
        return;
    }

    const loadingToast = toast.loading('Scheduling live class...');
    
    try {
        const res = await createOnlineSession({
            classId: classId,
            title: newSession.title,
            description: newSession.description,
            scheduledStart: newSession.scheduledStart,
            scheduledEnd: newSession.scheduledEnd,
        });

        toast.dismiss(loadingToast);

        if (res && res.success) {
            toast.success(res.message || 'Live class scheduled successfully');
            setShowScheduleModal(false);
            setNewSession({ 
                title: '', 
                description: '', 
                scheduledStart: getCurrentDateTimeLocal(),
                scheduledEnd: getCurrentDateTimeLocal()
            });
            loadSessions();
        } else {
            toast.error(res?.message || 'Failed to schedule live class');
        }
    } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Schedule session error:', error);
        
        // ✅ Show specific error message from backend
        const errorMessage = error?.response?.data?.message || 'Failed to schedule live class';
        toast.error(errorMessage);
    }
};

  const handleStartSession = async (sessionId) => {
    const loadingToast = toast.loading('Starting session...');
    try {
      const res = await startSession(sessionId);
      if (res && res.success) {
        toast.dismiss(loadingToast);
        toast.success('Session started! You can now join as teacher.');
        loadSessions();
        window.open(`/teacher/dashboard/join-live/${sessionId}`, '_blank');
      } else {
        toast.dismiss(loadingToast);
        toast.error(res?.message || 'Failed to start session');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Start session error:', error);
      toast.error(error?.response?.data?.message || 'Failed to start session');
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to end this session? All participants will be disconnected.')) {
      return;
    }

    const loadingToast = toast.loading('Ending session...');
    try {
      const res = await endSession(sessionId);
      if (res && res.success) {
        toast.dismiss(loadingToast);
        toast.success('Session ended successfully');
        loadSessions();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res?.message || 'Failed to end session');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('End session error:', error);
      toast.error(error?.response?.data?.message || 'Failed to end session');
    }
  };

  const openDeleteConfirm = (session, e) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    const loadingToast = toast.loading('Deleting session...');
    try {
      const res = await deleteSession(sessionToDelete._id);
      if (res && res.success) {
        toast.dismiss(loadingToast);
        toast.success('Session deleted successfully');
        setShowDeleteConfirm(false);
        setSessionToDelete(null);
        loadSessions();
      } else {
        toast.dismiss(loadingToast);
        toast.error(res?.message || 'Failed to delete session');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Delete session error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete session');
    }
  };

  const setupSocketListeners = () => {
    if (!socketService) return;
    
    socketService.on('quiz:submitted', handleQuizSubmitted);
    socketService.on('class:student-joined', handleStudentJoined);
    socketService.on('class:student-left', handleStudentLeft);
    socketService.on('class:updated', handleClassUpdated);
    socketService.on('new-online-session', handleNewSession);
    socketService.on('session-started', handleSessionStarted);

     // ✅ ADD THESE NEW LISTENERS FOR REAL-TIME UPDATES
  socketService.on('student:online-status', handleStudentOnlineStatus);
  socketService.on('student:progress-updated', handleStudentProgressUpdated);
  socketService.on('student:quiz-completed', handleStudentQuizCompleted);
  
  console.log('📡 Teacher class details socket listeners setup');
    
    console.log('📡 Teacher class details socket listeners setup');
  };

  // const cleanupSocketListeners = () => {
  //   if (!socketService) return;
    
  //   socketService.off('quiz:submitted', handleQuizSubmitted);
  //   socketService.off('class:student-joined', handleStudentJoined);
  //   socketService.off('class:student-left', handleStudentLeft);
  //   socketService.off('class:updated', handleClassUpdated);
  //   socketService.off('new-online-session', handleNewSession);
  //   socketService.off('session-started', handleSessionStarted);
  // };

  // const handleQuizSubmitted = (data) => {
  //   console.log('📝 Quiz submitted:', data);
    
  //   if (data.classId === classId) {
  //     toast.success(`${data.studentName || 'A student'} submitted "${data.quizTitle}" - Score: ${data.percentage}%`, {
  //       duration: 5000,
  //       icon: '📝'
  //     });
  //     refreshClassData();
  //   }
  // };


 

  const handleQuizSubmitted = (data) => {
  console.log('📝 Quiz submitted:', data);
  
  if (data.classId === classId) {
    // ✅ Update the student's progress immediately
    setClassData(prev => {
      if (!prev) return prev;
      
      const updatedStudents = prev.students?.map(student => {
        const studentId = student.id || student.studentId?._id || student.studentId;
        if (studentId?.toString() === data.studentId?.toString()) {
          const currentQuizzes = student.progress?.quizzesCompleted || 0;
          const currentAvg = student.progress?.averageScore || 0;
          const newQuizzesCompleted = currentQuizzes + 1;
          const newAverageScore = ((currentAvg * currentQuizzes) + data.percentage) / newQuizzesCompleted;
          
          return {
            ...student,
            progress: {
              ...student.progress,
              quizzesCompleted: newQuizzesCompleted,
              averageScore: Math.round(newAverageScore),
              lastActive: new Date()
            }
          };
        }
        return student;
      }) || [];
      
      return { ...prev, students: updatedStudents };
    });
    
    toast.success(`${data.studentName || 'A student'} submitted "${data.quizTitle}" - Score: ${data.percentage}%`, {
      duration: 5000,
      icon: '📝'
    });
    
    // Optional: Refresh full data in background
    setTimeout(() => refreshClassData(), 2000);
  }
};

  const handleStudentJoined = (data) => {
    if (data.classId === classId) {
      toast.info(`${data.studentName || 'A student'} joined the class!`, {
        duration: 4000,
        icon: '👋'
      });
      refreshClassData();
      loadSessions();
    }
  };

  const handleStudentLeft = (data) => {
    if (data.classId === classId) {
      toast.info(`A student left the class`, {
        duration: 4000,
        icon: '👋'
      });
      refreshClassData();
      loadSessions();
    }
  };

  const handleClassUpdated = (data) => {
    if (data.classId === classId) {
      refreshClassData();
    }
  };

  const handleNewSession = (data) => {
    if (data.classId === classId) {
      toast.info(`New live class scheduled: ${data.title}`, {
        duration: 5000,
        icon: '📅'
      });
      loadSessions();
    }
  };

  const handleSessionStarted = (data) => {
    if (data.classId === classId) {
      toast.info(`Live class has started: ${data.title}`, {
        duration: 5000,
        icon: '🔴'
      });
      loadSessions();
    }
  };

  const refreshClassData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchClassData();
    setRefreshing(false);
  };

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classRes, analyticsRes] = await Promise.all([
        getClassDetails(classId),
        getClassAnalytics(classId)
      ]);
      
      if (classRes.success) {
        const uniqueStudents = removeDuplicateStudents(classRes.class.students || []);
        setClassData({
          ...classRes.class,
          students: uniqueStudents
        });
        setEditForm({
          className: classRes.class.className,
          description: classRes.class.description || ''
        });
      } else {
        setError(classRes.message || 'Failed to load class details');
      }
      
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.analytics);
      }
    } catch (err) {
      console.error('Error fetching class data:', err);
      setError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const removeDuplicateStudents = (students) => {
    const seen = new Map();
    return students.filter(student => {
      const studentId = student.id || student.studentId?._id || student.studentId;
      if (!studentId) return true;
      if (seen.has(studentId.toString())) {
        return false;
      }
      seen.set(studentId.toString(), true);
      return true;
    });
  };

  const copyClassCode = () => {
    navigator.clipboard.writeText(classData?.classCode);
    toast.success('Class code copied to clipboard!');
  };

  const regenerateClassCode = async () => {
    toast.loading('Generating new class code...', { id: 'regenerate' });
    try {
      const response = await updateClass(classId, { regenerateCode: true });
      if (response.success) {
        toast.success(`New class code: ${response.class.classCode}`, { id: 'regenerate' });
        fetchClassData();
      } else {
        toast.error(response.message || 'Failed to regenerate code', { id: 'regenerate' });
      }
    } catch (error) {
      toast.error('Failed to regenerate code', { id: 'regenerate' });
    }
  };

  // ✅ Handle student online status changes
const handleStudentOnlineStatus = (data) => {
  if (data.classId === classId && data.studentId) {
    setClassData(prev => {
      if (!prev) return prev;
      
      const updatedStudents = prev.students?.map(student => {
        const studentId = student.id || student.studentId?._id || student.studentId;
        if (studentId?.toString() === data.studentId?.toString()) {
          return { ...student, isOnline: data.isOnline, lastActive: new Date() };
        }
        return student;
      }) || [];
      
      return { ...prev, students: updatedStudents };
    });
    
    // Optional: Show toast for online status
    if (data.isOnline) {
      toast.info(`${data.studentName || 'A student'} is now online`, {
        duration: 2000,
        icon: '🟢'
      });
    }
  }
};

// ✅ Handle student progress updates (quiz completed, score changed)
const handleStudentProgressUpdated = (data) => {
  if (data.classId === classId && data.studentId) {
    setClassData(prev => {
      if (!prev) return prev;
      
      const updatedStudents = prev.students?.map(student => {
        const studentId = student.id || student.studentId?._id || student.studentId;
        if (studentId?.toString() === data.studentId?.toString()) {
          return {
            ...student,
            progress: {
              ...student.progress,
              quizzesCompleted: data.quizzesCompleted || student.progress?.quizzesCompleted || 0,
              averageScore: data.averageScore || student.progress?.averageScore || 0,
              lastActive: new Date()
            }
          };
        }
        return student;
      }) || [];
      
      return { ...prev, students: updatedStudents };
    });
    
    // Also update analytics if needed
    if (analytics) {
      setAnalytics(prev => ({
        ...prev,
        classAverage: data.newClassAverage || prev?.classAverage
      }));
    }
  }
};

// ✅ Handle quiz completion specifically
const handleStudentQuizCompleted = (data) => {
  if (data.classId === classId) {
    // Update the student's progress immediately
    handleStudentProgressUpdated(data);
    
    // Show notification
    toast.success(`${data.studentName} scored ${data.percentage}% on ${data.quizTitle}`, {
      duration: 5000,
      icon: '📝'
    });
    
    // Refresh full data to ensure consistency
    refreshClassData();
  }
};

  const handleUpdateClass = async () => {
    if (!editForm.className.trim()) {
      toast.error('Class name is required');
      return;
    }

    toast.loading('Updating class...', { id: 'update' });
    try {
      const response = await updateClass(classId, {
        className: editForm.className,
        description: editForm.description
      });
      
      if (response.success) {
        toast.success('Class updated successfully', { id: 'update' });
        setEditingClass(false);
        fetchClassData();
        loadTeacherClasses();
        
        if (isOnline && socketService) {
          socketService.emit('class:updated', {
            classId: classId,
            className: editForm.className,
            timestamp: new Date()
          });
        }
      } else {
        toast.error(response.message || 'Failed to update class', { id: 'update' });
      }
    } catch (error) {
      toast.error('Failed to update class', { id: 'update' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const handleManualRefresh = () => {
    refreshClassData();
    loadSessions();
    loadAssignments();
    toast.info('Refreshing class data...');
  };

  if (loading) return <LoadingSpinner text="Loading class details..." />;
  if (error) return <ErrorAlert message={error} onClose={() => navigate('/teacher/dashboard/classes')} />;
  if (!classData) return <ErrorAlert message="Class not found" />;

  const liveSessionsCount = sessions.filter(s => s.status === 'live' || s.status === 'scheduled').length;
  const assignmentsCount = assignments.length;

  return (
    <div className="teacher-class-details">
      {/* Header with Back Button */}
      <div className="details-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/teacher/dashboard/classes')}
        >
          <ChevronLeft size={20} />
          Back to Classes
        </button>
        
        <div className="header-actions">
          <button 
            className="action-btn refresh-btn" 
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
          <button className="action-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Class Info Section */}
      <div className="class-info-section">
        <div className="class-title-section">
          {editingClass ? (
            <div className="edit-class-form">
              <input
                type="text"
                value={editForm.className}
                onChange={(e) => setEditForm({...editForm, className: e.target.value})}
                className="edit-title-input"
                autoFocus
              />
              <button onClick={handleUpdateClass} className="save-btn">
                <Save size={16} /> Save
              </button>
              <button onClick={() => setEditingClass(false)} className="cancel-btn">
                <X size={16} /> Cancel
              </button>
            </div>
          ) : (
            <div className="title-wrapper">
              <h1>{classData.className}</h1>
              <button className="edit-title-btn" onClick={() => setEditingClass(true)}>
                <Edit2 size={16} />
              </button>
            </div>
          )}
          
          <div className="class-badges">
            <span className="badge subject">{classData.subject}</span>
            <span className="badge topic">{classData.topic}</span>
          </div>
          
          {classData.description && !editingClass && (
            <p className="class-description">{classData.description}</p>
          )}
          
          {editingClass && (
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              className="edit-description-input"
              rows="3"
              placeholder="Class description..."
            />
          )}
        </div>

        {/* Class Code Card */}
        <div className="class-code-card">
          <div className="code-label">Class Code</div>
          <div className="code-display">
            <span className="code">{classData.classCode}</span>
            <div className="code-actions">
              <button onClick={copyClassCode} title="Copy code">
                <Copy size={16} />
              </button>
              <button onClick={regenerateClassCode} title="Generate new code">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <p className="code-hint">Share this code with students to join the class</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-item">
          <Users size={20} className="stat-icon blue" />
          <div className="stat-info">
            <h3>{classData.students?.length || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-item">
          <FileQuestion size={20} className="stat-icon purple" />
          <div className="stat-info">
            <h3>{analytics?.totalQuizzes || 0}</h3>
            <p>Total Quizzes</p>
          </div>
        </div>
        <div className="stat-item">
          <FileText size={20} className="stat-icon blue" />
          <div className="stat-info">
            <h3>{assignmentsCount}</h3>
            <p>Assignments</p>
          </div>
        </div>
        <div className="stat-item">
          <TrendingUp size={20} className="stat-icon green" />
          <div className="stat-info">
            <h3>{Math.round(analytics?.classAverage || 0)}%</h3>
            <p>Class Average</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn1 ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={16} />
          Students ({classData.students?.length || 0})
        </button>
        <button 
          className={`tab-btn1 ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <FileQuestion size={16} />
          Quizzes ({analytics?.totalQuizzes || 0})
        </button>
        <button 
          className={`tab-btn1 ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={16} />
          Assignments ({assignmentsCount})
        </button>
        <button 
          className={`tab-btn1 ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
        <button 
          className={`tab-btn1 ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <Video size={16} />
          Live Classes ({liveSessionsCount})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="students-tab">
            {/* Add this near the top of Students Tab */}
<div className="students-tab-header">
  <div className="connection-status">
    <span className={`status-dot ${isOnline ? 'connected' : 'disconnected'}`}></span>
    {isOnline ? 'Live updates active' : 'Reconnecting...'}
  </div>
  <button className="refresh-students-btn" onClick={handleManualRefresh}>
    <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
    Refresh
  </button>
</div>
            {classData.students?.length === 0 ? (
              <EmptyState
                icon="👨‍🎓"
                title="No Students Yet"
                message="Share the class code with students to get them enrolled"
                actionText="Copy Class Code"
                onAction={copyClassCode}
              />
            ) : (
              <div className="students-table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Quizzes Completed</th>
                      <th>Average Score</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const uniqueMap = new Map();
                      classData.students.forEach(student => {
                        const studentId = student.id || student.studentId?._id || student.studentId;
                        if (studentId && !uniqueMap.has(studentId.toString())) {
                          uniqueMap.set(studentId.toString(), student);
                        }
                      });
                      return Array.from(uniqueMap.values());
                    })().map((student) => {
                      const studentName = student.username || student.studentId?.username || 'Unknown';
                      const studentEmail = student.email || student.studentId?.email;
                      const studentProgress = student.progress || {};
                      
                      return (
                        <tr key={student.id || student.studentId?._id || student.studentId}>
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {studentName?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <span className="student-name">{studentName}</span>
                              {student.isOnline && <span className="online-dot"></span>}
                            </div>
                          </td>
                          <td>{studentEmail || '—'}</td>
                          <td>{formatDate(student.joinedAt)}</td>
                          <td>{studentProgress.quizzesCompleted || 0}</td>
                          <td>
                            <div className="score-cell">
                              <div 
                                className="score-bar"
                                style={{ 
                                  width: `${studentProgress.averageScore || 0}%`,
                                  background: getPerformanceColor(studentProgress.averageScore || 0)
                                }}
                              />
                              <span>{Math.round(studentProgress.averageScore || 0)}%</span>
                            </div>
                          </td>
                          <td>
                            {student.lastActive ? formatDate(student.lastActive) : 'Never'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="quizzes-tab">
            <div className="quizzes-header">
              <h2>Class Quizzes</h2>
              <button 
                className="create-quiz-btn"
                onClick={() => navigate('/teacher/dashboard/quiz')}
              >
                <FileQuestion size={16} />
                Create New Quiz
              </button>
            </div>

            {!analytics?.quizzes || analytics.quizzes.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No Quizzes Yet"
                message="Create your first quiz to assess student learning"
                actionText="Create Quiz"
                onAction={() => navigate('/teacher/dashboard/quiz')}
              />
            ) : (
              <div className="quizzes-list">
                {analytics.quizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <div className="quiz-info">
                      <h3>{quiz.title}</h3>
                      <div className="quiz-stats">
                        <span className="stat">
                          <Users size={12} />
                          {quiz.submissions} submissions
                        </span>
                        <span className="stat">
                          <TrendingUp size={12} />
                          Avg: {Math.round(quiz.averageScore || 0)}%
                        </span>
                      </div>
                    </div>
                    <button 
                      className="view-results-btn"
                      onClick={() => navigate(`/teacher/dashboard/quiz/${quiz.id}?mode=results`)}
                    >
                      View Results
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <div className="assignments-header">
              <div className="header-left">
                <h2>Class Assignments</h2>
                <p className="subtitle">Create and manage assignments for your students</p>
              </div>
              <button 
                className="create-assignment-btn"
                onClick={() => setShowUploadModal(true)}
              >
                <Plus size={16} />
                Upload Assignment
              </button>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No Assignments Yet"
                message="Create your first assignment to assess student learning"
                actionText="Upload Assignment"
                onAction={() => setShowUploadModal(true)}
              />
            ) : (
              <div className="assignments-grid">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                    onViewSubmissions={() => handleViewSubmissions(assignment)}
                    onDelete={handleAssignmentDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-summary">
              <div className="summary-card">
                <h3>Class Performance Overview</h3>
                <div className="performance-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8"/>
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="#667eea" strokeWidth="8"
                      strokeDasharray={`${(analytics?.classAverage || 0) * 2.83} 283`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="percentage">{Math.round(analytics?.classAverage || 0)}%</div>
                </div>
                <p>Overall Class Average</p>
              </div>
              
              <div className="summary-card">
                <h3>Quiz Completion Rate</h3>
                <div className="completion-stats">
                  <div className="stat-row">
                    <span>Total Quizzes:</span>
                    <strong>{analytics?.totalQuizzes || 0}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Total Submissions:</span>
                    <strong>{analytics?.totalSubmissions || 0}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Completion Rate:</span>
                    <strong>{Math.round(analytics?.completionRate || 0)}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="top-performers">
              <h3>🏆 Top Performing Students</h3>
              <div className="performers-list">
                {analytics?.studentPerformance?.slice(0, 5).map((student, idx) => (
                  <div key={idx} className="performer-item">
                    <div className="rank">{idx + 1}</div>
                    <div className="performer-info">
                      <span className="name">{student.name}</span>
                      <span className="score">{Math.round(student.averageScore)}% average</span>
                    </div>
                    <div className="score-badge" style={{ background: getPerformanceColor(student.averageScore) }}>
                      {Math.round(student.averageScore)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Classes Tab */}
        {activeTab === 'live' && (
          <div className="live-classes-tab">
            <div className="sessions-header">
              <h3>📺 Live Online Classes</h3>
              <button onClick={() => setShowScheduleModal(true)} className="schedule-btn">
                <Plus size={16} /> Schedule Live Class
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="empty-state">
                <Video size={48} />
                <h4>No live classes scheduled</h4>
                <p>Click "Schedule Live Class" to create your first online session.</p>
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map((session) => (
                  <div key={session._id} className="session-card">
                    <div className="session-info">
                      <h4>{session.title}</h4>
                      {session.description && <p>{session.description}</p>}
                      
                      <div className="session-meta">
                        <span>
                          <Calendar size={14} /> 
                          {new Date(session.scheduledStart).toLocaleString()}
                        </span>
                        {session.scheduledEnd && (
                          <span>
                            <Clock size={14} /> 
                            {new Date(session.scheduledEnd).toLocaleTimeString()}
                          </span>
                        )}
                        <span className={`status-badge ${session.status}`}>
                          {session.status === 'live' ? '🔴 LIVE NOW' : 
                           session.status === 'scheduled' ? '📅 Scheduled' : 
                           session.status === 'ended' ? '✅ Ended' : '❌ Cancelled'}
                        </span>
                      </div>
                    </div>
                    <div className="session-actions">
                      {session.status === 'scheduled' && (
                        <>
                          <button 
                            onClick={(e) => openDeleteConfirm(session, e)}
                            className="delete-session-btn"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                          {new Date(session.scheduledStart) <= new Date() && (
                            <button onClick={() => handleStartSession(session._id)} className="start-btn">
                              <Play size={16} /> Start Now
                            </button>
                          )}
                        </>
                      )}
                      {session.status === 'live' && (
                        <button
                          onClick={() => window.open(`/teacher/dashboard/join-live/${session._id}`, '_blank')}
                          className="join-btn"
                        >
                          <Video size={16} /> Join as Teacher
                        </button>
                      )}
                      {session.status === 'ended' && (
                        <button 
                          onClick={(e) => openDeleteConfirm(session, e)}
                          className="delete-ended-btn"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule Modal */}
            {/* {showScheduleModal && (
              <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Schedule Live Class</h3>
                    <button className="close-btn" onClick={() => setShowScheduleModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Session Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., Introduction to React Hooks"
                        value={newSession.title}
                        onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description (optional)</label>
                      <textarea
                        placeholder="What will this session cover?"
                        rows="3"
                        value={newSession.description}
                        onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={newSession.scheduledStart}
                        onChange={(e) => setNewSession({ ...newSession, scheduledStart: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={newSession.scheduledEnd}
                        onChange={(e) => setNewSession({ ...newSession, scheduledEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button onClick={() => setShowScheduleModal(false)}>Cancel</button>
                    <button onClick={handleCreateSession} className="primary">Create Session</button>
                  </div>
                </div>
              </div>
            )} */}

            {/* Schedule Modal */}
{showScheduleModal && (
  <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>Schedule Live Class</h3>
        <button className="close-btn" onClick={() => setShowScheduleModal(false)}>×</button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Session Title *</label>
          <input
            type="text"
            placeholder="e.g., Introduction to React Hooks"
            value={newSession.title}
            onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            placeholder="What will this session cover?"
            rows="3"
            value={newSession.description}
            onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Start Date & Time *</label>
          <input
            type="datetime-local"
            value={newSession.scheduledStart}
            onChange={(e) => setNewSession({ ...newSession, scheduledStart: e.target.value })}
            min={getCurrentDateTimeLocal()}
          />
        </div>
        <div className="form-group">
          <label>End Date & Time *</label>
          <input
            type="datetime-local"
            value={newSession.scheduledEnd}
            onChange={(e) => setNewSession({ ...newSession, scheduledEnd: e.target.value })}
            min={newSession.scheduledStart || getCurrentDateTimeLocal()}
          />
          <small className="field-hint">Minimum 15 minutes duration</small>
        </div>
      </div>
      <div className="modal-actions">
        <button onClick={() => setShowScheduleModal(false)}>Cancel</button>
        <button onClick={handleCreateSession} className="primary">Create Session</button>
      </div>
    </div>
  </div>
)}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                <div className="modal-content confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Delete {sessionToDelete?.status === 'ended' ? 'Ended' : 'Scheduled'} Session</h3>
                    <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete "<strong>{sessionToDelete?.title}</strong>"?</p>
                    <p className="warning-text">This action cannot be undone.</p>
                  </div>
                  <div className="modal-actions">
                    <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button onClick={handleDeleteSession} className="danger">Delete Forever</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Assignment Modal */}
      <UploadAssignmentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        classId={classId}
        onSuccess={handleAssignmentCreated}
      />

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowSubmissionsModal(false)}>
          <div className="modal-content submissions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submissions: {selectedAssignment.title}</h3>
              <button className="close-btn" onClick={() => setShowSubmissionsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {submissions.length === 0 ? (
                <div className="empty-submissions">
                  <p>No submissions yet</p>
                </div>
              ) : (
                <div className="submissions-list">
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                        <th>Marks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => {
                        // ✅ Fix: Get full URL for submission file
                        const submissionFileUrl = sub.submissionFile?.url?.startsWith('http') 
                          ? sub.submissionFile.url 
                          : `${API_BASE}${sub.submissionFile?.url || ''}`;
                        
                        return (
                          <tr key={sub._id}>
                            <td>{sub.studentId?.username || 'Unknown'}</td>
                            <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                            <td>
                              <span className={`submission-status ${sub.status}`}>
                                {sub.status === 'graded' ? '✓ Graded' : '📎 Submitted'}
                              </span>
                            </td>
                            <td>
                              {sub.status === 'graded' ? (
                                `${sub.marks}/${selectedAssignment.totalPoints}`
                              ) : (
                                <input
                                  type="number"
                                  placeholder="Marks"
                                  className="marks-input"
                                  min="0"
                                  max={selectedAssignment.totalPoints}
                                  onBlur={(e) => {
                                    const marks = parseInt(e.target.value);
                                    if (!isNaN(marks)) {
                                      handleGradeSubmission(sub._id, marks, '');
                                    }
                                  }}
                                />
                              )}
                            </td>
                            <td>
                              <a 
                                href={submissionFileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="download-link"
                              >
                                Download
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Class Settings</h2>
              <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="setting-group">
                <label>Class Code</label>
                <div className="code-setting">
                  <code>{classData.classCode}</code>
                  <button onClick={copyClassCode} className="copy-code-btn">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={regenerateClassCode} className="regenerate-btn">
                    <RefreshCw size={14} /> Regenerate
                  </button>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Danger Zone</label>
                <div className="danger-zone">
                  <p>Once you delete a class, all student data will be permanently removed.</p>
                  <button 
                    className="delete-class-btn"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
                        // Handle delete
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Delete Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassDetails;