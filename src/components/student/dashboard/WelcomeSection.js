// frontend/src/components/student/dashboard/WelcomeSection.js
import { motion } from "framer-motion";
import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { toast } from "sonner";
import socketService from "../../../services/socketService";
import { dashboardAPI } from "../../../api/dashboard";
import { learningPathAPI } from "../../../api/learningPath";

const WelcomeSection = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [learningProgress, setLearningProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch learning path progress
  const fetchLearningProgress = async () => {
    try {
      const response = await learningPathAPI.getCurrentPath();
      if (response.success && response.data) {
        const progress = response.data.totalProgress || 0;
        setLearningProgress(Math.round(progress));
      }
    } catch (error) {
      console.error('Error fetching learning progress:', error);
    }
  };

  // Fetch user progress from API
  const fetchUserProgress = async () => {
    try {
      const response = await dashboardAPI.getWeeklyActivity();
      
      if (response.success && response.data) {
        const progress = response.data;
        
        const storedUser = localStorage.getItem('user');
        let userName = 'Learner';
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            userName = user.username || user.name || 'Learner';
          } catch (e) {}
        }
        
        setUserData({
          name: userName,
          streak: progress.streak || progress.stats?.learningStreak || 0,
          xp: progress.totalXP || progress.stats?.xpPoints || 0,
          level: progress.level || progress.stats?.level || 1,
          todayStudyTime: progress.todayStudyTime || progress.stats?.todayStudyTime || 0,
          weeklyStudyTime: progress.weeklyStudyTime || progress.stats?.weeklyStudyTime || 0,
        });
        
        localStorage.setItem('userProgress', JSON.stringify(progress));
      } else {
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };
  
  const loadFromLocalStorage = () => {
    const storedUser = localStorage.getItem('user');
    const storedProgress = localStorage.getItem('userProgress');
    
    let userName = 'Learner';
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userName = user.username || user.name || 'Learner';
      } catch (e) {}
    }
    
    if (storedProgress) {
      try {
        const progress = JSON.parse(storedProgress);
        setUserData({
          name: userName,
          streak: progress.streak || progress.stats?.learningStreak || 0,
          xp: progress.totalXP || progress.stats?.xpPoints || 0,
          level: progress.level || progress.stats?.level || 1,
          todayStudyTime: progress.todayStudyTime || progress.stats?.todayStudyTime || 0
        });
      } catch (e) {
        setDefaultUserData(userName);
      }
    } else {
      setDefaultUserData(userName);
    }
    setLoading(false);
  };
  
  const setDefaultUserData = (userName) => {
    setUserData({
      name: userName,
      streak: 0,
      xp: 0,
      level: 1,
      todayStudyTime: 0
    });
  };

  // Handle real-time progress updates from socket
  const handleProgressUpdate = (data) => {
    console.log('📊 WelcomeSection: Progress update received', data);
    
    if (data.type === 'full_update' && data.data) {
      const progress = data.data;
      
      // Update user stats
      setUserData(prev => ({
        ...prev,
        streak: progress.stats?.learningStreak || prev?.streak || 0,
        xp: progress.stats?.xpPoints || prev?.xp || 0,
        level: progress.stats?.level || prev?.level || 1,
        todayStudyTime: progress.stats?.todayStudyTime || 0,
        weeklyStudyTime: progress.stats?.weeklyStudyTime || 0,
      }));
      
      // Update learning path progress
      if (progress.stats?.completedTopics && progress.stats?.totalTopics) {
        const pathProgress = (progress.stats.completedTopics / progress.stats.totalTopics) * 100;
        setLearningProgress(Math.round(pathProgress));
      }
      
      localStorage.setItem('userProgress', JSON.stringify(progress));
      
    } else if (data.type === 'incremental') {
      if (data.data?.xpEarned) {
        setUserData(prev => ({
          ...prev,
          xp: (prev?.xp || 0) + data.data.xpEarned
        }));
      }
      if (data.data?.level) {
        setUserData(prev => ({
          ...prev,
          level: data.data.level
        }));
      }
    }
  };

  // Handle topic completion - update learning progress
  const handleTopicCompleted = (data) => {
    console.log('📚 WelcomeSection: Topic completed', data);
    fetchLearningProgress(); // Refresh learning path progress
    toast.success(`🎉 ${data.topicTitle || 'Topic'} completed!`, {
      duration: 3000,
      icon: '📚'
    });
  };

  // Handle level up events
  const handleLevelUp = (data) => {
    console.log('🎉 Level up event in WelcomeSection:', data);
    
    setUserData(prev => ({
      ...prev,
      level: data.newLevel,
      xp: data.totalXP || prev?.xp || 0
    }));
    
    toast.success(`🎉 Congratulations! You've reached Level ${data.newLevel}!`, {
      duration: 5000,
      icon: '🎉'
    });
  };

  // Handle XP earned events
  const handleXPEarned = (data) => {
    console.log('💎 XP earned in WelcomeSection:', data);
    
    setUserData(prev => ({
      ...prev,
      xp: data.totalXP || (prev?.xp || 0) + data.amount
    }));
    
    if (data.amount >= 10) {
      toast.success(`+${data.amount} XP from ${data.source || 'quiz'}!`, {
        duration: 2000,
        icon: '💎'
      });
    }
  };

  // Handle socket connection
  const handleSocketConnected = () => {
    console.log('Socket connected in WelcomeSection');
    setIsOnline(true);
    setTimeout(() => {
      socketService.requestProgressUpdate();
      fetchLearningProgress();
    }, 500);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getMotivationalMessage = () => {
    if (learningProgress >= 100) {
      return "🎉 Congratulations! You've completed your learning path!";
    }
    if (learningProgress >= 75) {
      return "🔥 Almost there! Complete the final stretch!";
    }
    if (learningProgress >= 50) {
      return "💪 Halfway there! Keep pushing forward!";
    }
    if (learningProgress >= 25) {
      return "📚 Great progress! You're on the right track!";
    }
    if (userData?.streak >= 7) {
      return "🔥 Amazing streak! Keep the momentum going!";
    }
    if (userData?.xp >= 500) {
      return "🌟 You're on fire! Ready for the next challenge?";
    }
    return "Ready to continue your learning journey? Let's make today productive!";
  };

  const getProgressColor = () => {
    if (learningProgress >= 75) return '#10b981';
    if (learningProgress >= 50) return '#f5c45e';
    if (learningProgress >= 25) return '#f59e0b';
    return '#3b82f6';
  };

  useEffect(() => {
    fetchUserProgress();
    fetchLearningProgress();
    
    if (socketService) {
      const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
      const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
      const unsubscribeTopic = socketService.on('topic-completed', handleTopicCompleted);
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
        if (unsubscribeTopic) unsubscribeTopic();
        if (unsubscribeLevelUp) unsubscribeLevelUp();
        if (unsubscribeXPEarned) unsubscribeXPEarned();
        if (unsubscribeConnected) unsubscribeConnected();
      };
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <motion.div
        className="welcome-card-premium"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="welcome-content" style={{ textAlign: "center" }}>
          <CircularProgress />
          <p style={{ marginTop: "1rem", color: "#666" }}>Loading your dashboard...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="welcome-card-premium"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="card-glow-effect"></div>

      <div className="welcome-content">
        <motion.div 
          initial={{ x: -20 }} 
          animate={{ x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>
            {getGreeting()}, <span className="text-gold">{userData?.name || 'Learner'}</span>!
            {!isOnline && (
              <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', color: '#888' }}>
                (offline)
              </span>
            )}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#888" }}>
            {getMotivationalMessage()}
          </p>
        </motion.div>
        
        {/* Stats Grid - 4 columns now (no Topics Done) */}
        <div className="welcome-stats-mini">
          <div className="mini-stat">
            <strong>{userData?.streak || 0}</strong>
            <span>Day Streak</span>
          </div>
          <div className="stat-divider"></div>
          <div className="mini-stat">
            <strong>{userData?.xp || 0}</strong>
            <span>Total XP</span>
          </div>
          <div className="stat-divider"></div>
          <div className="mini-stat">
            <strong>Lv {userData?.level || 1}</strong>
            <span>Level</span>
          </div>
        </div>
        
        {/* Learning Path Progress Bar - REPLACES Topics Done */}
        <div className="learning-progress-container mt-3">
          <div className="progress-header">
            <span className="progress-label">Learning Path Progress</span>
            <span className="progress-value">{learningProgress}%</span>
          </div>
          <div className="learning-progress-bar-bg">
            <motion.div 
              className="learning-progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${learningProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ backgroundColor: getProgressColor() }}
            />
          </div>
          {learningProgress === 0 && (
            <p className="progress-hint">Start your first topic to begin your journey!</p>
          )}
          {learningProgress > 0 && learningProgress < 100 && (
            <p className="progress-hint">{100 - learningProgress}% left to complete</p>
          )}
          {learningProgress === 100 && (
            <p className="progress-hint success">🎉 Complete! You've mastered this path!</p>
          )}
        </div>
        
        {/* XP Progress Bar */}
        {userData && (
          <div className="xp-progress-mini mt-2">
            <div className="xp-progress-bar-bg">
              <div 
                className="xp-progress-bar-fill"
                style={{ width: `${(userData.xp || 0) % 100}%` }}
              />
            </div>
            <span className="xp-progress-text text-white">
              {(userData.xp || 0) % 100}/100 XP to next level
            </span>
          </div>
        )}
      </div>

      <motion.button 
        className="resume-btn-premium1"
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245, 196, 94, 0.4)" }}
        whileTap={{ scale: 0.95 }} 
        onClick={() => navigate('/student/learning-path')}
      >
        <FaPlay className="play-icon" />
        Resume Learning
      </motion.button>
    </motion.div>
  );
};

export default WelcomeSection;