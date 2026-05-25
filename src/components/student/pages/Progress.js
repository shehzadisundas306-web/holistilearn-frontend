// frontend/src/components/student/pages/Progress.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  FaFire, FaGraduationCap, FaCheckDouble, FaPercentage, 
  FaSpinner, FaClock, FaChartLine, FaTrophy, FaBrain,
  FaSync, FaBookOpen, FaUserGraduate, FaCalendarWeek,
  FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";
import { progressAPI } from "../../../api/progress";
import socketService from "../../../services/socketService";
import { toast } from "sonner";
import '../../../styles/ProgessAnalytics.css';

const Progress = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdateType, setLastUpdateType] = useState(null);
  const [progressData, setProgressData] = useState({
    stats: {
      completedLessons: 0,
      quizzesTaken: 0,
      averageScore: 0,
      learningStreak: 0,
      xpPoints: 0,
      level: 1,
      totalStudyTime: 0,
      totalTopics: 0,
      completedTopics: 0,
      inProgressTopics: 0,
      todayStudyTime: 0,
      weeklyStudyTime: 0,
      xpToNextLevel: 100,
      progressToNextLevel: 0
    },
    recentActivity: [],
    inProgress: [],
    achievements: [],
    weeklyProgress: [],
    quizStats: {
      totalQuizzes: 0,
      averageScore: 0,
      weakTopics: []
    }
  });

  const [scoreTrend, setScoreTrend] = useState([
    { day: "Mon", score: 0, studyTime: 0 },
    { day: "Tue", score: 0, studyTime: 0 },
    { day: "Wed", score: 0, studyTime: 0 },
    { day: "Thu", score: 0, studyTime: 0 },
    { day: "Fri", score: 0, studyTime: 0 },
    { day: "Sat", score: 0, studyTime: 0 },
    { day: "Sun", score: 0, studyTime: 0 }
  ]);
  
  const [skillData, setSkillData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check socket connection
  useEffect(() => {
    setIsOnline(socketService.getConnectionStatus());
    
    const unsubscribe = socketService.on('socket:connected', () => {
      setIsOnline(true);
      toast.success('🔄 Real-time updates connected!', { duration: 2000 });
      fetchAllProgressData(false);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle real-time progress updates
  const handleProgressUpdate = useCallback((data) => {
    console.log('📊 Progress Page: Update received', data.type);
    
    if (data.type === 'full_update' && data.data) {
      setLastUpdateType('full');
      updateProgressData(data.data);
      setTimeout(() => setLastUpdateType(null), 3000);
      
    } else if (data.type === 'incremental') {
      setLastUpdateType('incremental');
      if (data.data?.quizCompleted) {
        toast.success(`📝 Quiz completed! Score: ${data.data.score}%`, { duration: 3000 });
        fetchAllProgressData(false);
      }
      setTimeout(() => setLastUpdateType(null), 2000);
    }
  }, []);

  // Handle level up
  const handleLevelUp = useCallback((data) => {
    toast.success(`🎉 LEVEL UP! You've reached Level ${data.newLevel}!`, {
      duration: 5000,
      icon: '🎉',
    });
    fetchAllProgressData(false);
  }, []);

  // Handle XP earned
  const handleXPEarned = useCallback((data) => {
    if (data.amount >= 10) {
      toast.success(`+${data.amount} XP from ${data.source || 'quiz'}!`, {
        duration: 2000,
        icon: '💎'
      });
    }
    setProgressData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        xpPoints: data.totalXP || (prev.stats.xpPoints + data.amount)
      }
    }));
  }, []);

  // Handle weak topics update
  const handleWeakTopicsUpdate = useCallback((data) => {
    if (data.newWeakTopics && data.newWeakTopics.length > 0) {
      toast.info(`📚 New areas to focus: ${data.newWeakTopics.map(w => w.topic).join(', ')}`, {
        duration: 5000,
        icon: '🎯'
      });
      fetchAllProgressData(false);
    }
  }, []);

  // Handle topics mastered
  const handleTopicsMastered = useCallback((data) => {
    if (data.newMasteredTopics && data.newMasteredTopics.length > 0) {
      toast.success(`🎓 Mastered: ${data.newMasteredTopics.map(m => m.topic).join(', ')}!`, {
        duration: 4000,
        icon: '🏆'
      });
      fetchAllProgressData(false);
    }
  }, []);

  const updateProgressData = (data) => {
    setProgressData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        ...data.stats
      },
      recentActivity: data.recentActivity || prev.recentActivity,
      achievements: data.achievements || prev.achievements,
      quizStats: data.quizStats || prev.quizStats
    }));

    const weakTopics = data.quizStats?.weakTopics || [];
    const masteredTopics = data.quizStats?.topicsMastered || [];
    const totalTopics = (weakTopics.length + masteredTopics.length) || 1;
    
    const skills = [
      { subject: 'Quiz Accuracy', value: data.stats?.averageScore || 0, fullMark: 100 },
      { subject: 'Topics Mastered', value: (masteredTopics.length / totalTopics) * 100, fullMark: 100 },
      { subject: 'Study Consistency', value: Math.min(100, ((data.stats?.weeklyStudyTime || 0) / 420) * 100), fullMark: 100 },
      { subject: 'XP Progress', value: data.stats?.progressToNextLevel || 0, fullMark: 100 },
      { subject: 'Streak Power', value: Math.min(100, ((data.stats?.learningStreak || 0) / 30) * 100), fullMark: 100 }
    ];
    setSkillData(skills);

    if (data.weeklyActivity && data.weeklyActivity.length > 0) {
      setScoreTrend(data.weeklyActivity.map(day => ({
        day: day.day || 'Unknown',
        score: typeof day.score === 'number' ? day.score : 0,
        studyTime: day.studyTime || 0
      })));
    }

    if (data.insights && data.insights.length > 0) {
      setInsights(data.insights);
    }

    setLastUpdated(new Date(data.lastUpdated || Date.now()));
  };

  const fetchAllProgressData = useCallback(async (showToastMessage = false) => {
    try {
      setError(null);
      
      const result = await progressAPI.getProgressSummary();
      
      if (result.success && result.data) {
        const data = result.data;
        
        console.log('📊 Progress Data Received:', {
          stats: data.stats,
          quizStats: data.quizStats,
          weeklyActivity: data.weeklyActivity,
          insights: data.insights?.length
        });
        
        setProgressData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            ...data.stats
          },
          recentActivity: data.recentActivity || [],
          achievements: data.achievements || [],
          quizStats: data.quizStats || prev.quizStats
        }));

        const weakTopics = data.quizStats?.weakTopics || [];
        const masteredTopics = data.quizStats?.topicsMastered || [];
        const totalTopics = (weakTopics.length + masteredTopics.length) || 1;
        
        const skills = [
          { subject: 'Quiz Accuracy', value: data.stats?.averageScore || 0, fullMark: 100 },
          { subject: 'Topics Mastered', value: (masteredTopics.length / totalTopics) * 100, fullMark: 100 },
          { subject: 'Study Consistency', value: Math.min(100, ((data.stats?.weeklyStudyTime || 0) / 420) * 100), fullMark: 100 },
          { subject: 'XP Progress', value: data.stats?.progressToNextLevel || 0, fullMark: 100 },
          { subject: 'Streak Power', value: Math.min(100, ((data.stats?.learningStreak || 0) / 30) * 100), fullMark: 100 }
        ];
        setSkillData(skills);
        
        let weeklyData = [];
        
        if (data.weeklyActivity && data.weeklyActivity.length > 0) {
          weeklyData = data.weeklyActivity.map(day => ({
            day: day.day || 'Unknown',
            score: typeof day.score === 'number' ? day.score : 0,
            studyTime: day.studyTime || 0
          }));
        } else {
          weeklyData = [
            { day: "Mon", score: 0, studyTime: 0 },
            { day: "Tue", score: 0, studyTime: 0 },
            { day: "Wed", score: 0, studyTime: 0 },
            { day: "Thu", score: 0, studyTime: 0 },
            { day: "Fri", score: 0, studyTime: 0 },
            { day: "Sat", score: 0, studyTime: 0 },
            { day: "Sun", score: 0, studyTime: 0 }
          ];
        }
        
        setScoreTrend(weeklyData);
        
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        } else {
          setInsights([
            {
              type: 'neutral',
              title: '🚀 Start Your Journey',
              description: 'Complete quizzes and topics to see personalized insights!',
              icon: '💡'
            }
          ]);
        }
        
        setLastUpdated(new Date(data.lastUpdated || Date.now()));
        
        if (showToastMessage) {
          toast.success('Progress data updated!');
        }
      } else {
        console.warn('Progress summary data not available');
        setScoreTrend([
          { day: "Mon", score: 0, studyTime: 0 },
          { day: "Tue", score: 0, studyTime: 0 },
          { day: "Wed", score: 0, studyTime: 0 },
          { day: "Thu", score: 0, studyTime: 0 },
          { day: "Fri", score: 0, studyTime: 0 },
          { day: "Sat", score: 0, studyTime: 0 },
          { day: "Sun", score: 0, studyTime: 0 }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setError('Failed to load progress data. Please try again.');
      
      setScoreTrend([
        { day: "Mon", score: 0, studyTime: 0 },
        { day: "Tue", score: 0, studyTime: 0 },
        { day: "Wed", score: 0, studyTime: 0 },
        { day: "Thu", score: 0, studyTime: 0 },
        { day: "Fri", score: 0, studyTime: 0 },
        { day: "Sat", score: 0, studyTime: 0 },
        { day: "Sun", score: 0, studyTime: 0 }
      ]);
      
      if (showToastMessage) {
        toast.error('Failed to load progress data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllProgressData(false);
  }, [fetchAllProgressData]);

  // Setup socket listeners
  useEffect(() => {
    if (socketService) {
      const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
      const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
      const unsubscribeLevelUp = socketService.on('level-up', handleLevelUp);
      const unsubscribeXPEarned = socketService.on('xp-earned', handleXPEarned);
      const unsubscribeWeakTopics = socketService.on('weak-topics-update', handleWeakTopicsUpdate);
      const unsubscribeMastered = socketService.on('topics-mastered', handleTopicsMastered);
      
      return () => {
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeIncremental) unsubscribeIncremental();
        if (unsubscribeLevelUp) unsubscribeLevelUp();
        if (unsubscribeXPEarned) unsubscribeXPEarned();
        if (unsubscribeWeakTopics) unsubscribeWeakTopics();
        if (unsubscribeMastered) unsubscribeMastered();
      };
    }
  }, [handleProgressUpdate, handleLevelUp, handleXPEarned, handleWeakTopicsUpdate, handleTopicsMastered]);

  // Auto-refresh every minute when offline
  useEffect(() => {
    if (loading || refreshing || isOnline) return;
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllProgressData(false);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchAllProgressData, loading, refreshing, isOnline]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllProgressData(true);
    if (isOnline) {
      socketService.requestProgressUpdate();
    }
  }, [fetchAllProgressData, isOnline]);

  const getDifficultyColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Remove loading check to allow data to show even if loading
  // if (loading) { ... }

  const statsCards = [
    { label: "Quizzes Taken", val: progressData.stats.quizzesTaken, icon: <FaCheckDouble />, color: "#2ecc71", suffix: "" },
    { label: "Avg. Score", val: `${Math.round(progressData.stats.averageScore)}%`, icon: <FaPercentage />, color: "#f1c40f", suffix: "%" },
    { label: "Day Streak", val: progressData.stats.learningStreak, icon: <FaFire />, color: "#e67e22", suffix: "" },
    // { label: "Total XP", val: progressData.stats.xpPoints, icon: <FaTrophy />, color: "#f5c45e", suffix: "" }
  ];

  return (
    <div className="analytics-wrapper">
      {/* Header with Refresh Button */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>Performance Analytics</h2>
          <p>A detailed breakdown of your learning velocity and skill acquisition.</p>
          {!isOnline && <span className="offline-badge">offline mode</span>}
          {lastUpdateType && (
            <span className={`live-badge ${lastUpdateType}`}>
              {lastUpdateType === 'full' ? '🔄 Syncing...' : '📡 Live Update'}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh} 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {/* Level Info */}
        <div className="level-info">
          <div className="level-badge-wrapper">
            <FaUserGraduate className="level-icon" />
            <span className="level-badge">Level {progressData.stats.level}</span>
            <span className="xp-info">{progressData.stats.xpPoints} XP</span>
          </div>
          <div className="xp-progress-container">
            <div className="xp-progress">
              <motion.div 
                className="xp-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressData.stats.progressToNextLevel}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="xp-next">{progressData.stats.xpToNextLevel} XP to next level</span>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <p>{error}</p>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {/* Primary Stats Grid - 4 cards now */}
      <div className="stats-grid-premium">
        {statsCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card-glass"
          >
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.val}</h3>
              <p>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Study Time Summary */}
      <div className="study-summary">
        <div className="summary-card">
          <FaClock className="summary-icon" />
          <div>
            <h4>Today's Study Time</h4>
            <p>{Math.floor(progressData.stats.todayStudyTime / 60)}h {progressData.stats.todayStudyTime % 60}m</p>
          </div>
        </div>
        <div className="summary-card">
          <FaCalendarWeek className="summary-icon" />
          <div>
            <h4>This Week</h4>
            <p>{Math.floor(progressData.stats.weeklyStudyTime / 60)}h {progressData.stats.weeklyStudyTime % 60}m</p>
          </div>
        </div>
        <div className="summary-card">
          <FaTrophy className="summary-icon" />
          <div>
            <h4>Total Study Time</h4>
            <p>{Math.floor(progressData.stats.totalStudyTime / 60)}h {progressData.stats.totalStudyTime % 60}m</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {/* Score Trend Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-card score-trend">
          <h3>
            <FaChartLine className="chart-icon" />
            Quiz Score Trend
          </h3>
          <div className="chart-wrapper">
            {scoreTrend.some(day => day.score > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#0d1b2a', border: '1px solid #1b263b' }} />
                  <Area type="monotone" dataKey="score" stroke="#2196f3" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>📊 Complete quizzes to see your score trend</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Skill Radar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-card skill-radar">
          <h3>
            <FaBrain className="chart-icon" />
            Skill Distribution
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} />
                <Radar name="Your Skills" dataKey="value" stroke="#f1c40f" fill="#f1c40f" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Weak Topics Section */}
      {progressData.quizStats.weakTopics && progressData.quizStats.weakTopics.length > 0 ? (
        <div className="weak-topics-section">
          <h3>
            <FaBookOpen className="section-icon" />
            Areas to Improve
          </h3>
          <div className="weak-topics-grid">
            {progressData.quizStats.weakTopics.slice(0, 4).map((topic, index) => {
              const avgScore = topic.averageScore && !isNaN(topic.averageScore) 
                ? Math.round(topic.averageScore) 
                : topic.score && !isNaN(topic.score) 
                  ? Math.round(topic.score) 
                  : 0;
              
              const topicName = topic.topic || topic.name || 'Unknown Topic';
              
              return (
                <div key={index} className="weak-topic-card">
                  <div className="topic-name">{topicName}</div>
                  <div className="topic-score" style={{ color: getDifficultyColor(avgScore) }}>
                    {avgScore}% average
                  </div>
                  <div className="topic-progress">
                    <motion.div 
                      className="topic-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${avgScore}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ backgroundColor: getDifficultyColor(avgScore) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="weak-topics-section">
          <h3>
            <FaBookOpen className="section-icon" />
            Areas to Improve
          </h3>
          <div className="no-weak-topics">
            <p>🎉 Great job! No weak topics identified yet.</p>
            <p>Keep taking quizzes to identify areas for improvement.</p>
          </div>
        </div>
      )}

      {/* Insights Section */}
      {insights.length > 0 && insights[0].title !== '🚀 Start Your Journey' && (
        <div className="insights-section">
          <h3>
            <FaBrain className="insights-icon" /> Learning Insights
          </h3>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <span className="insight-icon">{insight.icon || '💡'}</span>
                <div>
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {progressData.recentActivity.length > 0 && (
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {progressData.recentActivity.slice(0, 5).map((activity, index) => (
              <motion.div 
                key={index} 
                className="activity-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="activity-icon">{activity.icon || '📌'}</span>
                <div className="activity-details">
                  <p>{activity.title || activity.description}</p>
                  <small>{new Date(activity.timestamp).toLocaleDateString()}</small>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;