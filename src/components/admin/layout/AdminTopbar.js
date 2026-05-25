// frontend/src/components/admin/layout/AdminTopbar.jsx
import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, ChevronDown, LogOut, X, AlertTriangle, Mail, Calendar, Shield, UserCheck, Edit2, Save, Eye, EyeOff } from 'lucide-react';
import { useGetData } from '../../../context/userContext';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from '../../NotificationPanel';
import StatusBadge from '../common/StatusBadge';
import { toast } from 'sonner';
import { updateAdminProfile } from '../../../api/adminApi';
import notificationService from '../../../services/notificationService';
import socketService from '../../../services/socketService';

const AdminTopbar = ({ title, onToggleSidebar, onMobileMenu }) => {
    const { user, setUser } = useGetData();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Edit Profile Form State
    const [editForm, setEditForm] = useState({
        name: '',
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    // ✅ Initialize notification service and listen for updates
    useEffect(() => {
        notificationService.init();
        
        // Connect socket for admin
        if (!socketService.getConnectionStatus()) {
            socketService.connect();
        }
        
        // Update unread count
        const updateUnreadCount = () => {
            const newCount = notificationService.getUnreadCount();
            setUnreadCount(newCount);
        };
        
        // Handle new notification with animation
        const handleNewNotification = () => {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1000);
            updateUnreadCount();
        };
        
        // Subscribe to notification events
        const unsubscribeNew = notificationService.on('new', handleNewNotification);
        const unsubscribeRead = notificationService.on('read', updateUnreadCount);
        const unsubscribeDelete = notificationService.on('delete', updateUnreadCount);
        const unsubscribeAllRead = notificationService.on('allRead', updateUnreadCount);
        const unsubscribeClearAll = notificationService.on('clearAll', updateUnreadCount);
        const unsubscribeCountChange = notificationService.on('unreadCountChanged', updateUnreadCount);
        
        updateUnreadCount();
        
        return () => {
            if (unsubscribeNew) unsubscribeNew();
            if (unsubscribeRead) unsubscribeRead();
            if (unsubscribeDelete) unsubscribeDelete();
            if (unsubscribeAllRead) unsubscribeAllRead();
            if (unsubscribeClearAll) unsubscribeClearAll();
            if (unsubscribeCountChange) unsubscribeCountChange();
        };
    }, []);

    // ✅ Join admin socket room
    useEffect(() => {
        if (socketService.getConnectionStatus() && user?.id) {
            socketService.emit('join-admin-room', { adminId: user.id });
        }
    }, [user]);

    const handleLogout = () => {
        setIsLoggingOut(true);
        
        // Disconnect socket on logout
        if (socketService.getConnectionStatus()) {
            socketService.disconnect();
        }
        
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            navigate('/login', { replace: true });
            
            setIsLoggingOut(false);
            setShowLogoutModal(false);
            setShowUserMenu(false);
        }, 500);
    };

    const handleProfileClick = () => {
        setShowUserMenu(false);
        setShowProfileModal(true);
    };

    const handleEditProfileClick = () => {
        setEditForm({
            name: user?.name || '',
            username: user?.username || '',
            email: user?.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowProfileModal(false);
        setShowEditProfileModal(true);
    };

    const handleUpdateProfile = async () => {
        if (!editForm.name.trim()) {
            toast.error('Name is required');
            return;
        }
        
        if (!editForm.email.trim()) {
            toast.error('Email is required');
            return;
        }
        
        if (editForm.newPassword) {
            if (editForm.newPassword.length < 6) {
                toast.error('New password must be at least 6 characters');
                return;
            }
            if (editForm.newPassword !== editForm.confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
        }
        
        setIsUpdating(true);
        
        try {
            const updateData = {
                name: editForm.name,
                username: editForm.username,
                email: editForm.email
            };
            
            if (editForm.currentPassword && editForm.newPassword) {
                updateData.currentPassword = editForm.currentPassword;
                updateData.newPassword = editForm.newPassword;
            }
            
            const response = await updateAdminProfile(updateData);
            
            if (response.success) {
                toast.success('Profile updated successfully');
                
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, ...updateData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                if (setUser) setUser(updatedUser);
                
                setShowEditProfileModal(false);
                setEditForm({
                    name: '',
                    username: '',
                    email: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error?.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogoutClick = () => {
        setShowUserMenu(false);
        setShowLogoutModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <>
            <header className="admin-topbar">
                <div className="topbar-left">
                    <button className="menu-btn" onClick={onToggleSidebar}>
                        <Menu size={20} />
                    </button>
                    <button className="mobile-menu-btn" onClick={onMobileMenu}>
                        <Menu size={20} />
                    </button>
                    <h2 className="page-title">{title}</h2>
                </div>
                
                <div className="topbar-right">
                    {/* ✅ Notification Button with Animation and Badge */}
                    <button 
                        className={`notification-btn ${isAnimating ? 'animate-bell' : ''}`}
                        onClick={() => setShowNotifications(true)}
                        aria-label="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="admin-notification-badge">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                    
                    <div className="user-menu">
                        <button 
                            className="user-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                        >
                            <div className="user-avatar">
                                {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <span className="user-name">{user?.name || user?.username || 'Admin'}</span>
                            <ChevronDown className="chevron-icon text-white" size={16} />
                        </button>
                        
                        {showUserMenu && (
                            <div className="user-dropdown">
                                <button 
                                    className="dropdown-item"
                                    onClick={handleProfileClick}
                                >
                                    <User className='text-white' size={16} />
                                    <span className='text-white'>My Profile</span>
                                </button>
                                <div className="dropdown-divider"></div>
                                <button 
                                    className="dropdown-item text-danger"
                                    onClick={handleLogoutClick}
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* ✅ Notification Panel */}
            <NotificationPanel 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                role="admin"
            />

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="admin-topbar-profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="admin-topbar-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-topbar-profile-modal-header">
                            <h3>Admin Profile</h3>
                            <button 
                                className="admin-topbar-profile-close-btn" 
                                onClick={() => setShowProfileModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="admin-topbar-profile-modal-body">
                            <div className="admin-topbar-profile-avatar-section">
                                <div className="admin-topbar-profile-avatar-large">
                                    {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div className="admin-topbar-profile-avatar-info">
                                    <h4>{user?.name || user?.username || 'Admin User'}</h4>
                                    <div className="admin-topbar-profile-role">
                                        <Shield size={14} />
                                        <span>Administrator</span>
                                    </div>
                                </div>
                                <button 
                                    className="admin-topbar-profile-edit-btn"
                                    onClick={handleEditProfileClick}
                                >
                                    <Edit2 size={16} />
                                    Edit Profile
                                </button>
                            </div>

                            <div className="admin-topbar-profile-details">
                                <div className="admin-topbar-profile-detail-item">
                                    <div className="admin-topbar-profile-detail-icon">
                                        <User size={16} />
                                    </div>
                                    <div className="admin-topbar-profile-detail-info">
                                        <span className="admin-topbar-profile-detail-label">Username</span>
                                        <p className="admin-topbar-profile-detail-value">@{user?.username || 'admin'}</p>
                                    </div>
                                </div>
                                
                                <div className="admin-topbar-profile-detail-item">
                                    <div className="admin-topbar-profile-detail-icon">
                                        <Mail size={16} />
                                    </div>
                                    <div className="admin-topbar-profile-detail-info">
                                        <span className="admin-topbar-profile-detail-label">Email Address</span>
                                        <p className="admin-topbar-profile-detail-value">{user?.email || 'admin@holistilearn.com'}</p>
                                    </div>
                                </div>
                                
                                <div className="admin-topbar-profile-detail-item">
                                    <div className="admin-topbar-profile-detail-icon">
                                        <UserCheck size={16} />
                                    </div>
                                    <div className="admin-topbar-profile-detail-info">
                                        <span className="admin-topbar-profile-detail-label">Full Name</span>
                                        <p className="admin-topbar-profile-detail-value">{user?.name || user?.username || 'Admin User'}</p>
                                    </div>
                                </div>
                                
                                <div className="admin-topbar-profile-detail-item">
                                    <div className="admin-topbar-profile-detail-icon">
                                        <Calendar size={16} />
                                    </div>
                                    <div className="admin-topbar-profile-detail-info">
                                        <span className="admin-topbar-profile-detail-label">Member Since</span>
                                        <p className="admin-topbar-profile-detail-value">{formatDate(user?.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-topbar-profile-status">
                                <div className="admin-topbar-profile-status-item">
                                    <span className="admin-topbar-profile-status-label">Account Status</span>
                                    <StatusBadge status="active" />
                                </div>
                                <div className="admin-topbar-profile-status-item">
                                    <span className="admin-topbar-profile-status-label">Role</span>
                                    <StatusBadge status="admin" />
                                </div>
                                <div className="admin-topbar-profile-status-item">
                                    <span className="admin-topbar-profile-status-label">Last Login</span>
                                    <span className="admin-topbar-profile-status-value">
                                        {user?.lastLogin ? formatDate(user.lastLogin) : 'Today'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="admin-topbar-profile-modal-footer">
                            <button 
                                className="admin-topbar-profile-close-modal-btn"
                                onClick={() => setShowProfileModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditProfileModal && (
                <div className="admin-topbar-profile-modal-overlay" onClick={() => setShowEditProfileModal(false)}>
                    <div className="admin-topbar-edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-topbar-profile-modal-header">
                            <h3>Edit Profile</h3>
                            <button 
                                className="admin-topbar-profile-close-btn" 
                                onClick={() => setShowEditProfileModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="admin-topbar-profile-modal-body">
                            <div className="admin-topbar-edit-profile-form">
                                <div className="admin-topbar-edit-form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                
                                <div className="admin-topbar-edit-form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        placeholder="Enter your username"
                                    />
                                </div>
                                
                                <div className="admin-topbar-edit-form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                
                                <div className="admin-topbar-edit-divider">
                                    <span>Change Password (Optional)</span>
                                </div>
                                
                                <div className="admin-topbar-edit-form-group">
                                    <label>Current Password</label>
                                    <div className="admin-topbar-edit-password-input">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={editForm.currentPassword}
                                            onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="admin-topbar-edit-password-toggle"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="admin-topbar-edit-form-group">
                                    <label>New Password</label>
                                    <div className="admin-topbar-edit-password-input">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={editForm.newPassword}
                                            onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                                            placeholder="Enter new password (leave blank to keep current)"
                                        />
                                    </div>
                                </div>
                                
                                <div className="admin-topbar-edit-form-group">
                                    <label>Confirm New Password</label>
                                    <div className="admin-topbar-edit-password-input">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={editForm.confirmPassword}
                                            onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="admin-topbar-edit-profile-modal-footer">
                            <button 
                                className="admin-topbar-edit-cancel-btn"
                                onClick={() => setShowEditProfileModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="admin-topbar-edit-save-btn"
                                onClick={handleUpdateProfile}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="admin-topbar-edit-spinner"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="admin-topbar-logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="admin-topbar-logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-topbar-logout-modal-header">
                            <div className="admin-topbar-logout-icon-wrapper">
                                <AlertTriangle size={28} />
                            </div>
                            <h3>Confirm Logout</h3>
                            <button 
                                className="admin-topbar-logout-close-btn" 
                                onClick={() => setShowLogoutModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="admin-topbar-logout-modal-body">
                            <p>Are you sure you want to logout?</p>
                            <p className="admin-topbar-logout-warning">
                                You will need to login again to access your account.
                            </p>
                        </div>
                        
                        <div className="admin-topbar-logout-modal-footer">
                            <button 
                                className="admin-topbar-logout-cancel-btn"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="admin-topbar-logout-confirm-btn"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="admin-topbar-logout-spinner"></span>
                                        Logging out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut size={16} />
                                        Logout
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminTopbar;