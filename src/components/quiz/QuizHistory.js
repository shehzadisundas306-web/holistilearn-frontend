// frontend/src/components/quiz/QuizHistory.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHistory, FaSpinner, FaTrophy, FaBullseye, FaChartBar, 
  FaChevronRight, FaCalendarAlt, FaSync, FaFilter, 
  FaTimes, FaBookOpen, FaTrash, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight as FaChevronRightIcon,
  FaClock, FaStar, FaBrain
} from 'react-icons/fa';
import { 
  getQuizHistory as getStudentQuizHistory, 
  getQuizStats as getStudentQuizStats, 
  getQuizResult,
  deleteQuizHistory  // ✅ Add this import
} from '../../api/studentApi';
import { formatDate } from '../../utils/helpers';
import socketService from '../../services/socketService';
import { toast } from 'sonner';
import './quiz.css';

const QuizHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check socket connection
  useEffect(() => {
    setIsOnline(socketService?.getConnectionStatus() || false);
    
    const unsubscribe = socketService?.on('socket:connected', () => {
      setIsOnline(true);
      handleRefresh();
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch quiz history from API with pagination
  const fetchQuizHistory = useCallback(async (page = 1) => {
    try {
      const response = await getStudentQuizHistory({ page, limit: itemsPerPage });
      if (response.success && response.data) {
        const quizzes = response.data.quizzes || [];
        setQuizHistory(quizzes);
        setFilteredHistory(quizzes);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        
        // Extract unique topics for filter
        const topics = [...new Set(quizzes.map(q => q.topic).filter(Boolean))];
        setAvailableTopics(topics);
        return quizzes;
      } else {
        throw new Error(response.message || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching quiz history:', err);
      setError('Unable to load quiz history. Please try again.');
      setQuizHistory([]);
      setFilteredHistory([]);
      return [];
    }
  }, [itemsPerPage]);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await getStudentQuizStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.overview || {
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          worstScore: 0,
          totalTimeSpent: 0
        });
      } else {
        throw new Error('Invalid stats response');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalTimeSpent: 0
      });
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchQuizHistory(currentPage), fetchStats()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load your quiz history. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [fetchQuizHistory, fetchStats, currentPage]);

  // Refresh data (manual refresh)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchQuizHistory(currentPage), fetchStats()]);
      toast.success('History refreshed successfully');
    } catch (err) {
      console.error('Error refreshing:', err);
      toast.error('Failed to refresh history');
    } finally {
      setRefreshing(false);
    }
  }, [fetchQuizHistory, fetchStats, currentPage]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchQuizHistory(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages, fetchQuizHistory]);

  // Filter by topic
  const handleFilterByTopic = useCallback((topic) => {
    if (topic === filterTopic) {
      setFilterTopic('');
      setFilteredHistory(quizHistory);
    } else {
      setFilterTopic(topic);
      const filtered = quizHistory.filter(quiz => quiz.topic === topic);
      setFilteredHistory(filtered);
    }
    setShowFilterMenu(false);
  }, [filterTopic, quizHistory]);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilterTopic('');
    setFilteredHistory(quizHistory);
  }, [quizHistory]);

  // Handle quiz click
  const handleQuizClick = useCallback(async (quiz) => {
    const loadingToast = toast.loading('Loading quiz results...');
    
    try {
      const response = await getQuizResult(quiz.id);
      
      toast.dismiss(loadingToast);
      
      if (response.success && response.data) {
        const resultData = response.data;
        
        console.log('📊 Quiz Result Data:', {
          strengths: resultData.strengths,
          weaknesses: resultData.weaknesses,
          questions: resultData.questions?.length
        });
        
        navigate(`/student/student-quiz/${quiz.id}/result`, { 
          state: { 
            result: {
              score: resultData.score,
              correctAnswers: resultData.correctAnswers,
              totalQuestions: resultData.totalQuestions,
              xpEarned: resultData.xpEarned || 50,
              passed: resultData.passed,
              strengths: resultData.strengths || [],
              weaknesses: resultData.weaknesses || [],
              feedback: resultData.feedback,
              questionResults: resultData.questions || [],
              oldLevel: resultData.oldLevel,
              newLevel: resultData.newLevel,
              title: resultData.title,
              topic: resultData.topic
            },
            quizTitle: resultData.title || quiz.title,
            topic: resultData.topic || quiz.topic
          } 
        });
      } else {
        toast.dismiss(loadingToast);
        toast.warning('Detailed results not available');
        
        navigate(`/student/student-quiz/${quiz.id}/result`, { 
          state: { 
            result: {
              score: quiz.score,
              correctAnswers: quiz.correctAnswers,
              totalQuestions: quiz.totalQuestions,
              xpEarned: 50,
              passed: quiz.score >= 70,
              strengths: [],
              weaknesses: [],
              feedback: {
                message: `You scored ${quiz.score}% on this quiz`,
                tip: 'Complete more quizzes to get detailed insights!'
              },
              questionResults: []
            },
            quizTitle: quiz.title,
            topic: quiz.topic
          } 
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error loading quiz result:', error);
      
      navigate(`/student/student-quiz/${quiz.id}/result`, { 
        state: { 
          result: {
            score: quiz.score,
            correctAnswers: quiz.correctAnswers,
            totalQuestions: quiz.totalQuestions,
            xpEarned: 50,
            passed: quiz.score >= 70,
            strengths: [],
            weaknesses: [],
            feedback: {
              message: `You scored ${quiz.score}%`,
              tip: 'Keep learning to improve your scores!'
            },
            questionResults: []
          },
          quizTitle: quiz.title,
          topic: quiz.topic
        } 
      });
    }
  }, [navigate]);

  // Handle delete click
  const handleDeleteClick = useCallback((quiz, e) => {
    e.stopPropagation();
    setDeletingQuiz(quiz);
    setShowDeleteModal(true);
  }, []);

  // ✅ UPDATED: Confirm delete with API call
  const confirmDelete = useCallback(async () => {
    if (!deletingQuiz) return;
    
    setIsDeleting(true);
    const toastId = toast.loading('Deleting quiz attempt...');
    
    try {
      // ✅ Call the backend API to delete
      const response = await deleteQuizHistory(deletingQuiz.id);
      
      if (response.success) {
        // ✅ Update frontend state after successful deletion
        const updatedHistory = quizHistory.filter(q => q.id !== deletingQuiz.id);
        setQuizHistory(updatedHistory);
        setFilteredHistory(filterTopic ? updatedHistory.filter(q => q.topic === filterTopic) : updatedHistory);
        
        toast.success('Quiz attempt deleted successfully', { id: toastId });
        
        // ✅ Refresh stats to update counts
        await fetchStats();
        
        // ✅ If current page becomes empty and not first page, go to previous page
        const remainingItems = updatedHistory.length;
        const itemsOnCurrentPage = (currentPage - 1) * itemsPerPage;
        
        if (remainingItems === itemsOnCurrentPage && currentPage > 1) {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          await fetchQuizHistory(newPage);
        } else {
          await fetchQuizHistory(currentPage);
        }
      } else {
        throw new Error(response.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
      toast.error(err.message || 'Failed to delete quiz attempt', { id: toastId });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletingQuiz(null);
    }
  }, [deletingQuiz, quizHistory, filterTopic, fetchStats, fetchQuizHistory, currentPage, itemsPerPage]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setDeletingQuiz(null);
  }, []);

  // Retry loading on error
  const handleRetry = useCallback(() => {
    loadData();
  }, [loadData]);

  // Get score color based on percentage
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Get score emoji
  const getScoreEmoji = (score) => {
    if (score >= 90) return '🏆';
    if (score >= 70) return '🎉';
    if (score >= 50) return '📝';
    return '📚';
  };

  // Load data on mount and page change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (loading || refreshing) return;
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchQuizHistory(currentPage);
        fetchStats();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchQuizHistory, fetchStats, currentPage, loading, refreshing]);

  if (loading) {
    return (
      <div className="premium-loader">
        <FaSpinner className="spinner-icon" />
        <p>Synchronizing your learning records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state-modern">
        <div className="error-icon">
          <FaExclamationTriangle />
        </div>
        <h3>Unable to Load History</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-btn-modern">
          <FaSync /> Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="history-page-wrapper">
        {/* Header Section */}
        <header className="history-hero">
          <div className="hero-content">
            <div className="hero-icon-wrapper">
              <FaHistory className="hero-icon-gold" />
            </div>
            <div className="hero-text">
              <h2 className='quiz-hero-h1'>Performance Analytics</h2>
              <p>Track your cognitive growth and subject mastery over time.</p>
              {!isOnline && <span className="offline-badge">offline</span>}
            </div>
            <button 
              onClick={handleRefresh} 
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              disabled={refreshing}
            >
              <FaSync className={refreshing ? 'spin-icon' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Stats Dashboard */}
        <section className="analytics-grid">
          <div className="glass-stat-card">
            <div className="stat-icon" style={{ background: '#3498db20', color: '#3498db' }}>
              <FaChartBar />
            </div>
            <div className="stat-meta">
              <h3>{stats?.totalQuizzes || 0}</h3>
              <span>Total Assessments</span>
            </div>
          </div>
          
          <div className="glass-stat-card">
            <div className="stat-icon" style={{ background: 'var(--blue)20', color: 'var(--blue)' }}>
              <FaBullseye />
            </div>
            <div className="stat-meta">
              <h3>{Math.round(stats?.averageScore || 0)}%</h3>
              <span>Average Accuracy</span>
            </div>
          </div>
          
          <div className="glass-stat-card">
            <div className="stat-icon" style={{ background: '#f1c40f20', color: '#f1c40f' }}>
              <FaTrophy />
            </div>
            <div className="stat-meta">
              <h3>{(stats?.bestScore || 0).toFixed(2)}%</h3>
              <span>Highest Achievement</span>
            </div>
          </div>
        </section>

        {/* History List Section */}
        <div className="history-list-container">
          <div className="list-header">
            <div className="header-left">
              <h3 className="text-white">
                <FaBookOpen className="header-icon" /> 
                Recent Attempts
                {filterTopic && (
                  <span className="active-filter-badge">
                    {filterTopic}
                    <button onClick={clearFilter} className="clear-filter-btn">
                      <FaTimes />
                    </button>
                  </span>
                )}
              </h3>
              <p className="history-count">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'assessment' : 'assessments'} found
                {totalItems > 0 && !filterTopic && ` • ${totalItems} total`}
              </p>
            </div>
            
            <div className="filter-container">
              <button 
                className="filter-btn border-0"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <FaFilter /> Filter by Topic
              </button>
              
              <AnimatePresence>
                {showFilterMenu && (
                  <motion.div 
                    className="filter-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="filter-dropdown-header">
                      <span>Select Topic</span>
                      <button onClick={() => setShowFilterMenu(false)}>×</button>
                    </div>
                    <div className="filter-dropdown-list">
                      <button 
                        className={`filter-option ${!filterTopic ? 'active' : ''}`}
                        onClick={() => handleFilterByTopic('')}
                      >
                        All Topics
                      </button>
                      {availableTopics.map(topic => (
                        <button 
                          key={topic}
                          className={`filter-option ${filterTopic === topic ? 'active' : ''}`}
                          onClick={() => handleFilterByTopic(topic)}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="scrollable-history">
            {filteredHistory.length === 0 ? (
              <div className="empty-history-state">
                <div className="empty-icon">📭</div>
                <h4>No Quiz Attempts Yet</h4>
                <p>Start your learning journey by generating your first quiz!</p>
                <button 
                  className="start-quiz-btn"
                  onClick={() => navigate('/student/quiz/generate')}
                >
                  Generate Your First Quiz
                </button>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {filteredHistory.map((quiz, index) => (
                    <motion.div
                      key={quiz.id || `quiz_${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: index * 0.05 }}
                      className="premium-history-item"
                      onClick={() => handleQuizClick(quiz)}
                    >
                      <div className="item-main">
                        <div className="item-header">
                          <div 
                            className="topic-badge"
                            style={{ 
                              background: `${getScoreColor(quiz.score)}20`,
                              color: getScoreColor(quiz.score)
                            }}
                          >
                            {quiz.topic}
                          </div>
                          <button 
                            className="delete-history-btn"
                            onClick={(e) => handleDeleteClick(quiz, e)}
                            title="Delete this attempt"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <h4>{quiz.title}</h4>
                        <div className="item-sub">
                          <span className="item-date">
                            <FaCalendarAlt /> {formatDate(quiz.completedAt)}
                          </span>
                          <span className="item-questions">
                            <FaBookOpen /> {quiz.totalQuestions} questions
                          </span>
                          {quiz.timeSpent && (
                            <span className="item-time">
                              <FaClock /> {Math.floor(quiz.timeSpent / 60)} min
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="item-performance">
                        <div className="score-viz">
                          <div className="score-text">
                            <span 
                              className="score-value"
                              style={{ color: getScoreColor(quiz.score) }}
                            >
                              {getScoreEmoji(quiz.score)} {Math.round(quiz.score)}%
                            </span>
                          </div>
                          <div className="progress-bar-mini">
                            <motion.div 
                              className="progress-fill" 
                              initial={{ width: 0 }}
                              animate={{ width: `${quiz.score}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              style={{ background: getScoreColor(quiz.score) }}
                            />
                          </div>
                          <div className="score-stats">
                            <span>{quiz.correctAnswers || Math.round(quiz.score * quiz.totalQuestions / 100)}/{quiz.totalQuestions} correct</span>
                          </div>
                        </div>
                        <FaChevronRight className="arrow-link" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Pagination Controls */}
                {!filterTopic && totalPages > 1 && (
                  <div className="pagination-controls">
                    <button 
                      className="pag-nav-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft />
                    </button>
                    <div className="pagination-info">
                      <span>Page {currentPage} of {totalPages}</span>
                      <span className="total-items">({totalItems} total)</span>
                    </div>
                    <button 
                      className="pag-nav-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <FaChevronRightIcon />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <motion.div 
              className="confirm-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon warning">
                <FaExclamationTriangle />
              </div>
              <h3>Delete Quiz Attempt</h3>
              <p>
                Are you sure you want to delete the quiz attempt for <strong>"{deletingQuiz?.title}"</strong>?
                <br />
                <span className="warning-text">This action cannot be undone.</span>
              </p>
              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm-delete" 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? <FaSpinner className="spin-icon" /> : <FaTrash />}
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuizHistory;