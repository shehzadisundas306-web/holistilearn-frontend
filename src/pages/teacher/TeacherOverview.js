import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import { 
  Users, BookOpen, FileQuestion, TrendingUp, ChevronRight,
  UserPlus, ClipboardCheck, Calendar, Clock, MessageSquare, Bell, Zap
} from 'lucide-react';
import { useGetData } from '../../context/userContext';
import '../../styles/teacher/TeacherDashboard.css';

const TeacherOverview = () => {
  const { token } = useGetData();
  const { 
    dashboardStats, 
    dashboardLoading, 
    refreshAllData,
    loadDashboardStats 
  } = useTeacher();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      loadDashboardStats();
    }
  }, [token, loadDashboardStats]);

  const handleRefresh = async () => {
    toast.loading('Refreshing dashboard...', { id: 'refresh' });
    await refreshAllData();
    toast.success('Dashboard refreshed!', { id: 'refresh' });
  };

  // ✅ Helper function to format percentage (no decimal points)
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return `${Math.round(num)}%`;
  };

  // ✅ Helper function to format number with proper rounding
  const formatNumber = (value) => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 0;
    return Math.round(num);
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div className={`stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="stat-icon" style={{ background: color }}>
        <Icon size={24} color="white" />
      </div>
      <div className="stat-info">
        <h3>{typeof value === 'string' && value.includes('%') ? value : formatNumber(value)}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  if (dashboardLoading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorAlert message={error} onClose={() => setError(null)} />;

  const stats = dashboardStats.stats || {};
  const recentActivity = dashboardStats.recentActivity || [];
  const upcomingTasks = dashboardStats.upcomingTasks || [];
  const recentClasses = dashboardStats.recentClasses || [];

  return (
    <div className="teacher-overview">
      <div className="overview-header">
        <div>
          <h1>Welcome Back!</h1>
          <p>Here's what's happening with your classes today</p>
        </div>
        <button className="refresh-btn" onClick={handleRefresh}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Classes" 
          value={stats.totalClasses} 
          icon={BookOpen}
          color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          onClick={() => navigate('/teacher/dashboard/classes')}
        />
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={Users}
          color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          onClick={() => navigate('/teacher/dashboard/classes')}
        />
        <StatCard 
          title="Total Quizzes" 
          value={stats.totalQuizzes} 
          icon={FileQuestion}
          color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          onClick={() => navigate('/teacher/dashboard/quiz')}
        />
        <StatCard 
          title="Avg. Score" 
          value={formatPercentage(stats.averageScore)}
          icon={TrendingUp}
          color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
      </div>

      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-btn" onClick={() => navigate('/teacher/dashboard/classes')}>
            <div className="action-icon blue"><UserPlus size={24} /></div>
            <span>Create New Class</span>
            <ChevronRight size={16} className="action-arrow" />
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/teacher/dashboard/quiz')}>
            <div className="action-icon purple"><Zap size={24} /></div>
            <span>Generate Quiz with AI</span>
            <ChevronRight size={16} className="action-arrow" />
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/teacher/dashboard/subjects')}>
            <div className="action-icon green"><ClipboardCheck size={24} /></div>
            <span>Manage Subjects</span>
            <ChevronRight size={16} className="action-arrow" />
          </button>
          <button className="quick-action-btn" onClick={() => navigate('/teacher/dashboard/messages')}>
            <div className="action-icon orange"><MessageSquare size={24} /></div>
            <span>View Messages</span>
            <ChevronRight size={16} className="action-arrow" />
          </button>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="recent-activity-card">
          <div className="card-header">
            <h2><Bell size={18} /> Recent Activity</h2>
          </div>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <EmptyState icon="📭" title="No recent activity" message="Activities will appear here" />
            ) : (
              recentActivity.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon-wrapper">
                    <span className="activity-emoji">{activity.icon || '📝'}</span>
                  </div>
                  <div className="activity-details">
                    <p className="activity-action">{activity.action || activity.title || 'Activity'}</p>
                    <span className="activity-time">
                      <Clock size={12} /> {activity.time || activity.timestamp || 'Just now'}
                    </span>
                  </div>
                  {activity.score && (
                    <div className="activity-score">{formatPercentage(activity.score)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="upcoming-tasks-card">
          <div className="card-header">
            <h2><Calendar size={18} /> Upcoming Tasks</h2>
          </div>
          <div className="tasks-list">
            {upcomingTasks.length === 0 ? (
              <EmptyState icon="✅" title="All caught up!" message="No pending tasks" />
            ) : (
              upcomingTasks.slice(0, 5).map((task, idx) => (
                <div key={idx} className={`task-item priority-${task.priority || 'medium'}`}>
                  <div className="task-info">
                    <p className="task-title">{task.task || task.title || 'Task'}</p>
                    <span className="task-deadline">
                      <Calendar size={12} /> Due: {task.deadline || task.dueDate || 'No deadline'}
                    </span>
                  </div>
                  <div className="task-badge">
                    {task.priority ? task.priority.toUpperCase() : 'MEDIUM'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="recent-classes-section">
        <div className="section-header">
          <h2>Recent Classes</h2>
          <button className="view-all-btn" onClick={() => navigate('/teacher/dashboard/classes')}>
            View All Classes <ChevronRight size={16} />
          </button>
        </div>
        <div className="classes-grid">
          {recentClasses.length === 0 ? (
            <EmptyState 
              icon="🏫" 
              title="No Classes Yet" 
              message="Create your first class" 
              actionText="Create Class" 
              onAction={() => navigate('/teacher/dashboard/classes')} 
            />
          ) : (
            recentClasses.slice(0, 3).map(cls => (
              <div 
                key={cls.id || cls._id} 
                className="class-card" 
                onClick={() => navigate(`/teacher/dashboard/classes/${cls.id || cls._id}`)}
              >
                <div className="class-header">
                  <h3>{cls.name || cls.className}</h3>
                  <span className="class-code">{cls.classCode}</span>
                </div>
                <p className="class-subject">{cls.subject || 'General'}</p>
                <div className="class-stats">
                  <div className="stat">
                    <Users size={14} /> {cls.studentCount || 0} students
                  </div>
                  <div className="stat">
                    <Calendar size={14} /> {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
                <div className="class-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.min(100, Math.max(0, cls.progress || 0))}%` }} 
                    />
                  </div>
                  <span className="progress-text">
                    {formatPercentage(cls.progress)} completed
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ai-insight-banner">
        <div className="ai-icon">🤖</div>
        <div className="ai-content">
          <h3>AI Teaching Assistant</h3>
          <p>
            Based on your students' performance, consider creating a quiz on 
            <strong> "Algebraic Expressions"</strong> - many students are struggling with this topic.
          </p>
          <button className="ai-action-btn" onClick={() => navigate('/teacher/dashboard/quiz')}>
            Generate Quiz with AI <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;