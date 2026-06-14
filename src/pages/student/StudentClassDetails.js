import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetData } from '../../context/userContext';
import { getStudentClassDetails, getClassQuizzes } from '../../api/studentApi';
import { getSessionsByClass, joinSession } from '../../api/onlineClassApi';
import { getStudentAssignments } from '../../api/assignmentApi';
import StudentAssignmentCard from '../../components/student/assignments/StudentAssignmentCard';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import socketService from '../../services/socketService';
import { 
    Users, BookOpen, FileQuestion, MessageSquare, 
    ChevronLeft, Award, Calendar, Clock, User, 
    BarChart3, Trophy, Star, TrendingUp, ChevronRight, RefreshCw,
    Video, LogIn, FileText
} from 'lucide-react';
import '../../styles/teacher/StudentClassesWithDetail.css';

const StudentClassDetails = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useGetData();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [classData, setClassData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);
    
    // ✅ ASSIGNMENTS STATE
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // ==================== LIVE CLASSES STATE ====================
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Initial load
    useEffect(() => {
        fetchClassDetails();
    }, [classId]);

    // Fetch quizzes when class data is available
    useEffect(() => {
        if (classData) {
            fetchQuizzes();
            fetchSessions();
            fetchAssignments(); // ✅ Fetch assignments
        }
    }, [classData]);

    // ✅ Socket listener for real-time updates
    useEffect(() => {
        const handleQuizCompleted = (data) => {
            console.log('🎉 Quiz completed event received:', data);
            refreshClassData();
        };
        
        const handleAssignmentSubmitted = (data) => {
            if (data.classId === classId) {
                console.log('📝 Assignment submitted event received');
                fetchAssignments();
            }
        };
        
        if (socketService?.getConnectionStatus()) {
            socketService.on('quiz-completed', handleQuizCompleted);
            socketService.on('assignment-submitted', handleAssignmentSubmitted);
        }
        
        return () => {
            if (socketService) {
                socketService.off('quiz-completed', handleQuizCompleted);
                socketService.off('assignment-submitted', handleAssignmentSubmitted);
            }
        };
    }, [classId]);

    // ✅ Refresh when user returns to this tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('📱 Tab became visible, refreshing data...');
                refreshClassData();
                fetchSessions();
                fetchAssignments();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [classId]);

    // ✅ Refresh when coming back from navigation
    useEffect(() => {
        if (location.state?.refresh) {
            console.log('🔄 Refreshing due to navigation state');
            refreshClassData();
            fetchSessions();
            fetchAssignments();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location]);

    // ✅ Socket event listeners for live sessions
    useEffect(() => {
        const refreshData = () => {
            console.log('🔄 Socket event triggered - refreshing class data');
            fetchClassDetails();
            if (classData) {
                fetchQuizzes();
                fetchAssignments();
            }
            fetchSessions();
        };
        
        const handleSessionStarted = (data) => {
            if (data.classId === classId) {
                toast.info(`A live class has started: ${data.title}`, {
                    duration: 5000,
                    icon: '🔴'
                });
                fetchSessions();
            }
        };
        
        const handleNewSession = (data) => {
            if (data.classId === classId) {
                toast.info(`New live class scheduled: ${data.title}`, {
                    duration: 5000,
                    icon: '📅'
                });
                fetchSessions();
            }
        };
        
        if (socketService) {
            socketService.on('quiz-completed', refreshData);
            socketService.on('assignment-submitted', refreshData);
            socketService.on('class:updated', (data) => {
                if (data.classId === classId) {
                    refreshData();
                }
            });
            socketService.on('session-started', handleSessionStarted);
            socketService.on('new-online-session', handleNewSession);
        }
        
        return () => {
            if (socketService) {
                socketService.off('quiz-completed', refreshData);
                socketService.off('assignment-submitted', refreshData);
                socketService.off('class:updated');
                socketService.off('session-started', handleSessionStarted);
                socketService.off('new-online-session', handleNewSession);
            }
        };
    }, [classId, classData]);

    const fetchClassDetails = async () => {
        try {
            setLoading(true);
            const response = await getStudentClassDetails(classId);
            if (response.success) {
                setClassData(response.class);
            } else {
                setError(response.message);
            }
        } catch (err) {
            console.error('Error fetching class details:', err);
            setError('Failed to load class details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchQuizzes = async () => {
        if (!classData?.id && !classData?._id) return;
        
        setLoadingQuizzes(true);
        try {
            const classIdValue = classData.id || classData._id;
            const response = await getClassQuizzes(classIdValue);
            console.log('📚 Quizzes response:', response);
            
            if (response.success) {
                setQuizzes(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoadingQuizzes(false);
        }
    };

    // ✅ FETCH ASSIGNMENTS
    const fetchAssignments = async () => {
        if (!classData?.id && !classData?._id) return;
        
        setLoadingAssignments(true);
        try {
            const classIdValue = classData.id || classData._id;
            const response = await getStudentAssignments(classIdValue);
            console.log('📝 Assignments response:', response);
            
            if (response.success) {
                setAssignments(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    // ==================== LIVE CLASSES FUNCTIONS ====================
    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await getSessionsByClass(classId);
            if (res.success) {
                setSessions(res.sessions || []);
            }
        } catch (error) {
            console.error('Error fetching live sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleJoinSession = async (session) => {
        const loadingToast = toast.loading('Joining live class...');
        try {
            const res = await joinSession(session._id);
            if (res.success) {
                toast.dismiss(loadingToast);
                if (res.meeting?.useJitsi) {
                    window.open(`/student/join-live/${session._id}`, '_blank');
                } else if (res.meeting?.url) {
                    window.open(res.meeting.url, '_blank');
                }
            } else {
                toast.dismiss(loadingToast);
                toast.error(res.message || 'Could not join session');
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error joining session:', error);
            toast.error('Failed to join live class');
        }
    };

    // ✅ Manual refresh function
    const refreshClassData = async () => {
        if (refreshing) return;
        setRefreshing(true);
        console.log('🔄 Refreshing class data...');
        await fetchClassDetails();
        toast.success('Class data refreshed');
    };

    // ✅ Function to handle messaging the teacher
    const handleMessageTeacher = async () => {
        if (!classData?.teacher?.id) {
            toast.error('Teacher information not available');
            return;
        }

        const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!authToken) {
            toast.error('Please login again to send messages');
            return;
        }

        try {
            const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app/';
            
            const response = await fetch(`${API_BASE}/api/chat/rooms/user/${classData.teacher.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Session expired. Please login again.');
                    navigate('/login');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                navigate(`/student/chat/${data.data._id}`, {
                    state: { 
                        recipientName: classData.teacher.name,
                        recipientId: classData.teacher.id,
                        isTeacher: true
                    }
                });
            } else {
                toast.error(data.message || 'Failed to start chat');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            toast.error('Failed to open chat. Please try again.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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

    // ✅ Function to handle messaging a classmate
    const handleMessageClassmate = async (classmateId, className) => {
        const authToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        if (!authToken) {
            toast.error('Please login again to send messages');
            return;
        }

        try {
            const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app/';
            
            const response = await fetch(`${API_BASE}/api/chat/rooms/user/${classmateId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Session expired. Please login again.');
                    navigate('/login');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                navigate(`/student/chat/${data.data._id}`, {
                    state: { 
                        recipientName: className,
                        recipientId: classmateId,
                        isTeacher: false
                    }
                });
            } else {
                toast.error(data.message || 'Failed to start chat');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            toast.error('Failed to open chat. Please try again.');
        }
    };

    // ✅ Handle assignment submission update
    const handleAssignmentUpdate = () => {
        fetchAssignments();
    };

    if (loading) return <LoadingSpinner text="Loading class..." />;
    if (error) return <ErrorAlert message={error} onClose={() => navigate('/student/classes')} />;
    if (!classData) return <ErrorAlert message="Class not found" />;

    const liveSessionsCount = sessions.filter(s => s.status === 'live').length;
    const correctTotalStudents = (classData.classmates?.length || 0) + 1;

    const getFormattedJoinDate = () => {
        if (classData.myProgress?.joinedAt) {
            return formatDate(classData.myProgress.joinedAt);
        }
        if (classData.joinedAt) {
            return formatDate(classData.joinedAt);
        }
        return 'N/A';
    };

    const getAverageScoreDisplay = () => {
        const avgScore = classData.myProgress?.averageScore || 0;
        return `${Math.round(avgScore)}%`;
    };

    return (
        <div className="student-class-details">
            {/* Header */}
            <div className="details-header">
                <button className="back-btn" onClick={() => navigate('/student/classes')}>
                    <ChevronLeft size={20} />
                    Back to Classes
                </button>
                <button 
                    className="refresh-btn" 
                    onClick={refreshClassData}
                    disabled={refreshing}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(245, 196, 94, 0.2)', border: 'none', cursor: 'pointer' }}
                >
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Hero Section */}
            <div className="class-hero">
                <div className="hero-content">
                    <h1>{classData.className}</h1>
                    <div className="class-badges">
                        <span className="badge subject">{classData.subject}</span>
                        <span className="badge topic">{classData.topic}</span>
                    </div>
                    {classData.description && (
                        <p className="class-description">{classData.description}</p>
                    )}
                </div>
                <div className="class-code-card">
                    <div className="code-label">Class Code</div>
                    <div className="code-display">
                        <span className="code">{classData.classCode}</span>
                    </div>
                    <p className="code-hint">Share this code with your teacher if needed</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Users size={20} />
                    </div>
                    <div className="stat-info">
                        <h3>{correctTotalStudents}</h3>
                        <p>Classmates</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Trophy size={20} />
                    </div>
                    <div className="stat-info">
                        <h3>{getAverageScoreDisplay()}</h3>
                        <p>Your Average</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Clock size={20} />
                    </div>
                    <div className="stat-info">
                        <h3>{classData.myProgress?.quizzesCompleted || 0}</h3>
                        <p>Quizzes Taken</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Calendar size={20} />
                    </div>
                    <div className="stat-info">
                        <h3>{getFormattedJoinDate()}</h3>
                        <p>Joined</p>
                    </div>
                </div>
            </div>

            {/* Teacher Info */}
            <div className="teacher-section">
                <div className="teacher-card">
                    <div className="teacher-avatar-large">
                        {classData.teacher?.name?.charAt(0)?.toUpperCase() || 'T'}
                        {classData.teacher?.isOnline && <span className="online-dot"></span>}
                    </div>
                    <div className="teacher-info">
                        <h3>Your Teacher</h3>
                        <p className="teacher-name">{classData.teacher?.name}</p>
                        {classData.teacher?.bio && (
                            <p className="teacher-bio">{classData.teacher.bio}</p>
                        )}
                    </div>
                    <button 
                        className="message-teacher-btn"
                        onClick={handleMessageTeacher}
                    >
                        <MessageSquare size={16} />
                        Message Teacher
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <BarChart3 size={16} />
                    Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quizzes')}
                >
                    <FileQuestion size={16} />
                    Quizzes ({quizzes.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assignments')}
                >
                    <FileText size={16} />
                    Assignments ({assignments.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'classmates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('classmates')}
                >
                    <Users size={16} />
                    Classmates ({classData.classmates?.length || 0})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live')}
                >
                    <Video size={16} />
                    Live Classes {liveSessionsCount > 0 && `(${liveSessionsCount})`}
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="progress-section">
                            <h3>Your Progress</h3>
                            <div className="progress-circle">
                                <div className="circle-chart">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8"/>
                                        <circle 
                                            cx="50" cy="50" r="45" fill="none" 
                                            stroke={getPerformanceColor(classData.myProgress?.averageScore || 0)} 
                                            strokeWidth="8"
                                            strokeDasharray={`${(classData.myProgress?.averageScore || 0) * 2.83} 283`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                    <div className="percentage">
                                        {Math.round(classData.myProgress?.averageScore || 0)}%
                                    </div>
                                </div>
                                <div className="progress-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Quizzes Completed</span>
                                        <span className="stat-value">{classData.myProgress?.quizzesCompleted || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Assignments Submitted</span>
                                        <span className="stat-value">{assignments.filter(a => a.submitted).length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Joined</span>
                                        <span className="stat-value">{getFormattedJoinDate()}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Last Active</span>
                                        <span className="stat-value">{formatDate(classData.myProgress?.lastActive)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                    <div className="quizzes-tab">
                        {loadingQuizzes ? (
                            <div className="loading-quizzes">
                                <LoadingSpinner text="Loading quizzes..." />
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="empty-state">
                                <FileQuestion size={48} />
                                <h3>No quizzes yet</h3>
                                <p>Your teacher hasn't assigned any quizzes for this class yet.</p>
                            </div>
                        ) : (
                            <div className="quizzes-grid">
                                {quizzes.map((quiz) => (
                                    <div key={quiz.id} className="quiz-card">
                                        <div className="quiz-header">
                                            <div className="quiz-title-section">
                                                <h3>{quiz.title}</h3>
                                                <span className={`quiz-status ${quiz.status}`}>
                                                    {quiz.status === 'completed' ? '✓ Completed' : 
                                                     quiz.status === 'overdue' ? '⏰ Overdue' : '📝 Available'}
                                                </span>
                                            </div>
                                        </div>
                                        {quiz.description && (
                                            <p className="quiz-description">{quiz.description}</p>
                                        )}
                                        <div className="quiz-meta">
                                            <span><Clock size={14} /> {quiz.timeLimit} min</span>
                                            <span><FileQuestion size={14} /> {quiz.questionCount} questions</span>
                                            {quiz.dueDate && (
                                                <span><Calendar size={14} /> Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        {quiz.status === 'available' && (
                                            <button 
                                                className="take-quiz-btn"
                                                onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                                            >
                                                Take Quiz <ChevronRight size={16} />
                                            </button>
                                        )}
                                        {quiz.status === 'completed' && (
                                            <button 
                                                className="view-results-btn"
                                                onClick={() => navigate(`/student/quiz/${quiz.id}/result`)}
                                            >
                                                View Results <ChevronRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ✅ NEW ASSIGNMENTS TAB */}
                {activeTab === 'assignments' && (
                    <div className="assignments-tab">
                        {loadingAssignments ? (
                            <div className="loading-assignments">
                                <LoadingSpinner text="Loading assignments..." />
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No assignments yet</h3>
                                <p>Your teacher hasn't assigned any assignments for this class yet.</p>
                            </div>
                        ) : (
                            <div className="assignments-grid">
                                {assignments.map((assignment) => (
                                    <StudentAssignmentCard
                                        key={assignment._id}
                                        assignment={assignment}
                                        onSubmissionUpdate={handleAssignmentUpdate}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Classmates Tab */}
                {activeTab === 'classmates' && (
                    <div className="classmates-tab">
                        {classData.classmates?.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <h3>No classmates yet</h3>
                                <p>Other students will appear here once they join</p>
                            </div>
                        ) : (
                            <div className="classmates-grid">
                                {classData.classmates.map((classmate) => (
                                    <div key={classmate.id} className="classmate-card">
                                        <div className="classmate-avatar">
                                            {classmate.name?.charAt(0)?.toUpperCase() || 'S'}
                                            {classmate.isOnline && <span className="online-dot"></span>}
                                        </div>
                                        <div className="classmate-info">
                                            <h4>{classmate.name}</h4>
                                            <p>Joined {formatDate(classmate.joinedAt)}</p>
                                        </div>
                                        <button 
                                            className="message-btn"
                                            onClick={() => handleMessageClassmate(classmate.id, classmate.name)}
                                        >
                                            <MessageSquare size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Live Classes Tab */}
                {activeTab === 'live' && (
                    <div className="live-classes-tab">
                        <h3>📺 Live Online Classes</h3>
                        
                        {loadingSessions ? (
                            <div className="loading-sessions">
                                <LoadingSpinner text="Loading live classes..." />
                            </div>
                        ) : sessions.filter(s => s.status === 'live' || s.status === 'scheduled').length === 0 ? (
                            <div className="empty-state">
                                <Video size={48} />
                                <h4>No live classes scheduled</h4>
                                <p>Check back later for online sessions with your teacher.</p>
                            </div>
                        ) : (
                            <div className="sessions-list">
                                {sessions.map((session) => (
                                    (session.status === 'live' || session.status === 'scheduled') && (
                                        <div key={session._id} className="session-card">
                                            <div className="session-info">
                                                <h4>{session.title}</h4>
                                                {session.description && <p>{session.description}</p>}
                                                <div className="session-meta">
                                                    <span>
                                                        <Calendar size={14} /> 
                                                        {new Date(session.scheduledStart).toLocaleString()}
                                                    </span>
                                                    <span className={`status-badge ${session.status}`}>
                                                        {session.status === 'live' ? '🔴 LIVE NOW' : '📅 Upcoming'}
                                                    </span>
                                                </div>
                                            </div>
                                            {session.status === 'live' && (
                                                <button
                                                    onClick={() => handleJoinSession(session)}
                                                    className="join-live-btn"
                                                >
                                                    <LogIn size={16} /> Join Now
                                                </button>
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentClassDetails;