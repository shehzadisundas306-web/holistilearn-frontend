// frontend/src/components/student/dashboard/Insights.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartLine, FaBrain, FaFire, FaStar, FaTrophy, 
  FaClock, FaMeditate, FaArrowRight, FaLightbulb,
  FaSpinner, FaCheckCircle
} from 'react-icons/fa';
import { dashboardAPI } from '../../../api/dashboard';
import socketService from '../../../services/socketService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Insights = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getInsights();
      
      if (response.success && response.data) {
        setInsights(response.data.insights || []);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights');
      toast.error('Could not load learning insights');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle real-time progress updates (refresh insights)
  const handleProgressUpdate = useCallback((data) => {
    console.log('📊 Insights: Progress update received', data);
    
    if (data.type === 'full_update' && data.data) {
      // Refresh insights when progress updates
      fetchInsights();
      
      // Show toast for significant progress
      const progressData = data.data;
      if (progressData.stats?.completedTopics > 0) {
        toast.info(`📈 Learning progress updated!`, {
          duration: 2000,
          icon: '📊'
        });
      }
    } else if (data.type === 'quiz_submitted') {
      // Refresh insights after quiz submission
      setTimeout(() => fetchInsights(), 1000);
    } else if (data.type === 'topic_completed') {
      // Refresh insights after topic completion
      setTimeout(() => fetchInsights(), 500);
    }
  }, []);

  // ✅ Handle level up - might generate new insights
  const handleLevelUp = useCallback((data) => {
    console.log('⭐ Insights: Level up event', data);
    setTimeout(() => fetchInsights(), 1000);
    
    // Add a special insight notification
    toast.success(`🎉 New achievement insights available!`, {
      duration: 4000,
      icon: '🏆'
    });
  }, []);

  // ✅ Handle achievements - might generate new insights
  const handleAchievementEarned = useCallback((data) => {
    console.log('🏆 Insights: Achievement earned', data);
    setTimeout(() => fetchInsights(), 1000);
  }, []);

  // ✅ Handle socket connection
  const handleSocketConnected = useCallback(() => {
    console.log('Socket connected in Insights');
    setIsOnline(true);
    // Refresh insights when socket connects
    fetchInsights();
  }, []);

  // ✅ Handle weak topics update
  const handleWeakTopicsUpdate = useCallback((data) => {
    console.log('📚 Insights: Weak topics update', data);
    if (data.newWeakTopics && data.newWeakTopics.length > 0) {
      toast.info(`📚 New insights available for improvement areas!`, {
        duration: 3000,
        icon: '💡'
      });
      setTimeout(() => fetchInsights(), 1000);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    
    // ✅ Setup socket listeners
    if (socketService) {
      const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
      const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
      const unsubscribeLevelUp = socketService.on('level-up', handleLevelUp);
      const unsubscribeAchievement = socketService.on('achievement-earned', handleAchievementEarned);
      const unsubscribeWeakTopics = socketService.on('weak-topics-update', handleWeakTopicsUpdate);
      const unsubscribeConnected = socketService.on('socket:connected', handleSocketConnected);
      
      setIsOnline(socketService.getConnectionStatus());
      
      return () => {
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeIncremental) unsubscribeIncremental();
        if (unsubscribeLevelUp) unsubscribeLevelUp();
        if (unsubscribeAchievement) unsubscribeAchievement();
        if (unsubscribeWeakTopics) unsubscribeWeakTopics();
        if (unsubscribeConnected) unsubscribeConnected();
      };
    }
  }, [handleProgressUpdate, handleLevelUp, handleAchievementEarned, handleWeakTopicsUpdate, handleSocketConnected]);

  const getInsightIcon = (type, icon) => {
    if (icon) return icon;
    
    const icons = {
      positive: '📈',
      achievement: '🏆',
      improvement: '🎯',
      suggestion: '💡',
      wellness: '🧘',
      motivation: '⭐',
      insight: '💡',
      warning: '⚠️',
      streak: '🔥',
      quiz: '📝',
      time: '⏰'
    };
    return icons[type] || '📊';
  };

  const getInsightColor = (type) => {
    const colors = {
      positive: '#10b981',
      achievement: '#f59e0b',
      improvement: '#3b82f6',
      suggestion: '#8b5cf6',
      wellness: '#ec4899',
      motivation: '#fbbf24',
      insight: '#06b6d4',
      warning: '#ef4444',
      streak: '#ef4444',
      quiz: '#F5C45E',
      time: '#a78bfa'
    };
    return colors[type] || '#6b7280';
  };

  const handleInsightClick = (insight) => {
    setSelectedInsight(insight);
    setTimeout(() => setSelectedInsight(null), 3000);
  };

  // ✅ Handle insight actions
  const handleInsightAction = (insight, e) => {
    e.stopPropagation();
    
    const action = insight.action;
    const link = insight.link;
    
    if (link) {
      navigate(link);
      return;
    }
    
    if (action === 'Practice now' || action === 'Review weak topics') {
      navigate('/student/discover');
    } else if (action === 'View wellness tips') {
      navigate('/student/mental-state');
    } else if (action === 'Set a daily goal') {
      toast.info('You can set daily goals in your profile settings');
    } else if (action === 'Take a quiz') {
      navigate('/student/quizzes');
    } else if (action === 'Continue learning') {
      navigate('/student/learning-path');
    } else {
      toast.info(insight.action || 'Explore this insight');
    }
  };

  if (loading) {
    return (
      <div className="insights-loading">
        <FaSpinner className="spinner" />
        <p>Analyzing your learning patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchInsights} className="retry-btn">Try Again</button>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="insights-empty">
        <FaLightbulb className="empty-icon" />
        <h3>No Insights Yet</h3>
        <p>Continue learning and we'll provide personalized insights to help you improve!</p>
        {!isOnline && <p className="offline-note">Connect to the internet for personalized insights</p>}
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h2 className="insights-title">
          <FaBrain className="title-icon" /> Learning Insights
          {!isOnline && <span className="offline-badge-small">offline</span>}
        </h2>
        <p className="insights-subtitle">
          Personalized recommendations based on your learning patterns
        </p>
      </div>

      <div className="insights-grid">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className="insight-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleInsightClick(insight)}
          >
            <div 
              className="insight-icon"
              style={{ backgroundColor: `${getInsightColor(insight.type)}20` }}
            >
              <span style={{ color: getInsightColor(insight.type) }}>
                {getInsightIcon(insight.type, insight.icon)}
              </span>
            </div>
            
            <div className="insight-content">
              <div className="insight-header">
                <h3 className="insight-title">{insight.title}</h3>
                {insight.confidence && (
                  <span className="insight-confidence" style={{ color: getInsightColor(insight.type) }}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="insight-description">{insight.description}</p>
              
              {insight.stats && (
                <div className="insight-stats">
                  {insight.stats.streak && (
                    <span className="stat-badge">
                      <FaFire /> {insight.stats.streak} day streak
                    </span>
                  )}
                  {insight.stats.improvement && (
                    <span className="stat-badge positive">
                      <FaChartLine /> +{insight.stats.improvement}% improvement
                    </span>
                  )}
                  {insight.stats.score && (
                    <span className="stat-badge">
                      <FaStar /> {insight.stats.score}% average
                    </span>
                  )}
                </div>
              )}
              
              {insight.action && (
                <button 
                  className="insight-action"
                  onClick={(e) => handleInsightAction(insight, e)}
                >
                  {insight.action} <FaArrowRight className="action-icon" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Insight Notification */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            className="insight-toast"
            initial={{ opacity: 0, y: 50, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: -20 }}
          >
            <div 
              className="toast-icon"
              style={{ backgroundColor: `${getInsightColor(selectedInsight.type)}20` }}
            >
              <span style={{ color: getInsightColor(selectedInsight.type) }}>
                {getInsightIcon(selectedInsight.type, selectedInsight.icon)}
              </span>
            </div>
            <div className="toast-content">
              <h4>{selectedInsight.title}</h4>
              <p>{selectedInsight.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Insights;