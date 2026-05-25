// frontend/src/components/teacher/assignments/UploadAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Calendar, FileText, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../../api/uploadApi';
import { toast } from 'sonner';
import api from '../../../services/api';

const UploadAssignmentModal = ({ isOpen, onClose, classId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Get minimum datetime for due date (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // ✅ Title validation
    if (!title.trim()) {
      newErrors.title = 'Assignment title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }
    
    // ✅ Description validation (optional, but validate if provided)
    if (description && description.length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters';
    }
    
    // ✅ Due date validation
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(dueDate);
      const now = new Date();
      
      if (isNaN(selectedDate.getTime())) {
        newErrors.dueDate = 'Invalid date format';
      } else if (selectedDate < now) {
        newErrors.dueDate = 'Due date cannot be in the past';
      } else {
        // Check if due date is too far (max 1 year)
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        if (selectedDate > oneYearLater) {
          newErrors.dueDate = 'Due date cannot be more than 1 year from now';
        }
      }
    }
    
    // ✅ Total points validation
    const points = Number(totalPoints);
    if (isNaN(points)) {
      newErrors.totalPoints = 'Total points must be a number';
    } else if (!Number.isInteger(points)) {
      newErrors.totalPoints = 'Total points must be a whole number';
    } else if (points < 1) {
      newErrors.totalPoints = 'Total points must be at least 1';
    } else if (points > 1000) {
      newErrors.totalPoints = 'Total points cannot exceed 1000';
    }
    
    // ✅ File validation
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    } else {
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        newErrors.file = `File size cannot exceed 50MB (current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'application/zip'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|jpg|jpeg|png|zip)$/i)) {
        newErrors.file = 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Clear file error when file is selected
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: null }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run validations
    if (!validateForm()) {
      // Show first error as toast
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading('Uploading assignment...');

    try {
      // Upload file first
      const uploadResponse = await uploadFile(file, 'assignment');
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'File upload failed');
      }
      
      // Create assignment with the uploaded file data
      const assignmentData = {
        classId,
        title: title.trim(),
        description: description?.trim() || '',
        dueDate: new Date(dueDate).toISOString(),
        totalPoints: Number(totalPoints),
        attachment: uploadResponse.data
      };

      const response = await api.post('/api/assignments', assignmentData);
      
      if (response.data.success) {
        toast.success('Assignment created successfully!', { id: loadingToast });
        
        // Reset form
        resetForm();
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        
        // Close modal
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to create assignment', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setTotalPoints(100);
    setFile(null);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="upload-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #102E50, #0d2542)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '550px',
          padding: '1.5rem',
          border: '1px solid rgba(245, 196, 94, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#F5C45E" /> Upload Assignment
          </h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            disabled={uploading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#F5C45E', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
              Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }}
              placeholder="Assignment title (3-200 characters)"
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.title ? '#ef4444' : 'rgba(245,196,94,0.2)'}`,
                borderRadius: '12px',
                color: 'white'
              }}
            />
            {errors.title && (
              <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Field (Optional) */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#F5C45E', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
              Description <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: null }));
              }}
              placeholder="Assignment description (max 5000 characters)"
              rows="3"
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.description ? '#ef4444' : 'rgba(245,196,94,0.2)'}`,
                borderRadius: '12px',
                color: 'white',
                resize: 'vertical'
              }}
            />
            {errors.description && (
              <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                {errors.description}
              </p>
            )}
          </div>

          {/* Due Date & Points Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ color: '#F5C45E', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
                <Calendar size={12} /> Due Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: null }));
                }}
                min={getMinDateTime()}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.dueDate ? '#ef4444' : 'rgba(245,196,94,0.2)'}`,
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              {errors.dueDate && (
                <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                  {errors.dueDate}
                </p>
              )}
            </div>
            <div>
              <label style={{ color: '#F5C45E', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
                Total Points <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                value={totalPoints}
                onChange={(e) => {
                  setTotalPoints(Number(e.target.value));
                  if (errors.totalPoints) setErrors(prev => ({ ...prev, totalPoints: null }));
                }}
                min="1"
                max="1000"
                step="1"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.totalPoints ? '#ef4444' : 'rgba(245,196,94,0.2)'}`,
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              {errors.totalPoints && (
                <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                  {errors.totalPoints}
                </p>
              )}
            </div>
          </div>

          {/* File Attachment */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#F5C45E', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
              <Upload size={12} /> Attachment <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.file ? '#ef4444' : 'rgba(245,196,94,0.2)'}`,
                borderRadius: '12px',
                color: 'white',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
              disabled={uploading}
            />
            {file && !errors.file && (
              <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.3rem' }}>
                ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
            {errors.file && (
              <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertCircle size={12} /> {errors.file}
              </p>
            )}
            <p style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.3rem' }}>
              Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP (Max 50MB)
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(245,196,94,0.2)',
                borderRadius: '12px',
                color: 'white',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #F5C45E, #e0a82b)',
                border: 'none',
                borderRadius: '12px',
                color: '#102E50',
                fontWeight: 'bold',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1,
                position: 'relative'
              }}
            >
              {uploading ? (
                <>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid #102E50',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    marginRight: '8px'
                  }}></span>
                  Uploading...
                </>
              ) : (
                'Create Assignment'
              )}
            </button>
          </div>
        </form>
      </motion.div>
      
      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadAssignmentModal;