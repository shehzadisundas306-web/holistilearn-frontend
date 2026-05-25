import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import '../../styles/teacher/TeacherDashboard.css';
import TeacherTopbar from '../../components/teacher/TeacherTopbar';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';
import { useGetData } from '../../context/userContext';
import notificationService from '../../services/notificationService';
import socketService from '../../services/socketService';

const TeacherDashboard = () => {
  const { user, logout } = useGetData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMounted = useRef(true);

  // Initialize notification service and socket connection
  useEffect(() => {
    // Initialize notification service
    notificationService.init();
    
    // Connect socket for real-time updates
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }
    
    // Load initial notifications
    loadNotifications();
    
    // Setup event listeners for real-time notifications
    const unsubscribeNew = notificationService.on('new', (notification) => {
      if (!isMounted.current) return;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast for high priority notifications
      if (notification.priority === 'high') {
        toast.info(notification.title, {
          description: notification.message,
          duration: 5000,
          icon: notification.icon,
          action: notification.link ? {
            label: 'View',
            onClick: () => navigate(notification.link)
          } : undefined
        });
      }
    });
    
    const unsubscribeUnreadCount = notificationService.on('unreadCountChanged', (count) => {
      if (!isMounted.current) return;
      setUnreadCount(count);
    });
    
    const unsubscribeRead = notificationService.on('read', () => {
      if (!isMounted.current) return;
      setUnreadCount(notificationService.getUnreadCount());
      loadNotifications();
    });
    
    const unsubscribeDelete = notificationService.on('delete', () => {
      if (!isMounted.current) return;
      loadNotifications();
    });
    
    const unsubscribeClear = notificationService.on('clearAll', () => {
      if (!isMounted.current) return;
      loadNotifications();
      setUnreadCount(0);
    });
    
    // ✅ Listen for socket connection to join rooms
    const handleSocketConnected = () => {
      if (socketService.getConnectionStatus() && user?.id) {
        console.log('✅ Socket connected, joining teacher rooms');
        socketService.joinUserRoom();
        socketService.requestTeacherStats();
      }
    };
    
    // Check if already connected
    if (socketService.getConnectionStatus() && user?.id) {
      socketService.joinUserRoom();
      socketService.requestTeacherStats();
    }
    
    // Listen for connection event
    socketService.on('socket:connected', handleSocketConnected);
    
    // Cleanup
    return () => {
      isMounted.current = false;
      unsubscribeNew();
      unsubscribeUnreadCount();
      unsubscribeRead();
      unsubscribeDelete();
      unsubscribeClear();
      socketService.off('socket:connected', handleSocketConnected);
    };
  }, [user?.id]);

  const loadNotifications = () => {
    if (!isMounted.current) return;
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Mark notification as read
  const markAsRead = (id) => {
    notificationService.markAsRead(id);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    toast.success('All notifications marked as read');
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    notificationService.clearAll();
    toast.success('All notifications cleared');
  };

  // Handle logout
  const handleLogout = async () => {
    // Disconnect socket before logout
    if (socketService.getConnectionStatus()) {
      socketService.disconnect();
    }
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className={`teacher-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      
      {/* Sidebar */}
      <TeacherSidebar
        collapsed={sidebarCollapsed}
        currentPath={location.pathname}
      />
      
      {/* Main Content */}
      <div className="dashboard-main">
        <TeacherTopbar
          user={user}
          onToggleSidebar={toggleSidebar}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAllNotifications}
          onLogout={handleLogout}
        />
        
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;