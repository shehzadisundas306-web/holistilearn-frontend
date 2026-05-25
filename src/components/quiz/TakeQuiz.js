// frontend/src/components/quiz/TakeQuiz.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaClock, FaArrowLeft } from 'react-icons/fa';
import { quizAPI } from '../../api/quiz';
import { mentalStateAPI } from '../../api/mentalState';
import socketService from '../../services/socketService';
import { toast } from 'sonner';
import './quiz.css';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  useEffect(() => {
    setIsOnline(socketService.getConnectionStatus());
    const unsubscribe = socketService.on('socket:connected', () => {
      setIsOnline(true);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz && timeLeft === null && quiz.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getQuizById(quizId);
      
      if (response.success && response.data) {
        console.log('📚 Quiz loaded:', response.data);
        setQuiz(response.data);
        // Initialize answers array with empty strings (not null)
        setAnswers(new Array(response.data.questions.length).fill(''));
        setAnsweredQuestions(new Set());
      } else {
        toast.error(response.message || 'Quiz not found');
        navigate('/teacher/dashboard/quiz');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/teacher/dashboard/quiz');
    } finally {
      setLoading(false);
    }
  };

  const checkIfCorrect = (selectedOptionText, question) => {
    if (!question || !question.correctAnswer) return false;
    return selectedOptionText === question.correctAnswer;
  };

  const handleAnswer = (option, optionIndex) => {
    if (showFeedback) return;
    
    const currentQuestion = quiz.questions[current];
    const isCorrect = checkIfCorrect(option, currentQuestion);
    
    console.log(`📝 Answer: "${option}" | Correct: ${isCorrect}`);
    
    setSelectedOption(option);
    setIsAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    // Store the answer TEXT
    const newAnswers = [...answers];
    newAnswers[current] = option;
    setAnswers(newAnswers);
    
    // Mark this question as answered
    const newAnswered = new Set(answeredQuestions);
    newAnswered.add(current);
    setAnsweredQuestions(newAnswered);
    
    // Auto-advance to next question after 1.5 seconds
    setTimeout(() => {
      const next = current + 1;
      if (next < quiz.questions.length) {
        setCurrent(next);
        setSelectedOption(null);
        setIsAnswerCorrect(null);
        setShowFeedback(false);
      } else {
        // Last question - don't auto-submit, let user click submit
        setShowFeedback(false);
      }
    }, 1500);
  };

  const handleNext = () => {
    if (current < quiz.questions.length - 1 && !showFeedback) {
      setCurrent(current + 1);
      setSelectedOption(null);
      setIsAnswerCorrect(null);
    }
  };

  const handlePrevious = () => {
    if (current > 0 && !showFeedback) {
      setCurrent(current - 1);
      setSelectedOption(null);
      setIsAnswerCorrect(null);
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    
    // ✅ Check which questions are unanswered
    const unansweredIndices = [];
    for (let i = 0; i < answers.length; i++) {
      if (!answers[i] || answers[i] === '') {
        unansweredIndices.push(i + 1);
      }
    }
    
    console.log('Answers array:', answers);
    console.log('Unanswered indices:', unansweredIndices);
    
    if (unansweredIndices.length > 0) {
      const message = unansweredIndices.length === 1 
        ? `⚠️ Please answer question ${unansweredIndices[0]} before submitting`
        : `⚠️ Please answer questions: ${unansweredIndices.join(', ')} before submitting`;
      toast.warning(message);
      return;
    }
    
    setSubmitting(true);
    const loadingToast = toast.loading('Submitting your quiz...');
    
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      let mentalState = {};
      try {
        const mentalStateRes = await mentalStateAPI.getInsights();
        mentalState = mentalStateRes.data?.currentState || {};
      } catch (error) {
        console.warn('Could not fetch mental state:', error);
      }
      
      // ✅ Answers already contain answer texts
      const answerTexts = answers;
      console.log('📤 Submitting answers:', answerTexts);
      
      const response = await quizAPI.submitQuiz(quizId, answerTexts, timeSpent, mentalState);
      
      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success(`✅ Quiz completed! Score: ${response.data.score}%`);
        
        if (isOnline && socketService.getConnectionStatus()) {
          socketService.requestProgressUpdate();
        }
        
        navigate(`/student/student-quiz/${quizId}/result`, { 
          state: { 
            results: response.data,
            quizTitle: quiz?.title,
            topic: quiz?.topic
          } 
        });
      } else {
        toast.dismiss(loadingToast);
        toast.error(response.message || 'Failed to submit quiz');
        setSubmitting(false);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOptionCorrect = (optionText) => {
    if (!quiz) return false;
    const currentQuestion = quiz.questions[current];
    if (!currentQuestion || !currentQuestion.correctAnswer) return false;
    return optionText === currentQuestion.correctAnswer;
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <FaSpinner className="spinner" />
        <p>Loading your quiz...</p>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;
  const isLastQuestion = current === quiz.questions.length - 1;
  const hasCurrentAnswer = answers[current] && answers[current] !== '';

  return (
    <div className="quiz-container-premium">
      <div className="quiz-header">
        <button onClick={() => navigate('/student/quiz/generate')} className="back-btn">
          <FaArrowLeft /> Back
        </button>
        <div className="quiz-info">
          <h2>{quiz.title}</h2>
          <div className="quiz-meta">
            <span className="difficulty-badge" data-difficulty={quiz.difficulty}>
              {quiz.difficulty || 'Intermediate'}
            </span>
            <span className="time-badge">
              <FaClock /> {formatTime(timeLeft)}
            </span>
            {!isOnline && <span className="offline-badge-small">offline</span>}
          </div>
          <div className="progress-section">
            <span>
              Question {current + 1} of {quiz.questions.length}
              {hasCurrentAnswer && <span className="answered-badge"> ✓ Answered</span>}
            </span>
            <div className="progress-bar-bg">
              <motion.div 
                className="progress-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="question-card"
        >
          <h3 className="question-text">{currentQuestion.text || currentQuestion.question}</h3>

          <div className="options-grid">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const letter = String.fromCharCode(65 + idx);
              const isCorrectOption = isOptionCorrect(option);
              const isAnswered = hasCurrentAnswer && answers[current] === option;
              
              let statusClass = "";
              if (showFeedback) {
                if (isCorrectOption) {
                  statusClass = "correct";
                } else if (isSelected && !isCorrectOption) {
                  statusClass = "incorrect";
                } else if (!isSelected && !isCorrectOption) {
                  statusClass = "disabled";
                }
              } else if (isAnswered) {
                statusClass = "answered";
              }

              return (
                <button
                  key={idx}
                  className={`option-btn ${statusClass}`}
                  onClick={() => !showFeedback && !submitting && !hasCurrentAnswer && handleAnswer(option, idx)}
                  disabled={showFeedback || submitting || hasCurrentAnswer}
                >
                  <span className="option-letter">{letter}.</span>
                  <span className="option-text">{option}</span>
                  {showFeedback && isCorrectOption && (
                    <FaCheckCircle className="status-icon correct-icon" />
                  )}
                  {showFeedback && isSelected && !isCorrectOption && (
                    <FaTimesCircle className="status-icon incorrect-icon" />
                  )}
                  {!showFeedback && isAnswered && (
                    <FaCheckCircle className="status-icon answered-icon" />
                  )}
                </button>
              );
            })}
          </div>
          
          {showFeedback && currentQuestion.explanation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`explanation-box ${isAnswerCorrect ? 'correct-explanation' : 'incorrect-explanation'}`}
            >
              <p className="explanation-title">
                {isAnswerCorrect ? '✅ Correct!' : '❌ Incorrect!'}
              </p>
              <p className="explanation-text">{currentQuestion.explanation}</p>
              {!isAnswerCorrect && (
                <p className="correct-answer-text">
                  Correct answer: <strong style={{ color: '#10b981' }}>{currentQuestion.correctAnswer}</strong>
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="quiz-navigation">
        <button
          className="nav-btn prev"
          onClick={handlePrevious}
          disabled={current === 0 || showFeedback}
        >
          Previous
        </button>
        
        {!isLastQuestion ? (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={showFeedback || !answers[current]}
          >
            Next
          </button>
        ) : (
          <button
            className="nav-btn submit"
            onClick={handleSubmitQuiz}
            disabled={submitting || !answers[current]}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
      
      {submitting && (
        <div className="submitting-overlay">
          <FaSpinner className="spinner" />
          <p>Submitting your answers...</p>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;