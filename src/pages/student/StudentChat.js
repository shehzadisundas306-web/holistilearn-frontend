import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetData } from '../../context/userContext';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
    Send, ArrowLeft, MessageSquare, MoreVertical, Phone, Video, 
    Trash2, Copy, AlertTriangle, X, Check, CheckCheck 
} from 'lucide-react';
import socketService from '../../services/socketService';
import { 
    getChatById, 
    getChatMessages, 
    sendMessage, 
    markMessagesAsRead,
    deleteMessage 
} from '../../api/studentApi';
import '../../styles/StudentChat.css';

const StudentChat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useGetData();
    
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [recipientName, setRecipientName] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [recipientAvatar, setRecipientAvatar] = useState('');
    const [isTeacher, setIsTeacher] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState(false);
    
    // ✅ Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [deleteForEveryone, setDeleteForEveryone] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // ✅ Context menu state
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
    
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const hasJoinedRoom = useRef(false);

    // Get recipient from navigation state if available
    useEffect(() => {
        if (location.state?.recipientName) {
            setRecipientName(location.state.recipientName);
            setRecipientId(location.state.recipientId);
            setIsTeacher(location.state.isTeacher || false);
        }
    }, [location.state]);

    // Fetch chat details and messages
    useEffect(() => {
        if (chatId) {
            fetchChatData();
        } else {
            if (!location.state?.recipientId) {
                toast.error('Invalid chat session');
                navigate('/student/classes');
            }
            setLoading(false);
        }
    }, [chatId]);

    // Setup socket after data is loaded
    useEffect(() => {
        if (chatId && recipientId && !loading) {
            setupSocketListeners();
            joinChatRoom();
        }
        
        return () => {
            cleanupSocketListeners();
            leaveChatRoom();
        };
    }, [chatId, recipientId, loading]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ Handle click outside to close context menu
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu({ visible: false, x: 0, y: 0, message: null });
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchChatData = async () => {
        try {
            setLoading(true);
            
            const chatResponse = await getChatById(chatId);
            console.log('Chat details:', chatResponse);
            
            if (chatResponse.success && chatResponse.data) {
                const chat = chatResponse.data;
                const otherParticipant = chat.participants?.find(p => p._id !== user?.id && p._id !== user?._id);
                if (otherParticipant) {
                    setRecipientName(otherParticipant.name || otherParticipant.username || 'User');
                    setRecipientId(otherParticipant._id);
                    setRecipientAvatar(otherParticipant.avatar);
                    setIsTeacher(otherParticipant.role === 'teacher');
                    setOnlineStatus(otherParticipant.isOnline || false);
                }
            }
            
            const messagesResponse = await getChatMessages(chatId);
            console.log('Messages:', messagesResponse);
            
            if (messagesResponse.success) {
                const currentUserId = user?.id || user?._id;
                // Filter out messages deleted for current user
                const filteredMessages = (messagesResponse.messages || []).filter(msg => 
                    !msg.deletedFor?.includes(currentUserId)
                );
                setMessages(filteredMessages);
            }
        } catch (error) {
            console.error('Error fetching chat data:', error);
            toast.error('Failed to load chat');
        } finally {
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        if (!socketService.getConnectionStatus()) {
            socketService.connect();
        }
        
        // Listen for new messages
        socketService.on('new-message', (data) => {
            const currentUserId = user?.id || user?._id;
            const isOwnMessage = data.userId === currentUserId || 
                                data.message?.senderId === currentUserId;
            
            if (isOwnMessage) return;
            
            if (data.chatId === chatId && data.message) {
                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === data.message.id);
                    if (exists) return prev;
                    return [...prev, { ...data.message, isRead: false }];
                });
            }
        });
        
        // ✅ Listen for message deleted for everyone
        socketService.on('message:deleted-for-everyone', (data) => {
            if (data.chatId === chatId) {
                setMessages(prev => prev.map(msg => 
                    msg.id === data.messageId 
                        ? { ...msg, isDeleted: true, text: 'This message was deleted' }
                        : msg
                ));
            }
        });
        
        // ✅ Listen for message deleted for me
        socketService.on('message:deleted-for-me', (data) => {
            if (data.chatId === chatId) {
                setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
            }
        });
        
        // Listen for typing indicators
        socketService.on('user:typing', (data) => {
            const currentUserId = user?.id || user?._id;
            if (data.chatId === chatId && data.userId !== currentUserId) {
                setIsTyping(data.isTyping);
                if (data.isTyping) {
                    setTimeout(() => setIsTyping(false), 3000);
                }
            }
        });
        
        // Listen for read receipts
        socketService.on('message:read-receipt', (data) => {
            if (data.chatId === chatId) {
                setMessages(prev => prev.map(msg => 
                    msg.id === data.messageId ? { ...msg, isRead: true } : msg
                ));
            }
        });
        
        // Listen for online status changes
        socketService.on('user:status-change', (data) => {
            if (data.userId === recipientId) {
                setOnlineStatus(data.isOnline);
            }
        });
    };

    const cleanupSocketListeners = () => {
        socketService.off('new-message');
        socketService.off('message:deleted-for-everyone');
        socketService.off('message:deleted-for-me');
        socketService.off('user:typing');
        socketService.off('message:read-receipt');
        socketService.off('user:status-change');
    };

    const joinChatRoom = () => {
        if (chatId && !hasJoinedRoom.current) {
            socketService.joinChatRoom(chatId);
            hasJoinedRoom.current = true;
            console.log('Joined chat room:', chatId);
        }
    };

    const leaveChatRoom = () => {
        if (chatId && hasJoinedRoom.current) {
            socketService.leaveChatRoom(chatId);
            hasJoinedRoom.current = false;
            console.log('Left chat room:', chatId);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;
        
        const messageText = newMessage.trim();
        const tempId = `temp_${Date.now()}`;
        
        setNewMessage('');
        setSending(true);
        
        const tempMessage = {
            id: tempId,
            text: messageText,
            senderId: user?.id || user?._id,
            senderName: 'You',
            createdAt: new Date().toISOString(),
            isRead: false,
            isPending: true
        };
        setMessages(prev => [...prev, tempMessage]);
        
        try {
            const response = await sendMessage({
                chatId: chatId,
                text: messageText,
                recipientId: recipientId
            });
            
            if (response.success) {
                setMessages(prev => prev.map(msg => 
                    msg.id === tempId 
                        ? { ...response.message, isPending: false }
                        : msg
                ));
            } else {
                toast.error(response.message || 'Failed to send message');
                setMessages(prev => prev.filter(msg => msg.id !== tempId));
            }
        } catch (error) {
            console.error('Send message error:', error);
            toast.error('Failed to send message');
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
        } finally {
            setSending(false);
        }
    };

    // ✅ Handle copy message
    const handleCopyMessage = () => {
        if (contextMenu.message) {
            navigator.clipboard.writeText(contextMenu.message.text);
            toast.success('Message copied to clipboard');
            setContextMenu({ visible: false, x: 0, y: 0, message: null });
        }
    };

    // ✅ Handle message deletion
    const handleDeleteMessage = async () => {
        if (!selectedMessage || isDeleting) return;
        
        setIsDeleting(true);
        const toastId = toast.loading('Deleting message...');
        
        try {
            const response = await deleteMessage(selectedMessage.id, deleteForEveryone);
            
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

    // ✅ Handle right-click on message
    // const handleContextMenu = (e, message) => {
    //     e.preventDefault();
    //     const isCurrentUser = message.senderId === (user?.id || user?._id);
        
    //     // Don't show context menu for deleted messages or pending messages
    //     if (message.isDeleted || message.isPending) return;
        
    //     setContextMenu({
    //         visible: true,
    //         x: e.clientX,
    //         y: e.clientY,
    //         message
    //     });
    // };

    const handleContextMenu = (e, message) => {
  e.preventDefault();

  if (message.isDeleted || message.isPending) return;

  const menuWidth = 200;
  const menuHeight = 120;

  let x = e.clientX;
  let y = e.clientY;

  // Prevent overflow RIGHT
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10;
  }

  // Prevent overflow BOTTOM
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10;
  }

  // Prevent overflow LEFT
  if (x < 10) x = 10;

  // Prevent overflow TOP
  if (y < 10) y = 10;

  setContextMenu({
    visible: true,
    x,
    y,
    message
  });
};

    // ✅ Open delete modal
    const openDeleteModal = (message, forEveryone = false) => {
        setSelectedMessage(message);
        setDeleteForEveryone(forEveryone);
        setShowDeleteModal(true);
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
    };

    const handleTyping = (isTypingNow) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        socketService.sendTyping(chatId, recipientId, isTypingNow);
        
        if (isTypingNow) {
            typingTimeoutRef.current = setTimeout(() => {
                socketService.sendTyping(chatId, recipientId, false);
            }, 2000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="student-chat-container">
                <div className="chat-header">
                    <button className="back-btn" onClick={() => navigate('/student/classes')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="chat-info">
                        <h3>Loading...</h3>
                    </div>
                </div>
                <LoadingSpinner text="Loading chat..." />
            </div>
        );
    }

    return (
        <div className="student-chat-container">
            {/* Chat Header */}
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/student/classes')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="chat-info">
                    <div className="chat-avatar">
                        {recipientAvatar ? (
                            <img src={recipientAvatar} alt={recipientName} />
                        ) : (
                            <div className="avatar-placeholder">
                                {recipientName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        {onlineStatus && <span className="online-indicator"></span>}
                    </div>
                    <div className="chat-details">
                        <h3>{recipientName || 'User'}</h3>
                        <p className="chat-role">
                            {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Classmate'}
                            {onlineStatus && <span className="online-text"> • Online</span>}
                        </p>
                    </div>
                </div>
                {/* <div className="chat-actions">
                    <button className="action-btn" title="Call">
                        <Phone size={18} />
                    </button>
                    <button className="action-btn" title="Video Call">
                        <Video size={18} />
                    </button>
                    <button className="action-btn" title="More">
                        <MoreVertical size={18} />
                    </button>
                </div> */}
            </div>

            {/* Messages Area */}
            <div className="messages-area" onContextMenu={(e) => e.preventDefault()}>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <MessageSquare size={48} />
                        <h3>No messages yet</h3>
                        <p>Start a conversation with {recipientName}</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isCurrentUser = message.senderId === user?.id || 
                                             message.senderId === user?._id ||
                                             message.senderName === 'You';
                        
                        // Show deleted message differently
                        if (message.isDeleted) {
                            return (
                                <div 
                                    key={message.id || index}
                                    className={`message deleted ${isCurrentUser ? 'sent' : 'received'}`}
                                >
                                    <div className="message-bubble deleted-bubble">
                                        <p className="deleted-text">
                                            <AlertTriangle size={12} />
                                            {message.text || 'This message was deleted'}
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                        
                        return (
                            <div 
                                key={message.id || index}
                                className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                                onContextMenu={(e) => handleContextMenu(e, message)}
                            >
                                {!isCurrentUser && (
                                    <div className="message-avatar">
                                        {recipientName?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                )}
                                <div className="message-bubble">
                                    <p>{message.text}</p>
                                    <div className="message-footer">
                                        <span className="message-time">
                                            {formatTime(message.createdAt)}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="message-status">
                                                {message.isPending ? '⌛' : message.isRead ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                
                {isTyping && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>{recipientName} is typing...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* ✅ Context Menu */}
            {/* {contextMenu.visible && contextMenu.message && (
                <div 
                    className="context-menu"
                    // style={{ top: contextMenu.y }}
                >
                    <button onClick={handleCopyMessage} className="context-menu-item">
                        <Copy size={14} />
                        Copy
                    </button>
                    {(contextMenu.message.senderId === (user?.id || user?._id)) && (
                        <>
                            <button 
                                onClick={() => openDeleteModal(contextMenu.message, false)} 
                                className="context-menu-item delete"
                            >
                                <Trash2 size={14} />
                                Delete for me
                            </button>
                            <button 
                                onClick={() => openDeleteModal(contextMenu.message, true)} 
                                className="context-menu-item delete-warning"
                            >
                                <Trash2 size={14} />
                                Delete for everyone
                            </button>
                        </>
                    )}
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
    {/* 1. Copy is always available */}
    <button onClick={handleCopyMessage} className="context-menu-item">
      <Copy size={14} />
      <span>Copy Message</span>
    </button>

    <div className="menu-divider"></div>

    {/* 2. "Delete for me" should be available for ALL messages */}
    <button 
      onClick={() => openDeleteModal(contextMenu.message, false)} 
      className="context-menu-item delete"
    >
      <Trash2 size={14} />
      <span>Delete for me</span>
    </button>

    {/* 3. "Delete for everyone" only if YOU are the sender */}
    {(contextMenu.message.senderId === (user?.id || user?._id)) && (
      <button 
        onClick={() => openDeleteModal(contextMenu.message, true)} 
        className="context-menu-item delete-warning"
      >
        <Trash2 size={14} />
        <span>Delete for everyone</span>
      </button>
    )}
  </div>
)}

            {/* ✅ Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay1" onClick={() => setShowDeleteModal(false)}>
                    <div className="delete-modal1" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Message</h3>
                            <button className="close-modal" onClick={() => setShowDeleteModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete this message?</p>
                            {deleteForEveryone && (
                                <p className="warning-text">
                                    <AlertTriangle size={16} />
                                    This will delete the message for everyone in the chat. This cannot be undone.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className={`delete-btn1 ${deleteForEveryone ? 'delete-for-everyone' : ''}`}
                                onClick={handleDeleteMessage}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="message-input-area">
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping(true);
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="message-input"
                    disabled={sending}
                />
                <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default StudentChat;