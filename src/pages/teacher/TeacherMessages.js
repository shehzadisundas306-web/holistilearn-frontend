// frontend/src/pages/teacher/TeacherMessages.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import socketService from '../../services/socketService';
import notificationService from '../../services/notificationService';
import { getTeacherChats, markTeacherChatRead, sendTeacherMessage, deleteTeacherMessage } from '../../api/teacherApi';
import { 
  MessageSquare, Send, Search, Users, Phone, Video, MoreVertical,
  Paperclip, Check, CheckCheck, BookOpen, Volume2, VolumeX,
  Sun, Moon, RefreshCw, Trash2, Copy, AlertTriangle
} from 'lucide-react';
import { useGetData } from '../../context/userContext';
import '../../styles/teacher/TeacherMessages.css';

const TeacherMessages = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useGetData();
  const { classes } = useTeacher();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());
  const isMounted = useRef(true);
  const messageLoadAttempts = useRef(0);

  // Load chats on mount
  useEffect(() => {
    isMounted.current = true;
    fetchChats();
    loadPreferences();
    
    // Connect to socket
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }
    
    setupSocketListeners();
    
    return () => {
      isMounted.current = false;
      cleanupSocketListeners();
      leaveAllChatRooms();
    };
  }, []);

  // Handle active chat from URL param
  useEffect(() => {
    if (chatId && chats.length > 0 && !activeChat) {
      const chat = chats.find(c => c.id === chatId || c._id === chatId);
      if (chat) {
        handleChatSelect(chat);
      }
    }
  }, [chatId, chats]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add this useEffect after your other useEffects
useEffect(() => {
  if (!contextMenu.visible) return;

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      message: null
    });
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeContextMenu();
    }
  };

  // Close on click anywhere else
  window.addEventListener('click', closeContextMenu);

  // Close on scroll (important for chat window)
  window.addEventListener('scroll', closeContextMenu, true);

  // Close on resize
  window.addEventListener('resize', closeContextMenu);

  // Close on Escape key
  window.addEventListener('keydown', handleEscape);

  return () => {
    window.removeEventListener('click', closeContextMenu);
    window.removeEventListener('scroll', closeContextMenu, true);
    window.removeEventListener('resize', closeContextMenu);
    window.removeEventListener('keydown', handleEscape);
  };
}, [contextMenu.visible]);

  const loadPreferences = () => {
    const savedSound = localStorage.getItem('chat_sound_enabled');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    
    const savedDarkMode = localStorage.getItem('chat_dark_mode');
    if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
    if (savedDarkMode === 'true') {
      document.body.classList.add('chat-dark-mode');
    }
  };

  const setupSocketListeners = () => {
    if (!socketService) return;
    
    // ✅ Listen for socket connection
    socketService.on('connect', () => {
      console.log('✅ Socket connected in TeacherMessages');
      setSocketConnected(true);
      
      // Rejoin active chat room if exists
      if (activeChat) {
        const chatIdentifier = activeChat.id || activeChat._id;
        if (chatIdentifier && !joinedRoomsRef.current.has(chatIdentifier)) {
          socketService.joinChatRoom(chatIdentifier);
          joinedRoomsRef.current.add(chatIdentifier);
        }
      }
    });
    
    // ✅ Listen for new messages (UI update only)
    socketService.on('message:new', (data) => {
      console.log('📨 New message received (UI update):', data);
      handleNewMessage(data);
    });
    
    // ✅ Listen for typing indicators
    socketService.on('user:typing', handleUserTyping);
    
    // ✅ Listen for read receipts
    socketService.on('message:read-receipt', handleMessageReadReceipt);
    
    // ✅ Listen for status changes
    socketService.on('user:status-change', handleUserStatusChange);
    
    // ✅ Listen for new chats
    socketService.on('new-chat', handleNewChat);
    
    // ✅ Listen for deleted messages
    socketService.on('message:deleted-for-everyone', handleMessageDeletedForEveryone);
    socketService.on('message:deleted-for-me', handleMessageDeletedForMe);
    
    console.log('📡 Socket listeners setup complete');
  };

  const cleanupSocketListeners = () => {
    if (!socketService) return;
    
    socketService.off('connect', () => {});
    socketService.off('message:new', handleNewMessage);
    socketService.off('user:typing', handleUserTyping);
    socketService.off('message:read-receipt', handleMessageReadReceipt);
    socketService.off('user:status-change', handleUserStatusChange);
    socketService.off('new-chat', handleNewChat);
    socketService.off('message:deleted-for-everyone', handleMessageDeletedForEveryone);
    socketService.off('message:deleted-for-me', handleMessageDeletedForMe);
  };

  // ✅ FIXED: Handle new message - immediately update UI
  const handleNewMessage = useCallback((data) => {
    const messageChatId = data.chatId || data.message?.chatId;
    const message = data.message || data;
    
    if (!messageChatId) return;
    
    console.log(`📨 Processing message for chat: ${messageChatId}`);
    
    // Update messages if this is the active chat
    if (activeChat && (activeChat.id === messageChatId || activeChat._id === messageChatId)) {
      console.log('✅ Message belongs to active chat, updating messages');
      
      const newMessageObj = {
        id: message.id || message._id || Date.now(),
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        timestamp: message.createdAt || message.timestamp || new Date(),
        isRead: false,
        isPending: false
      };
      
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(m => m.id === newMessageObj.id);
        if (exists) return prev;
        return [...prev, newMessageObj];
      });
      
      // Mark as read immediately
      markChatAsRead(messageChatId);
    }
    
    // Update chat list
    setChats(prev => prev.map(chat => {
      const chatIdMatch = (chat.id === messageChatId || chat._id === messageChatId);
      if (chatIdMatch) {
        const isCurrentChat = activeChat && (activeChat.id === messageChatId || activeChat._id === messageChatId);
        return {
          ...chat,
          lastMessage: {
            text: message.text,
            timestamp: message.createdAt || new Date(),
            senderId: message.senderId
          },
          unreadCount: isCurrentChat ? 0 : (chat.unreadCount || 0) + 1
        };
      }
      return chat;
    }));
    
    // Play sound if not active chat
    if (soundEnabled && (!activeChat || (activeChat.id !== messageChatId && activeChat._id !== messageChatId))) {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  }, [activeChat, soundEnabled]);

  const handleMessageDeletedForEveryone = (data) => {
    if (activeChat && (activeChat.id === data.chatId || activeChat._id === data.chatId)) {
      setMessages(prev => prev.map(msg => 
        (msg.id === data.messageId || msg._id === data.messageId)
          ? { ...msg, isDeleted: true, text: 'This message was deleted' }
          : msg
      ));
    }
  };

  const handleMessageDeletedForMe = (data) => {
    if (activeChat && (activeChat.id === data.chatId || activeChat._id === data.chatId)) {
      setMessages(prev => prev.filter(msg => 
        (msg.id !== data.messageId && msg._id !== data.messageId)
      ));
    }
  };

  const handleUserTyping = ({ chatId, userId, userName, isTyping }) => {
    const isActiveChat = activeChat && (activeChat.id === chatId || activeChat._id === chatId);
    if (isActiveChat && userId !== user?.id && userId !== user?._id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userName || 'Student');
        } else {
          newSet.delete(userName || 'Student');
        }
        return newSet;
      });
    }
  };

  const handleMessageReadReceipt = ({ messageId, chatId, readBy }) => {
    const isActiveChat = activeChat && (activeChat.id === chatId || activeChat._id === chatId);
    if (isActiveChat) {
      setMessages(prev => prev.map(msg => 
        (msg.id === messageId || msg._id === messageId) ? { ...msg, isRead: true } : msg
      ));
    }
  };

  const handleUserStatusChange = ({ userId, isOnline }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (isOnline) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleNewChat = ({ chat }) => {
    console.log('💬 New chat created:', chat);
    const formattedChat = {
      ...chat,
      id: chat.id || chat._id,
      participant: chat.otherParticipant || chat.participant
    };
    setChats(prev => [formattedChat, ...prev]);
  };

  const joinChatRoom = (chatIdentifier) => {
    if (!chatIdentifier || !socketService || !socketConnected) return;
    if (joinedRoomsRef.current.has(chatIdentifier)) return;
    
    socketService.joinChatRoom(chatIdentifier);
    joinedRoomsRef.current.add(chatIdentifier);
    console.log(`💬 Joined chat room: ${chatIdentifier}`);
  };

  const leaveAllChatRooms = () => {
    joinedRoomsRef.current.forEach(chatId => {
      if (socketService) {
        socketService.leaveChatRoom(chatId);
      }
    });
    joinedRoomsRef.current.clear();
  };

  const fetchChats = async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    try {
      const response = await getTeacherChats();
      console.log('📋 Teacher chats response:', response);
      
      if (response.success && response.chats) {
        const formattedChats = response.chats.map(chat => ({
          ...chat,
          id: chat.id || chat._id,
          participant: chat.participant || chat.otherParticipant
        }));
        setChats(formattedChats);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching teacher chats:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const refreshChats = () => {
    setRefreshing(true);
    fetchChats();
  };

  const handleChatSelect = async (chat) => {
    const chatIdentifier = chat.id || chat._id;
    if (!chatIdentifier) return;
    
    console.log(`🖱️ Selecting chat: ${chatIdentifier}`);
    
    // Clear previous state
    setMessages([]);
    setActiveChat(chat);
    
    // Join room
    joinChatRoom(chatIdentifier);
    
    // Load messages
    await loadMessages(chatIdentifier);
    
    // Mark as read
    await markChatAsRead(chatIdentifier);
    
    // Update URL
    navigate(`/teacher/dashboard/messages/${chatIdentifier}`, { replace: true });
  };

  const loadMessages = async (chatId) => {
    if (!chatId) return;
    
    setLoadingMessages(true);
    messageLoadAttempts.current++;
    const currentAttempt = messageLoadAttempts.current;
    
    console.log(`🔄 Loading messages for chat: ${chatId} (Attempt: ${currentAttempt})`);
    
    try {
      const API_BASE = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app/';
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      // Try multiple endpoints
      let messagesArray = [];
      
      // Endpoint 1: Direct messages endpoint
      try {
        const response = await fetch(`${API_BASE}/api/chat/${chatId}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.messages) {
          messagesArray = data.messages;
        } else if (data.success && data.data) {
          messagesArray = data.data;
        }
      } catch (err) {
        console.log('Endpoint 1 failed:', err);
      }
      
      // Endpoint 2: Teacher specific endpoint
      if (messagesArray.length === 0) {
        try {
          const response = await fetch(`${API_BASE}/api/chat/teacher/chats/${chatId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success && data.messages) {
            messagesArray = data.messages;
          } else if (data.success && data.data) {
            messagesArray = data.data;
          }
        } catch (err) {
          console.log('Endpoint 2 failed:', err);
        }
      }
      
      // Format messages
      const formattedMessages = messagesArray.map(msg => ({
        id: msg.id || msg._id,
        text: msg.text || msg.message || '',
        senderId: msg.senderId,
        senderName: msg.senderName || (msg.senderId === 'teacher' ? 'Teacher' : 'Student'),
        timestamp: msg.createdAt || msg.timestamp || new Date(),
        isRead: msg.isRead || msg.read || false,
        isDeleted: msg.isDeleted || false
      }));
      
      if (isMounted.current && currentAttempt === messageLoadAttempts.current) {
        setMessages(formattedMessages);
        console.log(`✅ Loaded ${formattedMessages.length} messages`);
        scrollToBottom();
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (isMounted.current && currentAttempt === messageLoadAttempts.current) {
        setLoadingMessages(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    
    const tempId = `temp_${Date.now()}`;
    const teacherId = user?.id || user?._id;
    const teacherName = user?.name || user?.username || 'Teacher';
    const chatIdentifier = activeChat.id || activeChat._id;
    
    // Optimistic update
    const tempMessage = {
      id: tempId,
      text: messageText,
      senderId: teacherId,
      senderName: teacherName,
      timestamp: new Date(),
      isRead: false,
      isPending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();
    
    try {
      const recipientId = activeChat.type === 'direct' 
        ? (activeChat.participant?.id || activeChat.participant?._id)
        : null;
      
      const response = await sendTeacherMessage({
        chatId: chatIdentifier,
        text: messageText,
        recipientId: recipientId
      });
      
      if (response.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...response.message, id: response.message.id, isPending: false }
            : msg
        ));
      } else {
        toast.error(response.message || 'Failed to send message');
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      await markTeacherChatRead(chatId);
      setChats(prev => prev.map(chat => 
        (chat.id === chatId || chat._id === chatId) ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (error) {
      console.error('Error marking chat read:', error);
    }
  };

  const handleTyping = () => {
    if (!activeChat) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socketService?.sendTyping(activeChat.id || activeChat._id, activeChat.participant?.id, true);
    
    typingTimeoutRef.current = setTimeout(() => {
      socketService?.sendTyping(activeChat.id || activeChat._id, activeChat.participant?.id, false);
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCopyMessage = () => {
    if (contextMenu.message) {
      navigator.clipboard.writeText(contextMenu.message.text);
      toast.success('Message copied to clipboard');
      setContextMenu({ visible: false, x: 0, y: 0, message: null });
    }
  };

  const openDeleteModal = (message, forEveryone = false) => {
    setSelectedMessage(message);
    setDeleteForEveryone(forEveryone);
    setShowDeleteModal(true);
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || isDeleting) return;
    
    setIsDeleting(true);
    const toastId = toast.loading('Deleting message...');
    
    try {
      const response = await deleteTeacherMessage(selectedMessage.id, deleteForEveryone);
      
      if (response.success) {
        if (deleteForEveryone) {
          setMessages(prev => prev.map(msg => 
            msg.id === selectedMessage.id
              ? { ...msg, isDeleted: true, text: 'This message was deleted' }
              : msg
          ));
          toast.success('Message deleted for everyone', { id: toastId });
        } else {
          setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
          toast.success('Message deleted', { id: toastId });
        }
      } else {
        toast.error(response.message || 'Failed to delete message', { id: toastId });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete message', { id: toastId });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedMessage(null);
      setDeleteForEveryone(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedMessage(null);
    setDeleteForEveryone(false);
    setIsDeleting(false);
  };

  // const handleContextMenu = (e, message) => {
  //   e.preventDefault();
  //   if (message.isDeleted || message.isPending) return;
    
  //   setContextMenu({
  //     visible: true,
  //     x: e.clientX,
  //     y: e.clientY,
  //     message
  //   });
  // };


  // Replace your existing handleContextMenu function with this
const handleContextMenu = (e, message) => {
  e.preventDefault();
  e.stopPropagation();

  // Don't show menu for deleted or pending messages
  if (message.isDeleted || message.isPending) return;

  const MENU_WIDTH = 220;
  const MENU_HEIGHT = 140;
  const PADDING = 10;

  let x = e.clientX;
  let y = e.clientY;

  // Prevent overflow on right side
  if (x + MENU_WIDTH > window.innerWidth - PADDING) {
    x = window.innerWidth - MENU_WIDTH - PADDING;
  }

  // Prevent overflow on left side
  if (x < PADDING) {
    x = PADDING;
  }

  // Prevent overflow on bottom side
  if (y + MENU_HEIGHT > window.innerHeight - PADDING) {
    y = window.innerHeight - MENU_HEIGHT - PADDING;
  }

  // Prevent overflow on top side
  if (y < PADDING) {
    y = PADDING;
  }

  setContextMenu({
    visible: true,
    x,
    y,
    message
  });
};



  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const diffHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const last = new Date(lastSeen);
    const diffMinutes = Math.floor((now - last) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };

  const filteredChats = chats.filter(chat => {
    const participantName = chat.participant?.name || chat.name;
    return participantName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    localStorage.setItem('chat_sound_enabled', !soundEnabled);
    toast.info(`Sound ${!soundEnabled ? 'enabled' : 'disabled'}`);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('chat_dark_mode', !darkMode);
    document.body.classList.toggle('chat-dark-mode', !darkMode);
  };

  if (loading) return <LoadingSpinner text="Loading messages..." />;

  return (
    <div className={`teacher-messages-container ${darkMode ? 'dark' : ''}`}>
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2><MessageSquare size={18} /> Messages</h2>
          <div className="sidebar-actions">
            <button onClick={refreshChats} className="icon-btn" disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            </button>
            <button onClick={toggleSound} className="icon-btn">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={toggleDarkMode} className="icon-btn">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className="search-bar">
          <Search size={16} />
          <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="chat-list">
          {filteredChats.length === 0 ? (
            <EmptyState icon="💬" title="No Messages" message="Your conversations will appear here" />
          ) : (
            filteredChats.map((chat) => {
              const chatIdentifier = chat.id || chat._id;
              const isActive = activeChat && (activeChat.id === chatIdentifier || activeChat._id === chatIdentifier);
              const participantName = chat.participant?.name || chat.name;
              const participantId = chat.participant?.id || chat.participant?._id;
              const isOnline = onlineUsers.has(participantId);
              
              return (
                <div key={chatIdentifier} className={`chat-item ${isActive ? 'active' : ''}`} onClick={() => handleChatSelect(chat)}>
                  <div className="chat-avatar">
                    <div className="user-avatar">
                      {participantName?.charAt(0)?.toUpperCase() || 'S'}
                      {isOnline && <span className="online-indicator"></span>}
                    </div>
                  </div>
                  <div className="chat-info">
                    <div className="chat-name-teacher">{participantName || 'Unknown User'}</div>
                    <div className="chat-last-message">
                      {chat.lastMessage?.text?.substring(0, 30) || 'No messages yet'}
                    </div>
                  </div>
                  <div className="chat-meta">
                    <span className="chat-time">{chat.lastMessage?.timestamp && formatTime(chat.lastMessage.timestamp)}</span>
                    {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar large">
                  <div className="user-avatar">
                    {(activeChat.participant?.name || activeChat.name)?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                </div>
                <div className="header-details">
                  <h3>{activeChat.participant?.name || activeChat.name || 'Student'}</h3>
                  <p className="status">
                    {onlineUsers.has(activeChat.participant?.id || activeChat.participant?._id) ? (
                      <span className="online">Online</span>
                    ) : (
                      <span className="offline">Last seen {formatLastSeen(activeChat.participant?.lastSeen)}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="chat-actions">
                <button className="icon-btn" onClick={() => loadMessages(activeChat.id || activeChat._id)}>
                  <RefreshCw size={18} className={loadingMessages ? 'spin' : ''} />
                </button>
              </div>
            </div>

            <div className="messages-area" onContextMenu={(e) => e.preventDefault()}>
              {loadingMessages ? (
                <div className="loading-container"><LoadingSpinner text="Loading messages..." /></div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <MessageSquare size={48} />
                  <h3>No messages yet</h3>
                  <p>Start a conversation with {activeChat.participant?.name || 'this student'}</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isTeacher = message.senderId === (user?.id || user?._id) || message.senderName === 'Teacher';
                  
                  if (message.isDeleted) {
                    return (
                      <div key={message.id} className={`message deleted ${isTeacher ? 'sent' : 'received'}`}>
                        <div className="message-bubble deleted-bubble">
                          <p><AlertTriangle size={12} /> {message.text}</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={message.id} className={`message ${isTeacher ? 'sent' : 'received'}`} onContextMenu={(e) => handleContextMenu(e, message)}>
                      {!isTeacher && <div className="message-avatar">{activeChat.participant?.name?.charAt(0)?.toUpperCase() || 'S'}</div>}
                      <div className="message-bubble">
                        <p>{message.text}</p>
                        <div className="message-meta">
                          <span className="time">{formatTime(message.timestamp)}</span>
                          {isTeacher && (
                            <span className="status-icon">
                              {message.isRead ? <CheckCheck size={12} /> : message.isPending ? <span className="pending">...</span> : <Check size={12} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {typingUsers.size > 0 && !loadingMessages && (
                <div className="typing-indicator">
                  <div className="typing-dots"><span></span><span></span><span></span></div>
                  <span>{Array.from(typingUsers).join(', ')} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="message-input"
              />
              <button className="send-btn" onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <MessageSquare size={64} />
            <h3>Select a conversation</h3>
            <p>Choose a chat from the sidebar to start messaging</p>
          </div>
        )}
      </div>

      {/* Context Menu
      {contextMenu.visible && contextMenu.message && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={handleCopyMessage} className="context-menu-item"><Copy size={14} /> Copy</button>
          <button onClick={() => openDeleteModal(contextMenu.message, false)} className="context-menu-item delete"><Trash2 size={14} /> Delete for me</button>
          <button onClick={() => openDeleteModal(contextMenu.message, true)} className="context-menu-item delete-warning"><Trash2 size={14} /> Delete for everyone</button>
        </div>
      )} */}

      {/* Replace your existing Context Menu JSX with this */}
{/* {contextMenu.visible && contextMenu.message && (
  <div
    className="context-menu"
    style={{
      position: 'fixed',
      top: `${contextMenu.y}px`,
      left: `${contextMenu.x}px`,
      zIndex: 99999
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      onClick={handleCopyMessage}
      className="context-menu-item"
    >
      <Copy size={14} />
      <span>Copy Message</span>
    </button>

    <div className="menu-divider"></div>

    <button
      onClick={() => openDeleteModal(contextMenu.message, false)}
      className="context-menu-item delete"
    >
      <Trash2 size={14} />
      <span>Delete for Me</span>
    </button>

    <button
      onClick={() => openDeleteModal(contextMenu.message, true)}
      className="context-menu-item delete-warning"
    >

      <Trash2 size={14} />
      <span>Delete for Everyone</span>
    </button>
  </div>
)} */}

{/* ✅ Context Menu */}
{contextMenu.visible && contextMenu.message && (
  <div
    className="context-menu"
    style={{
      position: 'fixed',
      top: `${contextMenu.y}px`,
      left: `${contextMenu.x}px`,
      zIndex: 99999
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Always visible: Copy */}
    <button
      onClick={handleCopyMessage}
      className="context-menu-item"
    >
      <Copy size={14} />
      <span>Copy Message</span>
    </button>

    <div className="menu-divider"></div>

    {/* Always visible: Delete for Me (Removes from your view only) */}
    <button
      onClick={() => openDeleteModal(contextMenu.message, false)}
      className="context-menu-item delete"
    >
      <Trash2 size={14} />
      <span>Delete for Me</span>
    </button>

    {/* ONLY visible for your own messages: Delete for Everyone */}
    {(contextMenu.message.senderId === (user?.id || user?._id)) && (
      <button
        onClick={() => openDeleteModal(contextMenu.message, true)}
        className="context-menu-item delete-warning"
      >
        <Trash2 size={14} />
        <span>Delete for Everyone</span>
      </button>
    )}
  </div>
)}


      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon warning"><AlertTriangle size={24} /></div>
              <h3>Delete Message</h3>
              <button className="close-btn" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this message?</p>
              {deleteForEveryone && (
                <div className="warning-box"><AlertTriangle size={16} /><span>This will delete the message for <strong>everyone</strong> in the chat.</span></div>
              )}
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelDelete} disabled={isDeleting}>Cancel</button>
              <button className={`btn-delete ${deleteForEveryone ? 'delete-for-everyone' : ''}`} onClick={handleDeleteMessage} disabled={isDeleting}>
                {isDeleting ? <>Deleting...</> : <><Trash2 size={16} /> {deleteForEveryone ? 'Delete for Everyone' : 'Delete for Me'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMessages;