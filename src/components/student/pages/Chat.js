import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import chatService from '../../../services/firebaseChatService';
import ChatWindow from './ChatWindow';
import UsersList from './TeacherList';
import '../../../styles/Chat.css';

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    // Get token
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    console.log('🔍 Checking authentication...');
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('No token, redirecting to login');
      navigate('/login');
      return;
    }

    // Get user from localStorage
    let user = null;
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      try {
        user = JSON.parse(userStr);
        console.log('User found in localStorage:', user.username || user.name);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    if (user && (user._id || user.id)) {
      // Use user from localStorage
      const formattedUser = {
        _id: user._id || user.id,
        id: user._id || user.id,
        name: user.username || user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      };
      setCurrentUser(formattedUser);
      chatService.setCurrentUser(formattedUser);
      await loadChats();
    } else {
      // Fetch user from API
      await fetchUserFromAPI(token);
    }
    
    setLoading(false);
  };

  const fetchUserFromAPI = async (token) => {
    try {
      const response = await fetch('https://holistilearn-backend.vercel.app/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const user = data.user;
          const formattedUser = {
            _id: user._id || user.id,
            id: user._id || user.id,
            name: user.username || user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role
          };
          setCurrentUser(formattedUser);
          chatService.setCurrentUser(formattedUser);
          await loadChats();
        } else {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/login');
    }
  };

  const loadChats = async () => {
    try {
      const userChats = await chatService.getChats();
      console.log('Chats loaded:', userChats.length);
      setChats(userChats);
      
      // Check for active chat from navigation state
      if (location.state?.activeChat) {
        setActiveChat(location.state.activeChat);
      }
    } catch (error) {
      console.error('Load chats error:', error);
    }
  };

  const handleStartChat = (newChat) => {
    setActiveChat(newChat);
    loadChats();
  };

  const getOtherParticipant = (chat) => {
    if (!currentUser) return null;
    return chat.participants?.find(p => p._id !== currentUser._id);
  };

  if (loading) {
    return (
      <div className="chat-loading-container">
        <div className="chat-loading-spinner"></div>
        <p>Loading your messages...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="chat-error-container">
        <p>Please login to access chats</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  const getLastMessageText = (msg) => {
    if (!msg) return '✨ Start a conversation';

    if (typeof msg === 'string') {
      return msg.substring(0, 35);
    }

    if (typeof msg === 'object') {
      return msg.text
        ? msg.text.substring(0, 35)
        : '✨ Start a conversation';
    }

    return '✨ Start a conversation';
  };

  return (
    <div className="chat-page-container">
      {/* Sidebar - Chat List */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => navigate('/student/teachers')}
          >
            + New Chat
          </button>
        </div>
        
        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="no-chats">
              <p>📭 No conversations yet</p>
              <p className="no-chats-subtitle">Click "New Chat" to start messaging</p>
            </div>
          ) : (
            chats.map(chat => {
              const other = getOtherParticipant(chat);
              return (
                <div
                  key={chat._id}
                  className={`chat-list-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => setActiveChat(chat)}
                >
                  <div className="chat-avatar">
                    {other?.avatar ? (
                      <img src={other.avatar} alt={other.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {other?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="chat-info">
                    <h4>{other?.name || 'Unknown User'}</h4>
                    <p className="last-message">
                      {getLastMessageText(chat.lastMessage)}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">{chat.unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onBack={() => setActiveChat(null)}
            currentUser={currentUser}
          />
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>No conversation selected</h3>
            <p>Click "New Chat" to find and message teachers</p>
          </div>
        )}
      </div>

      {/* Right Panel - Teachers List (Only visible if you want to keep it) */}
      <div className="chat-teachers-panel">
        <UsersList onStartChat={handleStartChat} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default ChatPage;