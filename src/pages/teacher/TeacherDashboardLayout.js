// frontend/src/pages/teacher/TeacherDashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { useGetData } from '../../context/userContext';
import { toast } from 'sonner';
import NotificationPanel from '../../components/NotificationPanel';
import notificationService from '../../services/notificationService';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileQuestion, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../../styles/teacher/TeacherDashboard.css';
import { checkProfileStatus } from '../../api/teacherApi';

// ==================== TEACHER SIDEBAR ====================
const TeacherSidebar = ({ collapsed, onToggle, currentPath }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { path: '/teacher/dashboard/overview', icon: LayoutDashboard, label: 'Overview' },
    { path: '/teacher/dashboard/subjects', icon: BookOpen, label: 'Subjects & Topics' },
    { path: '/teacher/dashboard/classes', icon: Users, label: 'My Classes' },
    { path: '/teacher/dashboard/quiz', icon: FileQuestion, label: 'Quiz Manager' },
    { path: '/teacher/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/teacher/dashboard/reports', icon: BarChart3, label: 'Reports' },
    { path: '/teacher/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => currentPath.startsWith(path);

  return (
    <aside className={`tch-layout-sidebar ${collapsed ? 'tch-layout-collapsed' : ''}`}>
      <div className="tch-layout-brand">
        <div className="tch-layout-brand-wrapper">
          <div className="tch-layout-logo-box">
            <div className="tch-layout-inner-logo"></div>
          </div>
          {!collapsed && <h2 className="tch-layout-brand-text">Holisti<span className="tch-layout-logo-gold">Learn</span></h2>}
        </div>
        <button className="tch-layout-sidebar-toggle" onClick={onToggle}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="tch-layout-section-label">
        {collapsed ? "•••" : "MAIN MENU"}
      </div>

      <nav className="tch-layout-sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`tch-layout-nav-link ${isActive(item.path) ? 'tch-layout-nav-active' : ''}`}
            data-tip={item.label}
          >
            <div className="tch-layout-active-indicator" />
            <item.icon className="tch-layout-nav-icon" size={18} />
            {!collapsed && <span className="tch-layout-nav-label">{item.label}</span>}
            {isActive(item.path) && !collapsed && <div className="tch-layout-active-pill" />}
          </button>
        ))}
      </nav>

      <div className="tch-layout-sidebar-footer">
        <button 
          className="tch-layout-logout-button" 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          data-tip="Sign Out"
        >
          <LogOut size={18} className="tch-layout-logout-icon" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

// ==================== TEACHER TOPBAR ====================
const TeacherTopbar = ({ user, onRefresh, lastUpdated }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('teacher_theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  useEffect(() => {
    const checkTeacherProfile = async () => {
      try {
        const response = await checkProfileStatus();
        if (!response.isComplete) {
          navigate('/teacher-onboarding');
        }
      } catch (error) {
        console.error('Profile check error:', error);
      }
    };
    checkTeacherProfile();
  }, [navigate]);

  useEffect(() => {
    setNotificationCount(notificationService.getUnreadCount());
    const handleUnreadCount = (count) => setNotificationCount(count);
    
    notificationService.on('unreadCountChanged', handleUnreadCount);
    notificationService.on('new', () => setNotificationCount(notificationService.getUnreadCount()));
    
    return () => {
      notificationService.off('unreadCountChanged', handleUnreadCount);
      notificationService.off('new', () => {});
    };
  }, []);

  const getUserInitials = () => {
    const name = user?.name || user?.username || 'T';
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.tch-layout-user-container')) setShowUserMenu(false);
      if (!e.target.closest('.tch-layout-notification-btn') && !e.target.closest('.notification-panel')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <header className="tch-layout-topbar">
        <div className="tch-layout-topbar-left">
          <h2 className="tch-layout-page-title">Teacher Space</h2>
          {lastUpdated && (
            <span className="tch-layout-last-updated">
              Sync: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="tch-layout-topbar-right">
          {/* Action Sync Trigger */}
          <button className="tch-layout-icon-btn" onClick={onRefresh} title="Sync Workspace Data">
            <svg className="tch-layout-refresh-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>

          {/* Notifications Button */}
          <button 
            className="tch-layout-icon-btn tch-layout-notification-btn"
            onClick={() => setShowNotifications(true)}
            aria-label="View system alerts"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="tch-layout-badge">{notificationCount}</span>
            )}
          </button>

          {/* User Menu Panel Profile Dropdown */}
          <div className="tch-layout-user-container">
            <button className="tch-layout-user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="tch-layout-avatar">{getUserInitials()}</div>
              <div className="tch-layout-user-meta">
                <span className="tch-layout-user-name">{user?.name || 'Teacher'}</span>
                <span className="tch-layout-user-role">Academic Instructor</span>
              </div>
              <ChevronDown size={14} className={`tch-layout-arrow-icon ${showUserMenu ? 'tch-layout-rotate' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="tch-layout-dropdown">
                <button className="tch-layout-dropdown-item" onClick={() => navigate('/teacher/dashboard/settings')}>
                  <User size={15} /> Profile Settings
                </button>
                <hr className="tch-layout-dropdown-divider" />
                <button className="tch-layout-dropdown-item tch-layout-logout-item" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
                  <LogOut size={15} /> Sign Out Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotifications && (
        <NotificationPanel 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />
      )}
    </>
  );
};

// ==================== MAIN CORE LAYOUT FRAME ====================
const TeacherDashboardLayout = () => {
  const { user } = useGetData();
  const { refreshAllData, lastDashboardUpdate } = useTeacher();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleRefresh = async () => {
    toast.loading('Syncing dashboard components...', { id: 'refresh-tch' });
    await refreshAllData();
    toast.success('Workspace updated!', { id: 'refresh-tch' });
  };

  return (
    <div className={`tch-layout-frame ${sidebarCollapsed ? 'tch-layout-frame-collapsed' : ''}`}>
      <TeacherSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={location.pathname}
      />
      <div className="tch-layout-main-wrapper">
        <TeacherTopbar
          user={user}
          onRefresh={handleRefresh}
          lastUpdated={lastDashboardUpdate}
        />
        <main className="tch-layout-content-view">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboardLayout;