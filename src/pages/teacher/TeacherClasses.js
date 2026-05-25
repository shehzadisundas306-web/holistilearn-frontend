import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { createClass, deleteClass, regenerateClassCode } from '../../api/teacherApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import { 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Users, 
  Calendar, 
  ChevronRight,
  BookOpen,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  X,
  Check
} from 'lucide-react';
import { useGetData } from '../../context/userContext';

const TeacherClasses = () => {
  const navigate = useNavigate();
  const { token } = useGetData();
  // ✅ Get subjects directly from TeacherContext
  const { classes, classesLoading, loadTeacherClasses, addClass, removeClass, subjects } = useTeacher();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    topic: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.className.trim()) errors.className = 'Class name is required';
    if (!formData.subject) errors.subject = 'Subject is required';
    if (!formData.topic.trim()) errors.topic = 'Topic is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const toastId = toast.loading('Creating your class...');
    
    try {
      const response = await createClass(formData);
      if (response.success) {
        toast.success(`Class "${formData.className}" created! Code: ${response.class.classCode}`, { id: toastId });
        setShowCreateModal(false);
        setFormData({ className: '', subject: '', topic: '', description: '' });
        await loadTeacherClasses();
        toast.success('Class created successfully! Share the code with your students.');
      } else {
        toast.error(response.message || 'Failed to create class', { id: toastId });
      }
    } catch (error) {
      console.error('Create class error:', error);
      toast.error(error.response?.data?.message || 'Failed to create class', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete class
  const handleDeleteClass = async (classId, className) => {
    setShowDeleteConfirm(null);
    const toastId = toast.loading(`Deleting "${className}"...`);
    
    try {
      const response = await deleteClass(classId);
      if (response.success) {
        toast.success(`"${className}" deleted successfully`, { id: toastId });
        removeClass(classId);
        await loadTeacherClasses();
      } else {
        toast.error(response.message || 'Failed to delete class', { id: toastId });
      }
    } catch (error) {
      console.error('Delete class error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete class', { id: toastId });
    }
  };

  // Handle regenerate class code
  const handleRegenerateCode = async (classId, className) => {
    const toastId = toast.loading(`Generating new code for "${className}"...`);
    
    try {
      const response = await regenerateClassCode(classId);
      if (response.success) {
        toast.success(`New class code: ${response.classCode}`, { id: toastId });
        await loadTeacherClasses();
      } else {
        toast.error(response.message || 'Failed to regenerate code', { id: toastId });
      }
    } catch (error) {
      console.error('Regenerate code error:', error);
      toast.error('Failed to regenerate code', { id: toastId });
    }
  };

  // Copy class code to clipboard
  const copyClassCode = (code, className) => {
    navigator.clipboard.writeText(code);
    toast.success(`Class code for "${className}" copied to clipboard!`);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (classesLoading) {
    return <LoadingSpinner text="Loading your classes..." />;
  }

  return (
    <div className="teacher-classes">
      <ErrorAlert message={error} onClose={() => setError(null)} />

      {/* Header */}
      <div className="classes-header">
        <div>
          <h1>My Classes</h1>
          <p>Create and manage all your classes in one place</p>
        </div>
        <button 
          className="create-class-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Create New Class
        </button>
      </div>

      {/* Stats Summary */}
      <div className="classes-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <BookOpen size={20} />
          </div>
          <div className="stat-info">
            <h3>{classes.length}</h3>
            <p>Total Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <h3>{classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <h3>{classes.filter(c => c.studentCount > 0).length}</h3>
            <p>Active Classes</p>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="No Classes Yet"
          message="Create your first class to start teaching students"
          actionText="Create Class"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="classes-grid">
          {classes.map((cls) => (
            <div key={cls.id} className="class-card">
              {/* Class Header */}
              <div className="class-card-header">
                <div className="class-info">
                  <h3>{cls.className}</h3>
                  <div className="class-badges">
                    <span className="badge subject">{cls.subject}</span>
                    <span className="badge topic">{cls.topic}</span>
                  </div>
                </div>
                <div className="class-menu">
                  <button 
                    className="menu-btn"
                    onClick={() => setShowDeleteConfirm(cls.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showDeleteConfirm === cls.id && (
                    <div className="delete-confirm">
                      <p>Delete "{cls.className}"?</p>
                      <div className="confirm-actions">
                        <button onClick={() => setShowDeleteConfirm(null)}>
                          <X size={14} /> Cancel
                        </button>
                        <button onClick={() => handleDeleteClass(cls.id, cls.className)}>
                          <Check size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Code Section */}
              <div className="class-code-section">
                <div className="code-label">Class Code</div>
                <div className="code-value">
                  <span className="code">{cls.classCode}</span>
                  <div className="code-actions">
                    <button 
                      onClick={() => copyClassCode(cls.classCode, cls.className)}
                      title="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={() => handleRegenerateCode(cls.id, cls.className)}
                      title="Generate new code"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Class Stats */}
              <div className="class-stats">
                <div className="stat">
                  <Users size={14} />
                  <span>{cls.studentCount || 0} Students</span>
                </div>
                <div className="stat">
                  <Calendar size={14} />
                  <span>Created {formatDate(cls.createdAt)}</span>
                </div>
              </div>

              {/* Description */}
              {cls.description && (
                <p className="class-description">{cls.description}</p>
              )}

              {/* Action Buttons */}
              <div className="class-actions">
                <button 
                  className="btn-view"
                  onClick={() => navigate(`/teacher/dashboard/classes/${cls.id}`)}
                >
                  <Eye size={16} />
                  View Class
                  <ChevronRight size={16} />
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteClass(cls.id, cls.className)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-class-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Class</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateClass}>
              <div className="modal-body">
                {/* Class Name */}
                <div className="form-group">
                  <label>Class Name *</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    placeholder="e.g., Physics 101 - Spring 2024"
                    className={formErrors.className ? 'error' : ''}
                  />
                  {formErrors.className && <span className="error-text">{formErrors.className}</span>}
                </div>

                {/* Subject - Now populated from TeacherContext */}
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className={formErrors.subject ? 'error' : ''}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject, idx) => (
                      <option key={idx} value={subject}>{subject}</option>
                    ))}
                  </select>
                  {formErrors.subject && <span className="error-text">{formErrors.subject}</span>}
                  {subjects.length === 0 && (
                    <p className="helper-text">
                      No subjects added yet. Go to <button 
                        type="button"
                        onClick={() => navigate('/teacher/dashboard/subjects')}
                        className="link-btn"
                      >Subjects & Topics</button> to add some.
                    </p>
                  )}
                </div>

                {/* Topic */}
                <div className="form-group">
                  <label>Topic *</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="e.g., Newton's Laws of Motion"
                    className={formErrors.topic ? 'error' : ''}
                  />
                  {formErrors.topic && <span className="error-text">{formErrors.topic}</span>}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    placeholder="Describe what students will learn in this class..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting || subjects.length === 0}
                >
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;