// frontend/src/components/NotificationPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, FaCheck, FaTrash, FaTimes, FaVolumeUp, FaVolumeMute, 
  FaDesktop, FaEnvelope, FaTrophy, FaStar, FaBook, FaGraduationCap,
  FaVideo, FaCalendar, FaUserPlus, FaChartLine, FaGift
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { toast } from 'sonner';
import '../styles/NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const panelRef = useRef(null);
  const isFirstLoad = useRef(true);
  const processedIds = useRef(new Set());

  // ✅ FIXED: Proper cleanup of event listeners
  useEffect(() => {
    if (!isOpen) return;
    
    loadNotifications();
    
    // Store unsubscribe function
    const unsubscribe = setupEventListeners();
    
    // ✅ Return cleanup function that calls unsubscribe
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      // Clear processed IDs after panel closes
      setTimeout(() => {
        processedIds.current.clear();
      }, 1000);
    };
  }, [isOpen]);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    
    // ✅ Filter out duplicates in UI
    const uniqueNotifications = [];
    const seenIds = new Set();
    const seenContent = new Set();
    
    for (const notif of allNotifications) {
      const notifId = `${notif.type}_${notif.id || notif.createdAt}`;
      const contentKey = `${notif.type}_${notif.title}_${notif.message.substring(0, 50)}`;
      
      if (seenIds.has(notifId) || seenContent.has(contentKey)) {
        continue;
      }
      
      seenIds.add(notifId);
      seenContent.add(contentKey);
      uniqueNotifications.push(notif);
    }
    
    setNotifications(uniqueNotifications);
    setUnreadCount(uniqueNotifications.filter(n => !n.read).length);
    setSoundEnabled(localStorage.getItem('notif_sound') !== 'false');
    setDesktopEnabled(localStorage.getItem('notif_desktop') === 'true');
    
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  };

  // ✅ Returns unsubscribe function for proper cleanup
  const setupEventListeners = () => {
    // const unsubscribeNew = notificationService.on('new', (notification) => {
    //   // Check for duplicate before adding
    //   const notifId = `${notification.type}_${notification.id || notification.createdAt}`;
      
    //   if (processedIds.current.has(notifId)) {
    //     console.log('⚠️ Duplicate notification detected in panel, skipping UI update');
    //     return;
    //   }
      
    //   processedIds.current.add(notifId);
      
    //   // Check against existing notifications
    //   const exists = notifications.some(n => {
    //     const existingId = `${n.type}_${n.id || n.createdAt}`;
    //     return existingId === notifId;
    //   });
      
    //   if (exists) {
    //     return;
    //   }
      
    //   loadNotifications();
    // });

    const unsubscribeNew = notificationService.on('new', () => {
  loadNotifications();
});

    const unsubscribeRead = notificationService.on('read', () => {
      setUnreadCount(notificationService.getUnreadCount());
      loadNotifications();
    });

    const unsubscribeDelete = notificationService.on('delete', () => {
      loadNotifications();
    });

    const unsubscribeClear = notificationService.on('clearAll', () => {
      loadNotifications();
      processedIds.current.clear();
    });

    const unsubscribeUnreadCount = notificationService.on('unreadCountChanged', (count) => {
      setUnreadCount(count);
    });

    // ✅ Return cleanup function
    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeDelete();
      unsubscribeClear();
      unsubscribeUnreadCount();
    };
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('notif_sound', newState);
    notificationService.soundEnabled = newState;
    toast.info(`Sound ${newState ? 'enabled' : 'disabled'}`);
  };

  const toggleDesktop = async () => {
    const newState = !desktopEnabled;
    if (newState) {
      const granted = await notificationService.requestDesktopPermission();
      if (granted) {
        setDesktopEnabled(true);
        localStorage.setItem('notif_desktop', 'true');
        notificationService.desktopEnabled = true;
        toast.success('Desktop notifications enabled!');
      } else {
        toast.error('Please allow notifications in your browser settings');
      }
    } else {
      setDesktopEnabled(false);
      localStorage.setItem('notif_desktop', 'false');
      notificationService.desktopEnabled = false;
      toast.info('Desktop notifications disabled');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIconForNotification = (notification) => {
    if (notification.icon) return notification.icon;
    
    const icons = {
      quiz: '📝',
      quiz_assigned: '📝',
      quiz_submitted: '📊',
      achievement: '🏆',
      level: '⭐',
      topic: '📚',
      message: '💬',
      xp: '💎',
      live_class: '🎥',
      live_class_started: '🔴',
      student_joined: '👨‍🎓',
      student_left: '👋',
      class: '📋',
      new_chat: '💬'
    };
    return icons[notification.type] || '🔔';
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    if (filter === 'read') {
      return notifications.filter(n => n.read);
    }
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  // Handle clear all with confirmation
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      notificationService.clearAll();
      processedIds.current.clear();
      toast.success('All notifications cleared');
    }
  };

  // Handle clear old notifications
  const handleClearOld = () => {
    if (window.confirm('Clear notifications older than 30 days?')) {
      notificationService.clearOldNotifications(30);
      setTimeout(() => loadNotifications(), 100);
      // toast.success('Old notifications cleared');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="notification-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            ref={panelRef}
            className="notification-panel"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="notification-panel-header">
              <div className="header-title">
                <h3>
                  <FaBell /> Notifications
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                </h3>
              </div>
              <div className="notification-actions">
                <button onClick={toggleSound} className="icon-btn" title={soundEnabled ? 'Mute' : 'Unmute'}>
                  {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                </button>
                <button onClick={toggleDesktop} className="icon-btn" title="Desktop Notifications">
                  <FaDesktop className={desktopEnabled ? 'active' : ''} />
                </button>
                {notifications.length > 0 && (
                  <>
                    <button 
                      onClick={() => {
                        notificationService.markAllAsRead();
                        toast.success('All notifications marked as read');
                      }} 
                      className="icon-btn" 
                      title="Mark all read"
                    >
                      <FaCheck />
                    </button>
                    <button 
                      onClick={handleClearAll} 
                      className="icon-btn" 
                      title="Clear all"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
                <button onClick={onClose} className="icon-btn close-btn">
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="notification-filters">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button 
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({notifications.filter(n => !n.read).length})
              </button>
              <button 
                className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read ({notifications.filter(n => n.read).length})
              </button>
            </div>

            <div className="notification-list">
              {filteredNotifications.length === 0 ? (
                <div className="empty-notifications">
                  <FaBell />
                  <p>No notifications yet</p>
                  <span>
                    {filter === 'unread' ? 'You have no unread notifications' :
                     filter === 'read' ? 'You have no read notifications' :
                     'Complete quizzes and activities to see notifications!'}
                  </span>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <motion.div
                    key={`${notification.type}_${notification.id}`}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    whileHover={{ x: 5 }}
                    layout
                  >
                    <div className="notification-icon" style={{ backgroundColor: `${notification.color || '#f5c45e'}20` }}>
                      <span style={{ color: notification.color || '#f5c45e' }}>
                        {getIconForNotification(notification)}
                      </span>
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        <h4>{notification.title}</h4>
                        {!notification.read && <span className="unread-dot"></span>}
                      </div>
                      <p>{notification.message}</p>
                      <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        notificationService.deleteNotification(notification.id);
                        // Immediate UI update
                        setNotifications(prev => prev.filter(n => n.id !== notification.id));
                      }}
                    >
                      <FaTimes />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer with clear old notifications */}
            {notifications.length > 0 && (
              <div className="notification-footer">
                <button 
                  className="clear-old-btn"
                  onClick={handleClearOld}
                >
                  Clear old notifications (30+ days)
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;