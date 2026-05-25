// frontend/src/api/progress.js
import axios from 'axios';

const PROGRESS_API_URL = process.env.REACT_APP_PROGRESS_API_URL || 'http://localhost:5000/api';

const progressApi = axios.create({
  baseURL: PROGRESS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Add token interceptor
progressApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 Progress API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
progressApi.interceptors.response.use(
  (response) => {
    console.log(`📥 Progress API: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response?.status !== 404) {
      console.error('❌ Progress API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ============= MOCK DATA (Fallback) =============

const getMockProgressData = () => ({
  success: true,
  data: {
    stats: {
      completedLessons: 12,
      quizzesTaken: 15,
      averageScore: 78,
      learningStreak: 5,
      xpPoints: 1250,
      level: 3,
      totalStudyTime: 720,
      totalTopics: 20,
      completedTopics: 12,
      inProgressTopics: 3,
      todayStudyTime: 45,
      weeklyStudyTime: 210,
      xpToNextLevel: 250,
      progressToNextLevel: 65
    },
    recentActivity: [],
    inProgress: [],
    achievements: [],
    weeklyProgress: [],
    quizStats: {
      totalQuizzes: 15,
      averageScore: 78,
      weakTopics: [],
      topicsMastered: []
    }
  }
});

const getMockWeeklyData = () => ({
  success: true,
  data: {
    currentWeek: {
      days: [
        { dayName: 'Mon', studyTime: 0, date: new Date() },
        { dayName: 'Tue', studyTime: 0, date: new Date() },
        { dayName: 'Wed', studyTime: 0, date: new Date() },
        { dayName: 'Thu', studyTime: 0, date: new Date() },
        { dayName: 'Fri', studyTime: 0, date: new Date() },
        { dayName: 'Sat', studyTime: 0, date: new Date() },
        { dayName: 'Sun', studyTime: 0, date: new Date() }
      ],
      totalStudyTime: 0
    },
    averageDaily: 0,
    mostProductiveDay: null,
    trend: { direction: 'stable', studyTimeChange: 0 }
  }
});

// ============= API METHODS =============

export const progressAPI = {
  // ✅ FIXED: Get weekly activity - NOW USING CORRECT ENDPOINT
  getWeeklyActivity: async () => {
    try {
      // ✅ CHANGE THIS: from '/dashboard/weekly' to '/progress/weekly'
      const response = await progressApi.get('/progress/weekly');
      
      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      console.log('No weekly data, using mock');
      return getMockWeeklyData();
      
    } catch (error) {
      console.error('Get weekly activity error:', error);
      return getMockWeeklyData();
    }
  },

  // Get progress overview
  getProgressOverview: async () => {
    try {
      const response = await progressApi.get('/dashboard/summary');
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        
        return {
          success: true,
          data: {
            stats: {
              completedLessons: data.progress?.stats?.completedLessons || data.stats?.completedLessons || 0,
              quizzesTaken: data.progress?.stats?.quizzesTaken || data.stats?.quizzesTaken || 0,
              averageScore: data.progress?.stats?.averageScore || data.stats?.averageScore || 0,
              learningStreak: data.progress?.stats?.learningStreak || data.stats?.learningStreak || 0,
              xpPoints: data.progress?.stats?.xpPoints || data.stats?.xpPoints || 0,
              level: data.progress?.stats?.level || data.stats?.level || 1,
              totalStudyTime: data.progress?.stats?.totalStudyTime || data.stats?.totalStudyTime || 0,
              totalTopics: data.progress?.stats?.totalTopics || data.stats?.totalTopics || 0,
              completedTopics: data.progress?.stats?.completedTopics || data.stats?.completedTopics || 0,
              inProgressTopics: data.progress?.stats?.inProgressTopics || data.stats?.inProgressTopics || 0,
              todayStudyTime: data.progress?.stats?.todayStudyTime || data.stats?.todayStudyTime || 0,
              weeklyStudyTime: data.progress?.stats?.weeklyStudyTime || data.stats?.weeklyStudyTime || 0,
              xpToNextLevel: data.progress?.stats?.xpToNextLevel || data.stats?.xpToNextLevel || 100,
              progressToNextLevel: data.progress?.stats?.progressToNextLevel || data.stats?.progressToNextLevel || 0
            },
            recentActivity: data.recentActivity || [],
            inProgress: data.inProgress || [],
            achievements: data.achievements || [],
            weeklyProgress: data.weeklyProgress || [],
            quizStats: data.quizStats || {
              totalQuizzes: 0,
              averageScore: 0,
              weakTopics: []
            }
          }
        };
      }
      
      return getMockProgressData();
      
    } catch (error) {
      console.error('Get progress overview error:', error);
      return getMockProgressData();
    }
  },

  // Get aggregated progress summary
  getProgressSummary: async () => {
    try {
      const response = await progressApi.get('/progress/summary');
      
      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return getMockProgressData();
      
    } catch (error) {
      console.error('Get progress summary error:', error);
      return getMockProgressData();
    }
  },

  // Get learning streak
  getLearningStreak: async () => {
    try {
      const overview = await progressAPI.getProgressOverview();
      if (overview.success && overview.data) {
        return {
          success: true,
          data: {
            currentStreak: overview.data.stats.learningStreak || 0,
            longestStreak: overview.data.stats.learningStreak || 0,
            lastActive: new Date().toISOString()
          }
        };
      }
      
      return {
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActive: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.warn('Get learning streak error:', error.message);
      return {
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActive: new Date().toISOString()
        }
      };
    }
  },

  // Get monthly progress
  getMonthlyProgress: async (year, month) => {
    try {
      let url = '/dashboard/monthly';
      if (year && month) {
        url += `?year=${year}&month=${month}`;
      }
      const response = await progressApi.get(url);
      
      if (response.data?.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        data: null
      };
      
    } catch (error) {
      console.error('Get monthly progress error:', error);
      return {
        success: false,
        data: null
      };
    }
  },

  // Get achievements
  getAchievements: async () => {
    try {
      const overview = await progressAPI.getProgressOverview();
      if (overview.success && overview.data) {
        return {
          success: true,
          data: {
            earned: overview.data.achievements || [],
            totalEarned: overview.data.achievements?.length || 0,
            totalAvailable: 10
          }
        };
      }
      
      return {
        success: false,
        data: { earned: [], totalEarned: 0, totalAvailable: 10 }
      };
      
    } catch (error) {
      console.error('Get achievements error:', error);
      return {
        success: false,
        data: { earned: [], totalEarned: 0, totalAvailable: 10 }
      };
    }
  },

  // Get learning insights
  getLearningInsights: async () => {
    try {
      const response = await progressApi.get('/dashboard/insights');
      
      if (response.data?.success && response.data?.data) {
        return {
          success: true,
          data: {
            insights: response.data.data.insights || []
          }
        };
      }
      
      const overview = await progressAPI.getProgressOverview();
      if (overview.success && overview.data) {
        const insights = generateInsightsFromData(overview.data);
        return {
          success: true,
          data: { insights }
        };
      }
      
      return {
        success: true,
        data: { insights: [] }
      };
      
    } catch (error) {
      console.error('Get learning insights error:', error);
      return {
        success: true,
        data: { insights: [] }
      };
    }
  }
};

// Helper function to generate insights from data
const generateInsightsFromData = (data) => {
  const insights = [];
  const stats = data.stats;
  const weakTopics = data.quizStats?.weakTopics || [];
  
  if (stats.learningStreak >= 7) {
    insights.push({
      type: 'positive',
      title: '🔥 Amazing Streak!',
      description: `You've maintained a ${stats.learningStreak}-day learning streak. Keep it up!`,
      icon: '🔥'
    });
  } else if (stats.learningStreak > 0) {
    insights.push({
      type: 'motivation',
      title: 'Building Momentum',
      description: `${stats.learningStreak} day streak! ${7 - stats.learningStreak} more days to reach weekly milestone.`,
      icon: '⚡'
    });
  }
  
  if (stats.averageScore > 80) {
    insights.push({
      type: 'positive',
      title: '🎯 Quiz Master!',
      description: `Your average quiz score of ${Math.round(stats.averageScore)}% shows excellent understanding.`,
      icon: '🏆'
    });
  } else if (stats.averageScore < 60 && stats.quizzesTaken > 0) {
    insights.push({
      type: 'improvement',
      title: '📚 Focus Needed',
      description: 'Review weak topics to improve quiz scores.',
      icon: '🎯'
    });
  }
  
  if (weakTopics.length > 0) {
    insights.push({
      type: 'action',
      title: '💡 Smart Practice',
      description: `Focus on "${weakTopics[0].topic}" (${Math.round(weakTopics[0].averageScore)}% accuracy)`,
      icon: '📖'
    });
  }
  
  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      title: '🚀 Keep Going!',
      description: 'Complete more quizzes to unlock personalized insights.',
      icon: '💪'
    });
  }
  
  return insights;
};

export default progressApi;