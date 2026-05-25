import React, { useState } from 'react';
import { X, BookOpen, Users, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CreateClassModal = ({ isOpen, onClose, onCreateClass, subjects, loading }) => {
  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    topic: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.className.trim()) newErrors.className = 'Class name is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.topic.trim()) newErrors.topic = 'Topic is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onCreateClass(formData);
      setFormData({ className: '', subject: '', topic: '', description: '' });
      onClose();
    } catch (error) {
      console.error('Create class error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Class</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Class Name */}
            <div className="form-group">
              <label>
                <BookOpen size={16} />
                Class Name *
              </label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
                placeholder="e.g., Physics 101 - Spring 2024"
                className={errors.className ? 'error' : ''}
              />
              {errors.className && <span className="error-text">{errors.className}</span>}
            </div>

            {/* Subject */}
            <div className="form-group">
              <label>Subject *</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={errors.subject ? 'error' : ''}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject, idx) => (
                  <option key={idx} value={subject}>{subject}</option>
                ))}
              </select>
              {errors.subject && <span className="error-text">{errors.subject}</span>}
              {subjects.length === 0 && (
                <p className="helper-text">
                  No subjects added. Go to Subjects & Topics to add some.
                </p>
              )}
            </div>

            {/* Topic */}
            <div className="form-group">
              <label>Topic *</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., Newton's Laws of Motion"
                className={errors.topic ? 'error' : ''}
              />
              {errors.topic && <span className="error-text">{errors.topic}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe what students will learn in this class..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
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
  );
};

export default CreateClassModal;