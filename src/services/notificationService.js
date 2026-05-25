// frontend/src/services/notificationService.js
import { toast } from 'sonner';
import socketService from './socketService';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = new Map();
    this.soundEnabled = localStorage.getItem('notif_sound') !== 'false';
    this.desktopEnabled = localStorage.getItem('notif_desktop') === 'true';
    this.maxNotifications = 100;
    
    this.initialized = false;
    this.socketHandlers = [];
    this.processedEventIds = new Set();
    this.lastProcessedTime = 0;
    this.currentUserId = null;
    this.toastHistory = new Map();
    this.lastToastTime = 0;
  }

  getCurrentUserId() {
    if (this.currentUserId) return this.currentUserId;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.currentUserId = user.id || user._id;
        return this.currentUserId;
      }
    } catch (e) {
      console.error('Error getting current user:', e);
    }
    return null;
  }

  registerSocketHandler(event, handler) {
    socketService.on(event, handler);
    this.socketHandlers.push({ event, handler });
  }

  triggerEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  destroy() {
    console.log('🧹 Cleaning up notification service...');
    this.socketHandlers.forEach(({ event, handler }) => {
      socketService.off(event, handler);
    });
    this.socketHandlers = [];
    this.processedEventIds.clear();
    this.toastHistory.clear();
    this.initialized = false;
  }

  isEventProcessed(eventId, cooldownMs = 2000) {
    const now = Date.now();
    if (this.processedEventIds.has(eventId)) {
      console.log(`⚠️ Duplicate event detected: ${eventId}`);
      return true;
    }
    if (now - this.lastProcessedTime < 500) {
      console.log('⚠️ Event throttled (too rapid)');
      return true;
    }
    this.processedEventIds.add(eventId);
    this.lastProcessedTime = now;
    setTimeout(() => this.processedEventIds.delete(eventId), cooldownMs);
    return false;
  }

  shouldShowToast(title, message) {
    const now = Date.now();
    const key = `${title}_${message.substring(0, 50)}`;
    if (this.toastHistory.has(key)) {
      const lastShown = this.toastHistory.get(key);
      if (now - lastShown < 3000) {
        console.log('⚠️ Toast throttled (duplicate):', title);
        return false;
      }
    }
    if (now - this.lastToastTime < 1000) {
      console.log('⚠️ Toast throttled (too rapid)');
      return false;
    }
    this.toastHistory.set(key, now);
    this.lastToastTime = now;
    for (const [k, time] of this.toastHistory.entries()) {
      if (now - time > 5000) this.toastHistory.delete(k);
    }
    return true;
  }

  init() {
    if (this.initialized) {
      console.log('⚠️ Notification service already initialized, skipping...');
      return;
    }
    this.initialized = true;
    this.getCurrentUserId();
    this.loadFromStorage();
    this.setupSocketListeners();
    this.requestDesktopPermission();
    console.log('✅ Notification service initialized, notifications loaded:', this.notifications.length);
  }

  loadFromStorage() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        console.log(`📦 Loaded ${this.notifications.length} notifications from storage`);
      } catch(e) { 
        console.error('Error loading notifications:', e); 
        this.notifications = [];
        this.unreadCount = 0;
      }
    } else {
      console.log('📦 No saved notifications found');
    }
  }

  saveToStorage() {
    const toStore = this.notifications.slice(0, this.maxNotifications);
    localStorage.setItem('notifications', JSON.stringify(toStore));
    console.log(`💾 Saved ${toStore.length} notifications to storage`);
  }

  async requestDesktopPermission() {
    if (this.desktopEnabled && 'Notification' in window && Notification.permission !== 'granted') {
      return await Notification.requestPermission();
    }
    return false;
  }

  setupSocketListeners() {
    const currentUserId = this.getCurrentUserId();
    
    // ==================== BACKEND NOTIFICATION EVENTS (CRITICAL) ====================
    
    // ✅ Listen for notifications from backend NotificationService
    this.registerSocketHandler('new-notification', (data) => {
      console.log('🔔 New notification from backend:', data);
      
      const eventId = `backend-notification_${data.id || Date.now()}`;
      if (this.isEventProcessed(eventId)) return;
      
      this.addNotification({
        id: data.id,
        type: data.type || 'system',
        title: data.title || 'Notification',
        message: data.message || '',
        link: data.link || null,
        icon: data.icon || '🔔',
        color: data.color || '#6b7280',
        priority: data.priority || 'medium',
        showToast: true,
        metadata: data.data || {},
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    
    // ✅ Listen for unread count updates from backend
    this.registerSocketHandler('notification-count-update', (data) => {
      console.log('📊 Unread count update from backend:', data.count);
      this.unreadCount = data.count || 0;
      this.notifyListeners('unreadCountChanged', this.unreadCount);
    });
    
    // ==================== MESSAGE EVENTS ====================
    // These are for UI updates - DO NOT create notifications here
    
    this.registerSocketHandler('message:new', (data) => {
      console.log('💬 New message for UI (not creating notification):', data);
      // Only trigger for chat UI, not for notifications
      this.triggerEvent('message:new', data);
    });
    
    // ==================== LEGACY MESSAGE EVENTS (Backward compatibility) ====================
    
    this.registerSocketHandler('new-message', (data) => {
      console.log('⚠️ Deprecated: new-message received. Use new-notification instead.', data);
      // Still process for backward compatibility but with sender check
      const senderId = data.from?._id || data.from || data.message?.sender?._id ||data.message?.senderId || data.senderId;
      if (senderId && currentUserId && senderId.toString() === currentUserId.toString()) {
        console.log('⚠️ Skipping own message notification (sender)');
        return;
      }
      const messageId = data.message?.id || data.message?._id || `${data.chatId}_${data.message?.createdAt}`;
      const eventId = `new-message_${data.chatId}_${messageId}`;
      if (this.isEventProcessed(eventId)) return;
      
      const messagePreview = data.message?.text || data.message || '';
      this.addNotification({
        type: 'message',
        title: 'New Message 💬',
        message: `${data.fromName || 'Someone'}: ${messagePreview.substring(0, 60)}${messagePreview.length > 60 ? '...' : ''}`,
        link: data.link || (data.isTeacher ? `/teacher/dashboard/messages/${data.chatId}` : `/student/chat/${data.chatId}`),
        icon: '💬',
        color: '#3b82f6',
        priority: 'high',
        // showToast: true,
        metadata: { chatId: data.chatId, fromId: senderId, fromName: data.fromName, isTeacher: data.isTeacher, messageId }
      });
    });

    this.registerSocketHandler('new-message-notification', (data) => {
      console.log('⚠️ Deprecated: new-message-notification received. Use new-notification instead.', data);
      if (data.from && currentUserId && data.from.toString() === currentUserId.toString()) {
        console.log('⚠️ Skipping own message notification (enhanced)');
        return;
      }
      const eventId = `notif_${data.chatId}_${data.timestamp || data.messageId}`;
      if (this.isEventProcessed(eventId)) return;
      this.addNotification({
        type: data.type || 'message',
        title: data.title || 'New Message',
        message: data.message,
        link: data.link,
        icon: data.icon || '💬',
        color: data.color || '#3b82f6',
        priority: data.priority || 'high',
        showToast: true,
        metadata: { chatId: data.chatId, fromId: data.from, fromName: data.fromName, isTeacher: data.isTeacher, messagePreview: data.messagePreview }
      });
    });

    // ==================== NEW CHAT EVENT ====================
    
    this.registerSocketHandler('new-chat', (data) => {
      console.log('💬 New chat event:', data);
      this.triggerEvent('new-chat', data);
    });

    // ==================== QUIZ EVENTS ====================
    
    this.registerSocketHandler('quiz-completed', (data) => {
      const eventId = `quiz-completed_${data.quizId}`;
      if (this.isEventProcessed(eventId)) return;
      
      this.addNotification({
        type: 'quiz',
        title: 'Quiz Completed! 🎯',
        message: `You scored ${data.percentage || data.score}% on "${data.title || data.quizTitle}"`,
        link: `/student/quiz/${data.quizId}/result`,
        icon: '📝',
        color: '#10b981',
        priority: 'high',
        showToast: true
      });
    });

    this.registerSocketHandler('quiz:submitted', (data) => {
      const eventId = `quiz-submitted_${data.quizId}_${data.studentName}`;
      if (this.isEventProcessed(eventId)) return;
      
      this.addNotification({
        type: 'quiz_submitted',
        title: 'Quiz Submitted 📝',
        message: `${data.studentName || 'A student'} submitted "${data.quizTitle}" - Score: ${data.percentage || data.score}%`,
        link: `/teacher/dashboard/quiz/${data.quizId}?mode=results`,
        icon: '📊',
        color: '#10b981',
        priority: 'high',
        showToast: true,
        metadata: {
          quizId: data.quizId,
          quizTitle: data.quizTitle,
          studentName: data.studentName,
          score: data.score || data.percentage,
          className: data.className
        }
      });
    });

    // ==================== ACHIEVEMENT EVENTS ====================
    
    this.registerSocketHandler('achievement-earned', (data) => {
      const eventId = `achievement_${data.achievement?.achievementId || data.achievement?.name}`;
      if (this.isEventProcessed(eventId)) return;
      
      this.addNotification({
        type: 'achievement',
        title: 'Achievement Unlocked! 🏆',
        message: data.achievement?.name || data.achievement?.title || 'New achievement earned!',
        link: '/student/achievements',
        icon: '🏆',
        color: '#f5c45e',
        priority: 'high',
        showToast: true
      });
    });

    this.registerSocketHandler('level-up', (data) => {
      const eventId = `level-up_${data.newLevel}`;
      if (this.isEventProcessed(eventId)) return;
      
      this.addNotification({
        type: 'level',
        title: 'Level Up! 🎉',
        message: `Congratulations! You've reached Level ${data.newLevel}!`,
        link: '/student/progress',
        icon: '⭐',
        color: '#8b5cf6',
        priority: 'high',
        showToast: true
      });
    });

    this.registerSocketHandler('xp-earned', (data) => {
      const eventId = `xp-earned_${data.amount}_${data.source}`;
      if (this.isEventProcessed(eventId)) return;
      
      if (data.amount >= 25) {
        this.addNotification({
          type: 'xp',
          title: 'XP Earned! 💎',
          message: `+${data.amount} XP from ${data.source || 'learning'}`,
          link: '/student/progress',
          icon: '💎',
          color: '#fbbf24',
          priority: 'low',
          showToast: false,
          autoDismiss: 3000
        });
      }
    });

    // ==================== CLASS EVENTS ====================
    
    this.registerSocketHandler('class:student-joined', (data) => {
      const eventId = `student-joined_${data.classId}_${data.studentId}`;
      if (this.isEventProcessed(eventId)) return;
      
      this.addNotification({
        type: 'student_joined',
        title: 'New Student Joined 👋',
        message: `${data.studentName || 'A student'} joined "${data.className}"`,
        link: `/teacher/dashboard/classes/${data.classId}`,
        icon: '👨‍🎓',
        color: '#10b981',
        priority: 'medium',
        showToast: true,
        metadata: {
          classId: data.classId,
          className: data.className,
          studentId: data.student?.id,
          studentName: data.studentName,
          totalStudents: data.totalStudents
        }
      });
    });

    this.registerSocketHandler('class:updated', (data) => {
      if (data.className) {
        const eventId = `class-updated_${data.classId}`;
        if (this.isEventProcessed(eventId)) return;
        
        this.addNotification({
          type: 'class',
          title: 'Class Updated 📋',
          message: `Class "${data.className}" has been updated`,
          link: `/classes/${data.classId}`,
          icon: '📋',
          color: '#3b82f6',
          priority: 'low',
          showToast: true
        });
      }
    });

    // ==================== LIVE CLASS EVENTS ====================
    
    this.registerSocketHandler('session-started', (data) => {
      if (data.title && data.classId) {
        const eventId = `session-started_${data._id}`;
        if (this.isEventProcessed(eventId)) return;
        
        this.addNotification({
          type: 'live_class_started',
          title: '🔴 Live Class Started!',
          message: `"${data.title}" has started. Join now!`,
          link: `/student/join-live/${data._id}`,
          icon: '🔴',
          color: '#ef4444',
          priority: 'high',
          showToast: true
        });
      }
    });

    this.registerSocketHandler('new-online-session', (data) => {
      if (data.title && data.classId) {
        const eventId = `new-online-session_${data._id}`;
        if (this.isEventProcessed(eventId)) return;
        
        this.addNotification({
          type: 'live_class',
          title: '📅 New Live Class Scheduled',
          message: `Teacher scheduled "${data.title}" for ${data.scheduledStart ? new Date(data.scheduledStart).toLocaleString() : 'soon'}`,
          link: `/student/classes/${data.classId}`,
          icon: '🎥',
          color: '#f59e0b',
          priority: 'high',
          showToast: true
        });
      }
    });

    // ==================== SOCKET CONNECTION EVENTS ====================
    
    this.registerSocketHandler('connect_error', (error) => {
      console.warn('Socket connection error:', error);
    });

    this.registerSocketHandler('reconnect', () => {
      console.log('Socket reconnected, refreshing notifications');
      this.loadFromStorage();
    });
  }

  addNotification(notification) {
    // Duplicate check within 2 seconds
    const existingDuplicate = this.notifications.find(n => 
      n.type === notification.type && 
      n.message === notification.message && 
      new Date(n.createdAt).getTime() > Date.now() - 2000
    );
    if (existingDuplicate) {
      console.log('⚠️ Duplicate notification detected in batch, skipping');
      return null;
    }
    
    const newNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    this.unreadCount++;
    if (this.notifications.length > this.maxNotifications) this.notifications.pop();
    
    this.saveToStorage();
    this.notifyListeners('new', newNotification);
    this.notifyListeners('unreadCountChanged', this.unreadCount);
    
    console.log(`📌 Added notification: "${newNotification.title}" – total now ${this.notifications.length}`);
    
    const shouldShow = notification.showToast !== false && this.shouldShowToast(notification.title, notification.message);
    if (shouldShow) this.showToast(newNotification);
    this.showDesktopNotification(newNotification);
    if (notification.priority === 'high' && notification.showToast !== false) this.playSound();
    
    return newNotification;
  }

  showToast(notification) {
    if (notification.type === 'xp' && notification.priority === 'low') return;
    const toastType = notification.type === 'achievement' || notification.type === 'level' ? 'success' : 
                      notification.type === 'message' ? 'info' : 
                      notification.type === 'quiz' ? 'success' : 'default';
    toast[toastType](notification.title, {
      description: notification.message,
      duration: notification.autoDismiss || 4000,
      icon: notification.icon,
      onClick: () => { if (notification.link) window.location.href = notification.link; },
      action: notification.link ? { label: 'View', onClick: () => window.location.href = notification.link } : undefined
    });
  }

  showDesktopNotification(notification) {
    if (this.desktopEnabled && Notification.permission === 'granted') {
      try {
        const desktopNotif = new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png',
          tag: `${notification.type}_${notification.id}`,
          silent: false
        });
        desktopNotif.onclick = () => {
          if (notification.link) window.location.href = notification.link;
          desktopNotif.close();
        };
        setTimeout(() => desktopNotif.close(), 5000);
      } catch (error) {
        console.error('Desktop notification error:', error);
      }
    }
  }

  playSound() {
    if (!this.soundEnabled) return;
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.2;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.error('Sound play error:', error);
    }
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount--;
      this.saveToStorage();
      this.notifyListeners('read', notificationId);
      this.notifyListeners('unreadCountChanged', this.unreadCount);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => { n.read = true; });
    this.unreadCount = 0;
    this.saveToStorage();
    this.notifyListeners('allRead', null);
    this.notifyListeners('unreadCountChanged', this.unreadCount);
  }

  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const wasUnread = !this.notifications[index].read;
      this.notifications.splice(index, 1);
      if (wasUnread) this.unreadCount--;
      this.saveToStorage();
      this.notifyListeners('delete', notificationId);
      this.notifyListeners('unreadCountChanged', this.unreadCount);
    }
  }

  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.saveToStorage();
    this.notifyListeners('clearAll', null);
    this.notifyListeners('unreadCountChanged', this.unreadCount);
  }

  clearOldNotifications(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    this.notifications = this.notifications.filter(n => new Date(n.createdAt) > cutoff);
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.saveToStorage();
    this.notifyListeners('clearOld', days);
    this.notifyListeners('unreadCountChanged', this.unreadCount);
  }

  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  refreshFromStorage() {
    this.loadFromStorage();
    this.notifyListeners('refresh', this.notifications);
    this.notifyListeners('unreadCountChanged', this.unreadCount);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}

export default new NotificationService();