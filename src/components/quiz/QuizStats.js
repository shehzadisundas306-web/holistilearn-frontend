import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaChartLine, FaBrain, FaTrophy, FaLayerGroup, FaExclamationTriangle } from 'react-icons/fa';
import { quizAPI } from '../../api/quiz';
import './quiz.css';

const QuizStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await quizAPI.getQuizStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="stats-loader-container">
      <FaSpinner className="spin-icon" />
      <p>Aggregating performance data...</p>
    </div>
  );

  return (
    <div className="stats-dashboard-wrapper">
      <header className="stats-hero-section">
        <div className="stats-hero-text">
          <h1>Cognitive Insights</h1>
          <p>Real-time analysis of your subject matter proficiency.</p>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="stats-overview-grid">
        {[
          { label: 'Total Assessments', value: stats?.overview?.totalQuizzes || 0, icon: <FaLayerGroup />, color: '#3498db' },
          { label: 'Avg. Accuracy', value: `${Math.round(stats?.overview?.averageScore || 0)}%`, icon: <FaChartLine />, color: 'var(--blue)' },
          { label: 'Peak Performance', value: `${(stats?.overview?.bestScore || 0).toFixed(2)}%`, icon: <FaTrophy />, color: '#f1c40f' }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            className="stats-glass-card"
            whileHover={{ y: -5, borderColor: item.color }}
          >
            <div className="s-card-icon" style={{ color: item.color }}>{item.icon}</div>
            <div className="s-card-data">
              <h3>{item.value}</h3>
              <span>{item.label}</span>
            </div>
            <div className="s-card-glow" style={{ background: item.color }}></div>
          </motion.div>
        ))}
      </div>

      <div className="analysis-split-grid">
        {/* Mastered Topics */}
        <div className="analysis-panel mastered">
          <div className="panel-header">
            <FaBrain /> <h3>Competency Mastery</h3>
          </div>
          <div className="topic-skill-list">
            {stats?.topicsMastered?.length > 0 ? (
              stats.topicsMastered.map((topic, i) => (
                <div key={i} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{topic.topic}</span>
                    <span className="skill-percent">{Math.round(topic.averageScore)}%</span>
                  </div>
                  <div className="skill-bar-bg">
                    <motion.div 
                      className="skill-bar-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.averageScore}%` }}
                      style={{ background: 'var(--blue)' }}
                    />
                  </div>
                </div>
              ))
            ) : <p className="empty-msg">No masteries recorded yet.</p>}
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="analysis-panel weak">
          <div className="panel-header">
            <FaExclamationTriangle /> <h3>Growth Opportunities</h3>
          </div>
          <div className="topic-skill-list">
            {stats?.weakTopics?.length > 0 ? (
              stats.weakTopics.map((topic, i) => (
                <div key={i} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{topic.topic}</span>
                    <span className="skill-percent text-danger">{Math.round(topic.averageScore)}%</span>
                  </div>
                  <div className="skill-bar-bg">
                    <motion.div 
                      className="skill-bar-fill-weak" 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.averageScore}%` }}
                    />
                  </div>
                </div>
              ))
            ) : <p className="empty-msg">You're doing great in all areas!</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizStats;