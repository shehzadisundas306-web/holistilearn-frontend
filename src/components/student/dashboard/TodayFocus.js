// frontend/src/components/student/dashboard/TodayFocus.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaClock, FaCheckCircle, FaList, FaChartLine,} from 'react-icons/fa';
import { dashboardAPI } from '../../../api/dashboard';
import socketService from '../../../services/socketService';
import { toast } from 'sonner';

const TodayFocus = () => {
  const [focusData, setFocusData] = useState({
    schedule: [],
    totalPlanned: 0,
    completed: 0,
    remaining: 120,
    goal: 120,
    progress: 0,
    recommendedFocus: [],
    mood: 'happy',
    motivation: 'medium',
    activitiesDone: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const isUpdatingRef = useRef(false); // Prevent infinite loop

  const fetchTodayFocus = useCallback(async () => {
    // Skip if already updating to prevent loops
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      setLoading(true);
      const response = await dashboardAPI.getTodayFocus();
      
      if (response.success && response.data) {
        setFocusData(prev => ({
          ...prev,
          ...response.data,
          // Preserve goal if not provided
          goal: response.data.goal || prev.goal,
          remaining: response.data.remaining || (response.data.goal - response.data.completed) || 120
        }));
      }
    } catch (err) {
      console.error('Error fetching today focus:', err);
      setError('Failed to load today\'s focus');
    } finally {
      setLoading(false);
      isUpdatingRef.current = false;
    }
  }, []);

  // ✅ FIXED: Handle real-time progress updates - NO API CALL HERE
  const handleProgressUpdate = useCallback((data) => {
    console.log('📊 TodayFocus: Progress update received', data);
    
    if (data.type === 'full_update' && data.data) {
      const progress = data.data;
      
      // Get today's study time from the progress data
      let todayStudyTime = progress.stats?.todayStudyTime || 0;
      
      // If todayStudyTime is 0 but we have recent activity, calculate from activities
      if (todayStudyTime === 0 && progress.recentActivity) {
        const today = new Date().toDateString();
        const todayActivities = progress.recentActivity.filter(activity => {
          const activityDate = new Date(activity.timestamp).toDateString();
          return activityDate === today;
        });
        
        // Estimate study time from activities (each activity ~15-30 min)
        todayStudyTime = todayActivities.length * 15;
      }
      
      const goal = focusData.goal || 120;
      const newProgress = Math.min(100, (todayStudyTime / goal) * 100);
      
      // Update state without triggering API call
      setFocusData(prev => ({
        ...prev,
        completed: todayStudyTime,
        progress: newProgress,
        remaining: Math.max(0, goal - todayStudyTime),
        activitiesDone: progress.stats?.completedTopics || prev.activitiesDone,
        mood: progress.mentalState?.mood || prev.mood,
        motivation: progress.mentalState?.motivationLevel || prev.motivation
      }));
      
      console.log('Updated TodayFocus:', { todayStudyTime, goal, newProgress });
      
    } else if (data.type === 'quiz_submitted') {
      // Quiz completed - add time
      setFocusData(prev => {
        const timeSpent = data.data?.timeSpent || 15;
        const newCompleted = prev.completed + timeSpent;
        const newProgress = Math.min(100, (newCompleted / prev.goal) * 100);
        
        toast.success(`✅ Quiz completed! +${timeSpent} min`, {
          duration: 3000,
          icon: '🎯'
        });
        
        return {
          ...prev,
          completed: newCompleted,
          progress: newProgress,
          remaining: Math.max(0, prev.goal - newCompleted),
          activitiesDone: prev.activitiesDone + 1
        };
      });
    }
  }, [focusData.goal]);

  // Handle topic completion
  const handleTopicCompleted = useCallback((data) => {
    console.log('📚 TodayFocus: Topic completed', data);
    
    setFocusData(prev => {
      const duration = data.duration || 30;
      const newCompleted = prev.completed + duration;
      const newProgress = Math.min(100, (newCompleted / prev.goal) * 100);
      
      toast.success(`✅ Topic completed: ${data.topicTitle || 'Topic'}! +${duration} min`, {
        duration: 3000,
        icon: '📚'
      });
      
      return {
        ...prev,
        completed: newCompleted,
        progress: newProgress,
        remaining: Math.max(0, prev.goal - newCompleted),
        activitiesDone: prev.activitiesDone + 1
      };
    });
  }, [focusData.goal]);

  // Handle socket connection
  const handleSocketConnected = useCallback(() => {
    console.log('Socket connected in TodayFocus');
    setIsOnline(true);
    setTimeout(() => {
      socketService.requestProgressUpdate();
    }, 500);
  }, []);

  // Handle session start
  const handleStartSession = useCallback(async (session, index) => {
    toast.info(`Starting: ${session.title}`, {
      duration: 2000,
      icon: '🚀'
    });
    
    // Optimistic update
    setFocusData(prev => {
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[index] = { ...session, completed: true };
      const newCompleted = prev.completed + session.duration;
      const newProgress = Math.min(100, (newCompleted / prev.goal) * 100);
      
      return {
        ...prev,
        schedule: updatedSchedule,
        completed: newCompleted,
        progress: newProgress,
        remaining: Math.max(0, prev.goal - newCompleted),
        activitiesDone: prev.activitiesDone + 1
      };
    });
    
    if (isOnline) {
      socketService.emit('session-completed', {
        sessionId: session.id,
        title: session.title,
        duration: session.duration,
        type: session.type,
        timestamp: new Date()
      });
      // Request progress update but don't fetch API again
      socketService.requestProgressUpdate();
    }
  }, [isOnline, focusData.goal]);

  // Add manual progress increase for testing
  const addManualProgress = useCallback((minutes) => {
    setFocusData(prev => {
      const newCompleted = prev.completed + minutes;
      const newProgress = Math.min(100, (newCompleted / prev.goal) * 100);
      
      toast.success(`+${minutes} minutes added to your focus! 🎯`, {
        duration: 2000,
        icon: '⏰'
      });
      
      if (isOnline) {
        socketService.emit('manual-progress', {
          minutes: minutes,
          timestamp: new Date()
        });
      }
      
      return {
        ...prev,
        completed: newCompleted,
        progress: newProgress,
        remaining: Math.max(0, prev.goal - newCompleted)
      };
    });
  }, [isOnline, focusData.goal]);

  // Initial load only - NO socket dependency
  useEffect(() => {
    fetchTodayFocus();
  }, [fetchTodayFocus]);

  // Setup socket listeners - NO API calls inside
  useEffect(() => {
    if (!socketService) return;
    
    const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
    const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
    const unsubscribeQuiz = socketService.on('quiz-completed', handleProgressUpdate);
    const unsubscribeTopic = socketService.on('topic-completed', handleTopicCompleted);
    const unsubscribeConnected = socketService.on('socket:connected', handleSocketConnected);
    
    setIsOnline(socketService.getConnectionStatus());
    
    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeIncremental) unsubscribeIncremental();
      if (unsubscribeQuiz) unsubscribeQuiz();
      if (unsubscribeTopic) unsubscribeTopic();
      if (unsubscribeConnected) unsubscribeConnected();
    };
  }, [handleProgressUpdate, handleTopicCompleted, handleSocketConnected]);

  // Get mood emoji and color
  const getMoodInfo = (mood) => {
    const moods = {
      happy: { emoji: '😊', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
      neutral: { emoji: '😐', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
      sad: { emoji: '😔', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
      anxious: { emoji: '😰', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      tired: { emoji: '😴', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
      energetic: { emoji: '⚡', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      stressed: { emoji: '😫', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    };
    return moods[mood] || moods.neutral;
  };

  const getMotivationColor = (level) => {
    const colors = {
      high: '#10b981',
      medium: '#f59e0b',
      low: '#ef4444'
    };
    return colors[level] || '#6b7280';
  };

  const getMotivationMessage = () => {
    if (focusData.progress >= 100) {
      return "🎉 Amazing! You've completed your daily goal!";
    } else if (focusData.progress >= 75) {
      return "🔥 Almost there! Just a little more to go!";
    } else if (focusData.progress >= 50) {
      return "💪 Great progress! Keep the momentum going!";
    } else if (focusData.progress >= 25) {
      return "📚 You're making good progress! Stay focused!";
    } else if (focusData.completed > 0) {
      return "🌟 Great start! Keep learning!";
    } else {
      return "✨ Ready to start your learning journey today?";
    }
  };

  const isDev = process.env.NODE_ENV === 'development';

  if (loading) {
    return (
      <div className="today-focus-card loading">
        <div className="loading-spinner-small"></div>
        <p>Loading your focus plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="today-focus-card error">
        <p>⚠️ {error}</p>
        <button onClick={fetchTodayFocus} className="retry-btn-small">Retry</button>
      </div>
    );
  }

  const moodInfo = getMoodInfo(focusData.mood);
  const motivationColor = getMotivationColor(focusData.motivation);

  return (
    <motion.div 
      className="today-focus-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative' }}
    >
      {/* Test Buttons - Only show in development */}
      {isDev && (
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          display: 'flex', 
          gap: '5px',
          zIndex: 10
        }}>
          <button 
            onClick={() => addManualProgress(15)}
            style={{ background: '#10b981', border: 'none', borderRadius: '20px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: 'white' }}
          >
            +15min
          </button>
          <button 
            onClick={() => addManualProgress(30)}
            style={{ background: '#f59e0b', border: 'none', borderRadius: '20px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: 'white' }}
          >
            +30min
          </button>
          <button 
            onClick={() => addManualProgress(60)}
            style={{ background: '#ef4444', border: 'none', borderRadius: '20px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: 'white' }}
          >
            +60min
          </button>
        </div>
      )}

      <div className="focus-header">
        <h3 className="focus-title">
          <FaBrain className="focus-icon" /> Today's Focus
          {!isOnline && <span className="offline-badge-small">offline</span>}
        </h3>
        <div className="focus-stats-mini">
          <span className="stat-badge">
            <FaClock /> {Math.round(focusData.completed)} / {focusData.goal} min
          </span>
          <span className="stat-badge" style={{ background: moodInfo.bg, color: moodInfo.color }}>
            {moodInfo.emoji} {focusData.mood}
          </span>
        </div>
      </div>

      {/* Progress Circle */}
      <div className="focus-progress-circle">
        <svg className="progress-ring" width="120" height="120">
          <circle
            className="progress-ring-bg"
            stroke="#e0e0e0"
            strokeWidth="8"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
          />
          <circle
            className="progress-ring-fill"
            stroke="#F5C45E"
            strokeWidth="8"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - focusData.progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text x="60" y="65" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
            {Math.round(focusData.progress)}%
          </text>
        </svg>
      </div>

      {/* Progress Message */}
      <div className="focus-message">
        <p className="motivation-text">{getMotivationMessage()}</p>
        <div className="motivation-bar">
          <div 
            className="motivation-fill"
            style={{ 
              width: `${focusData.progress}%`,
              backgroundColor: motivationColor,
              transition: 'width 0.5s ease'
            }}
          />
        </div>
      </div>

      {/* Schedule Sessions */}
      {focusData.schedule && focusData.schedule.length > 0 && (
        <div className="focus-sessions">
          <h4 className="section-title">
            <FaList /> Today's Plan
          </h4>
          <div className="sessions-list">
            {focusData.schedule.map((session, index) => (
              <div key={session.id || index} className={`session-item ${session.completed ? 'completed' : ''}`}>
                <div className="session-icon">
                  {session.type === 'topic' ? '📚' : session.type === 'quiz' ? '❓' : '🔄'}
                </div>
                <div className="session-info">
                  <p className="session-title">{session.title}</p>
                  <p className="session-duration">{session.duration} minutes</p>
                </div>
                <div className="session-status">
                  {session.completed ? (
                    <FaCheckCircle className="completed-icon" />
                  ) : (
                    <button 
                      className="start-session-btn"
                      onClick={() => handleStartSession(session, index)}
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Focus Topics */}
      {focusData.recommendedFocus && focusData.recommendedFocus.length > 0 && (
        <div className="focus-recommendations">
          <h4 className="section-title">
            <FaChartLine /> Recommended Focus
          </h4>
          <div className="recommendations-list">
            {focusData.recommendedFocus.map((topic, index) => (
              <div key={index} className="recommendation-badge">
                {topic}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mental Health Tip */}
      {(focusData.mood === 'stressed' || focusData.mood === 'tired' || focusData.motivation === 'low') && (
        <div className="mental-health-tip">
          <FaList className="tip-icon" />
          <div className="tip-content">
            <h4>Take a Moment</h4>
            <p>Your {focusData.mood === 'stressed' ? 'stress levels' : 'energy'} seem low. Try a quick 2-minute breathing exercise.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TodayFocus;