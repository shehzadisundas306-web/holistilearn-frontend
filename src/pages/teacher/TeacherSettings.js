// frontend/src/pages/teacher/TeacherSettings.jsx
import React, { useState, useEffect } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { createTeacherProfile, updateProfilePicture, updateTeacherSettings } from '../../api/teacherApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  User, 
  Save,
  Camera,
  Mail,
  Key,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import { useGetData } from '../../context/userContext';
// import '../../styles/teacher/TeacherSettings.css';

const TeacherSettings = () => {
  const { user, updateUser, logout } = useGetData();
  const { profile, loadTeacherProfile } = useTeacher();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    location: ''
  });
  
  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || user.username || '',
        email: user.email || '',
        bio: user.bio || profile?.bio || '',
        phone: user.phone || '',
        location: user.location || ''
      });
      setUserEmail(user.email || '');
    }
  }, [user, profile]);

  // frontend/src/pages/teacher/TeacherSettings.jsx - Updated handleProfileUpdate

const handleProfileUpdate = async () => {
    if (!profileForm.name.trim()) {
        toast.error('Name is required');
        return;
    }

    setSaving(true);
    try {
        const profileData = {
            degree: profile?.degree || 'Not specified',
            specialization: profile?.specialization || 'General',
            experience: profile?.experience || '0 years',
            bio: profileForm.bio || 'Teacher at HolistiLearn',
            name: profileForm.name,
            phone: profileForm.phone || '',
            location: profileForm.location || '',
            website: profile?.website || ''
        };
        
        const response = await createTeacherProfile(profileData);
        if (response.success) {
            // ✅ Update user context with new name and bio
            const updatedUser = {
                ...user,
                name: profileForm.name,
                bio: profileForm.bio
            };
            
            // Update context
            updateUser(updatedUser);
            
            // Update localStorage directly to ensure persistence
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                userData.name = profileForm.name;
                userData.bio = profileForm.bio;
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            // Also update the user object in localStorage with token
            const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
            if (token) {
                // You might want to fetch the updated user profile from backend
                const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
                const userResponse = await fetch(`${API_BASE}/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = await userResponse.json();
                if (userData.success && userData.user) {
                    localStorage.setItem('user', JSON.stringify(userData.user));
                    updateUser(userData.user);
                }
            }
            
            toast.success('Profile updated successfully');
            await loadTeacherProfile();
            
            // ✅ Force refresh the page to update all components
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            toast.error(response.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        toast.error('Failed to update profile');
    } finally {
        setSaving(false);
    }
};

  // Profile Picture Upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    setUploadingImage(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const response = await updateProfilePicture(formData);
      if (response.success) {
        toast.success('Profile picture updated');
        await loadTeacherProfile();
      } else {
        toast.error(response.message || 'Failed to update profile picture');
        setProfilePreview(null);
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error('Failed to upload profile picture');
      setProfilePreview(null);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Password Change
  const handlePasswordChange = async () => {
    // Validation
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setSaving(true);
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/user/changePassword/${userEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="teacher-settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your profile and account settings</p>
      </div>

      <div className="settings-container">
        {/* Profile Section */}
        <div className="settings-section">
          <div className="section-header">
            <User size={20} />
            <h2>Profile Information</h2>
          </div>
          <p className="section-description">Update your personal information and public profile</p>

          {/* Profile Picture */}
          <div className="profile-picture-section">
            <div className="avatar-preview">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile preview" />
              ) : (
                <div className="avatar-placeholder">
                  {profileForm.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
              )}
              <label className="upload-btn">
                <Camera size={16} />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <div className="upload-info">
              <p>Profile Picture</p>
              <span>JPG, PNG or GIF. Max 5MB</span>
            </div>
          </div>

          {/* Profile Form */}
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                placeholder="Your full name"
              />
            </div>
            
            <div className="form-group">
              <label>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                disabled
                className="disabled-input"
              />
              <span className="field-hint">Email cannot be changed</span>
            </div>
            
            <div className="form-group full-width">
              <label>Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                rows="4"
                placeholder="Tell your students about yourself..."
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                placeholder="Optional"
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={profileForm.location}
                onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="save-btn"
              onClick={handleProfileUpdate}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className="settings-section">
          <div className="section-header">
            <Key size={20} />
            <h2>Change Password</h2>
          </div>
          <p className="section-description">Update your password to keep your account secure</p>

          <div className="form-group">
            <label>Current Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              placeholder="Enter current password"
            />
            {passwordErrors.currentPassword && (
              <span className="error-text">{passwordErrors.currentPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label>New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="Enter new password (minimum 6 characters)"
              />
              <button 
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <span className="error-text">{passwordErrors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              placeholder="Confirm new password"
            />
            {passwordErrors.confirmPassword && (
              <span className="error-text">{passwordErrors.confirmPassword}</span>
            )}
          </div>

          <button 
            className="change-password-btn"
            onClick={handlePasswordChange}
            disabled={saving}
          >
            <Key size={16} />
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <div className="section-header">
            <LogOut size={20} />
            <h2>Account Actions</h2>
          </div>
          <p>Log out of your account</p>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;