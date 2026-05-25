// frontend/src/components/quiz/GenerateQuiz.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSpinner, FaBrain, FaRocket, FaLightbulb, FaRobot } from 'react-icons/fa';
import { generateAIQuiz } from '../../api/studentApi';
import { toast } from 'sonner';
import './quiz.css';

const GenerateQuiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'intermediate',
    numQuestions: 10
  });

  const difficulties = [
    { value: 'beginner', label: 'Beginner', icon: <FaLightbulb />, color: '#F5C45E' },
    { value: 'intermediate', label: 'Intermediate', icon: <FaRocket />, color: '#3498db' },
    { value: 'advanced', label: 'Advanced', icon: <FaRobot />, color: '#e74c3c' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast.error('Please define a study topic');
      return;
    }
    setLoading(true);
    
    const toastId = toast.loading('Generating your personalized quiz...');
    
    try {
      const response = await generateAIQuiz(formData);
      
      if (response.success && response.data) {
        toast.success('AI has generated your assessment!', { id: toastId, duration: 3000 });
        
        // ✅ FIXED: Navigate to personal quiz route
        navigate(`/student/student-quiz/${response.data.quizId}`);
      } else {
        toast.error(response.message || 'AI Generation failed', { id: toastId });
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error(error.message || 'AI Generation failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-generator-wrapper">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-generator-card"
      >
        <div className="glass-header">
          <div className="ai-icon-pulse">
            <FaBrain />
          </div>
          <h2>AI Study Engine</h2>
          <p>Harness Neuro-symbolic AI to generate personalized assessments</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-form">
          <div className="input-field-group">
            <label>What do you want to master?</label>
            <div className="input-with-icon">
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g. Asynchronous Javascript or Quantum Physics"
                disabled={loading}
              />
              <div className="input-focus-border"></div>
            </div>
          </div>

          <div className="input-field-group">
            <label>Complexity Level</label>
            <div className="diff-grid">
              {difficulties.map(diff => (
                <div 
                  key={diff.value}
                  className={`diff-card ${formData.difficulty === diff.value ? 'selected' : ''}`}
                  onClick={() => !loading && setFormData(prev => ({ ...prev, difficulty: diff.value }))}
                >
                  <span className="diff-icon" style={{ color: diff.color }}>{diff.icon}</span>
                  <span className="diff-text">{diff.label}</span>
                  {formData.difficulty === diff.value && <motion.div layoutId="active-bg" className="active-glow" style={{background: diff.color}} />}
                </div>
              ))}
            </div>
          </div>

          <div className="input-field-group">
            <div className="slider-header">
              <label>Question Count</label>
              <span className="count-badge">{formData.numQuestions}</span>
            </div>
            <input
              type="range"
              name="numQuestions"
              min="5"
              max="20"
              value={formData.numQuestions}
              onChange={handleChange}
              className="premium-slider"
              disabled={loading}
            />
          </div>

          <button type="submit" className="ai-submit-btn" disabled={loading}>
            {loading ? <FaSpinner className="spin-icon" /> : "Initialize AI Generation"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default GenerateQuiz;