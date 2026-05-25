import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizForStudent, submitQuiz } from '../../api/studentApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Clock, AlertCircle, ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import socketService from '../../services/socketService';

const StudentTakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  
  // ✅ State for visual feedback
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  useEffect(() => {
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(quizId);
    
    if (!isValidObjectId) {
      console.error('Invalid quiz ID format:', quizId);
      toast.error('Invalid quiz link');
      navigate('/student/classes');
      return;
    }
    
    fetchQuiz();
    
    return () => {
      setQuiz(null);
      setAnswers({});
    };
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz && !submitting && !loading) {
      handleSubmit();
    }
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      
      if (!quizId || quizId === 'history' || quizId === 'undefined' || quizId === 'stats') {
        setError('Invalid quiz ID');
        toast.error('Invalid quiz ID');
        navigate('/student/classes');
        return;
      }
      
      const response = await getQuizForStudent(quizId);
      console.log('Quiz data:', response);
      
      if (response.success && response.data) {
        setQuiz(response.data);
        const timeLimitInSeconds = (response.data.timeLimit || 30) * 60;
        setTimeLeft(timeLimitInSeconds);
      } else {
        setError(response.message || 'Quiz not found');
        toast.error(response.message || 'Quiz not found');
      }
    } catch (err) {
      console.error('Error fetching quiz:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load quiz';
      setError(errorMsg);
      toast.error(errorMsg);
      navigate('/student/classes');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check if answer is correct
  const checkAnswer = (selectedOption, question) => {
    return selectedOption === question.correctAnswer;
  };

  // ✅ Handle answer with visual feedback
  const handleAnswerSelect = (questionIndex, answer, question) => {
    const correct = checkAnswer(answer, question);
    
    setSelectedAnswer(answer);
    setIsAnswerCorrect(correct);
    setShowFeedback(true);
    
    // Store the answer
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
    
    // Auto-advance to next question after 1.5 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        handleSubmit();
      }
    }, 1500);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    if (submitting) return;
    
    const unanswered = quiz.questions.filter((_, idx) => !answers[idx]);
    if (unanswered.length > 0) {
      toast.warning(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    const toastId = toast.loading('Submitting your quiz...');
    setSubmitting(true);
    
    try {
      const formattedAnswers = quiz.questions.map((_, idx) => answers[idx]);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await submitQuiz(quizId, {
        answers: formattedAnswers,
        timeSpent: timeSpent
      });

      toast.dismiss(toastId);

      if (response.success) {
        toast.success(`Quiz submitted! Score: ${response.data.score}%`);
        
        if (socketService?.getConnectionStatus()) {
          socketService.emit('quiz-completed', {
            quizId: quizId,
            score: response.data.score,
            xpEarned: response.data.xpEarned,
            topic: quiz?.topic,
            title: quiz?.title,
            timestamp: new Date()
          });
        }
        
        navigate(`/student/quiz/${quizId}/result`, { 
          state: { result: response.data },
          replace: true
        });
      } else {
        toast.error(response.message || 'Failed to submit quiz');
        setSubmitting(false);
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Error submitting quiz:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="take-quiz-container">
        <LoadingSpinner text="Loading quiz..." />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="take-quiz-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h2>Unable to load quiz</h2>
          <p>{error || 'Quiz not found'}</p>
          <button className="back-button" onClick={() => navigate('/student/classes')}>Go Back</button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="take-quiz-container">
      <div className="quiz-header">
        <button className="back-btn" onClick={() => navigate('/student/classes')}>
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="quiz-title">
          <h1>{quiz.title}</h1>
          <p>{quiz.topic}</p>
        </div>
        <div className="quiz-timer">
          <Clock size={18} />
          <span className={timeLeft < 60 ? 'urgent' : ''}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
      </div>

      <div className="quiz-question">
        <h3>{currentQ.text || currentQ.question}</h3>
        <div className="options-list">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQ.correctAnswer;
            const showResult = showFeedback && isSelected;
            
            let optionClass = 'option-label';
            if (showResult) {
              if (isCorrectOption) optionClass += ' correct';
              if (isSelected && !isCorrectOption) optionClass += ' incorrect';
            }
            
            return (
              <label
                key={idx}
                className={optionClass}
                onClick={() => !showFeedback && !submitting && handleAnswerSelect(currentQuestion, option, currentQ)}
              >
                <input
                  type="radio"
                  name={`question_${currentQuestion}`}
                  value={option}
                  checked={answers[currentQuestion] === option}
                  readOnly
                  disabled={showFeedback || submitting}
                />
                <span className="option-text">
                  {String.fromCharCode(65 + idx)}. {option}
                </span>
                {showFeedback && isCorrectOption && (
                  <CheckCircle className="correct-icon" size={18} />
                )}
                {showFeedback && isSelected && !isCorrectOption && (
                  <XCircle className="incorrect-icon" size={18} />
                )}
              </label>
            );
          })}
        </div>
        
        {showFeedback && (
          <div className={`feedback-message ${isAnswerCorrect ? 'correct-feedback' : 'incorrect-feedback'}`}>
            <p>{isAnswerCorrect ? '✅ Correct!' : `❌ Incorrect! The correct answer is: ${currentQ.correctAnswer}`}</p>
            {currentQ.explanation && <p className="explanation">{currentQ.explanation}</p>}
          </div>
        )}
      </div>

      <div className="quiz-navigation">
        <button
          className="nav-btn prev"
          onClick={handlePrevious}
          disabled={currentQuestion === 0 || showFeedback}
        >
          Previous
        </button>
        
        {currentQuestion === quiz.questions.length - 1 ? (
          <button
            className="nav-btn submit"
            onClick={handleSubmit}
            disabled={submitting || showFeedback}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={showFeedback}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentTakeQuiz;