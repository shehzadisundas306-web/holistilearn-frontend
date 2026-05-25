// frontend/src/hooks/useChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import chatService from '../services/chatService';
import { toast } from 'sonner';

export const useChat = (currentUser) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const typingTimeoutRef = useRef(null);

  // Connect to chat server
  useEffect(() => {
    if (!currentUser?.id) return;

    chatService.connect({
      userId: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar,
      course: currentUser.course
    });

    // Connection status listener
    chatService.on('connection-status', ({ connected }) => {
      setIsConnected(connected);
      if (connected) {
        setLoading(false);
      }
    });

    // Message listeners
    chatService.on('private-message', handleNewMessage);
    chatService.on('course-message', handleNewMessage);
    chatService.on('message', handleNewMessage);
    
    // Online users listener
    chatService.on('online-users', (users) => {
      setOnlineUsers(users);
    });
    
    // Typing indicator listener
    chatService.on('user-typing', ({ name, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(name);
        } else {
          newSet.delete(name);
        }
        return newSet;
      });
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(name);
          return newSet;
        });
      }, 3000);
    });
    
    // Message read receipt
    chatService.on('message-read', ({ messageId, readBy, readByName }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), readBy], readByName: [...(msg.readByName || []), readByName] }
          : msg
      ));
    });
    
    // Chat history
    chatService.on('chat-history', ({ roomId, messages: history }) => {
      if (activeRoom?.id === roomId) {
        setMessages(history);
      }
    });
    
    // Recent messages
    chatService.on('recent-messages', ({ private: privateMsgs, course: courseMsgs }) => {
      // Merge and update messages
      const allMessages = [...privateMsgs, ...courseMsgs];
      if (allMessages.length > 0) {
        setMessages(allMessages);
      }
    });
    
    // Message status updates
    chatService.on('message-status', ({ id, status, message }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, status } : msg
      ));
      if (status === 'offline') {
        toast.info(message);
      }
    });

    return () => {
      chatService.off('private-message', handleNewMessage);
      chatService.off('course-message', handleNewMessage);
      chatService.off('message', handleNewMessage);
      chatService.disconnect();
    };
  }, [currentUser]);

  const handleNewMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
    
    // Play notification sound if not in active room
    if (activeRoom?.id !== message.roomId && message.senderId !== currentUser?.id) {
      playNotificationSound();
      toast.info(`${message.senderName}: ${message.text.substring(0, 50)}`);
    }
  }, [activeRoom, currentUser]);

  // Send message
  const sendMessage = useCallback((text, type = 'private', target = null) => {
    if (!text.trim()) return;
    
    const messageData = { text: text.trim() };
    
    if (type === 'private' && target) {
      chatService.sendPrivateMessage(target.userId, messageData, `private-${currentUser.id}-${target.userId}`);
    } else if (type === 'course' && target) {
      chatService.sendCourseMessage(target.courseId, messageData);
    }
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      if (activeRoom) {
        chatService.stopTyping(activeRoom.id, activeRoom.type === 'private' ? activeRoom.userId : null);
      }
    }
  }, [currentUser, activeRoom]);

  // Handle typing
  const handleTyping = useCallback((isTyping) => {
    if (!activeRoom) return;
    
    if (isTyping && !typingTimeoutRef.current) {
      chatService.startTyping(activeRoom.id, activeRoom.type === 'private' ? activeRoom.userId : null);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      chatService.stopTyping(activeRoom.id, activeRoom.type === 'private' ? activeRoom.userId : null);
      typingTimeoutRef.current = null;
    }, 1000);
  }, [activeRoom]);

  // Join room
  const joinRoom = useCallback((room) => {
    setActiveRoom(room);
    setMessages([]);
    
    const roomId = room.type === 'private' 
      ? `private-${currentUser.id}-${room.userId}`
      : `course-${room.courseId}`;
    
    chatService.joinRoom(roomId, room.type, room);
    chatService.getChatHistory(roomId);
  }, [currentUser]);

  // Mark messages as read
  const markAsRead = useCallback((messageId, senderId) => {
    if (senderId !== currentUser?.id) {
      chatService.markAsRead(messageId, senderId);
    }
  }, [currentUser]);

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  // Get online status of a user
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.some(user => user.userId === userId);
  }, [onlineUsers]);

  // Get unread count
  const updateUnreadCount = useCallback(() => {
    const unreadMessages = messages.filter(msg => 
      msg.receiverId === currentUser?.id && 
      !msg.readBy?.includes(currentUser.id)
    );
    setUnreadCount(unreadMessages.length);
  }, [messages, currentUser]);

  useEffect(() => {
    updateUnreadCount();
  }, [messages, updateUnreadCount]);

  return {
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    activeRoom,
    unreadCount,
    loading,
    sendMessage,
    handleTyping,
    joinRoom,
    markAsRead,
    isUserOnline,
    setActiveRoom
  };
};