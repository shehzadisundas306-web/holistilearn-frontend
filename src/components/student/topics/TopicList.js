// frontend/src/components/student/topics/TopicsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaFilter, FaBook, FaClock, FaStar, 
  FaSpinner, FaChevronLeft, FaChevronRight, FaCheckCircle,
  FaFire, FaTrophy, FaChartLine
} from 'react-icons/fa';
import { topicsAPI } from '../../../api/topics';
import socketService from '../../../services/socketService';
import { toast } from 'sonner';
// import './TopicsList.css';

const TopicsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [newlyCompletedTopic, setNewlyCompletedTopic] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
    sortBy: 'popularity'
  });
  const [searchInput, setSearchInput] = useState('');

  // ✅ Check socket connection
  useEffect(() => {
    setIsOnline(socketService.getConnectionStatus());
    
    const unsubscribe = socketService.on('socket:connected', () => {
      setIsOnline(true);
      fetchTopics(); // Refresh when socket connects
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ✅ Handle real-time progress updates
  const handleProgressUpdate = useCallback((data) => {
    console.log('📊 TopicsList: Progress update received', data);
    
    if (data.type === 'full_update' && data.data) {
      // Refresh topics list to show updated progress
      fetchTopics();
      
      // Check for newly completed topics
      const progressData = data.data;
      if (progressData.stats?.completedTopics > 0) {
        // Find which topic was just completed
        const recentActivity = progressData.recentActivity || [];
        const completedTopicActivity = recentActivity.find(
          activity => activity.type === 'topic_completed'
        );
        
        if (completedTopicActivity) {
          const topicTitle = completedTopicActivity.metadata?.topicTitle || 'a topic';
          setNewlyCompletedTopic(topicTitle);
          setTimeout(() => setNewlyCompletedTopic(null), 5000);
          
          toast.success(`🎉 Topic completed: ${topicTitle}!`, {
            duration: 4000,
            icon: '🏆'
          });
        }
      }
    } else if (data.type === 'topic_completed') {
      toast.success(`🎉 ${data.data?.topicTitle || 'Topic'} Completed! +${data.data?.xpEarned || 50} XP`, {
        duration: 5000,
        icon: '🏆'
      });
      fetchTopics();
    } else if (data.type === 'topic_started') {
      toast.info(`🚀 Started: ${data.data?.topicTitle || 'New topic'}`, {
        duration: 3000,
        icon: '📚'
      });
      fetchTopics();
    }
  }, []);

  // ✅ Handle XP earned updates
  const handleXPEarned = useCallback((data) => {
    console.log('💎 TopicsList: XP earned', data);
    // Optionally show a small toast for XP
    if (data.amount >= 25) {
      toast.success(`+${data.amount} XP from ${data.source || 'learning'}!`, {
        duration: 2000,
        icon: '⭐'
      });
    }
  }, []);

  // ✅ Handle level up
  const handleLevelUp = useCallback((data) => {
    toast.success(`🎉 Level ${data.newLevel} Unlocked!`, {
      duration: 5000,
      icon: '🎉'
    });
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchTopics();
    
    // Setup socket listeners
    const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
    const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
    const unsubscribeXPEarned = socketService.on('xp-earned', handleXPEarned);
    const unsubscribeLevelUp = socketService.on('level-up', handleLevelUp);
    
    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeIncremental) unsubscribeIncremental();
      if (unsubscribeXPEarned) unsubscribeXPEarned();
      if (unsubscribeLevelUp) unsubscribeLevelUp();
    };
  }, [handleProgressUpdate, handleXPEarned, handleLevelUp]);

  useEffect(() => {
    fetchTopics();
  }, [filters.category, filters.difficulty, filters.sortBy, filters.page]);

  const fetchCategories = async () => {
    try {
      const response = await topicsAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await topicsAPI.getTopics(filters);
      
      if (response.success) {
        setTopics(response.data.topics || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          pages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: { text: 'Not Started', color: '#6b7280', icon: null },
      in_progress: { text: 'In Progress', color: '#f59e0b', icon: <FaFire className="status-icon" /> },
      completed: { text: 'Completed', color: '#10b981', icon: <FaCheckCircle className="status-icon" /> }
    };
    return badges[status] || badges.not_started;
  };

  if (loading && topics.length === 0) {
    return (
      <div className="topics-loading">
        <FaSpinner className="spinner" />
        <p>Loading learning topics...</p>
      </div>
    );
  }

  return (
    <div className="topics-container">
      {/* Header */}
      <div className="topics-header">
        <h1 className="topics-title">
          <FaBook className="title-icon" /> Learning Topics
          {!isOnline && <span className="offline-badge">offline</span>}
        </h1>
        <p className="topics-subtitle">
          Explore our comprehensive collection of learning materials
        </p>
      </div>

      {/* Search and Filters */}
      <div className="topics-filters">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="search-btn">Search</button>
        </form>

        <div className="filter-controls">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>

          <select
            name="difficulty"
            value={filters.difficulty}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="popularity">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="difficulty">Difficulty</option>
            <option value="duration">Duration</option>
            <option value="progress">Your Progress</option>
          </select>
        </div>
      </div>

      {/* Topics Count */}
      <div className="topics-count">
        <span>Found {pagination.total} topics</span>
        {isOnline && <span className="live-badge">Live Updates Active</span>}
      </div>

      {/* Topics Grid */}
      {topics.length === 0 ? (
        <div className="no-topics">
          <p>No topics found. Try adjusting your filters.</p>
          <button onClick={() => {
            setFilters({ category: '', difficulty: '', search: '', sortBy: 'popularity', page: 1 });
            setSearchInput('');
          }} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="topics-grid">
            {topics.map((topic, index) => {
              const statusBadge = getStatusBadge(topic.userProgress?.status);
              const progress = topic.userProgress?.progress || 0;
              
              return (
                <motion.div
                  key={topic._id}
                  className={`topic-card ${topic.userProgress?.status === 'completed' ? 'completed-card' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="topic-card-header">
                    <div className="topic-badges">
                      <span className="category-badge">{topic.category}</span>
                      <span 
                        className="difficulty-badge"
                        style={{ background: getDifficultyColor(topic.difficulty) }}
                      >
                        {topic.difficulty}
                      </span>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ background: statusBadge.color }}
                    >
                      {statusBadge.icon} {statusBadge.text}
                    </span>
                  </div>
                  
                  <h3 className="topic-title">{topic.title}</h3>
                  <p className="topic-description">{topic.description?.substring(0, 100)}...</p>
                  
                  <div className="topic-meta">
                    <span className="meta-item">
                      <FaClock /> {Math.floor(topic.duration / 60)}h {topic.duration % 60}m
                    </span>
                    <span className="meta-item">
                      <FaStar /> {topic.enrolledCount || 0} enrolled
                    </span>
                  </div>
                  
                  {progress > 0 && progress < 100 && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                      <span className="progress-text">{Math.round(progress)}%</span>
                    </div>
                  )}
                  
                  {progress === 100 && (
                    <div className="completed-badge-small">
                      <FaTrophy /> Mastered
                    </div>
                  )}
                  
                  <button
                    className={`topic-action-btn ${topic.userProgress?.status === 'completed' ? 'completed-btn' : ''}`}
                    onClick={() => navigate(`/topics/${topic._id}`)}
                  >
                    {topic.userProgress?.status === 'completed' ? 'Review Topic' :
                     topic.userProgress?.status === 'in_progress' ? 'Continue Learning' : 'Start Learning'}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                <FaChevronLeft /> Previous
              </button>
              
              <div className="pagination-numbers">
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`page-number ${pagination.page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* New Topic Completion Toast */}
      <AnimatePresence>
        {newlyCompletedTopic && (
          <motion.div
            className="completion-toast"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="toast-icon">🏆</div>
            <div className="toast-content">
              <h4>Topic Completed!</h4>
              <p>{newlyCompletedTopic}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopicsList;