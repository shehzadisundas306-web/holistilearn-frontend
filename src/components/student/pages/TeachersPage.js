// frontend/src/components/student/pages/TeachersPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import teacherService from '../../../services/teacherService';
import chatService from '../../../services/firebaseChatService';
import '../../../styles/Chat.css';

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many requests
    const timer = setTimeout(() => {
      fetchTeachers(1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search, selectedSubject]);

  const fetchSubjects = async () => {
    try {
      const response = await teacherService.getSubjects();
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await teacherService.getTeachers({
        page,
        limit: 12,
        search,
        subject: selectedSubject
      });
      
      if (response.success) {
        setTeachers(response.data.teachers);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (teacher) => {
    try {
      const chat = await chatService.getOrCreateChat(teacher._id);
      navigate('/student/chat', { state: { activeChat: chat } });
    } catch (error) {
      console.error('Start chat error:', error);
      alert('Unable to start chat. Please try again.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTeachers(newPage);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSubject('');
  };

  return (
    <div className="teachers-page">
      <div className="teachers-page-header">
        <button className="back-button" onClick={() => navigate('/student/chat')}>
          ← Back to Chats
        </button>
        <h1>Find a Teacher</h1>
        <p>Search and connect with expert teachers</p>
      </div>

      <div className="teachers-search-section">
        <div className="search-bar">
          {/* <span className="search-icon">🔍</span> */}
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-section">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-filter"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          
          {(search || selectedSubject) && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="teachers-loading">
          <div className="loading-spinner"></div>
          <p>Loading teachers...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">📚</div>
          <h3>No teachers found</h3>
          <p>Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="teachers-grid">
            {teachers.map(teacher => (
              <div key={teacher._id} className="teacher-card">
                <div className="teacher-card-avatar">
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} />
                  ) : (
                    <div className="avatar-placeholder-teacher">
                      {teacher.name?.charAt(0) || 'T'}
                    </div>
                  )}
                  <span className={`online-dot ${teacher.isOnline ? 'online' : 'offline'}`}></span>
                </div>
                
                <div className="teacher-card-info">
                  <h3>{teacher.name}</h3>
                  <p className="teacher-subject">{teacher.subject}</p>
                  {teacher.bio && (
                    <p className="teacher-bio">{teacher.bio.substring(0, 80)}...</p>
                  )}
                  <div className="teacher-stats">
                    <span className="rating">⭐ {teacher.rating || 'New'}</span>
                  </div>
                </div>
                
                <button 
                  className="start-chat-btn"
                  onClick={() => startChat(teacher)}
                >
                  💬 Message
                </button>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="page-btn"
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeachersPage;