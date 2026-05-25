// frontend/src/components/student/LearningPath.js
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCheck, FaPlay, FaLock, FaAward, FaBookOpen, FaSpinner, 
  FaArrowRight, FaRobot, FaBrain, FaChartLine, 
  FaTimes, FaLightbulb, FaRocket, FaSync, FaUserGraduate,
  FaHistory, FaFolderOpen, FaCheckCircle, FaClock, FaStar,
  FaPause, FaPlayCircle, FaTrash, FaPlus
} from "react-icons/fa";
import { dashboardAPI } from "../../../api/dashboard";
import { learningPathAPI } from "../../../api/learningPath";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import socketService from "../../../services/socketService";
import "../../../styles/LearningPath.css";

const LearningPath = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [progress, setProgress] = useState(null);
  const [completingTopic, setCompletingTopic] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  
  // State for delete and review
  const [deletingPath, setDeletingPath] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [stats, setStats] = useState({
    level: 1,
    xp: 0,
    streak: 0,
    nextLevelXP: 500,
    progressToNextLevel: 0,
    totalTopicsCompleted: 0,
    totalQuizzesTaken: 0,
    averageScore: 0
  });
  
  // State for path selector
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [allPaths, setAllPaths] = useState({
    activePath: null,
    pausedPaths: [],
    completedPaths: [],
    inProgressPaths: [],
    allPaths: []
  });
  const [switchingPath, setSwitchingPath] = useState(false);
  const [pausingPath, setPausingPath] = useState(false);

  // Normalize status function
  const normalizeStatus = (status) => {
    const statusLower = String(status).toLowerCase();
    
    if (statusLower === 'available' || statusLower === 'in progress' || statusLower === 'in_progress') {
      return 'In Progress';
    }
    if (statusLower === 'completed') {
      return 'Completed';
    }
    if (statusLower === 'locked') {
      return 'Locked';
    }
    
    return 'Locked';
  };

  // Fetch learning path from API
  const fetchLearningPath = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await learningPathAPI.getCurrentPath();
      
      if (response.success && response.data && response.data.hasLearningPath) {
        const data = response.data;
        
        if (data.milestones && data.milestones.length > 0) {
          const pathData = data.milestones.map((milestone, index) => {
            const normalizedStatus = normalizeStatus(milestone.status);
            
            const processedTopics = (milestone.topics || []).map(topic => ({
              ...topic,
              title: topic.title || topic.name || 'Topic',
              status: topic.status || 'pending'
            }));
            
            return {
              step: index + 1,
              milestoneId: milestone._id,
              topic: milestone.title,
              status: normalizedStatus,
              duration: `${milestone.estimatedTime || 60} min`,
              description: milestone.description || `Master ${milestone.title}`,
              skills: milestone.topics?.flatMap(t => t.skills) || milestone.skills || [],
              progress: milestone.progress || 0,
              topics: processedTopics,
              resources: milestone.resources || [],
              order: milestone.order,
              completedAt: milestone.completedAt
            };
          });
          
          setLearningPath(pathData);
          setProgress({
            goal: data.goal,
            description: data.description,
            totalProgress: data.totalProgress || 0
          });
        } else {
          setLearningPath([]);
        }
      } else {
        setLearningPath([]);
        setProgress(null);
      }
    } catch (error) {
      console.error("Error fetching learning path:", error);
      setLearningPath([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await dashboardAPI.getDashboardSummary();
      
      if (response.success && response.data) {
        setStats({
          level: response.data.progress?.level || 1,
          xp: response.data.progress?.xp || 0,
          streak: response.data.progress?.streak || 0,
          nextLevelXP: 500,
          progressToNextLevel: ((response.data.progress?.xp || 0) % 500 / 500) * 100,
          totalTopicsCompleted: response.data.progress?.completedTopics || 0,
          totalQuizzesTaken: response.data.quiz?.totalQuizzes || 0,
          averageScore: response.data.quiz?.averageScore || 0
        });
      } else {
        setStats(prev => prev);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch all learning paths
  const fetchAllPaths = useCallback(async () => {
    try {
      const response = await learningPathAPI.getAllPaths();
      console.log('📊 fetchAllPaths response:', response);
      
      if (response.success && response.data) {
        setAllPaths({
          activePath: response.data.activePath || null,
          pausedPaths: response.data.pausedPaths || [],
          completedPaths: response.data.completedPaths || [],
          inProgressPaths: response.data.inProgressPaths || [],
          allPaths: response.data.allPaths || []
        });
      } else {
        setAllPaths({
          activePath: null,
          pausedPaths: [],
          completedPaths: [],
          inProgressPaths: [],
          allPaths: []
        });
      }
    } catch (error) {
      console.error('Error fetching paths:', error);
      setAllPaths({
        activePath: null,
        pausedPaths: [],
        completedPaths: [],
        inProgressPaths: [],
        allPaths: []
      });
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchLearningPath(), fetchStats(), fetchAllPaths()]);
    setRefreshing(false);
  }, [fetchLearningPath, fetchStats, fetchAllPaths]);

  // ✅ Handle real-time progress updates (defined AFTER fetch functions)
  const handleProgressUpdate = useCallback((data) => {
    console.log('📊 LearningPath: Progress update received', data);
    
    if (data.type === 'full_update' && data.data) {
      const progressData = data.data;
      
      // Update stats
      setStats(prev => ({
        ...prev,
        level: progressData.stats?.level || prev.level,
        xp: progressData.stats?.xpPoints || prev.xp,
        streak: progressData.stats?.learningStreak || prev.streak,
        totalTopicsCompleted: progressData.stats?.completedTopics || prev.totalTopicsCompleted,
        totalQuizzesTaken: progressData.stats?.quizzesTaken || prev.totalQuizzesTaken,
        averageScore: progressData.stats?.averageScore || prev.averageScore
      }));
      
      // Refresh learning path to show completed topics
      fetchLearningPath();
      
    } else if (data.type === 'topic_completed') {
      toast.success(`🎉 Topic completed! +${data.data?.xpEarned || 50} XP`, {
        duration: 3000,
        icon: '✅'
      });
      fetchLearningPath();
      fetchStats();
      
    } else if (data.type === 'milestone_completed') {
      toast.success(`🎊 Milestone Completed: ${data.data?.milestoneTitle}!`, {
        duration: 5000,
        icon: '🏆'
      });
      fetchLearningPath();
    }
  }, [fetchLearningPath, fetchStats]);

  // ✅ Handle level up events
  const handleLevelUp = useCallback((data) => {
    console.log('⭐ LearningPath: Level up event', data);
    
    setStats(prev => ({
      ...prev,
      level: data.newLevel,
      xp: data.totalXP || prev.xp
    }));
    
    toast.success(`🎉 LEVEL UP! You've reached Level ${data.newLevel}!`, {
      duration: 5000,
      icon: '🎉',
      position: 'top-center'
    });
  }, []);

  // ✅ Handle XP earned events
  const handleXPEarned = useCallback((data) => {
    console.log('💎 LearningPath: XP earned', data);
    
    setStats(prev => ({
      ...prev,
      xp: data.totalXP || (prev.xp + data.amount)
    }));
  }, []);

  // ✅ Handle socket connection
  const handleSocketConnected = useCallback(() => {
    console.log('Socket connected in LearningPath');
    setIsOnline(true);
    setTimeout(() => {
      socketService.requestProgressUpdate();
    }, 500);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Setup socket listeners (separate useEffect to avoid dependency issues)
  useEffect(() => {
    if (socketService) {
      const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
      const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
      const unsubscribeLevelUp = socketService.on('level-up', handleLevelUp);
      const unsubscribeXPEarned = socketService.on('xp-earned', handleXPEarned);
      const unsubscribeConnected = socketService.on('socket:connected', handleSocketConnected);
      
      setIsOnline(socketService.getConnectionStatus());
      
      if (socketService.getConnectionStatus()) {
        setTimeout(() => {
          socketService.requestProgressUpdate();
        }, 1000);
      }
      
      return () => {
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeIncremental) unsubscribeIncremental();
        if (unsubscribeLevelUp) unsubscribeLevelUp();
        if (unsubscribeXPEarned) unsubscribeXPEarned();
        if (unsubscribeConnected) unsubscribeConnected();
      };
    }
  }, [handleProgressUpdate, handleLevelUp, handleXPEarned, handleSocketConnected]);

  // Delete path function
  const handleDeletePath = async (pathId, isActivePath = false, pathName = '') => {
    if (!window.confirm(`Are you sure you want to delete "${pathName}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingPath(true);
    try {
      const response = await learningPathAPI.deletePath(pathId, isActivePath);
      if (response.success) {
        toast.success(`"${pathName}" deleted successfully`);
        await loadData();
        setShowPathSelector(false);
      } else {
        toast.error(response.message || 'Failed to delete path');
      }
    } catch (error) {
      console.error('Error deleting path:', error);
      toast.error('Failed to delete learning path');
    } finally {
      setDeletingPath(false);
    }
  };

  // Enhanced review module function
  const handleReviewModule = async (milestone) => {
    console.log('📖 Review Module clicked for:', milestone.topic);
    
    try {
      toast.loading('Loading review content...');
      
      const response = await learningPathAPI.getMilestoneForReview(milestone.milestoneId);
      
      if (response.success && response.data) {
        setReviewData(response.data);
        setShowReviewModal(true);
        toast.dismiss();
      } else {
        toast.dismiss();
        toast.error('Failed to load review content');
        
        if (milestone.topics && milestone.topics.length > 0) {
          const topicToReview = milestone.topics[0];
          const topicTitle = topicToReview.title || `${milestone.topic} - Review`;
          navigate(`/student/ai?topic=${encodeURIComponent(topicTitle)}&mode=review&milestoneId=${milestone.milestoneId}`);
        }
      }
    } catch (error) {
      console.error("Error reviewing module:", error);
      toast.dismiss();
      toast.error("Failed to load review content");
    }
  };

  // Pause current path
  const handlePausePath = async () => {
    setPausingPath(true);
    try {
      const response = await learningPathAPI.pauseCurrentPath();
      if (response.success) {
        toast.success(response.message || "Learning path paused successfully");
        await loadData();
        setShowPathSelector(false);
      } else {
        toast.error(response.message || "Failed to pause learning path");
      }
    } catch (error) {
      console.error("Error pausing path:", error);
      toast.error("Failed to pause learning path");
    } finally {
      setPausingPath(false);
    }
  };

  // Resume a paused path
  const handleResumePath = async (pathId) => {
    setSwitchingPath(true);
    try {
      const response = await learningPathAPI.resumePath(pathId);
      if (response.success) {
        toast.success(response.message || "Learning path resumed successfully");
        await loadData();
        setShowPathSelector(false);
      } else if (response.warning) {
        toast.warning(response.message);
      } else {
        toast.error(response.message || "Failed to resume learning path");
      }
    } catch (error) {
      console.error("Error resuming path:", error);
      toast.error("Failed to resume learning path");
    } finally {
      setSwitchingPath(false);
    }
  };

  // Mark a topic as completed
  const markTopicCompleted = async (milestoneId, topicIndex, topicTitle) => {
    setCompletingTopic({ milestoneId, topicIndex });
    
    try {
      const timeSpent = 30;
      
      const response = await learningPathAPI.completeTopic({
        milestoneId,
        topicIndex,
        timeSpent
      });
      
      if (response.success) {
        toast.success(
          <div>
            <FaCheckCircle style={{ color: '#10b981', marginRight: '8px' }} />
            <strong>Topic Completed!</strong>
            <br />
            <span>You earned +{response.data.xpEarned || 50} XP</span>
            {response.data.milestoneCompleted && (
              <div className="milestone-toast">
                🎉 Milestone Completed! Next level unlocked!
              </div>
            )}
          </div>,
          { duration: 5000 }
        );
        
        await loadData();
        
        if (response.data.milestoneCompleted) {
          console.log("🎉 Milestone completed!");
        }
      } else {
        toast.error(response.message || "Failed to mark topic as completed");
      }
    } catch (error) {
      console.error("Error completing topic:", error);
      toast.error(error.response?.data?.message || "Failed to complete topic");
    } finally {
      setCompletingTopic(null);
    }
  };

  // Switch to a previous learning path
  const switchToPath = async (pathId) => {
    setSwitchingPath(true);
    try {
      const response = await learningPathAPI.switchToPath(pathId);
      if (response && response.success) {
        toast.success('Switched to learning path successfully!');
        await loadData();
        setShowPathSelector(false);
      } else {
        toast.error(response?.message || 'Failed to switch path');
      }
    } catch (error) {
      console.error('Error switching path:', error);
      toast.error('Failed to switch learning path');
    } finally {
      setSwitchingPath(false);
    }
  };

  // Handle continue topic
  const handleContinueTopic = async (milestone) => {
    console.log('🔍 ===== CONTINUE MODULE CLICKED =====');
    
    if (milestone.status === "Completed") {
      toast.info("This milestone is already completed! Click 'Review Module' to revisit.");
      return;
    }
    
    if (milestone.status === "Locked") {
      toast.info("Complete previous milestones to unlock this topic");
      return;
    }
    
    try {
      if (!milestone.topics || milestone.topics.length === 0) {
        toast.warning("This milestone has no topics yet. Please refresh the page.");
        return;
      }
      
      const pendingTopic = milestone.topics.find(t => {
        const status = t.status || 'pending';
        return status === 'pending' || status === 'in_progress';
      });
      
      if (pendingTopic) {
        const topicTitle = pendingTopic.title || `${milestone.topic} - Topic`;
        navigate(`/student/ai?topic=${encodeURIComponent(topicTitle)}`);
      } else {
        const allCompleted = milestone.topics.every(t => (t.status || 'pending') === 'completed');
        
        if (allCompleted) {
          toast.success(`🎉 "${milestone.topic}" is complete! Use 'Review Module' to revisit.`);
          await loadData();
        } else {
          toast.info("No pending topics available. Please check back later.");
        }
      }
    } catch (error) {
      console.error("Error continuing topic:", error);
      toast.error("Failed to continue learning. Please try again.");
    }
  };

  // Navigate to Discover Topics
  const handleDiscoverTopics = () => {
    navigate("/student/discover");
  };

  // Handle manual refresh
  const handleRefresh = () => {
    loadData();
    if (isOnline) {
      socketService.requestProgressUpdate();
    }
    toast.info("Refreshing your learning path...");
  };

  const getStatusIcon = (status) => {
    if (status === "Completed") return <FaCheck />;
    if (status === "In Progress") return <FaPlay className="pulse-icon" />;
    return <FaLock />;
  };

  const getProgressColor = (status) => {
    if (status === "Completed") return "#10b981";
    if (status === "In Progress") return "#f59e0b";
    return "#6b7280";
  };

  const calculateOverallProgress = () => {
    if (!learningPath || learningPath.length === 0) return 0;
    const totalProgress = learningPath.reduce((sum, item) => sum + (item.progress || 0), 0);
    return totalProgress / learningPath.length;
  };

  // Review Modal Component
  const ReviewModal = () => {
    if (!reviewData) return null;
    
    return (
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div 
              className="review-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <FaBookOpen className="modal-icon" />
                  Review: {reviewData.title}
                </h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowReviewModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body">
                <p className="review-description">{reviewData.description}</p>
                
                <div className="review-stats">
                  <div className="review-stat">
                    <span>Progress:</span>
                    <strong>{Math.round(reviewData.progress)}%</strong>
                  </div>
                  <div className="review-stat">
                    <span>Status:</span>
                    <strong className={`status-${reviewData.status.toLowerCase()}`}>
                      {reviewData.status}
                    </strong>
                  </div>
                  {reviewData.completedAt && (
                    <div className="review-stat">
                      <span>Completed:</span>
                      <strong>{new Date(reviewData.completedAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>
                
                <div className="review-topics">
                  <h4>Topics Covered</h4>
                  <div className="topics-grid">
                    {reviewData.topics.map((topic, idx) => (
                      <div key={idx} className={`review-topic-card ${topic.status}`}>
                        <div className="topic-header">
                          <FaCheckCircle className={topic.status === 'completed' ? 'completed-icon' : 'pending-icon'} />
                          <span className="topic-title">{topic.title}</span>
                        </div>
                        {topic.status === 'completed' && (
                          <div className="topic-details">
                            <span>Time spent: {topic.timeSpent} min</span>
                            {topic.skills && topic.skills.length > 0 && (
                              <div className="topic-skills">
                                {topic.skills.map((skill, i) => (
                                  <span key={i} className="skill-tag">{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {reviewData.quizzes && reviewData.quizzes.length > 0 && (
                  <div className="review-quizzes">
                    <h4>Quiz Results</h4>
                    {reviewData.quizzes.map((quiz, idx) => (
                      <div key={idx} className="quiz-review-card">
                        <span>{quiz.title}</span>
                        {quiz.attempts && quiz.attempts.length > 0 && (
                          <span className={`quiz-score ${quiz.status}`}>
                            Best: {Math.max(...quiz.attempts.map(a => a.score))}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  Close
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowReviewModal(false);
                    if (reviewData.topics && reviewData.topics.length > 0) {
                      navigate(`/student/ai?topic=${encodeURIComponent(reviewData.topics[0].title)}&mode=review&milestoneId=${reviewData.milestoneId}`);
                    }
                  }}
                >
                  <FaArrowRight /> Deep Dive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // if (loading) {
  //   return (
  //     <div className="learning-path-wrapper">
  //       <div className="loading-container">
  //         <FaSpinner className="spinner" />
  //         <p>Loading your personalized learning path...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const overallProgress = calculateOverallProgress();
  const hasLearningPath = learningPath && learningPath.length > 0;

  return (
    <div className="learning-path-wrapper">
      {/* Header with Refresh Button */}
      <div className="path-header">
        <div className="header-info">
          <h2>Your Learning Journey</h2>
          <p>Track your progress and unlock new modules as you grow.</p>
          {!isOnline && <span className="offline-badge">offline mode</span>}
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="path-history-btn"
            onClick={() => setShowPathSelector(true)}
          >
            <FaHistory /> My Paths
          </button>
          <button 
            className="discover-btn"
            onClick={handleDiscoverTopics}
          >
            <FaPlus /> Discover Topics
          </button>
          <div className="path-stats">
            <div className="stat-pill">
              <FaUserGraduate className="gold-icon" /> 
              <span>Level {stats.level}</span>
            </div>
            <div className="stat-pill">
              <span>🔥 {stats.streak} Day</span>
            </div>
            <div className="stat-pill">
              <span>⭐ {stats.xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="xp-progress-container">
        <div className="xp-progress-info">
          <span>Level {stats.level}</span>
          <span>{stats.xp % 500} / 500 XP</span>
        </div>
        <div className="xp-progress-track">
          <motion.div 
            className="xp-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.xp % 500) / 5}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="xp-next">{500 - (stats.xp % 500)} XP to next level</p>
      </div>

      {/* Empty State - No Learning Path */}
      {!hasLearningPath ? (
        <div className="empty-path-state">
          <div className="empty-state-icon">
            <FaRobot />
          </div>
          <h3>Start Your Learning Journey</h3>
          <p>Discover topics and create personalized learning paths.</p>
          <button 
            className="start-journey-btn"
            onClick={handleDiscoverTopics}
          >
            <FaRocket /> Explore Topics
          </button>
          <div className="empty-state-tips">
            <h4>Popular topics to explore:</h4>
            <div className="topic-suggestions">
              {["React", "JavaScript", "Python", "Machine Learning", "Web Development", "Data Science"].map(topic => (
                <button 
                  key={topic}
                  className="suggestion-tag"
                  onClick={() => navigate(`/student/discover?search=${encodeURIComponent(topic)}`)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overall Progress Bar */}
          <div className="overall-progress">
            <div className="progress-label">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="progress-track">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* Roadmap Container */}
          <div className="roadmap-container">
            {learningPath.map((item, index) => (
              <motion.div 
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`roadmap-step ${item.status.toLowerCase().replace(" ", "-")}`}
              >
                {index !== learningPath.length - 1 && <div className="connecting-line" />}

                <div className="step-indicator">
                  <div 
                    className="icon-circle"
                    style={{ background: `${getProgressColor(item.status)}20`, borderColor: getProgressColor(item.status) }}
                  >
                    {getStatusIcon(item.status)}
                  </div>
                </div>

                <motion.div 
                  whileHover={{ x: 10 }}
                  className="step-card-glass"
                >
                  <div className="card-top">
                    <span className="step-tag">Step {item.step}</span>
                    <span className="duration-tag"><FaBookOpen /> {item.duration}</span>
                  </div>
                  
                  <div className="card-main">
                    <h3>{item.topic}</h3>
                    <p>{item.description}</p>
                  </div>

                  {/* Topic List with Completion Buttons */}
                  {item.topics && item.topics.length > 0 && (
                    <div className="topics-list">
                      <div className="topics-header">
                        <span>Topics to Master</span>
                        <span>Progress</span>
                      </div>
                      {item.topics.map((topic, topicIndex) => {
                        const topicStatus = topic.status || 'pending';
                        
                        return (
                          <div key={topicIndex} className={`topic-item ${topicStatus}`}>
                            <div className="topic-info">
                              <div className="topic-title-wrapper">
                                {/* Replace this pending icon block */}
{topicStatus === 'completed' ? (
  <FaCheckCircle className="topic-status-icon completed" />
) : topicStatus === 'in_progress' ? (
  <FaPlay className="topic-status-icon in-progress" />
) : (
  <span className="topic-status-icon pending"></span>
)}
                                <span className="topic-title">{topic.title}</span>
                              </div>
                              <span className="topic-time"><FaClock /> {topic.estimatedTime || 30} min</span>
                            </div>
                            
                            {topicStatus === 'pending' && item.status === "In Progress" && (
                              <button 
                                className="complete-topic-btn"
                                onClick={() => markTopicCompleted(item.milestoneId, topicIndex, topic.title)}
                                disabled={completingTopic?.milestoneId === item.milestoneId && completingTopic?.topicIndex === topicIndex}
                              >
                                {completingTopic?.milestoneId === item.milestoneId && completingTopic?.topicIndex === topicIndex ? (
                                  <FaSpinner className="spinner-small" />
                                ) : (
                                  <FaCheck />
                                )}
                                Mark Completed
                              </button>
                            )}
                            
                            {topicStatus === 'completed' && (
                              <span className="topic-completed-badge">
                                <FaCheck /> Completed
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {item.status === "In Progress" && (
                    <div className="step-progress">
                      <div className="progress-bar-small">
                        <div 
                          className="progress-fill-small"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{Math.round(item.progress)}% complete</span>
                    </div>
                  )}

                  {item.skills && item.skills.length > 0 && (
                    <div className="card-skills">
                      {item.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  )}

                  {item.status === "In Progress" && (
                    <button 
                      className="continue-btn"
                      onClick={() => handleContinueTopic(item)}
                    >
                      Continue Module <FaArrowRight />
                    </button>
                  )}

                  {item.status === "Completed" && (
                    <button 
                      className="review-btn"
                      onClick={() => handleReviewModule(item)}
                    >
                      Review Module <FaBookOpen />
                    </button>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Path Selector Modal */}
      <AnimatePresence>
        {showPathSelector && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !switchingPath && !pausingPath && setShowPathSelector(false)}
          >
            <motion.div 
              className="path-selector-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <FaFolderOpen className="modal-icon" />
                  Your Learning Paths
                </h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowPathSelector(false)}
                  disabled={switchingPath || pausingPath}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                {allPaths.allPaths && allPaths.allPaths.length > 0 ? (
                  <div className="all-paths-list">
                    <h4>All Learning Paths ({allPaths.allPaths.length})</h4>
                    {allPaths.allPaths.map((path) => {
                      const isActive = learningPath?.goal === path.goal;
                      const isPaused = path.status === 'paused';
                      const isCompleted = path.status === 'completed';
                      
                      return (
                        <div key={path._id} className={`path-item ${path.status}`}>
                          <div className="path-info">
                            <div className="path-header">
                              <h5>{path.goal}</h5>
                              <span className={`status-badge ${path.status}`}>
                                {isActive ? 'Active' : isPaused ? 'Paused' : isCompleted ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                            <p>Progress: {Math.round(path.progress || 0)}%</p>
                            <div className="path-progress-bar">
                              <div 
                                className="path-progress-fill"
                                style={{ width: `${path.progress || 0}%` }}
                              />
                            </div>
                            <p className="path-meta">
                              Started: {new Date(path.startedAt).toLocaleDateString()}
                              {path.lastAccessedAt && ` | Last active: ${new Date(path.lastAccessedAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="path-actions">
                            {isActive ? (
                              <button 
                                className="pause-path-btn"
                                onClick={handlePausePath}
                                disabled={pausingPath}
                              >
                                {pausingPath ? <FaSpinner className="spinner-small" /> : <FaPause />}
                                Pause
                              </button>
                            ) : isPaused ? (
                              <button 
                                className="resume-path-btn"
                                onClick={() => handleResumePath(path._id)}
                                disabled={switchingPath}
                              >
                                {switchingPath ? <FaSpinner className="spinner-small" /> : <FaPlayCircle />}
                                Resume
                              </button>
                            ) : (
                              <button 
                                className="view-path-btn"
                                onClick={() => switchToPath(path._id)}
                                disabled={switchingPath}
                              >
                                <FaArrowRight /> Switch to this Path
                              </button>
                            )}
                            <button 
                              className="delete-path-btn"
                              onClick={() => handleDeletePath(path._id, false, path.goal)}
                              disabled={deletingPath}
                              title="Delete this path permanently"
                            >
                              {deletingPath ? <FaSpinner className="spinner-small" /> : <FaTrash />}
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-paths">
                    <FaBookOpen className="empty-icon" />
                    <p>No learning paths yet.</p>
                    <p className="empty-subtitle">Discover topics to create your first learning path!</p>
                    <button 
                      className="discover-from-modal-btn"
                      onClick={() => {
                        setShowPathSelector(false);
                        handleDiscoverTopics();
                      }}
                    >
                      <FaPlus /> Discover Topics
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-discover"
                  onClick={handleDiscoverTopics}
                >
                  <FaPlus /> Discover New Topics
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <ReviewModal />
    </div>
  );
};

export default LearningPath;