// frontend/src/components/quiz/QuizHub.js
import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaHistory, FaChartLine, FaAd } from 'react-icons/fa';

import GenerateQuiz from './GenerateQuiz';
import TakeQuiz from './TakeQuiz';
import QuizResults from './QuizResults';
import QuizHistory from './QuizHistory';
import QuizStats from './QuizStats';

import './quiz.css';
import StudentQuizResult from '../../pages/student/StudentQuizResult';
import StudentTakeQuiz from '../../pages/student/StudentTakeQuiz';

const QuizHub = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'generate', name: 'AI Engine', icon: <FaBrain />, path: '/student/quiz/generate' },
    { id: 'history', name: 'History', icon: <FaHistory />, path: '/student/quiz/history' },
    { id: 'stats', name: 'Insights', icon: <FaChartLine />, path: '/student/quiz/stats' },
  ];

  // Check if we're in quiz taking mode for TEACHER CLASS quizzes
  // Personal quizzes go to /student/student-quiz/*, so they won't match here
  const isQuizActive = location.pathname.includes('/quiz/') && 
                       !location.pathname.includes('/generate') &&
                       !location.pathname.includes('/history') &&
                       !location.pathname.includes('/stats');

  // Teacher class quiz routes
  if (isQuizActive) {
    return (
      <Routes>
        <Route path=":quizId" element={<StudentTakeQuiz />} />
        <Route path=":quizId/result" element={<StudentQuizResult />} />
      </Routes>
    );
  }

  return (
    <div className="quiz-hub-wrapper">
      <div className="hub-glow-1"></div>
      <div className="hub-glow-2"></div>

      <div className="quiz-hub-container">
        <header className="hub-header-section">
          <div className="badge-ai">
            <FaAd /> Powered by Neuro-symbolic AI
          </div>
          <h1 className="hub-title">Knowledge Mastery Hub</h1>
          <p className="hub-subtitle">
            Validate your expertise through AI-driven adaptive assessments.
          </p>
        </header>

        <nav className="hub-navigation">
          <div className="glass-nav-inner">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`hub-nav-item ${location.pathname === tab.path ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-text">{tab.name}</span>
                {location.pathname === tab.path && (
                  <motion.div 
                    layoutId="activeTabGlow" 
                    className="nav-active-indicator" 
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        <main className="hub-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Routes>
                <Route path="generate" element={<GenerateQuiz />} />
                <Route path="history" element={<QuizHistory />} />
                <Route path="stats" element={<QuizStats />} />
                <Route path="" element={<GenerateQuiz />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default QuizHub;