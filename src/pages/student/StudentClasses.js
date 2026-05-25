import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetData } from '../../context/userContext';
import { getStudentClasses, leaveClass } from '../../api/studentApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { BookOpen, Users, Calendar, ChevronRight, LogOut, Plus } from 'lucide-react';
import '../../styles/teacher/StudentClassesWithDetail.css'

const StudentClasses = () => {
    const navigate = useNavigate();
    const { token } = useGetData();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await getStudentClasses();
            if (response.success) {
                setClasses(response.classes || []);
            } else {
                toast.error(response.message || 'Failed to load classes');
            }
        } catch (error) {
            console.error('Fetch classes error:', error);
            toast.error('Failed to load your classes');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveClass = async (classId, className) => {
        if (window.confirm(`Are you sure you want to leave "${className}"? You will lose access to all class materials.`)) {
            const toastId = toast.loading(`Leaving ${className}...`);
            try {
                const response = await leaveClass(classId);
                if (response.success) {
                    toast.success(`Left ${className}`, { id: toastId });
                    fetchClasses();
                } else {
                    toast.error(response.message, { id: toastId });
                }
            } catch (error) {
                console.error('Leave class error:', error);
                toast.error('Failed to leave class', { id: toastId });
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getAverageScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) return <LoadingSpinner text="Loading your classes..." />;

    return (
        <div className="student-classes-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>My Classes</h1>
                    <p>Continue your learning journey</p>
                </div>
                <button 
                    className="join-class-btn"
                    onClick={() => navigate('/student/join')}
                >
                    <Plus size={18} />
                    Join New Class
                </button>
            </div>

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <EmptyState
                    icon="🏫"
                    title="No Classes Yet"
                    message="Join a class using the code from your teacher"
                    actionText="Join a Class"
                    onAction={() => navigate('/student/join')}
                />
            ) : (
                <div className="classes-grid">
                    {classes.map((cls) => (
                        <div 
                            key={cls.id}
                            className="class-card"
                            onClick={() => navigate(`/student/classes/${cls.id}`)}
                        >
                            {/* Card Header */}
                            <div className="card-header">
                                <div className="class-icon" style={{ background: `linear-gradient(135deg, ${getAverageScoreColor(cls.progress?.averageScore || 0)}, ${getAverageScoreColor(cls.progress?.averageScore || 0)}80)` }}>
                                    <BookOpen size={24} />
                                </div>
                                <button 
                                    className="leave-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLeaveClass(cls.id, cls.className);
                                    }}
                                    title="Leave Class"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>

                            {/* Class Info */}
                            <div className="card-body">
                                <h3>{cls.className}</h3>
                                <p className="class-meta">
                                    {cls.subject} • {cls.topic}
                                </p>
                                <div className="class-stats">
                                    <div className="stat">
                                        <Users size={14} />
                                        <span>{cls.totalStudents || 0} students</span>
                                    </div>
                                    <div className="stat">
                                        <Calendar size={14} />
                                        <span>Joined {formatDate(cls.joinedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="card-progress">
                                <div className="progress-label">
                                    <span>Your Progress</span>
                                    <span>{cls.progress?.quizzesCompleted || 0} quizzes</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ 
                                            width: `${cls.progress?.averageScore || 0}%`,
                                            background: getAverageScoreColor(cls.progress?.averageScore || 0)
                                        }}
                                    />
                                </div>
                                <div className="progress-score" style={{ color: getAverageScoreColor(cls.progress?.averageScore || 0) }}>
                                    Avg Score: {Math.round(cls.progress?.averageScore || 0)}%
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="card-footer">
                                <div className="teacher-info">
                                    <div className="teacher-avatar">
                                        {cls.teacher?.name?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <span>{cls.teacher?.name || 'Teacher'}</span>
                                </div>
                                <ChevronRight size={18} className="arrow-icon" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentClasses;