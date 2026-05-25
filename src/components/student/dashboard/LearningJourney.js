// frontend/src/components/student/dashboard/LearningJourney.js
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FaPlayCircle, FaClock, FaBookOpen, FaAward, FaSpinner } from "react-icons/fa";
import { learningPathAPI } from "../../../api/learningPath";
import socketService from "../../../services/socketService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const LearningJourney = () => {
  const navigate = useNavigate();
  const [path, setPath] = useState({
    topic: "Start Your Learning Journey",
    completedLessons: 0,
    totalLessons: 10,
    nextLesson: "Choose a topic to begin",
    estimatedTime: 60,
    progress: 0
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch learning path from API
  const fetchLearningPath = useCallback(async () => {
    try {
      const response = await learningPathAPI.getCurrentLearningPath();
      if (response.success && response.data) {
        setPath(response.data);
      }
    } catch (error) {
      console.error('Error fetching learning path:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update next lesson based on progress
  const updateNextLesson = useCallback((progress) => {
    if (progress === 0) return "Start with fundamentals";
    if (progress < 25) return "Core concepts and basics";
    if (progress < 50) return "Intermediate topics";
    if (progress < 75) return "Advanced concepts";
    if (progress < 100) return "Mastery and projects";
    return "Course completed! 🎉";
  }, []);

  // Calculate remaining time based on progress
  const calculateRemainingTime = useCallback((progress) => {
    return Math.max(15, Math.floor((100 - progress) / 100 * 60));
  }, []);

  // Handle real-time topic completion
  const handleTopicCompleted = useCallback((data) => {
    console.log('📚 LearningJourney: Topic completed', data);
    
    setPath(prev => {
      const newCompleted = Math.min(prev.completedLessons + 1, prev.totalLessons);
      const newProgress = (newCompleted / prev.totalLessons) * 100;
      
      toast.success(`✅ ${data.topicTitle || 'Topic'} completed!`, {
        duration: 2000,
        icon: '📚'
      });
      
      return {
        ...prev,
        completedLessons: newCompleted,
        progress: newProgress,
        nextLesson: updateNextLesson(newProgress),
        estimatedTime: calculateRemainingTime(newProgress)
      };
    });
  }, [updateNextLesson, calculateRemainingTime]);

  // Handle real-time quiz completion
  const handleQuizCompleted = useCallback((data) => {
    console.log('📝 LearningJourney: Quiz completed', data);
    
    setPath(prev => {
      const newProgress = Math.min(prev.progress + 5, 100);
      const newCompleted = Math.floor((newProgress / 100) * prev.totalLessons);
      
      toast.success(`📝 Quiz completed! +5% progress`, {
        duration: 2000,
        icon: '🎯'
      });
      
      return {
        ...prev,
        completedLessons: newCompleted,
        progress: newProgress,
        nextLesson: updateNextLesson(newProgress),
        estimatedTime: calculateRemainingTime(newProgress)
      };
    });
  }, [updateNextLesson, calculateRemainingTime]);

  // Handle full progress update from socket
  const handleProgressUpdate = useCallback((data) => {
    if (data.type === 'full_update' && data.data) {
      const progressData = data.data;
      const completedTopics = progressData.stats?.completedTopics || 0;
      const totalTopics = progressData.stats?.totalTopics || 10;
      const newProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
      
      setPath(prev => ({
        ...prev,
        completedLessons: completedTopics,
        totalLessons: totalTopics,
        progress: newProgress,
        nextLesson: updateNextLesson(newProgress),
        estimatedTime: calculateRemainingTime(newProgress)
      }));
    }
  }, [updateNextLesson, calculateRemainingTime]);

  // Handle socket connection
  const handleSocketConnected = useCallback(() => {
    console.log('✅ Socket connected in LearningJourney');
    setIsOnline(true);
    fetchLearningPath();
  }, [fetchLearningPath]);

  // Handle continue button click
  const handleContinue = () => {
    navigate('/student/learning-path');
  };

  // Initial load
  useEffect(() => {
    fetchLearningPath();
  }, [fetchLearningPath]);

  // Setup socket listeners
  useEffect(() => {
    if (!socketService) return;
    
    const unsubscribeTopic = socketService.on('topic-completed', handleTopicCompleted);
    const unsubscribeQuiz = socketService.on('quiz-completed', handleQuizCompleted);
    const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
    const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
    const unsubscribeConnected = socketService.on('socket:connected', handleSocketConnected);
    
    setIsOnline(socketService.getConnectionStatus());
    
    return () => {
      if (unsubscribeTopic) unsubscribeTopic();
      if (unsubscribeQuiz) unsubscribeQuiz();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeIncremental) unsubscribeIncremental();
      if (unsubscribeConnected) unsubscribeConnected();
    };
  }, [handleTopicCompleted, handleQuizCompleted, handleProgressUpdate, handleSocketConnected]);

  if (loading) {
    return (
      <div className="journey-card-premium mt-4 loading">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = path.progress || 0;

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    if (progressPercentage === 0) return "✨ Start your first lesson today!";
    if (progressPercentage < 25) return "💪 Great start! Keep building momentum!";
    if (progressPercentage < 50) return "📈 You're making steady progress!";
    if (progressPercentage < 75) return "🚀 Halfway there! You're doing amazing!";
    if (progressPercentage < 100) return "🏁 Almost there! Complete the final stretch!";
    return "🎉 Congratulations! You've completed the course!";
  };

  return (
    <motion.div 
      className="journey-card-premium mt-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Header */}
      <div className="journey-header">
        <div>
          <span className="journey-badge">
            <FaAward /> Current Path
            {!isOnline && <span className="offline-badge-small">offline</span>}
          </span>
          <h3>{path.topic}</h3>
        </div>
        <div className="journey-stats-pill">
          <FaBookOpen /> {path.completedLessons}/{path.totalLessons} Lessons
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section-modern">
        <div className="progress-labels">
          <span>Overall Progress</span>
          <span className="percentage-text">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-track-bg">
          <motion.div 
            className="progress-fill-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Motivational Message */}
      <div className="motivational-message">
        <p className="motivation-text">{getMotivationalMessage()}</p>
      </div>

      {/* Next Lesson */}
      <div className="next-lesson-box">
        <div className="next-lesson-info">
          <p className="next-up-label">NEXT UP</p>
          <h4>{path.nextLesson}</h4>
          <div className="time-meta">
            <FaClock /> <span>{path.estimatedTime} mins remaining</span>
          </div>
        </div>
        
        <motion.button 
          className="continue-learning-btn"
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
        >
          <span>Continue</span>
          <FaPlayCircle />
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="journey-quick-stats">
        <div className="stat-item-journey">
          <span className="stat-value">{Math.round(progressPercentage)}%</span>
          <span className="stat-label">Complete</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item-journey">
          <span className="stat-value">{path.completedLessons}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item-journey">
          <span className="stat-value">{path.totalLessons - path.completedLessons}</span>
          <span className="stat-label">Remaining</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LearningJourney;