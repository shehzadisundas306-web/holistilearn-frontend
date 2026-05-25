// frontend/src/components/teacher/TeacherTopbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, Menu, LogOut, Settings } from 'lucide-react';
import NotificationPanel from '../NotificationPanel';
import { useGetData } from '../../context/userContext';
import notificationService from '../../services/notificationService';

const TeacherTopbar = ({ onToggleSidebar, lastUpdated, onRefresh }) => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useGetData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localUserName, setLocalUserName] = useState('');
  const animationTimer = useRef(null);

  useEffect(() => {
    notificationService.init();
  }, []);

  useEffect(() => {
    setLocalUserName(user?.name || user?.username || 'Teacher');
    
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          setLocalUserName(updatedUser.name || updatedUser.username || 'Teacher');
          if (updateUser) updateUser(updatedUser);
        } catch (err) {
          console.error('Error parsing user from storage:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleUserUpdate = (event) => {
      if (event.detail?.user) {
        setLocalUserName(event.detail.user.name || event.detail.user.username || 'Teacher');
      }
    };
    
    window.addEventListener('user-updated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, [user, updateUser]);

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (token) {
          const API_BASE = process.env.REACT_APP_API_URL1 || 'http://localhost:5000';
          const response = await fetch(`${API_BASE}/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success && data.user) {
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (updateUser) updateUser(updatedUser);
            setLocalUserName(updatedUser.name || updatedUser.username || 'Teacher');
          }
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };
    
    const interval = setInterval(refreshUserData, 30000);
    return () => clearInterval(interval);
  }, [user, updateUser]);

  useEffect(() => {
    setNotificationCount(notificationService.getUnreadCount());
    
    const handleUnreadCount = (count) => setNotificationCount(count);
    
    const handleNewNotification = () => {
      const newCount = notificationService.getUnreadCount();
      setNotificationCount(newCount);
      setIsAnimating(true);
      if (animationTimer.current) clearTimeout(animationTimer.current);
      animationTimer.current = setTimeout(() => setIsAnimating(false), 1000);
    };
    
    const handleRead = () => setNotificationCount(notificationService.getUnreadCount());
    
    notificationService.on('unreadCountChanged', handleUnreadCount);
    notificationService.on('new', handleNewNotification);
    notificationService.on('read', handleRead);
    notificationService.on('allRead', handleRead);
    notificationService.on('clearAll', handleRead);
    
    return () => {
      notificationService.off('unreadCountChanged', handleUnreadCount);
      notificationService.off('new', handleNewNotification);
      notificationService.off('read', handleRead);
      notificationService.off('allRead', handleRead);
      notificationService.off('clearAll', handleRead);
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('teacher_theme');
    localStorage.removeItem('teacherProfile');
    navigate('/login', { replace: true });
  };

  const getUserInitials = () => {
    const name = localUserName || user?.name || user?.username || 'T';
    return name.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    return localUserName || user?.name || user?.username || 'Teacher';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.tch-topbar-user-container')) {
        setShowUserMenu(false);
      }
      if (showNotifications && !event.target.closest('.tch-topbar-notification-btn') && !event.target.closest('.notification-panel')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications]);

  return (
    <>
      <header className="tch-topbar-container">
        <div className="tch-topbar-left">
          <button className="tch-topbar-menu-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
          <h1 className="tch-topbar-page-title">Teacher Dashboard</h1>
          {lastUpdated && (
            <span className="tch-topbar-last-updated">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="tch-topbar-right">
          {/* Refresh Action Trigger */}
          {onRefresh && (
            <button className="tch-topbar-icon-btn" onClick={onRefresh} title="Refresh dashboard data">
              <svg className="tch-topbar-refresh-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          )}

          {/* Notifications Trigger containing shake micro-animation framework */}
          <button 
            className={`tch-topbar-icon-btn tch-topbar-notification-btn ${isAnimating ? 'tch-topbar-animate-bell' : ''}`}
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications Panel"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="tch-topbar-badge">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Context Navigation Dropdown Menu Box */}
          <div className="tch-topbar-user-container">
            <button 
              className="tch-topbar-user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User contextual profile items"
            >
              <div className="tch-topbar-avatar">
                {getUserInitials()}
              </div>
              <span className="tch-topbar-user-name">
                {getDisplayName()}
              </span>
              <ChevronDown size={14} className={`tch-topbar-arrow-icon ${showUserMenu ? 'tch-topbar-rotate' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="tch-topbar-dropdown">
                <button className="tch-topbar-dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/teacher/dashboard/settings'); }}>
                  <User size={15} />
                  <span>Profile Overview</span>
                </button>
                <button className="tch-topbar-dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/teacher/dashboard/settings'); }}>
                  <Settings size={15} />
                  <span>Account Configuration</span>
                </button>
                <hr className="tch-topbar-divider" />
                <button className="tch-topbar-dropdown-item tch-topbar-logout-item" onClick={handleLogout}>
                  <LogOut size={15} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
};

export default TeacherTopbar;