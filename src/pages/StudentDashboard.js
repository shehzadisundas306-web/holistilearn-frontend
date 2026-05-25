// frontend/src/pages/StudentDashboard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatsOverview from "../components/student/dashboard/StatsOverview";
import LearningJourney from "../components/student/dashboard/LearningJourney";
import WeeklyProgressChart from "../components/student/dashboard/WeeklyProgressChart";
import QuickActions from "../components/student/dashboard/QuickActions";
import WelcomeSection from "../components/student/dashboard/WelcomeSection";
import { dashboardAPI } from "../api/dashboard";
import { topicsAPI } from "../api/topics";
import { learningPathAPI } from "../api/learningPath";
import { toast } from "sonner";
import "../styles/studentdashboard.css";
import TodayFocus from "../components/student/dashboard/TodayFocus";
import Insights from "../components/student/dashboard/Insights";
import Achievements from "../components/student/dashboard/Achievements";

// ✅ Import notification and socket services
import notificationService from "../services/notificationService";
import socketService from "../services/socketService";

// Helper function to format time ago
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
  
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

// Helper to get icon based on category
const getTopicIcon = (category) => {
  const icons = {
    'Frontend': '💻',
    'Backend': '⚙️',
    'AI': '🧠',
    'Design': '🎨',
    'Programming': '👨‍💻',
    'Database': '🗄️',
    'JavaScript': '⚛️',
    'Python': '🐍',
    'React': '⚛️',
    'Node.js': '🚀',
    'Web Development': '🌐',
    'Data Science': '📊',
    'Machine Learning': '🤖'
  };
  return icons[category] || '📚';
};

// Helper to get color based on category
const getTopicColor = (category) => {
  const colors = {
    'Frontend': '#3b82f6',
    'Backend': '#10b981',
    'AI': '#8b5cf6',
    'Design': '#ec4899',
    'Programming': '#f59e0b',
    'Database': '#ef4444',
    'JavaScript': '#fbbf24',
    'Python': '#10b981',
    'React': '#61dafb',
    'Node.js': '#68a063',
    'Web Development': '#3b82f6',
    'Data Science': '#8b5cf6',
    'Machine Learning': '#8b5cf6'
  };
  return colors[category] || '#6b7280';
};

// Helper function for API calls with timeout
const fetchWithTimeout = async (promise, timeout = 10000) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), timeout)
  );
  return Promise.race([promise, timeoutPromise]);
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const isMounted = useRef(true);
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      completedTopics: 0,
      totalTopics: 0,
      quizAccuracy: 0,
      streak: 0,
      weakAreas: 0,
      xp: 0,
      level: 1
    },
    learningJourney: {
      topic: "Start Your Learning Journey",
      completedLessons: 0,
      totalLessons: 0,
      nextLesson: "Choose a topic to begin",
      estimatedTime: 25
    },
    weeklyActivity: {
      days: [
        { day: "Mon", hours: 0 },
        { day: "Tue", hours: 0 },
        { day: "Wed", hours: 0 },
        { day: "Thu", hours: 0 },
        { day: "Fri", hours: 0 },
        { day: "Sat", hours: 0 },
        { day: "Sun", hours: 0 }
      ],
      average: 0
    },
    recentActivity: [],
    welcome: {
      name: "Student",
      progress: 0,
      streak: 0,
      xp: 0
    },
    recommendedTopics: []
  });

  // ✅ Initialize notification service on mount
  useEffect(() => {
    isMounted.current = true;
    
    // Initialize notification service
    notificationService.init();
    
    // Connect socket for real-time updates
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }
    
    // ✅ Listen for socket connection to join student rooms
    const handleSocketConnected = () => {
      if (socketService.getConnectionStatus() && user?.id) {
        console.log('✅ Socket connected, joining student rooms');
        socketService.joinUserRoom();
        socketService.requestProgressUpdate();
      }
    };
    
    // Check if already connected
    if (socketService.getConnectionStatus() && user?.id) {
      socketService.joinUserRoom();
      socketService.requestProgressUpdate();
    }
    
    socketService.on('socket:connected', handleSocketConnected);
    
    return () => {
      isMounted.current = false;
      socketService.off('socket:connected', handleSocketConnected);
    };
  }, [user?.id]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        setDashboardData(prev => ({
          ...prev,
          welcome: {
            ...prev.welcome,
            name: parsedUser.username || parsedUser.name || 'Student'
          }
        }));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    fetchDashboardData();
  }, [navigate]);

  // ✅ Listen for real-time socket events for dashboard updates
  useEffect(() => {
    if (!socketService.getConnectionStatus()) return;
    
    // Listen for progress updates
    const unsubscribeProgress = socketService.on('progress-update', (data) => {
      if (!isMounted.current) return;
      if (data.type === 'full_update' && data.data) {
        console.log('📊 Real-time progress update received');
        
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            xp: data.data.stats?.xpPoints || prev.stats.xp,
            level: data.data.stats?.level || prev.stats.level,
            quizAccuracy: data.data.stats?.averageScore || prev.stats.quizAccuracy,
            streak: data.data.stats?.learningStreak || prev.stats.streak,
            completedTopics: data.data.stats?.completedTopics || prev.stats.completedTopics
          },
          welcome: {
            ...prev.welcome,
            progress: data.data.stats?.progressToNextLevel || prev.welcome.progress,
            xp: data.data.stats?.xpPoints || prev.welcome.xp,
            streak: data.data.stats?.learningStreak || prev.welcome.streak
          }
        }));
      }
    });
    
    // Listen for XP updates
    const unsubscribeXP = socketService.on('xp-earned', (data) => {
      if (!isMounted.current) return;
      console.log('💎 Real-time XP update:', data);
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          xp: data.totalXP || prev.stats.xp + data.amount
        },
        welcome: {
          ...prev.welcome,
          xp: data.totalXP || prev.welcome.xp + data.amount
        }
      }));
    });
    
    // Listen for level up
    const unsubscribeLevelUp = socketService.on('level-up', (data) => {
      if (!isMounted.current) return;
      console.log('⭐ Real-time level up:', data);
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          level: data.newLevel
        }
      }));
    });
    
    // Listen for quiz completed
    const unsubscribeQuiz = socketService.on('quiz-completed', (data) => {
      if (!isMounted.current) return;
      console.log('🎯 Real-time quiz completion:', data);
      fetchDashboardData();
    });
    
    return () => {
      unsubscribeProgress();
      unsubscribeXP();
      unsubscribeLevelUp();
      unsubscribeQuiz();
    };
  }, [socketService.getConnectionStatus()]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data from backend...');

      let summaryResponse = null;
      let weeklyResponse = null;
      let recommendedTopicsResponse = null;
      
      try {
        [summaryResponse, weeklyResponse, recommendedTopicsResponse] = await Promise.all([
          fetchWithTimeout(dashboardAPI.getDashboardSummary(), 8000),
          fetchWithTimeout(dashboardAPI.getWeeklyActivity(), 8000),
          fetchWithTimeout(topicsAPI.getRecommendedTopics().catch(() => ({ success: true, data: [] })), 8000)
        ]);
      } catch (timeoutError) {
        console.warn('Some API calls timed out, using partial data');
      }
      
      if (!isMounted.current) return;
      
      // Process dashboard summary
      if (summaryResponse && summaryResponse.success && summaryResponse.data) {
        const data = summaryResponse.data;
        
        const completedTopics = data.progress?.stats?.completedTopics || 
                                data.progress?.completedTopics || 
                                0;
        const totalTopics = data.progress?.stats?.totalTopics || 
                           data.progress?.totalTopics || 
                           0;
        const progressPercent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
        const weakAreasCount = data.quiz?.weakTopics?.length || 0;
        const averageScore = data.quiz?.averageScore || data.progress?.stats?.averageScore || 0;
        const xpPoints = data.progress?.stats?.xpPoints || data.progress?.xp || 0;
        const level = data.progress?.stats?.level || data.progress?.level || 1;
        const streak = data.progress?.stats?.learningStreak || data.progress?.streak || 0;
        
        setDashboardData(prev => ({
          ...prev,
          stats: {
            completedTopics: completedTopics,
            totalTopics: totalTopics,
            quizAccuracy: Math.round(averageScore),
            streak: streak,
            weakAreas: weakAreasCount,
            xp: xpPoints,
            level: level
          },
          welcome: {
            ...prev.welcome,
            progress: Math.round(progressPercent),
            streak: streak,
            xp: xpPoints
          },
          learningJourney: {
            topic: data.learning?.currentPath?.goal || "Start Your Learning Journey",
            completedLessons: completedTopics,
            totalLessons: totalTopics,
            nextLesson: data.learning?.nextSteps?.[0]?.title || "Choose a topic to begin",
            estimatedTime: data.learning?.nextSteps?.[0]?.estimatedTime || 25
          }
        }));
        
        console.log('✅ Dashboard data loaded');
      } else {
        console.warn('No dashboard summary data received');
      }

      // Process weekly activity
      if (weeklyResponse && weeklyResponse.success && weeklyResponse.data) {
        const days = weeklyResponse.data.currentWeek?.days || [];
        
        const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
          const found = days.find(d => 
            d.dayName === day || 
            (d.date && new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }) === day)
          );
          return {
            day,
            hours: found ? (found.studyTime || 0) / 60 : 0
          };
        });
        
        setDashboardData(prev => ({
          ...prev,
          weeklyActivity: {
            days: chartDays,
            average: weeklyResponse.data.averageDaily ? weeklyResponse.data.averageDaily / 60 : 0
          }
        }));
      }
      
      // Process recommended topics
      await fetchRecommendedTopics(recommendedTopicsResponse);
      
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      if (!isMounted.current) return;
      
      // Use mock data as fallback
      console.log('Using mock data as fallback');
      const mockStreak = parseInt(localStorage.getItem('streak') || '5');
      
      setDashboardData(prev => ({
        stats: {
          completedTopics: 12,
          totalTopics: 18,
          quizAccuracy: 78,
          streak: mockStreak,
          weakAreas: 2,
          xp: 450,
          level: 4
        },
        learningJourney: {
          topic: "Advanced Neural Networks",
          completedLessons: 12,
          totalLessons: 18,
          nextLesson: "Backpropagation Deep Dive",
          estimatedTime: 25
        },
        weeklyActivity: {
          days: [
            { day: "Mon", hours: 1.2 },
            { day: "Tue", hours: 2.5 },
            { day: "Wed", hours: 1.8 },
            { day: "Thu", hours: 3.2 },
            { day: "Fri", hours: 2.1 },
            { day: "Sat", hours: 4.0 },
            { day: "Sun", hours: 3.5 }
          ],
          average: 2.4
        },
        recentActivity: [
          { text: "Completed Linear Regression Lesson", time: "2 hours ago", type: "lesson", icon: "📝", color: "#3498db" },
          { text: "Scored 8/10 in Machine Learning Quiz", time: "5 hours ago", type: "quiz", icon: "📊", color: "#F5C45E" },
          { text: "Generated Notes for Neural Networks", time: "Yesterday", type: "note", icon: "📚", color: "#9b59b6" }
        ],
        welcome: {
          name: prev.welcome.name,
          progress: 75,
          streak: mockStreak,
          xp: 450
        },
        recommendedTopics: [
          { id: 1, name: "React Hooks", icon: "⚛️", level: "Intermediate", color: "#3b82f6", description: "Learn modern React patterns" },
          { id: 2, name: "Python OOP", icon: "🐍", level: "Beginner", color: "#10b981", description: "Object-oriented programming" },
          { id: 3, name: "Machine Learning", icon: "🤖", level: "Advanced", color: "#8b5cf6", description: "AI fundamentals" },
          { id: 4, name: "Node.js API", icon: "🚀", level: "Intermediate", color: "#f59e0b", description: "Build REST APIs" }
        ]
      }));
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  const fetchRecommendedTopics = async (response) => {
    try {
      if (response && response.success) {
        let topics = [];
        
        if (Array.isArray(response.data)) {
          topics = response.data;
        } else if (response.data && Array.isArray(response.data.forYou)) {
          topics = response.data.forYou;
        } else if (response.data && Array.isArray(response.data.topics)) {
          topics = response.data.topics;
        } else if (response.data && response.data.recommendations && Array.isArray(response.data.recommendations)) {
          topics = response.data.recommendations;
        } else if (response.data && typeof response.data === 'object') {
          const possibleArrays = ['forYou', 'topics', 'recommendations', 'items', 'data'];
          for (const key of possibleArrays) {
            if (response.data[key] && Array.isArray(response.data[key])) {
              topics = response.data[key];
              break;
            }
          }
        }
        
        if (!isMounted.current) return;
        
        if (Array.isArray(topics) && topics.length > 0) {
          const formattedTopics = topics.slice(0, 4).map(topic => ({
            id: topic._id || topic.id,
            name: topic.title || topic.name,
            icon: getTopicIcon(topic.category),
            level: topic.difficulty || topic.level || 'Intermediate',
            color: getTopicColor(topic.category),
            description: topic.description || `Learn about ${topic.title || topic.name}`
          }));
          
          setDashboardData(prev => ({
            ...prev,
            recommendedTopics: formattedTopics
          }));
          console.log('✅ Recommended topics loaded:', formattedTopics.length);
        } else {
          console.log('No recommended topics found, using empty array');
          setDashboardData(prev => ({
            ...prev,
            recommendedTopics: []
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching recommended topics:', error);
      if (isMounted.current) {
        setDashboardData(prev => ({
          ...prev,
          recommendedTopics: []
        }));
      }
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    
    toast.info('Refreshing dashboard...', {
      duration: 2000,
      icon: '🔄',
    });
  };

  const handleDiscoverTopics = () => {
    navigate('/student/discover');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your personalized dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <WelcomeSection 
        user={{ name: dashboardData.welcome.name }}
        progress={dashboardData.welcome}
      />

      <StatsOverview stats={dashboardData.stats} />
      
      <div className="dashboard-grid">
        <TodayFocus />
        <LearningJourney journey={dashboardData.learningJourney} />
        <WeeklyProgressChart activity={dashboardData.weeklyActivity} />
      </div>
      
      <Insights />
      <Achievements />

      <QuickActions onDiscoverTopics={handleDiscoverTopics} />
    </div>
  );
};

export default StudentDashboard;