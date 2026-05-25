// frontend/src/components/student/assignments/StudentAssignmentCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Clock, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '../../../api/uploadApi';
import { submitAssignment } from '../../../api/assignmentApi';

const StudentAssignmentCard = ({ assignment, onSubmissionUpdate }) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // ✅ Get backend URL
  const API_BASE = process.env.REACT_APP_API_URL1 || 'http://localhost:5000';
  
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();
  const isSubmitted = assignment.submitted;
  const isGraded = assignment.isGraded;
  const submission = assignment.submission;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // ✅ Fix: Download handler with correct URL
  const handleDownload = (url, fileName) => {
    if (!url) {
      toast.error('No file available to download');
      return;
    }
    
    // If URL is relative, prepend the backend URL
    let fullUrl = url;
    if (!url.startsWith('http')) {
      fullUrl = `${API_BASE}${url}`;
    }
    
    console.log('📥 Downloading from:', fullUrl);
    
    // Open in new tab
    window.open(fullUrl, '_blank');
  };

  // ✅ Fix: View submission handler
  const handleViewSubmission = (submissionFile) => {
    if (!submissionFile || !submissionFile.url) {
      toast.error('No submission file found');
      return;
    }
    
    let fullUrl = submissionFile.url;
    if (!submissionFile.url.startsWith('http')) {
      fullUrl = `${API_BASE}${submissionFile.url}`;
    }
    
    console.log('👁️ Viewing submission from:', fullUrl);
    
    // Open in new tab
    window.open(fullUrl, '_blank');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to submit');
      return;
    }

    setSubmitting(true);
    toast.loading('Uploading assignment...', { id: 'submit' });

    try {
      // Upload file
      const uploadResponse = await uploadFile(selectedFile, 'submission');
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'File upload failed');
      }

      // Submit assignment
      const submitResponse = await submitAssignment(assignment._id, {
        submissionFile: uploadResponse.data
      });

      if (submitResponse.success) {
        toast.success('Assignment submitted successfully!', { id: 'submit' });
        setShowSubmitModal(false);
        setSelectedFile(null);
        if (onSubmissionUpdate) onSubmissionUpdate();
      } else {
        toast.error(submitResponse.message || 'Failed to submit assignment', { id: 'submit' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to submit assignment', { id: 'submit' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className="student-assignment-card"
        style={{
          background: 'rgba(16, 46, 80, 0.8)',
          borderRadius: '20px',
          padding: '1.25rem',
          border: `1px solid ${isSubmitted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 196, 94, 0.2)'}`,
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={() => setShowSubmitModal(true)}
      >
        {/* Status Badge */}
        {isSubmitted && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isGraded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 196, 94, 0.15)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isGraded ? '#10b981' : '#F5C45E'
          }}>
            {isGraded ? <CheckCircle size={12} /> : <Upload size={12} />}
            {isGraded ? `Graded: ${submission?.marks}/${assignment.totalPoints}` : 'Submitted'}
          </div>
        )}

        {isOverdue && !isSubmitted && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.7rem',
            color: '#ef4444'
          }}>
            <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Overdue
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingRight: '80px' }}>
          <FileText size={20} color="#F5C45E" />
          <h3 style={{ color: 'white', fontSize: '1rem', margin: 0 }}>{assignment.title}</h3>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: '1.4' }}>
          {assignment.description}
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
            <FileText size={12} />
            Points: {assignment.totalPoints}
          </div>
        </div>

        {/* Teacher Feedback if graded */}
        {isGraded && submission?.feedback && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            borderLeft: '3px solid #3b82f6'
          }}>
            <p style={{ fontSize: '0.7rem', color: '#3b82f6', marginBottom: '0.25rem' }}>Teacher Feedback:</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{submission.feedback}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(assignment.attachment?.url, assignment.attachment?.fileName); }}
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
            <Download size={12} /> Download Assignment
          </button>
          {!isSubmitted && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSubmitModal(true); }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #F5C45E, #e0a82b)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem',
                color: '#102E50',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem'
              }}
            >
              <Upload size={12} /> Submit
            </button>
          )}
          {isSubmitted && submission?.submissionFile && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                handleViewSubmission(submission.submissionFile);
              }}
              style={{
                flex: 1,
                background: 'rgba(16, 185, 129, 0.15)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem',
                color: '#10b981',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem'
              }}
            >
              <Download size={12} /> View Submission
            </button>
          )}
        </div>
      </motion.div>

      {/* Submit Modal */}
      {showSubmitModal && !isSubmitted && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="submit-modal" onClick={(e) => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, #102E50, #0d2542)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.5rem',
            border: '1px solid rgba(245, 196, 94, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', margin: 0 }}>Submit Assignment</h3>
              <button onClick={() => setShowSubmitModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                <strong>{assignment.title}</strong>
              </p>
              <p style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>{assignment.description}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#F5C45E', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>
                Upload your work *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.png,.zip"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(245,196,94,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              {selectedFile && (
                <p style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: '0.3rem' }}>
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(245,196,94,0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: 'linear-gradient(135deg, #F5C45E, #e0a82b)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#102E50',
                  fontWeight: 'bold',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentAssignmentCard;