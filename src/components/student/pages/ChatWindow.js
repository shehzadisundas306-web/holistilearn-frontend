import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane, FaSmile, FaUserCircle, FaArrowLeft } from 'react-icons/fa';
import chatService from '../../../services/firebaseChatService';

const ChatWindow = ({ chat, onBack, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const unsubscribeMessages = useRef(null);
  const unsubscribeTyping = useRef(null);

  const otherParticipant = chat?.participants?.find(p => p._id !== currentUser?._id);

  useEffect(() => {
  if (currentUser) {
    chatService.setCurrentUser(currentUser);
  }
}, [currentUser]);
  useEffect(() => {
    if (chat && currentUser) {
      initChat();
    }

    
    
    return () => {
      if (unsubscribeMessages.current) unsubscribeMessages.current();
      if (unsubscribeTyping.current) unsubscribeTyping.current();
    };
  }, [chat, currentUser]);

 // In initChat function, modify the verification part
const initChat = async () => {
  setLoading(true);
  setMessages([]);
  
  try {
    // Verify access
    const verification = await chatService.verifyAccess(chat.firebaseChatId);
    console.log('Verification result:', verification);
    
    if (!verification.allowed) {
  console.error('Access denied to chat');
  setAccessDenied(true);
  setLoading(false);
  return;
}
    
    // Mark all messages as read
    await chatService.markAllAsRead(chat.firebaseChatId);
    
    // Listen to messages
    unsubscribeMessages.current = chatService.listenToMessages(chat.firebaseChatId, (newMessages) => {
      setMessages(prev => {
        const merged = [...prev];
        newMessages.forEach(newMsg => {
          const index = merged.findIndex(m => m.id === newMsg.id);
          if (index === -1) merged.push(newMsg);
          else merged[index] = newMsg;
        });
        return merged.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || a.createdAt || 0;
          const timeB = b.createdAt?.toDate?.() || b.createdAt || 0;
          return timeA - timeB;
        });
      });
      setLoading(false);
    });
    
    // Listen to typing indicators (with error handling)
    try {
      unsubscribeTyping.current = chatService.listenToTyping(chat.firebaseChatId, setTypingUsers);
    } catch (typingError) {
      console.warn('Typing indicators not available:', typingError.message);
    }
    
  } catch (error) {
    console.error('Init chat error:', error);
    setLoading(false);
  }
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (accessDenied) {
  alert("You are not allowed to send messages in this chat");
  return;
}
    if (!input.trim()) return;
    
    try {
      await chatService.sendMessage(
  chat.firebaseChatId,
  input,
  otherParticipant?._id
);
      setInput('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    }
  };

  const handleTyping = useCallback(async (isTyping) => {
    if (chat && currentUser) {
      await chatService.sendTyping(chat.firebaseChatId, isTyping);
    }
  }, [chat, currentUser]);

  const typingTimeout = useRef(null);
  const handleInputChange = (e) => {
    setInput(e.target.value);
    handleTyping(true);
    
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => handleTyping(false), 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!chat) {
    return (
      <div className="chat-window-empty">
        <FaUserCircle className="empty-icon" />
        <h3>Select a chat to start messaging</h3>
      </div>
    );
  }

  const isTyping = typingUsers.length > 0;
  const typingText = isTyping 
    ? `${typingUsers.map(u => u.userName).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...` 
    : '';

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft />
        </button>
        <div className="chat-user-info">
          {otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt={otherParticipant.name} />
          ) : (
            <FaUserCircle />
          )}
          <div>
            <h3>{otherParticipant?.name || 'Unknown'}</h3>
            <p className="typing-status">{typingText || (otherParticipant?.isOnline ? 'Online' : 'Offline')}</p>
          </div>
        </div>
      </div>

      <div className="chat-messages-area">
        {loading ? (
          <div className="messages-loading">
            <div className="small-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>💬 No messages yet</p>
            <p className="no-messages-subtitle">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === (currentUser?._id || currentUser?.id);
            return (
              <div key={msg.id} className={`message ${isOwn ? 'own' : 'other'}`}>
                {!isOwn && (
                  <div className="message-avatar">
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt={msg.senderName} />
                    ) : (
                      <FaUserCircle />
                    )}
                  </div>
                )}
                <div className="message-bubble">
                  {!isOwn && <div className="message-sender">{msg.senderName}</div>}
                  <p>{msg.text}</p>
                  <div className="message-time">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="chat-input"
        />
        <button 
          className="send-button" 
          onClick={handleSend} 
          disabled={!input.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;