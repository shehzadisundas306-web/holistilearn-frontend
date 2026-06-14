

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.userId = null;
    this.userRole = null;
  }

  connect() {
    if (this.socket && (this.socket.connected || this.socket.connecting)) {
      console.log('Socket already connecting/connected');
      return;
    }

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let userRole = null;
    
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        userRole = user.role;
        this.userRole = userRole;
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
    
    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://holistilearn-backend.vercel.app/';
    
    try {
      this.socket = io(SOCKET_URL, {
        auth: { token, role: userRole },
        transportOptions: {
          polling: {
            extraHeaders: {
              'Authorization': `Bearer ${token}`
            }
          }
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: false
      });

      // Setup event handlers
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join role-specific rooms
        this.joinUserRoom();
        
        this.triggerEvent('socket:connected', { socketId: this.socket.id });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
        this.triggerEvent('socket:disconnected', { reason });
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        this.isConnected = false;
        this.triggerEvent('socket:error', { error: error.message });
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket reconnect attempt ${attemptNumber}`);
        this.reconnectAttempts = attemptNumber;
      });

      this.socket.on('reconnect', () => {
        console.log('✅ Socket reconnected');
        this.isConnected = true;
        this.joinUserRoom();
        this.triggerEvent('socket:reconnected', { socketId: this.socket.id });
      });

      this.socket.on('connected', (data) => {
        console.log('📡 Socket server connected:', data);
        this.userId = data.userId;
        this.triggerEvent('connected', data);
      });

      // ==================== STUDENT PROGRESS EVENTS (Existing) ====================
      
      this.socket.on('progress-update', (data) => {
        console.log('📊 Progress update received:', data.type);
        this.triggerEvent('progress-update', data);
      });

      this.socket.on('progress-incremental', (data) => {
        console.log('📈 Incremental update:', data.type);
        this.triggerEvent('progress-incremental', data);
      });

      this.socket.on('quiz-completed', (data) => {
        console.log('🎯 Quiz completed event:', data);
        this.triggerEvent('quiz-completed', data);
      });

      // Add these after the existing event handlers (around line 120)

// ==================== ADD THESE CHAT EVENT HANDLERS ====================

// New message event (from backend)
this.socket.on('new-message', (data) => {
    console.log('💬 New message received:', data);
    this.triggerEvent('new-message', data);
});

// New chat created event
this.socket.on('new-chat', (data) => {
    console.log('💬 New chat created:', data);
    this.triggerEvent('new-chat', data);
});

// Message read receipt
this.socket.on('message:read-receipt', (data) => {
    console.log('✓ Message read receipt:', data);
    this.triggerEvent('message:read-receipt', data);
});

// User typing indicator
this.socket.on('user:typing', (data) => {
    console.log('✏️ User typing:', data);
    this.triggerEvent('user:typing', data);
});

// Message notification
this.socket.on('new-message-notification', (data) => {
    console.log('🔔 New message notification:', data);
    this.triggerEvent('new-message-notification', data);
});

// Chat list update
this.socket.on('chat-list-update', (data) => {
    console.log('📋 Chat list update:', data);
    this.triggerEvent('chat-list-update', data);
});

      this.socket.on('level-up', (data) => {
        console.log('⭐ Level up event:', data);
        this.triggerEvent('level-up', data);
      });

      this.socket.on('xp-earned', (data) => {
        console.log('💎 XP earned:', data);
        this.triggerEvent('xp-earned', data);
      });

      this.socket.on('achievement-earned', (data) => {
        console.log('🏆 Achievement earned:', data);
        this.triggerEvent('achievement-earned', data);
      });

      this.socket.on('achievements-unlocked', (data) => {
        console.log('🏆 Achievements unlocked:', data);
        this.triggerEvent('achievements-unlocked', data);
      });

      this.socket.on('perfect-score', (data) => {
        console.log('🎉 Perfect score!', data);
        this.triggerEvent('perfect-score', data);
      });

      this.socket.on('weak-topics-update', (data) => {
        console.log('📚 Weak topics update:', data);
        this.triggerEvent('weak-topics-update', data);
      });

      this.socket.on('topics-mastered', (data) => {
        console.log('🎓 Topics mastered:', data);
        this.triggerEvent('topics-mastered', data);
      });

      this.socket.on('milestone-unlocked', (data) => {
        console.log('🔓 Milestone unlocked:', data);
        this.triggerEvent('milestone-unlocked', data);
      });

      this.socket.on('progress-error', (data) => {
        console.error('Progress error:', data);
        this.triggerEvent('progress-error', data);
      });

      // ==================== TEACHER EVENTS (NEW) ====================
      
      // Teacher connection confirmation
      this.socket.on('teacher:connected', (data) => {
        console.log('👨‍🏫 Teacher connected:', data);
        this.triggerEvent('teacher:connected', data);
      });

      // Student joined class (real-time notification for teacher)
      this.socket.on('class:student-joined', (data) => {
        console.log('👨‍🎓 Student joined class:', data);
        this.triggerEvent('class:student-joined', data);
      });

      // Student left class
      this.socket.on('class:student-left', (data) => {
        console.log('👋 Student left class:', data);
        this.triggerEvent('class:student-left', data);
      });

      // Class created
      this.socket.on('class:created', (data) => {
        console.log('📚 Class created:', data);
        this.triggerEvent('class:created', data);
      });

      // Class updated
      this.socket.on('class:updated', (data) => {
        console.log('✏️ Class updated:', data);
        this.triggerEvent('class:updated', data);
      });

      // Class deleted
      this.socket.on('class:deleted', (data) => {
        console.log('🗑️ Class deleted:', data);
        this.triggerEvent('class:deleted', data);
      });

      // Quiz submitted by student
      this.socket.on('quiz:submitted', (data) => {
        console.log('📝 Quiz submitted:', data);
        this.triggerEvent('quiz:submitted', data);
      });

      // New message (for both teacher and student)
      this.socket.on('message:new', (data) => {
        console.log('💬 New message:', data);
        this.triggerEvent('message:new', data);
      });

      // Message read receipt
      this.socket.on('message:read-receipt', (data) => {
        console.log('✓ Message read:', data);
        this.triggerEvent('message:read-receipt', data);
      });

      // User typing indicator
      this.socket.on('user:typing', (data) => {
        this.triggerEvent('user:typing', data);
      });

      // Message notification
      this.socket.on('message:notification', (data) => {
        console.log('🔔 Message notification:', data);
        this.triggerEvent('message:notification', data);
      });

      // Teacher stats update
      this.socket.on('teacher:stats-update', (data) => {
        console.log('📊 Teacher stats update:', data);
        this.triggerEvent('teacher:stats-update', data);
      });

    } catch (error) {
      console.error('Socket initialization failed:', error);
      this.isConnected = false;
      this.triggerEvent('socket:error', { error: error.message });
    }
  }

  

//   joinUserRoom() {
//     if (!this.socket || !this.isConnected) return;
    
//     const userStr = localStorage.getItem('user');
//     if (userStr) {
//         try {
//             const user = JSON.parse(userStr);
//             this.userId = user.id || user._id;
//             this.userRole = user.role;
            
//             // ✅ Join user-specific room for direct messages
//             this.socket.emit('join-user-room');
//             console.log(`👤 Joined user room: ${this.userId}`);
            
//             // Join role-specific room
//             if (this.userRole === 'teacher') {
//                 this.socket.emit('join-teacher-room', { teacherId: this.userId });
//                 console.log(`👨‍🏫 Joined teacher room: ${this.userId}`);
//             } else if (this.userRole === 'student') {
//                 this.joinProgressRoom();
//                 console.log(`👨‍🎓 Joined student room: ${this.userId}`);
//             }
//         } catch (e) {
//             console.error('Error parsing user for socket:', e);
//         }
//     }
// }



  // Join progress room (for students)

  joinUserRoom() {
  if (!this.socket || !this.isConnected) return;
  
  const userStr = localStorage.getItem('user');
  if (userStr) {
      try {
          const user = JSON.parse(userStr);
          this.userId = user.id || user._id;
          this.userRole = user.role;
          
          // ✅ Join user-specific room for direct messages
          this.socket.emit('join-user-room');
          console.log(`👤 Joined user room: ${this.userId}`);
          
          // Join role-specific room
          if (this.userRole === 'teacher') {
              this.socket.emit('join-teacher-room', { teacherId: this.userId });
              console.log(`👨‍🏫 Joined teacher room: ${this.userId}`);
          } else if (this.userRole === 'student') {
              this.joinProgressRoom();
              console.log(`👨‍🎓 Joined student room: ${this.userId}`);
          }
      } catch (e) {
          console.error('Error parsing user for socket:', e);
      }
  }
}

  joinProgressRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-progress-room');
      console.log('📊 Joined progress room');
      return true;
    }
    console.warn('Cannot join progress room - socket not connected');
    return false;
  }

  leaveProgressRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-progress-room');
      console.log('📊 Left progress room');
      return true;
    }
    return false;
  }

  // ==================== TEACHER METHODS (NEW) ====================
  
  // Join a specific class room for real-time updates
  joinClassRoom(classId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-class-room', { classId });
      console.log(`📚 Joined class room: ${classId}`);
      return true;
    }
    return false;
  }

  leaveClassRoom(classId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-class-room', { classId });
      console.log(`📚 Left class room: ${classId}`);
      return true;
    }
    return false;
  }

  // Join a chat room
  joinChatRoom(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-chat', { chatId });
      console.log(`💬 Joined chat room: ${chatId}`);
      return true;
    }
    return false;
  }

  leaveChatRoom(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-chat', { chatId });
      console.log(`💬 Left chat room: ${chatId}`);
      return true;
    }
    return false;
  }

  // Send a message
  sendMessage(chatId, text, recipientId, chatType) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message:send', {
        chatId,
        text,
        recipientId,
        chatType,
        senderId: this.userId,
        senderRole: this.userRole
      });
      return true;
    }
    console.warn('Cannot send message - socket not connected');
    return false;
  }

  // Mark message as read
  // markMessageAsRead(messageId, chatId, senderId) {
  //   if (this.socket && this.isConnected) {
  //     this.socket.emit('message:mark-read', { messageId, chatId, senderId });
  //     return true;
  //   }
  //   return false;
  // }

  // Send typing indicator

  
  // Mark message as read (for API call)
async markMessageAsRead(messageId) {
    if (this.socket && this.isConnected) {
        this.socket.emit('message:read', { messageId });
        return true;
    }
    return false;
}

// Mark all messages in chat as read (for API call)
async markChatAsRead(chatId) {
    if (this.socket && this.isConnected) {
        this.socket.emit('messages:read', { chatId });
        return true;
    }
    return false;
}

  // sendTyping(chatId, recipientId, isTyping) {
  //   if (this.socket && this.isConnected) {
  //     if (this.userRole === 'teacher') {
  //       this.socket.emit('teacher:typing', { chatId, recipientId, isTyping });
  //     } else {
  //       this.socket.emit('user:typing', { chatId, recipientId, isTyping });
  //     }
  //     return true;
  //   }
  //   return false;
  // }

  
  // Send typing indicator

  sendTyping(chatId, recipientId, isTyping) {
    if (this.socket && this.isConnected) {
        // Use the event that matches your backend
        this.socket.emit('typing', { chatId, recipientId, isTyping });
        return true;
    }
    return false;
}

  
  // Request class stats (for teacher)


  requestClassStats(classId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('teacher:request-class-stats', { classId });
      return true;
    }
    return false;
  }

  // Request teacher dashboard stats
  requestTeacherStats() {
    if (this.socket && this.isConnected) {
      this.socket.emit('teacher:request-stats');
      return true;
    }
    return false;
  }

  // ==================== GENERAL METHODS ====================

  disconnect() {
    if (this.socket) {
      if (this.socket.connected) {
        this.leaveProgressRoom();
      }
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.userId = null;
      this.userRole = null;
      console.log('🔌 Socket manually disconnected');
      this.triggerEvent('socket:disconnected', { reason: 'manual' });
    }
  }

  reconnect() {
    console.log('🔄 Forcing socket reconnection...');
    this.disconnect();
    this.connect();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  offAll(event) {
    if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
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

  requestProgressUpdate() {
    if (this.socket && this.isConnected) {
      this.socket.emit('request-progress-update');
      console.log('📊 Requested progress update');
      return true;
    }
    console.warn('Cannot request progress update - socket not connected');
    return false;
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      return true;
    }
    console.warn(`Cannot emit ${event} - socket not connected`);
    return false;
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

const socketService = new SocketService();
let autoConnectTimeout = null;

const initSocket = () => {
  if (autoConnectTimeout) {
    clearTimeout(autoConnectTimeout);
  }
  
  autoConnectTimeout = setTimeout(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token && !socketService.getConnectionStatus()) {
      socketService.connect();
    }
  }, 1000);
};

window.addEventListener('storage', (event) => {
  if (event.key === 'accessToken' || event.key === 'token') {
    if (event.newValue) {
      socketService.reconnect();
    } else {
      socketService.disconnect();
    }
  }
});

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  if (key === 'accessToken' || key === 'token') {
    if (value) {
      setTimeout(() => socketService.reconnect(), 100);
    } else {
      socketService.disconnect();
    }
  }
};

// Expose globally for testing
if (typeof window !== 'undefined') {
  window.socketService = socketService;
  console.log('🔌 Socket service exposed globally for testing');
}

export default socketService;
export { initSocket };