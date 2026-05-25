import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Award, CheckCircle, XCircle, ArrowLeft, Loader } from 'lucide-react';
import { getQuizResult } from '../../api/studentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/teacher/StudentQuizResult.css';

const StudentQuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const loadResult = async () => {
      // Try to get result from navigation state first
      if (location.state?.result) {
        setResultData(location.state.result);
        setLoading(false);
        return;
      }
      
      // If no state, try to fetch from API
      if (quizId) {
        try {
          const response = await getQuizResult(quizId);
          
          if (response.success && response.data) {
            setResultData(response.data);
          } else {
            setErrorMessage(response.message || 'Failed to load results');
          }
        } catch (error) {
          console.error('API Error:', error);
          setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to load quiz results');
        } finally {
          setLoading(false);
        }
      } else {
        setErrorMessage('No quiz ID provided');
        setLoading(false);
      }
    };
    
    loadResult();
  }, [quizId, location.state]);

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Excellent! Outstanding performance!';
    if (score >= 70) return 'Good job! You\'re doing great!';
    if (score >= 50) return 'Good effort! Keep practicing!';
    return 'Keep learning! You\'ll do better next time!';
  };

  if (loading) {
    return (
      <div className="student-quiz-result">
        <div className="result-loading">
          <Loader className="loading-spinner" size={40} />
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="student-quiz-result">
        <div className="result-error">
          <h2>Unable to Load Results</h2>
          <p>{errorMessage}</p>
          <button 
            className="btn-back-dashboard"
            onClick={() => navigate('/student/classes')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="student-quiz-result">
        <div className="result-empty">
          <h2>No Results Found</h2>
          <p>We couldn't find any results for this quiz.</p>
          <button 
            className="btn-back-dashboard"
            onClick={() => navigate('/student/classes')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const score = Math.round(resultData.score || 0);
  const correctAnswers = resultData.correctAnswers || 0;
  const totalQuestions = resultData.totalQuestions || 0;
  const timeSpent = resultData.timeSpent || 0;
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  const xpEarned = resultData.xpEarned || Math.round(score * 1.5);
  const feedbackMessage = resultData.feedback?.message || getScoreMessage(score);
  const feedbackTip = resultData.feedback?.tip || 'Keep practicing to improve your score!';

  return (
    <div className="student-quiz-result">
      <div className="result-container">
        {/* Back Button */}
        <button 
          className="btn-back"
          onClick={() => navigate('/student/classes')}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Result Header */}
        <div className="result-header">
          <div className="result-icon">
            <Award size={48} />
          </div>
          <h1>Quiz Completed!</h1>
          <p className="result-message">{feedbackMessage}</p>
          {feedbackTip && <p className="result-tip">{feedbackTip}</p>}
        </div>

        {/* Score Section */}
        <div className="result-score-section">
          {/* Score Circle */}
          <div className="score-circle">
            <svg viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                className="score-circle-bg"
              />
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                className="score-circle-fill"
                style={{ 
                  stroke: getScoreColor(score),
                  strokeDasharray: `${score * 2.83} 283`
                }}
              />
            </svg>
            <div className="score-percentage">
              {score}%
            </div>
          </div>
          
          {/* Stats */}
          <div className="result-stats">
            <div className="stat-item">
              <span>Correct Answers</span>
              <strong>{correctAnswers} / {totalQuestions}</strong>
            </div>
            <div className="stat-item">
              <span>Time Spent</span>
              <strong>{minutes} min {seconds} sec</strong>
            </div>
            <div className="stat-item">
              <span>XP Earned</span>
              <strong className="xp-earned">+{xpEarned} XP</strong>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="result-analysis">
          <div className="strengths-section">
            <h3>
              <CheckCircle size={18} />
              Strengths
            </h3>
            <div className="topic-tags">
              {resultData.strengths && resultData.strengths.length > 0 ? (
                resultData.strengths.map((s, i) => {
                  let displayText = s;
                  if (typeof s === 'object') {
                    displayText = s.category || s.topic || s.name || 'General';
                  }
                  return (
                    <span key={i} className="tag tag-strength">
                      {displayText}
                    </span>
                  );
                })
              ) : (
                <span className="no-topics">No strengths identified yet</span>
              )}
            </div>
          </div>
          
          <div className="weaknesses-section">
            <h3>
              <XCircle size={18} />
              Areas to Improve
            </h3>
            <div className="topic-tags">
              {resultData.weaknesses && resultData.weaknesses.length > 0 ? (
                resultData.weaknesses.map((w, i) => {
                  let displayText = w;
                  if (typeof w === 'object') {
                    displayText = w.category || w.topic || w.name || 'General';
                  }
                  return (
                    <span key={i} className="tag tag-weakness">
                      {displayText}
                    </span>
                  );
                })
              ) : (
                <span className="no-topics">Keep up the great work!</span>
              )}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button 
          className="btn-continue"
          onClick={() => navigate('/student/classes')}
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
};

export default StudentQuizResult;