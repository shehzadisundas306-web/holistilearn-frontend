// frontend/src/context/StatsContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../api/dashboard';
import { useGetData } from './userContext';

const StatsContext = createContext(null);

export const StatsProvider = ({ children }) => {
  const { user } = useGetData();
  const [stats, setStats] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    progressToNextLevel: 0,
    streak: 0,
    completedTopics: 0,
    totalTopics: 0,
    quizzesTaken: 0,
    averageScore: 0,
    todayStudyTime: 0,
    weeklyStudyTime: 0,
    totalStudyTime: 0,
    isLoading: true
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch stats from API (only for students)
  const fetchStats = useCallback(async () => {
    // ✅ Only fetch if user is a student
    if (!user || user.role !== 'student') {
      setStats(prev => ({ ...prev, isLoading: false }));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboardSummary();
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Calculate XP to next level (100 XP per level)
        const currentLevel = data.progress?.stats?.level || data.progress?.level || 1;
        const currentXP = data.progress?.stats?.xpPoints || data.progress?.xp || 0;
        const xpInCurrentLevel = currentXP - ((currentLevel - 1) * 100);
        const xpToNextLevel = 100 - xpInCurrentLevel;
        const progressToNextLevel = Math.min(100, (xpInCurrentLevel / 100) * 100);
        
        setStats({
          level: currentLevel,
          xp: currentXP,
          xpToNextLevel: xpToNextLevel > 0 ? xpToNextLevel : 100,
          progressToNextLevel: progressToNextLevel > 0 ? progressToNextLevel : 0,
          streak: data.progress?.stats?.learningStreak || data.progress?.streak || 0,
          completedTopics: data.progress?.stats?.completedTopics || data.progress?.completedTopics || 0,
          totalTopics: data.progress?.stats?.totalTopics || data.progress?.totalTopics || 0,
          quizzesTaken: data.progress?.stats?.quizzesTaken || data.quiz?.totalQuizzes || 0,
          averageScore: Math.round(data.progress?.stats?.averageScore || data.quiz?.averageScore || 0),
          todayStudyTime: data.progress?.stats?.todayStudyTime || data.today?.studyTime || 0,
          weeklyStudyTime: data.progress?.stats?.weeklyStudyTime || 0,
          totalStudyTime: data.progress?.stats?.totalStudyTime || 0,
          isLoading: false
        });
        
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep existing stats but mark as not loading
      setStats(prev => ({ ...prev, isLoading: false }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh stats manually
  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Update specific stat (optimistic update)
  const updateStat = useCallback((key, value) => {
    setStats(prev => ({ ...prev, [key]: value }));
  }, []);

  // Add XP and check level up
  const addXP = useCallback((amount) => {
    setStats(prev => {
      const newXP = prev.xp + amount;
      const newLevel = 1 + Math.floor(newXP / 100);
      
      const xpInCurrentLevel = newXP - ((newLevel - 1) * 100);
      const xpToNextLevel = 100 - xpInCurrentLevel;
      const progressToNextLevel = Math.min(100, (xpInCurrentLevel / 100) * 100);
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: xpToNextLevel > 0 ? xpToNextLevel : 100,
        progressToNextLevel: progressToNextLevel > 0 ? progressToNextLevel : 0
      };
    });
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('statsUpdated', { 
      detail: { type: 'xp_added', amount, timestamp: new Date() } 
    }));
  }, []);

  // Increment streak
  const incrementStreak = useCallback(() => {
    setStats(prev => ({ ...prev, streak: prev.streak + 1 }));
  }, []);

  // Increment completed topics
  const incrementCompletedTopics = useCallback(() => {
    setStats(prev => ({ ...prev, completedTopics: prev.completedTopics + 1 }));
  }, []);

  // Increment quizzes taken
  const incrementQuizzesTaken = useCallback((score) => {
    setStats(prev => {
      const newTotalQuizzes = prev.quizzesTaken + 1;
      const newAverageScore = ((prev.averageScore * prev.quizzesTaken) + score) / newTotalQuizzes;
      return {
        ...prev,
        quizzesTaken: newTotalQuizzes,
        averageScore: Math.round(newAverageScore)
      };
    });
  }, []);

  // Initial fetch when user is available (only for students)
  useEffect(() => {
    if (user && user.role === 'student') {
      fetchStats();
    } else {
      // For non-students, just mark loading as false
      setLoading(false);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, fetchStats]);

  // Listen for events that should trigger stats refresh (only for students)
  useEffect(() => {
    if (user?.role !== 'student') return;
    
    const handleTopicCompleted = () => {
      refreshStats();
    };
    
    const handleQuizCompleted = () => {
      refreshStats();
    };
    
    const handleLevelUp = () => {
      refreshStats();
    };
    
    window.addEventListener('topicCompleted', handleTopicCompleted);
    window.addEventListener('quizCompleted', handleQuizCompleted);
    window.addEventListener('levelUp', handleLevelUp);
    
    return () => {
      window.removeEventListener('topicCompleted', handleTopicCompleted);
      window.removeEventListener('quizCompleted', handleQuizCompleted);
      window.removeEventListener('levelUp', handleLevelUp);
    };
  }, [refreshStats, user]);

  // Auto-refresh every 30 seconds (only for students)
  useEffect(() => {
    if (user?.role !== 'student') return;
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshStats();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshStats, user]);

  const value = {
    stats,
    loading,
    lastUpdated,
    refreshStats,
    updateStat,
    addXP,
    incrementStreak,
    incrementCompletedTopics,
    incrementQuizzesTaken
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};