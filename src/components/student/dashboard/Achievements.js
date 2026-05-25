// frontend/src/components/student/dashboard/Achievements.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaStar, FaFire, FaMedal, FaAward, 
  FaCheckCircle, FaLock, FaSpinner, FaGift,
  FaChartLine, FaBrain, FaBookOpen, FaCode
} from 'react-icons/fa';
import { dashboardAPI } from '../../../api/dashboard';
import socketService from '../../../services/socketService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Achievements = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [stats, setStats] = useState({ totalEarned: 0, totalAvailable: 0 });
  const [newAchievement, setNewAchievement] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  // ✅ Fetch achievements from API
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAchievements();
      
      console.log('📊 Achievements API Response:', response);
      
      if (response.success && response.data) {
        // Handle different response structures
        let achievementsList = [];
        let totalEarned = 0;
        let totalAvailable = 10; // Default
        
        if (response.data.earned?.all) {
          achievementsList = response.data.earned.all;
          totalEarned = response.data.totalEarned || achievementsList.length;
        } else if (Array.isArray(response.data)) {
          achievementsList = response.data;
          totalEarned = achievementsList.length;
        } else if (response.data.achievements) {
          achievementsList = response.data.achievements;
          totalEarned = achievementsList.length;
        }
        
        setAchievements(achievementsList);
        setStats({
          totalEarned: totalEarned,
          totalAvailable: response.data.totalAvailable || totalAvailable
        });
      } else {
        // If no real data, show mock achievements for demo
        console.log('No real achievements data, showing demo achievements');
        setAchievements(getMockAchievements());
        setStats({
          totalEarned: getMockAchievements().length,
          totalAvailable: 10
        });
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements');
      // Show mock data on error
      setAchievements(getMockAchievements());
      setStats({
        totalEarned: getMockAchievements().length,
        totalAvailable: 10
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Mock achievements for demo/testing
  const getMockAchievements = () => {
    return [
      {
        achievementId: 'first_quiz',
        name: 'First Quiz',
        description: 'Completed your first quiz',
        icon: '🏆',
        xpReward: 50,
        earnedAt: new Date().toISOString()
      },
      {
        achievementId: 'seven_day_streak',
        name: 'Week Warrior',
        description: 'Maintained a 7-day learning streak',
        icon: '🔥',
        xpReward: 100,
        earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  // ✅ Handle real-time achievement earned from socket
  const handleAchievementEarned = useCallback((data) => {
    console.log('🏆 Achievement earned event received:', data);
    
    // Extract achievement data from different possible structures
    let newAchievementData = null;
    
    if (data.achievement) {
      newAchievementData = data.achievement;
    } else if (data.data) {
      newAchievementData = data.data;
    } else {
      newAchievementData = data;
    }
    
    const formattedAchievement = {
      achievementId: newAchievementData.achievementId || `achievement_${Date.now()}`,
      name: newAchievementData.name || 'New Achievement',
      description: newAchievementData.description || 'You\'ve earned a new achievement!',
      icon: newAchievementData.icon || '🏆',
      xpReward: newAchievementData.xpReward || 50,
      earnedAt: new Date().toISOString()
    };
    
    // Add to achievements list (prevent duplicates)
    setAchievements(prev => {
      // Check if already exists
      const exists = prev.some(a => a.achievementId === formattedAchievement.achievementId);
      if (exists) return prev;
      return [formattedAchievement, ...prev];
    });
    
    setStats(prev => ({
      ...prev,
      totalEarned: prev.totalEarned + 1
    }));
    
    // Show toast notification
    toast.success(`🏆 Achievement Unlocked: ${formattedAchievement.name}!`, {
      duration: 5000,
      icon: '🏆'
    });
    
    // Show animated achievement popup
    setNewAchievement(formattedAchievement);
    setTimeout(() => setNewAchievement(null), 5000);
  }, []);

  // ✅ Handle quiz completion (may trigger achievements)
  const handleQuizCompleted = useCallback((data) => {
    console.log('📝 Quiz completed event:', data);
    
    // Check if perfect score achievement should trigger
    if (data.score === 100) {
      const perfectScoreAchievement = {
        achievementId: 'perfect_score',
        name: 'Perfect Score!',
        description: 'Got 100% on a quiz',
        icon: '🌟',
        xpReward: 100,
        earnedAt: new Date().toISOString()
      };
      
      setAchievements(prev => {
        const exists = prev.some(a => a.achievementId === 'perfect_score');
        if (exists) return prev;
        return [perfectScoreAchievement, ...prev];
      });
      
      setStats(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + 1
      }));
      
      toast.success('🏆 Perfect Score! Achievement Unlocked!', {
        duration: 5000,
        icon: '🌟'
      });
      
      setNewAchievement(perfectScoreAchievement);
      setTimeout(() => setNewAchievement(null), 5000);
    }
  }, []);

  // ✅ Handle level up (may trigger achievements)
  const handleLevelUp = useCallback((data) => {
    console.log('⭐ Level up event:', data);
    
    // Check for level-based achievements
    if (data.newLevel >= 5) {
      const levelAchievement = {
        achievementId: 'level_5',
        name: 'Level 5 Achieved!',
        description: `Reached Level ${data.newLevel}`,
        icon: '🎯',
        xpReward: 200,
        earnedAt: new Date().toISOString()
      };
      
      setAchievements(prev => {
        const exists = prev.some(a => a.achievementId === 'level_5');
        if (exists) return prev;
        return [levelAchievement, ...prev];
      });
      
      setStats(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + 1
      }));
      
      toast.success(`🏆 Level ${data.newLevel} Achievement Unlocked!`, {
        duration: 5000,
        icon: '🎯'
      });
      
      setNewAchievement(levelAchievement);
      setTimeout(() => setNewAchievement(null), 5000);
    }
  }, []);

  // ✅ Handle streak milestone
  const handleStreakMilestone = useCallback((data) => {
    console.log('🔥 Streak milestone event:', data);
    
    if (data.streak === 7) {
      const streakAchievement = {
        achievementId: 'seven_day_streak',
        name: 'Week Warrior',
        description: '7-day learning streak!',
        icon: '🔥',
        xpReward: 150,
        earnedAt: new Date().toISOString()
      };
      
      setAchievements(prev => {
        const exists = prev.some(a => a.achievementId === 'seven_day_streak');
        if (exists) return prev;
        return [streakAchievement, ...prev];
      });
      
      setStats(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + 1
      }));
      
      toast.success('🔥 Week Warrior! 7-day streak achievement unlocked!', {
        duration: 5000,
        icon: '🔥'
      });
      
      setNewAchievement(streakAchievement);
      setTimeout(() => setNewAchievement(null), 5000);
    }
  }, []);

  // ✅ Handle socket connection
  const handleSocketConnected = useCallback(() => {
    console.log('Socket connected in Achievements');
    setIsOnline(true);
    fetchAchievements(); // Refresh on reconnect
    setTimeout(() => {
      socketService.requestProgressUpdate();
    }, 500);
  }, [fetchAchievements]);

  // ✅ Setup socket listeners
  useEffect(() => {
    fetchAchievements();
    
    if (socketService) {
      const unsubscribeAchievement = socketService.on('achievement-earned', handleAchievementEarned);
      const unsubscribeAchievements = socketService.on('achievements-unlocked', handleAchievementsUnlocked);
      const unsubscribeQuiz = socketService.on('quiz-completed', handleQuizCompleted);
      const unsubscribeLevelUp = socketService.on('level-up', handleLevelUp);
      const unsubscribeStreak = socketService.on('streak-milestone', handleStreakMilestone);
      const unsubscribeProgress = socketService.on('progress-update', () => {
        // Refresh achievements on any progress update
        fetchAchievements();
      });
      const unsubscribeConnected = socketService.on('socket:connected', handleSocketConnected);
      
      setIsOnline(socketService.getConnectionStatus());
      
      return () => {
        if (unsubscribeAchievement) unsubscribeAchievement();
        if (unsubscribeAchievements) unsubscribeAchievements();
        if (unsubscribeQuiz) unsubscribeQuiz();
        if (unsubscribeLevelUp) unsubscribeLevelUp();
        if (unsubscribeStreak) unsubscribeStreak();
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeConnected) unsubscribeConnected();
      };
    }
  }, [fetchAchievements, handleAchievementEarned, handleQuizCompleted, handleLevelUp, handleStreakMilestone, handleSocketConnected]);

  // ✅ Handle multiple achievements unlocked
  const handleAchievementsUnlocked = (data) => {
    console.log('🏆 Multiple achievements unlocked:', data);
    
    if (data.achievements && data.achievements.length > 0) {
      const newAchievements = data.achievements.map(ach => ({
        achievementId: ach.achievementId,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward || 50,
        earnedAt: new Date().toISOString()
      }));
      
      setAchievements(prev => [...newAchievements, ...prev]);
      setStats(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + newAchievements.length
      }));
      
      toast.success(`🎉 ${newAchievements.length} New Achievement${newAchievements.length > 1 ? 's' : ''} Unlocked!`, {
        duration: 5000,
        icon: '🏆'
      });
      
      if (newAchievements.length > 0) {
        setNewAchievement(newAchievements[0]);
        setTimeout(() => setNewAchievement(null), 5000);
      }
    }
  };

  const getAchievementIcon = (iconName, achievementId) => {
    const icons = {
      '🏆': <FaTrophy />,
      '🌟': <FaStar />,
      '🔥': <FaFire />,
      '📚': <FaBookOpen />,
      '🧠': <FaBrain />,
      '💻': <FaCode />,
      '🎯': <FaChartLine />,
      '🏅': <FaMedal />,
      '🎖️': <FaAward />,
      '🎁': <FaGift />
    };
    
    const defaultIcons = {
      first_quiz: <FaTrophy />,
      perfect_score: <FaStar />,
      seven_day_streak: <FaFire />,
      thirty_day_streak: <FaFire style={{ color: '#ff6b6b' }} />,
      five_topics: <FaBookOpen />,
      ten_topics: <FaBookOpen style={{ color: '#10b981' }} />,
      notes_master: <FaBrain />,
      code_master: <FaCode />,
      quiz_master: <FaMedal />,
      quiz_legend: <FaTrophy />,
      level_5: <FaChartLine />
    };
    
    return defaultIcons[achievementId] || icons[iconName] || <FaMedal />;
  };

  const getAchievementColor = (achievementId) => {
    const colors = {
      first_quiz: '#10b981',
      perfect_score: '#f59e0b',
      seven_day_streak: '#ef4444',
      thirty_day_streak: '#dc2626',
      five_topics: '#3b82f6',
      ten_topics: '#10b981',
      notes_master: '#8b5cf6',
      code_master: '#06b6d4',
      quiz_master: '#f59e0b',
      quiz_legend: '#F5C45E',
      level_5: '#8b5cf6'
    };
    return colors[achievementId] || '#F5C45E';
  };

  const getAchievementLevel = (achievementId) => {
    const levels = {
      first_quiz: 'Bronze',
      perfect_score: 'Silver',
      seven_day_streak: 'Gold',
      thirty_day_streak: 'Platinum',
      five_topics: 'Bronze',
      ten_topics: 'Silver',
      notes_master: 'Gold',
      code_master: 'Platinum',
      quiz_master: 'Gold',
      quiz_legend: 'Diamond',
      level_5: 'Silver'
    };
    return levels[achievementId] || 'Bronze';
  };

  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
    setTimeout(() => setSelectedAchievement(null), 3000);
  };

  if (loading) {
    return (
      <div className="achievements-loading">
        <FaSpinner className="spinner" />
        <p>Loading your achievements...</p>
      </div>
    );
  }

  const progressPercentage = stats.totalAvailable > 0 
    ? (stats.totalEarned / stats.totalAvailable) * 100 
    : 0;

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <div className="header-left">
          <h2 className="achievements-title">
            <FaTrophy className="title-icon" /> Your Achievements
            {!isOnline && <span className="offline-badge-small"> Offline</span>}
          </h2>
          <p className="achievements-subtitle">
            Collect badges as you progress in your learning journey
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-circle">
            <span className="stat-number">{stats.totalEarned}</span>
            <span className="stat-label">Earned</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-circle">
            <span className="stat-number">{stats.totalAvailable}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="achievements-progress">
        <div className="progress-info">
          <span>Overall Progress</span>
          <span className="progress-percent">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar-bg">
          <motion.div 
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {achievements.length === 0 ? (
          <div className="no-achievements">
            <FaMedal className="no-icon" />
            <h3>No Achievements Yet</h3>
            <p>Complete quizzes, maintain streaks, and master topics to earn achievements!</p>
            <button className="start-learning-btn" onClick={() => navigate('/student/discover')}>
              Start Learning
            </button>
          </div>
        ) : (
          achievements.map((achievement, index) => (
            <motion.div
              key={achievement.achievementId || index}
              className="achievement-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => handleAchievementClick(achievement)}
            >
              <div 
                className="achievement-icon"
                style={{ 
                  background: `linear-gradient(135deg, ${getAchievementColor(achievement.achievementId)}20, ${getAchievementColor(achievement.achievementId)}40)`,
                  borderColor: getAchievementColor(achievement.achievementId)
                }}
              >
                {getAchievementIcon(achievement.icon, achievement.achievementId)}
              </div>
              
              <div className="achievement-info">
                <div className="achievement-header">
                  <h3 className="achievement-name">{achievement.name}</h3>
                  <span 
                    className="achievement-level"
                    style={{ background: `${getAchievementColor(achievement.achievementId)}20`, color: getAchievementColor(achievement.achievementId) }}
                  >
                    {getAchievementLevel(achievement.achievementId)}
                  </span>
                </div>
                <p className="achievement-description">{achievement.description}</p>
                <div className="achievement-footer">
                  <div className="achievement-xp">
                    <FaStar className="xp-icon" />
                    <span>+{achievement.xpReward || 50} XP</span>
                  </div>
                  <div className="achievement-date">
                    {achievement.earnedAt && (
                      <span>Earned: {new Date(achievement.earnedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="achievement-check">
                <FaCheckCircle className="check-icon" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* New Achievement Popup Animation */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            className="new-achievement-popup"
            initial={{ opacity: 0, scale: 0.3, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: -100 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <div className="popup-icon" style={{ 
              background: `linear-gradient(135deg, ${getAchievementColor(newAchievement.achievementId)}, ${getAchievementColor(newAchievement.achievementId)}80)`
            }}>
              {getAchievementIcon(newAchievement.icon, newAchievement.achievementId)}
            </div>
            <div className="popup-content">
              <h4>🎉 Achievement Unlocked!</h4>
              <h3>{newAchievement.name}</h3>
              <p>{newAchievement.description}</p>
              <div className="popup-xp">
                <FaStar /> +{newAchievement.xpReward || 50} XP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Detail Toast */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            className="achievement-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            <div className="toast-icon">
              {getAchievementIcon(selectedAchievement.icon, selectedAchievement.achievementId)}
            </div>
            <div className="toast-content">
              <h4>{selectedAchievement.name}</h4>
              <p>{selectedAchievement.description}</p>
              <div className="toast-xp">
                <FaStar /> +{selectedAchievement.xpReward || 50} XP
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Achievements;