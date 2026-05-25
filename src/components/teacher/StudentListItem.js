import React, { useState } from 'react';
import { Mail, MessageSquare, MoreVertical, Award, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StudentListItem = ({ student, classId, onMessage, onViewProgress }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = () => {
    if (onMessage) {
      onMessage(student.id);
    } else {
      navigate(`/teacher/dashboard/messages/${student.id}`);
    }
  };

  return (
    <div className="student-list-item">
      <div className="student-info">
        <div className="student-avatar">
          {student.name?.charAt(0)?.toUpperCase() || 'S'}
          {student.isOnline && <span className="online-indicator"></span>}
        </div>
        <div className="student-details">
          <div className="student-name">
            {student.name}
            {student.isOnline && <span className="online-badge">Online</span>}
          </div>
          <div className="student-email">{student.email}</div>
          <div className="student-meta">
            <span className="meta-item">
              <Clock size={12} />
              Joined: {formatDate(student.joinedAt)}
            </span>
            {student.lastActive && (
              <span className="meta-item">
                <Star size={12} />
                Last active: {formatDate(student.lastActive)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="student-performance">
        <div className="performance-score">
          <div 
            className="score-circle"
            style={{ 
              background: `conic-gradient(${getPerformanceColor(student.averageScore)} 0deg ${student.averageScore * 3.6}deg, #e0e0e0 ${student.averageScore * 3.6}deg 360deg)`
            }}
          >
            <span>{student.averageScore || 0}%</span>
          </div>
          <div className="performance-label">{getPerformanceLabel(student.averageScore)}</div>
        </div>
        <div className="performance-stats">
          <div className="stat">
            <span className="stat-label">Quizzes</span>
            <span className="stat-value">{student.quizzesCompleted || 0}</span>
          </div>
        </div>
      </div>

      <div className="student-actions">
        <button 
          className="action-btn message"
          onClick={handleSendMessage}
          title="Send message"
        >
          <MessageSquare size={16} />
        </button>
        <button 
          className="action-btn progress"
          onClick={() => onViewProgress?.(student.id)}
          title="View progress"
        >
          <Award size={16} />
        </button>
        <div className="action-menu">
          <button className="action-btn more" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <div className="menu-dropdown">
              <button onClick={() => window.location.href = `mailto:${student.email}`}>
                <Mail size={14} /> Send Email
              </button>
              <button onClick={handleSendMessage}>
                <MessageSquare size={14} /> Send Message
              </button>
              <button onClick={() => onViewProgress?.(student.id)}>
                <Award size={14} /> View Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentListItem;