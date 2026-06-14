import React, { useState, useEffect } from 'react';
import axios from 'axios';
import chatService from '../../../services/firebaseChatService';

const API_URL = process.env.REACT_APP_API_URL1 || 'https://holistilearn-backend.vercel.app/';

const TeacherList = ({ onStartChat, currentUser }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      console.log('Fetching teachers...');
      
      const response = await axios.get(`${API_URL}/user/teachers`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log('Teachers found:', response.data.data.length);
        setTeachers(response.data.data || []);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("❌ Full backend error:", error.response?.data);
      console.error('Fetch teachers error:', error);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (teacher) => {
    if (!currentUser?._id || !teacher?._id) {
  console.error("Invalid user IDs");
  return;
}

if (currentUser._id === teacher._id) {
  console.error("Cannot start chat with yourself");
  return;
}
    try {
      
      console.log('Starting chat with teacher:', teacher.name);
      const chat = await chatService.getOrCreateChat(teacher._id);
      console.log('Chat created/retrieved:', chat);
      onStartChat(chat);
    } catch (error) {
      console.error('Start chat error:', error);
      alert('Unable to start chat. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="teachers-loading">
        <div className="small-spinner"></div>
        <p>Loading teachers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teachers-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchTeachers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="teachers-list-chat">
      <div className="teachers-header-chat">
        <h3>👨‍🏫 Teachers</h3>
        <p>Click on any teacher to start a conversation</p>
      </div>
      
      <div className="teachers-grid-chat">
        {teachers.length === 0 ? (
          <div className="no-teachers">
            <p>No teachers available</p>
          </div>
        ) : (
          teachers.map(teacher => (
            <div key={teacher._id} className="teacher-card-chat" onClick={() => startChat(teacher)}>
              <div className="teacher-avatar-chat">
                {teacher.avatar ? (
                  <img src={teacher.avatar} alt={teacher.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {teacher.name?.charAt(0) || 'T'}
                  </div>
                )}
                <span className={`online-status ${teacher.isOnline ? 'online' : 'offline'}`}></span>
              </div>
              
              <div className="teacher-info-chat">
                <h4>{teacher.name}</h4>
                <p className="teacher-subject-chat">{teacher.subject || 'Subject Expert'}</p>
                {teacher.bio && (
                  <p className="teacher-bio-chat">{teacher.bio.substring(0, 60)}...</p>
                )}
                <button className="chat-button-chat" onClick={(e) => {
                e.stopPropagation();
                startChat(teacher);
              }}>
                 Message
              </button>
              </div>
              
              
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherList;