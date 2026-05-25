// frontend/src/components/student/dashboard/StatsOverview.js
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion } from "framer-motion";
import { FaFire, FaExclamationTriangle, FaBullseye, FaChartLine } from "react-icons/fa";
import { useEffect, useState } from "react";
import { dashboardAPI } from "../../../api/dashboard";
import socketService from "../../../services/socketService";
import { toast } from "sonner";

const StatsOverview = ({ stats: propStats }) => {
  const [stats, setStats] = useState({
    quizAccuracy: 0,
    learningStreak: 0,
    weakAreas: 0,
    xp: 0,
    level: 1
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Update stats function
  const updateStatsData = (newStats) => {
    setStats(prev => ({
      ...prev,
      quizAccuracy: newStats.quizAccuracy ?? prev.quizAccuracy,
      learningStreak: newStats.learningStreak ?? prev.learningStreak,
      weakAreas: newStats.weakAreas ?? prev.weakAreas,
      xp: newStats.xp ?? prev.xp,
      level: newStats.level ?? prev.level
    }));
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboardSummary();
      
      if (response.success && response.data) {
        const data = response.data;
        updateStatsData({
          quizAccuracy: Math.round(data.progress?.stats?.averageScore || 0),
          learningStreak: data.progress?.stats?.learningStreak || 0,
          weakAreas: data.quiz?.weakTopics?.length || 0,
          xp: data.progress?.stats?.xpPoints || 0,
          level: data.progress?.stats?.level || 1
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time progress updates from socket
  const handleProgressUpdate = (data) => {
    console.log('📊 StatsOverview: Progress update received', data);
    
    if (data.type === 'full_update' && data.data) {
      const progress = data.data;
      updateStatsData({
        quizAccuracy: Math.round(progress.stats?.averageScore || 0),
        learningStreak: progress.stats?.learningStreak || 0,
        weakAreas: progress.quizStats?.weakTopics?.length || 0,
        xp: progress.stats?.xpPoints || 0,
        level: progress.stats?.level || 1
      });
    } else if (data.type === 'quiz_submitted') {
      if (data.data?.score) {
        setStats(prev => ({
          ...prev,
          quizAccuracy: Math.round((prev.quizAccuracy + data.data.score) / 2)
        }));
      }
    }
  };

  // Handle weak topics updates
  const handleWeakTopicsUpdate = (data) => {
    console.log('📚 StatsOverview: Weak topics update', data);
    if (data.newWeakTopics) {
      setStats(prev => ({
        ...prev,
        weakAreas: (prev.weakAreas || 0) + data.newWeakTopics.length
      }));
      
      toast.info(`📚 New area to focus: ${data.newWeakTopics.map(w => w.topic).join(', ')}`, {
        duration: 4000,
        position: 'top-right'
      });
    }
  };

  // Handle level up
  const handleLevelUp = (data) => {
    console.log('⭐ StatsOverview: Level up', data);
    setStats(prev => ({
      ...prev,
      level: data.newLevel
    }));
  };

  // Handle socket connection
  const handleSocketConnected = () => {
    console.log('Socket connected in StatsOverview');
    setIsOnline(true);
    setTimeout(() => {
      socketService.requestProgressUpdate();
    }, 500);
  };

  useEffect(() => {
    if (propStats) {
      updateStatsData(propStats);
      setLoading(false);
    } else {
      fetchStats();
    }
    
    if (socketService) {
      const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
      const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
      const unsubscribeWeakTopics = socketService.on('weak-topics-update', handleWeakTopicsUpdate);
      const unsubscribeLevelUp = socketService.on('level-up', handleLevelUp);
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
        if (unsubscribeWeakTopics) unsubscribeWeakTopics();
        if (unsubscribeLevelUp) unsubscribeLevelUp();
        if (unsubscribeConnected) unsubscribeConnected();
      };
    }
  }, [propStats]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    }),
  };

  const getAccuracyMessage = () => {
    if (stats.quizAccuracy >= 90) return "Master level! 🏆";
    if (stats.quizAccuracy >= 70) return "Top performer! ⭐";
    if (stats.quizAccuracy >= 50) return "Good improvement! 📈";
    return "Keep practicing! 💪";
  };

  const getStreakMessage = () => {
    if (stats.learningStreak >= 30) return "Monthly Master! 🔥";
    if (stats.learningStreak >= 7) return "Week Warrior! ⚡";
    if (stats.learningStreak > 0) return `${stats.learningStreak} days strong! 💪`;
    return "Start your streak today! 🎯";
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3].map((i) => (
          <motion.div key={i} className="stat-card-premium skeleton" custom={i} initial="hidden" animate="visible" variants={cardVariants}>
            <div className="skeleton-shimmer"></div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {/* Quiz Accuracy Card */}
      <motion.div className="stat-card-premium" custom={0} initial="hidden" animate="visible" variants={cardVariants}>
        <div className="stat-info">
          <div className="stat-icon-bg gold-glow"><FaBullseye /></div>
          <h4>Quiz Accuracy</h4>
          <p>{getAccuracyMessage()}</p>
          {!isOnline && <span className="offline-badge">offline</span>}
        </div>
        <div className="stat-visual">
          <CircularProgressbar 
            value={stats.quizAccuracy} 
            text={`${stats.quizAccuracy}%`} 
            styles={buildStyles({
              pathColor: `#F5C45E`,
              textColor: '#ffffff',
              trailColor: 'rgba(255, 255, 255, 0.05)',
            })}
          />
        </div>
      </motion.div>

      {/* Learning Streak Card */}
      <motion.div className="stat-card-premium simple-stat" custom={1} initial="hidden" animate="visible" variants={cardVariants}>
        <div className="stat-icon-bg orange-glow"><FaFire /></div>
        <div className="simple-info">
          <h5 className="text-white">Learning Streak</h5>
          <h2>{stats.learningStreak} <span>Days</span></h2>
          <p className="streak-message">{getStreakMessage()}</p>
        </div>
      </motion.div>

      {/* Areas to Improve Card */}
      <motion.div className="stat-card-premium simple-stat" custom={2} initial="hidden" animate="visible" variants={cardVariants}>
        <div className="stat-icon-bg red-glow"><FaExclamationTriangle /></div>
        <div className="simple-info">
          <h5 className="text-white">Areas to Improve</h5>
          <h2>{stats.weakAreas} <span>Topics</span></h2>
          {stats.weakAreas === 0 ? (
            <p className="success-message">No weak areas! 🎉</p>
          ) : (
            <p className="warning-message">Focus on these topics</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StatsOverview;