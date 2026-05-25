// frontend/src/pages/teacher/SetupProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { createTeacherProfile, checkProfileStatus, getTeacherProfile } from '../../api/teacherApi';
import { toast } from 'sonner';
import { GraduationCap, BookOpen, Briefcase, FileText, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useGetData } from '../../context/userContext';
import '../../styles/teacher/setup.css'

const SetupProfile = () => {
  const navigate = useNavigate();
  const { token, user } = useGetData();
  const { loadTeacherProfile } = useTeacher();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const [profileStatus, setProfileStatus] = useState(null);
  const [formData, setFormData] = useState({
    degree: '',
    specialization: '',
    experience: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Check if profile already exists
  useEffect(() => {
    const checkProfile = async () => {
      try {
        console.log('Checking profile status...');
        const response = await checkProfileStatus();
        console.log('Profile status response:', response);
        
        setProfileStatus(response);
        
        // If profile is complete
        if (response.isComplete) {
          // Check if profile is approved
          const profileResponse = await getTeacherProfile();
          
          if (profileResponse.success && profileResponse.profile) {
            const profile = profileResponse.profile;
            
            if (profile.isApproved === false) {
              // Profile exists but not approved
              console.log('Profile exists but pending approval');
              toast.info('Your profile is pending admin approval. You will be notified when approved.');
              navigate('/teacher/pending-approval', { replace: true });
              return;
            } else {
              // Profile is approved
              console.log('Profile is complete and approved, redirecting to dashboard');
              toast.success('Profile already complete! Redirecting...');
              navigate('/teacher/dashboard', { replace: true });
              return;
            }
          } else {
            // Profile exists but we couldn't fetch it - assume approved
            navigate('/teacher/dashboard', { replace: true });
            return;
          }
        } else {
          console.log('Profile not complete, showing setup form');
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        // If it's a 404, profile doesn't exist - show form
        if (error.response?.status === 404) {
          console.log('No profile found, showing setup form');
        } else {
          console.log('Will show setup form due to error');
        }
      } finally {
        setChecking(false);
      }
    };
    
    if (token) {
      checkProfile();
    } else {
      setChecking(false);
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    switch (field) {
      case 'degree':
        if (!value.trim()) error = 'Degree is required';
        break;
      case 'specialization':
        if (!value.trim()) error = 'Specialization is required';
        break;
      case 'experience':
        if (!value) error = 'Experience is required';
        else if (value < 0) error = 'Experience cannot be negative';
        else if (value > 50) error = 'Experience cannot exceed 50 years';
        break;
      case 'bio':
        if (!value.trim()) error = 'Bio is required';
        else if (value.length < 10) error = 'Bio must be at least 10 characters';
        else if (value.length > 500) error = 'Bio cannot exceed 500 characters';
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = () => {
    const fields = ['degree', 'specialization', 'experience', 'bio'];
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setTouched({
      degree: true,
      specialization: true,
      experience: true,
      bio: true
    });
    
    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your teacher profile...');
    
    try {
      console.log('Creating teacher profile with data:', formData);
      const response = await createTeacherProfile(formData);
      console.log('Profile creation response:', response);
      
      if (response.success) {
        toast.success('Profile submitted successfully!', { id: toastId });
        await loadTeacherProfile();
        
        // ✅ Redirect to pending approval page
        navigate('/teacher/pending-approval', { replace: true });
      } else {
        toast.error(response.message || 'Failed to create profile', { id: toastId });
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      const errorMsg = error.response?.data?.message || 'Network error. Please try again.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking profile
  if (checking) {
    return (
      <div className="teacher-setup-container">
        <div className="setup-loading">
          <div className="loading-spinner"></div>
          <p>Checking profile status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-setup-container">
      <div className="teacher-setup-card">
        <div className="setup-header">
          <div className="setup-icon">👨‍🏫</div>
          <h1>Complete Your Teacher Profile</h1>
          <p>Tell us about your expertise to get started with teaching</p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="info-banner">
          <CheckCircle size={16} />
          <span>After submission, your profile will be reviewed by our admin team. You'll receive a notification when approved.</span>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label>
              <GraduationCap size={18} />
              Degree *
            </label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              onBlur={() => handleBlur('degree')}
              placeholder="e.g., Master's in Mathematics, B.Ed in Physics"
              className={touched.degree && errors.degree ? 'error' : ''}
              disabled={loading}
            />
            {touched.degree && errors.degree && (
              <span className="error-text">{errors.degree}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <BookOpen size={18} />
              Specialization *
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              onBlur={() => handleBlur('specialization')}
              placeholder="e.g., Algebra, Calculus, Physics, Computer Science"
              className={touched.specialization && errors.specialization ? 'error' : ''}
              disabled={loading}
            />
            {touched.specialization && errors.specialization && (
              <span className="error-text">{errors.specialization}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <Briefcase size={18} />
              Years of Experience *
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              onBlur={() => handleBlur('experience')}
              placeholder="e.g., 5"
              min="0"
              max="50"
              className={touched.experience && errors.experience ? 'error' : ''}
              disabled={loading}
            />
            {touched.experience && errors.experience && (
              <span className="error-text">{errors.experience}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <FileText size={18} />
              Bio *
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              onBlur={() => handleBlur('bio')}
              rows="5"
              placeholder="Tell students about your teaching style, philosophy, and what makes your classes special..."
              className={touched.bio && errors.bio ? 'error' : ''}
              disabled={loading}
              maxLength="500"
            />
            {touched.bio && errors.bio && (
              <span className="error-text">{errors.bio}</span>
            )}
            <div className="char-count">
              <span className={formData.bio.length > 450 ? 'warning' : ''}>
                {formData.bio.length}/500 characters
              </span>
              {formData.bio.length >= 10 && !errors.bio && (
                <CheckCircle size={14} className="valid-icon" />
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Submitting Profile...
              </>
            ) : (
              <>
                Submit for Approval
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="setup-info">
          <p>
            <strong>Why do we need this information?</strong><br />
            Your profile helps students find you and understand your expertise.
            All applications are reviewed by admin before approval.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupProfile;