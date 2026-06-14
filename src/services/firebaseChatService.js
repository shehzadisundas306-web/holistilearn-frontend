import { 
  collection, doc, addDoc, updateDoc,setDoc, onSnapshot, query, 
  orderBy, limit, serverTimestamp, getDocs, where, arrayUnion 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app';

class ChatService {
  constructor() {
    this.currentUser = null;
    this.unsubscribeFunctions = new Map();
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  getToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  }

  // Get all chats for current user
  async getChats() {
    try {
      const response = await axios.get(`${API_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Get chats error:', error);
      return [];
    }
  }

  // Create or get chat with a user
  async getOrCreateChat(userId) {
    try {
      const response = await axios.post(
        `${API_URL}/chat/rooms/user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${this.getToken()}` } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Create chat error:', error);
      throw error;
    }
  }

  // Verify access to Firebase chat
  async verifyAccess(firebaseChatId) {
    try {
      const response = await axios.get(`${API_URL}/chat/verify/${firebaseChatId}`, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
      return response.data.data;
    } catch (error) {
      return { allowed: false };
    }
  }

  // In frontend/src/services/firebaseChatService.js
// Replace the entire sendMessage function with this:

// Send message
async sendMessage(firebaseChatId, text, otherUserId) {
  let user = this.currentUser;

if (!user) {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user = JSON.parse(storedUser);
    this.currentUser = user; // restore session
  }
}

if (!user) {
  throw new Error('Not authenticated');
}

  const messagesRef = collection(db, 'chats', firebaseChatId, 'messages');
  const userId = user._id || user.id;
  
  const message = {
    senderId: userId,
    senderName: user.name || user.username,
senderAvatar: user.avatar || null,
    text: text.trim(),
    createdAt: serverTimestamp(),
    readBy: [userId],
    status: 'sent'
  };

  // Add the message to messages subcollection
  const docRef = await addDoc(messagesRef, message);
  
  // ✅ FIX: Create or update the chat parent document
  const chatRef = doc(db, 'chats', firebaseChatId);
  
  try {
    // Try to update existing document
    await updateDoc(chatRef, {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
      lastSenderId: userId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      console.log('Creating chat document in Firestore...');
      const chatData = {
  participants: [userId, otherUserId],
  type: 'private',
  createdAt: serverTimestamp(),
  createdBy: userId,
  lastMessage: text.trim(),
  lastMessageTime: serverTimestamp(),
  lastSenderId: userId,
  updatedAt: serverTimestamp()
};

// إزالة undefined fields
Object.keys(chatData).forEach(
  key => chatData[key] === undefined && delete chatData[key]
);

await setDoc(chatRef, chatData);
      
      console.log('✅ Chat document created in Firestore');
    } else {
      console.error('Error updating chat document:', error);
    }
  }

  return { id: docRef.id, ...message, createdAt: new Date() };
}

  // Listen to messages
  listenToMessages(firebaseChatId, callback) {
    if (this.unsubscribeFunctions.has(firebaseChatId)) {
      this.unsubscribeFunctions.get(firebaseChatId)();
    }

    const messagesRef = collection(db, 'chats', firebaseChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          messages.push({
            id: change.doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt
          });
        }
      });
      if (messages.length > 0) callback(messages);
    }, (error) => console.error('Listen error:', error));
    
    this.unsubscribeFunctions.set(firebaseChatId, unsubscribe);
    return unsubscribe;
  }

  // Mark message as read
  async markAsRead(firebaseChatId, messageId) {
    if (!this.currentUser) return;
    const userId = this.currentUser._id || this.currentUser.id;
    const messageRef = doc(db, 'chats', firebaseChatId, 'messages', messageId);
    await updateDoc(messageRef, { readBy: arrayUnion(userId) });
  }

  // Mark all messages as read
  async markAllAsRead(firebaseChatId) {
    if (!this.currentUser) return;
    const userId = this.currentUser._id || this.currentUser.id;
    const messagesRef = collection(db, 'chats', firebaseChatId, 'messages');
    const q = query(
  messagesRef,
  where('senderId', '!=', userId)
);
    const snapshot = await getDocs(q);

const updates = snapshot.docs
  .filter(doc => {
    const data = doc.data();
    return !data.readBy?.includes(userId);
  })
  .map(doc => updateDoc(doc.ref, {
    readBy: arrayUnion(userId)
  }));

await Promise.all(updates);
  }

  // Typing indicator with better error handling
async sendTyping(firebaseChatId, isTyping) {
  if (!this.currentUser) return;
  const userId = this.currentUser._id || this.currentUser.id;
  const typingRef = doc(db, 'chats', firebaseChatId, 'typing', userId);
  
  try {
    await setDoc(typingRef, {
      isTyping,
      updatedAt: serverTimestamp(),
      userName: this.currentUser.name || this.currentUser.username
    }, { merge: true });
  } catch (error) {
    // Don't throw error for typing - it's not critical
    console.debug('Typing indicator error (non-critical):', error.message);
  }
}

  // Listen to typing indicators
  listenToTyping(firebaseChatId, callback) {
    const typingRef = collection(db, 'chats', firebaseChatId, 'typing');
    const q = query(typingRef, orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const typingUsers = [];
      const currentUserId = this.currentUser?._id || this.currentUser?.id;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isTyping && doc.id !== currentUserId) {
          typingUsers.push({ userId: doc.id, userName: data.userName });
        }
      });
      callback(typingUsers);
    });
  }

  cleanup() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
  }
}

export default new ChatService();