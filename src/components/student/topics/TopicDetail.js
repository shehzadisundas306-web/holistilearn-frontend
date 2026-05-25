// frontend/src/components/student/topics/TopicDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowLeft, FaBook, FaClock, FaStar, FaPlay, 
  FaCheckCircle, FaSpinner, FaUserGraduate, FaTrophy, 
  FaExternalLinkAlt, FaCode, FaCheck, FaFire
} from 'react-icons/fa';
import { topicsAPI } from '../../../api/topics';
import socketService from '../../../services/socketService';
import { toast } from 'sonner';
import '../../../styles/DiscoverTopics.css';

const TopicDetail = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [completedSections, setCompletedSections] = useState([]);
  const [progress, setProgress] = useState(0);

  // Check socket connection
  useEffect(() => {
    setIsOnline(socketService.getConnectionStatus());
    
    const unsubscribe = socketService.on('socket:connected', () => {
      setIsOnline(true);
      fetchTopic();
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle real-time progress updates
  useEffect(() => {
    const handleProgressUpdate = (data) => {
      console.log('📊 TopicDetail: Progress update received', data);
      
      if (data.type === 'full_update' && data.data) {
        fetchTopic();
        
        if (data.data.stats?.completedTopics > 0) {
          const topicCompleted = data.data.recentActivity?.some(
            activity => activity.type === 'topic_completed' && activity.metadata?.topicId === topicId
          );
          
          if (topicCompleted) {
            toast.success('🎉 Topic Completed! Great job!', {
              duration: 5000,
              icon: '🏆'
            });
          }
        }
      } else if (data.type === 'topic_completed' && data.data?.topicId === topicId) {
        toast.success(`🎉 ${data.data.topicTitle || 'Topic'} Completed! +${data.data.xpEarned || 50} XP`, {
          duration: 5000,
          icon: '🏆'
        });
        fetchTopic();
      } else if (data.type === 'section_completed' && data.data?.topicId === topicId) {
        toast.success(`✅ Section completed! +${data.data.xpEarned || 25} XP`, {
          duration: 3000,
          icon: '📚'
        });
        fetchTopic();
      }
    };
    
    const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
    const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
    
    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeIncremental) unsubscribeIncremental();
    };
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      const response = await topicsAPI.getTopicById(topicId);
      
      if (response.success) {
        setTopic(response.data);
        
        // Load completed sections from user progress
        if (response.data.userProgress) {
          const completedIds = response.data.userProgress.completedLessons?.map(l => l.lessonId) || [];
          setCompletedSections(completedIds);
          setProgress(response.data.userProgress.progress || 0);
        }
      } else {
        toast.error('Topic not found');
        navigate('/student/discover');
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
      toast.error('Failed to load topic');
      navigate('/student/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTopic = async () => {
    try {
      setUpdating(true);
      const response = await topicsAPI.startTopic(topicId);
      
      if (response.success) {
        toast.success('Topic started! Good luck! 🚀');
        fetchTopic();
        
        if (isOnline && socketService.getConnectionStatus()) {
          socketService.requestProgressUpdate();
        }
      }
    } catch (error) {
      console.error('Error starting topic:', error);
      toast.error(error.response?.data?.message || 'Failed to start topic');
    } finally {
      setUpdating(false);
    }
  };

  const handleSectionComplete = async (sectionIndex, sectionTitle) => {
    if (completedSections.includes(sectionIndex.toString())) {
      toast.info('Section already completed');
      return;
    }
    
    setUpdating(true);
    
    try {
      const totalSections = topic.content.sections.length;
      const newProgress = ((completedSections.length + 1) / totalSections) * 100;
      
      const response = await topicsAPI.updateTopicProgress(
        topicId,
        newProgress,
        sectionIndex.toString(),
        15
      );
      
      if (response.success) {
        setCompletedSections(prev => [...prev, sectionIndex.toString()]);
        setProgress(newProgress);
        
        toast.success(`✅ "${sectionTitle}" completed! +${response.data.xpEarned || 25} XP`);
        
        if (isOnline && socketService.getConnectionStatus()) {
          socketService.emit('section-completed', {
            topicId,
            sectionIndex,
            sectionTitle,
            xpEarned: response.data.xpEarned || 25,
            timestamp: new Date()
          });
          socketService.requestProgressUpdate();
        }
        
        // Check if all sections are completed
        if (completedSections.length + 1 === totalSections) {
          toast.success('🎉 Congratulations! You\'ve completed all sections!', {
            duration: 6000,
            icon: '🏆'
          });
        }
        
        // Auto-advance to next section
        if (sectionIndex + 1 < totalSections) {
          setTimeout(() => {
            setActiveSection(sectionIndex + 1);
            const nextSection = document.querySelector(`.section-item:nth-child(${sectionIndex + 2})`);
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="topic-detail-loading">
        <FaSpinner className="spinner" />
        <p>Loading topic...</p>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  const isCompleted = progress === 100;
  const isStarted = progress > 0;
  const totalSections = topic.content?.sections?.length || 0;
  const completedCount = completedSections.length;

  return (
    <div className="topic-detail-container">
      <button onClick={() => navigate('/student/discover')} className="back-btn">
        <FaArrowLeft /> Back to Topics
      </button>

      {/* Hero Section */}
      <div className="topic-hero">
        <div className="hero-content">
          <div className="hero-badges">
            <span className="category-badge">{topic.category}</span>
            <span 
              className="difficulty-badge"
              style={{ background: getDifficultyColor(topic.difficulty) }}
            >
              {topic.difficulty}
            </span>
            {!isOnline && <span className="offline-badge">offline</span>}
          </div>
          
          <h1 className="hero-title">{topic.title}</h1>
          <p className="hero-description">{topic.description}</p>
          
          <div className="hero-stats">
            <div className="stat">
              <FaClock /> {Math.floor(topic.duration / 60)}h {topic.duration % 60}m
            </div>
            <div className="stat">
              <FaUserGraduate /> {topic.enrolledCount || 0} students
            </div>
            <div className="stat">
              <FaBook /> {totalSections} sections
            </div>
            {completedCount > 0 && (
              <div className="stat completed-stat">
                <FaCheck /> {completedCount}/{totalSections} done
              </div>
            )}
          </div>
          
          {!isStarted && !isCompleted && topic.prerequisitesMet !== false && (
            <button 
              className="start-btn"
              onClick={handleStartTopic}
              disabled={updating}
            >
              {updating ? <FaSpinner className="spinner-small" /> : <FaPlay />}
              Start Learning
            </button>
          )}
          
          {topic.prerequisitesMet === false && (
            <div className="prerequisites-warning">
              <p>⚠️ Complete prerequisites before starting this topic</p>
            </div>
          )}
        </div>
        
        {isStarted && (
          <div className="hero-progress">
            <div className="progress-circle">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#F5C45E"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
                  {Math.round(progress)}%
                </text>
              </svg>
            </div>
            <p>Overall Progress</p>
            {isCompleted && (
              <div className="completed-hero-badge">
                <FaTrophy /> Completed!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      {isStarted && (
        <div className="topic-content">
          <div className="content-header">
            <h2>Course Content</h2>
            {isCompleted && (
              <span className="completed-badge">
                <FaCheckCircle /> Completed!
              </span>
            )}
          </div>
          
          <div className="sections-list">
            {topic.content?.sections?.map((section, index) => {
              const isCompletedSection = completedSections.includes(index.toString());
              
              return (
                <motion.div
                  key={index}
                  className={`section-item ${activeSection === index ? 'active' : ''} ${isCompletedSection ? 'completed' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveSection(index)}
                >
                  <div className="section-header">
                    <div className="section-number">
                      {isCompletedSection ? <FaCheckCircle className="completed-icon" /> : index + 1}
                    </div>
                    <div className="section-info">
                      <h3>{section.title}</h3>
                      <div className="section-meta">
                        <FaClock /> {section.duration} min
                        {isCompletedSection && <span className="completed-tag">Completed</span>}
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {activeSection === index && (
                      <motion.div 
                        className="section-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{section.content}</p>
                        
                        {section.codeExamples?.length > 0 && (
                          <div className="code-examples">
                            <h4><FaCode /> Code Examples</h4>
                            {section.codeExamples.map((ex, idx) => (
                              <pre key={idx} className="code-block">
                                <code>{ex.code}</code>
                              </pre>
                            ))}
                          </div>
                        )}
                        
                        {!isCompletedSection && (
                          <button
                            className="complete-section-btn"
                            onClick={() => handleSectionComplete(index, section.title)}
                            disabled={updating}
                          >
                            {updating ? <FaSpinner className="spinner-small" /> : <FaCheck />}
                            Mark as Complete
                          </button>
                        )}
                        
                        {isCompletedSection && (
                          <div className="completed-section-badge">
                            <FaCheckCircle /> Section Completed
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quiz Button */}
      {isStarted && !isCompleted && progress > 50 && (
        <div className="quiz-prompt">
          <h3>Ready to Test Your Knowledge?</h3>
          <p>Take the quiz to earn XP and complete this topic!</p>
          <button 
            className="take-quiz-btn"
            onClick={() => navigate(`/student/quiz/generate?topic=${encodeURIComponent(topic.title)}`)}
          >
            <FaTrophy /> Take Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicDetail;