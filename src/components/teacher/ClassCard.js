import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Copy, RefreshCw, MoreVertical, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const ClassCard = ({ classData, onRegenerateCode, onDelete }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const copyClassCode = () => {
    navigator.clipboard.writeText(classData.classCode);
    toast.success('Class code copied to clipboard!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="class-card">
      {/* Header */}
      <div className="class-card-header">
        <div className="class-info">
          <h3>{classData.className}</h3>
          <div className="class-badges">
            <span className="badge subject">{classData.subject}</span>
            <span className="badge topic">{classData.topic}</span>
          </div>
        </div>
        <div className="class-menu">
          <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <div className="menu-dropdown">
              <button onClick={() => navigate(`/teacher/dashboard/classes/${classData.id}`)}>
                <Eye size={14} /> View Class
              </button>
              <button onClick={() => onRegenerateCode(classData.id)}>
                <RefreshCw size={14} /> Regenerate Code
              </button>
              <button onClick={() => onDelete(classData.id)} className="delete">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Class Code */}
      <div className="class-code-section">
        <div className="code-label">Class Code</div>
        <div className="code-value">
          <span className="code">{classData.classCode}</span>
          <button onClick={copyClassCode} className="copy-btn" title="Copy code">
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="class-stats">
        <div className="stat">
          <Users size={14} />
          <span>{classData.studentCount || 0} Students</span>
        </div>
        <div className="stat">
          <Calendar size={14} />
          <span>Created {formatDate(classData.createdAt)}</span>
        </div>
      </div>

      {/* Description */}
      {classData.description && (
        <p className="class-description">{classData.description.substring(0, 80)}...</p>
      )}

      {/* Action Button */}
      <button 
        className="view-class-btn"
        onClick={() => navigate(`/teacher/dashboard/classes/${classData.id}`)}
      >
        View Class
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};

export default ClassCard;