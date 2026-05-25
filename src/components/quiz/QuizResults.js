// frontend/src/components/quiz/QuizResults.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTrophy, FaRedo, FaHome, FaChartLine, FaCheckCircle, 
  FaTimesCircle, FaLightbulb, FaShare, FaDownload, FaSpinner,
  FaArrowAltCircleLeft, FaStar
} from 'react-icons/fa';
import socketService from '../../services/socketService';
import { toast } from 'sonner';
import { quizAPI } from '../../api/quiz';
import { useParams } from 'react-router-dom';
import './quiz.css';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [results, setResults] = useState(location.state?.results);
  const [quizTitle, setQuizTitle] = useState(location.state?.quizTitle);
  const [topic, setTopic] = useState(location.state?.topic);
  const [loading, setLoading] = useState(!location.state?.results);
  const [isOnline, setIsOnline] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Check socket connection
  useEffect(() => {
    setIsOnline(socketService.getConnectionStatus());
    
    if (socketService.getConnectionStatus()) {
      setTimeout(() => {
        socketService.requestProgressUpdate();
      }, 500);
    }
  }, []);

  // Debug: Log the results structure
  useEffect(() => {
    if (results) {
      console.log('Quiz Results Data:', {
        hasResults: !!results,
        strengths: results.strengths,
        weaknesses: results.weaknesses,
        allKeys: Object.keys(results)
      });
    }
  }, [results]);

  // ✅ Fetch results if not provided via state (for history navigation)
  useEffect(() => {
    const fetchResults = async () => {
      if (!results && quizId) {
        try {
          setLoading(true);
          const response = await quizAPI.getQuizResultById(quizId);
          
          if (response.success && response.data) {
            const data = response.data;
            setResults({
              score: data.score,
              correctAnswers: data.correctAnswers,
              totalQuestions: data.totalQuestions,
              xpEarned: data.xpEarned || 50,
              passed: data.passed || data.score >= 70,
              strengths: data.strengths || [],
              weaknesses: data.weaknesses || [],
              feedback: data.feedback || {
                message: `You scored ${data.score}%`,
                tip: 'Keep practicing to improve!'
              },
              questionResults: data.questions || [],
              oldLevel: data.oldLevel,
              newLevel: data.newLevel
            });
            setQuizTitle(data.title);
            setTopic(data.topic);
          }
        } catch (error) {
          console.error('Error fetching quiz results:', error);
          toast.error('Failed to load quiz results');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchResults();
  }, [quizId, results]);

  // Show loading state
  if (loading) {
    return (
      <div className="quiz-loading">
        <FaSpinner className="spinner" />
        <p>Loading your results...</p>
      </div>
    );
  }

  // Fallback if accessed without state
  if (!results) {
    return (
      <div className="error-state">
        <p>No results found. Let's start a new journey!</p>
        <button onClick={() => navigate('/student/quiz/generate')} className="btn-primary">
          Go to Hub
        </button>
      </div>
    );
  }

  const score = results.score || 0;
  const xpEarned = results.xpEarned || 50;
  const newLevel = results.newLevel;
  const passed = results.passed || score >= 70;
  
  const getStatusTheme = () => {
    if (score >= 80) return { class: 'theme-success', label: 'Mastery Achieved', icon: <FaTrophy />, message: 'Excellent work! You\'ve mastered this topic!' };
    if (score >= 60) return { class: 'theme-warning', label: 'Solid Progress', icon: '🎉', message: 'Good job! Keep practicing to master it!' };
    return { class: 'theme-danger', label: 'Keep Pushing', icon: '📚', message: 'Don\'t give up! Review and try again.' };
  };

  const theme = getStatusTheme();

  // ✅ Get strengths from different possible locations
  const getStrengths = () => {
    if (results.strengths && results.strengths.length > 0) return results.strengths;
    if (results.topicsMastered && results.topicsMastered.length > 0) return results.topicsMastered;
    if (results.strongTopics && results.strongTopics.length > 0) return results.strongTopics;
    return [];
  };

  // ✅ Get weaknesses from different possible locations
  const getWeaknesses = () => {
    if (results.weaknesses && results.weaknesses.length > 0) return results.weaknesses;
    if (results.weakTopics && results.weakTopics.length > 0) return results.weakTopics;
    if (results.weakAreas && results.weakAreas.length > 0) return results.weakAreas;
    return [];
  };

  // ✅ Robust getDisplayText function
  const getDisplayText = (item) => {
    if (!item) return 'Topic';
    
    if (typeof item === 'string') {
      if (item.match(/^[0-9a-fA-F]{24}$/)) {
        return 'Learning Topic';
      }
      return item;
    }
    
    if (typeof item === 'number') return String(item);
    
    if (typeof item === 'object') {
      if (item.category && typeof item.category === 'string') return item.category;
      if (item.topic && typeof item.topic === 'string') return item.topic;
      if (item.name && typeof item.name === 'string') return item.name;
      if (item.title && typeof item.title === 'string') return item.title;
      
      if (item.topic && typeof item.topic === 'object') {
        if (item.topic.name) return item.topic.name;
        if (item.topic.title) return item.topic.title;
      }
      
      if (Array.isArray(item) && item.length > 0) {
        return getDisplayText(item[0]);
      }
      
      const stringValue = Object.values(item).find(val => typeof val === 'string' && !val.match(/^[0-9a-fA-F]{24}$/));
      if (stringValue) return stringValue;
      
      return 'Topic Area';
    }
    
    return String(item);
  };

  const strengths = getStrengths();
  const weaknesses = getWeaknesses();

  const handleShare = async () => {
    setSharing(true);
    try {
      const shareData = {
        title: `Quiz Result: ${quizTitle || 'Knowledge Check'}`,
        text: `I scored ${score.toFixed(0)}% on ${topic || 'my quiz'}! +${xpEarned} XP earned! 🎉`,
        url: window.location.href
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Results copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Could not share results');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    toast.info('Certificate feature coming soon!');
  };

  const handleRetry = () => {
    navigate('/student/quiz/generate');
  };

  // const handleReviewWeakAreas = () => {
  //   if (weaknesses.length > 0) {
  //     const weakTopics = weaknesses.map(w => getDisplayText(w)).join(', ');
  //     navigate(`/student/ai?topic=${encodeURIComponent(weakTopics)}&mode=review`);
  //   } else {
  //     navigate('/student/discover');
  //   }
  // };

  return (
    <div className="results-wrapper">
      <button 
        className="btn-results primary btn mb-4 rounded-pill" 
        onClick={() => navigate('/student/quiz/history')}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <FaArrowAltCircleLeft className='me-2' /> Back to History
      </button>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="results-glass-card"
      >
        {/* Header Section with Score Circle */}
        <div className={`results-hero ${theme.class}`}>
          <div className="hero-badge">
            {theme.icon} {theme.label}
            {!isOnline && <span className="offline-badge">offline</span>}
          </div>
          <div className="score-circle-container">
            <svg viewBox="0 0 36 36" className="score-ring">
              <path className="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <motion.path 
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${score}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="ring-fill" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              />
            </svg>
            <div className="score-text-overlay">
              <span className="big-score">{score.toFixed(0)}</span>
              <span className="percent-sign">%</span>
            </div>
          </div>
          <h2>{results.feedback?.message || theme.message}</h2>
          {passed && (
            <div className="passed-badge">
              <FaTrophy /> Quiz Passed!
            </div>
          )}
        </div>

        {/* Vital Stats Grid */}
        <div className="stats-grid-premium">
          <div className="p-stat-card">
            <div className="p-stat-icon correct"><FaCheckCircle /></div>
            <div className="p-stat-info">
              <span className="p-value">{results.correctAnswers}</span>
              <span className="p-label">Correct</span>
            </div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-icon incorrect"><FaTimesCircle /></div>
            <div className="p-stat-info">
              <span className="p-value">{results.totalQuestions - results.correctAnswers}</span>
              <span className="p-label">Incorrect</span>
            </div>
          </div>
          <div className="p-stat-card xp-glow">
            <div className="p-stat-icon xp"><FaChartLine /></div>
            <div className="p-stat-info">
              <span className="p-value">+{xpEarned}</span>
              <span className="p-label">XP Gained</span>
            </div>
          </div>
        </div>

        {/* Level Up Notification */}
        {newLevel && newLevel > (results.oldLevel || 1) && (
          <motion.div 
            className="level-up-notification"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <FaTrophy className="level-up-icon" />
            <div className="level-up-content">
              <h4>Level Up!</h4>
              <p>You've reached Level {newLevel}! 🎉</p>
            </div>
          </motion.div>
        )}

        {/* Strengths Section */}
        {strengths.length > 0 && (
          <div className="strengths-section">
            <h4>💪 Your Strengths</h4>
            <div className="strengths-list">
              {strengths.slice(0, 3).map((strength, idx) => (
                <span key={idx} className="strength-badge">
                  {getDisplayText(strength)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses Section */}
        {weaknesses.length > 0 && (
          <div className="weaknesses-section">
            <h4>📚 Areas to Improve</h4>
            <div className="weaknesses-list">
              {weaknesses.slice(0, 3).map((weakness, idx) => (
                <span key={idx} className="weakness-badge">
                  {getDisplayText(weakness)}
                </span>
              ))}
            </div>
            {/* <button className="review-weak-btn" onClick={handleReviewWeakAreas}>
              Review These Topics <FaChartLine />
            </button> */}
          </div>
        )}

        {/* AI Insight Box */}
        {results.feedback?.tip && (
          <div className="ai-insight-box">
            <div className="insight-header">
              <FaLightbulb /> <span>AI Learning Tip</span>
            </div>
            <p>{results.feedback.tip}</p>
          </div>
        )}

        {/* Question Review Section */}
        {results.questionResults && results.questionResults.length > 0 && (
          <details className="question-review-details">
            <summary>📝 Review Your Answers ({results.questionResults.length} questions)</summary>
            <div className="question-review-list">
              {results.questionResults.map((q, idx) => {
                const isUserCorrect = q.isCorrect;
                return (
                  <div key={idx} className={`question-review-item ${isUserCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="question-review-header">
                      <span className="question-number">Question {idx + 1}</span>
                      <span className="question-status">
                        {isUserCorrect ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />}
                      </span>
                    </div>
                    <p className="question-review-text">{q.question}</p>
                    <div className="question-answers">
                      <div className="user-answer">
                        <span>Your answer:</span>
                        <strong className={isUserCorrect ? 'correct-text' : 'incorrect-text'}>
                          {q.userAnswer || 'Not answered'}
                        </strong>
                      </div>
                      {!isUserCorrect && (
                        <div className="correct-answer">
                          <span>Correct answer:</span>
                          <strong className="text-success">{q.correctAnswer}</strong>
                        </div>
                      )}
                    </div>
                    {q.explanation && (
                      <div className="question-explanation">
                        <FaLightbulb className="text-info" /> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Action Controls */}
        <div className="results-footer-actions">
          <button className="btn-results primary" onClick={handleRetry}>
            <FaRedo /> Retake Assessment
          </button>
          <button className="btn-results secondary" onClick={() => navigate('/student')}>
            <FaHome /> Return Home
          </button>
          <button className="btn-results share" onClick={handleShare} disabled={sharing}>
            {sharing ? <FaSpinner className="spinner-small" /> : <FaShare />}
            Share
          </button>
          <button className="btn-results download" onClick={handleDownload}>
            <FaDownload /> Certificate
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizResults;