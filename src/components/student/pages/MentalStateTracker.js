// frontend/src/components/student/mentalState/MentalStateTracker.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaBatteryFull, FaBatteryThreeQuarters, FaBatteryQuarter, 
  FaBrain, FaCalendarAlt, FaChartLine, FaSmile, 
  FaFrown, FaMeh, FaTired, FaSpinner, FaCheckCircle, FaTimesCircle,
  FaMoon, FaSun, FaWalking, FaAppleAlt, FaUsers, FaBriefcase,
  FaSync, FaLightbulb
} from 'react-icons/fa';
import { mentalStateAPI } from '../../../api/mentalState';
import socketService from '../../../services/socketService';
import { toast } from 'sonner';
import '../../../styles/MentalStateTracker.css';
import { FaLandMineOn } from 'react-icons/fa6';

const MentalStateTracker = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentState, setCurrentState] = useState(null);
  const [history, setHistory] = useState(null);
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState(null);
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [journalType, setJournalType] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    stressLevel: 'medium',
    motivationLevel: 'medium',
    energyLevel: 'medium',
    focusLevel: 'medium',
    mood: 'neutral',
    notes: '',
    sleepHours: '',
    exerciseMinutes: '',
    factors: [],
  });

  // Check socket connection
  useEffect(() => {
    setIsOnline(socketService.getConnectionStatus());
    
    const unsubscribe = socketService.on('socket:connected', () => {
      setIsOnline(true);
      toast.success('🔄 Real-time wellness sync connected!', { duration: 2000 });
      fetchData(false);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle real-time mental state updates
  const handleMentalStateUpdate = (data) => {
    console.log('🧠 MentalState: Update received', data);
    
    if (data.currentState) {
      setCurrentState(data.currentState);
      setFormData(prev => ({
        ...prev,
        stressLevel: data.currentState.stressLevel || 'medium',
        motivationLevel: data.currentState.motivationLevel || 'medium',
        energyLevel: data.currentState.energyLevel || 'medium',
        focusLevel: data.currentState.focusLevel || 'medium',
        mood: data.currentState.mood || 'neutral'
      }));
      
      toast.info(`Mood updated to ${data.currentState.mood}`, {
        duration: 2000,
        icon: getMoodEmoji(data.currentState.mood)
      });
    }
  };

  // Handle progress updates that might affect mental state
  const handleProgressUpdate = (data) => {
    console.log('📊 MentalState: Progress update received', data);
    
    if (data.type === 'quiz_submitted') {
      if (data.data?.score < 50) {
        toast.warning('Low quiz score detected. Take a break if needed!', {
          duration: 5000,
          icon: '🧘'
        });
      } else if (data.data?.score >= 90) {
        toast.success('Great job! Your hard work is paying off!', {
          duration: 3000,
          icon: '🎉'
        });
      }
      setTimeout(() => fetchData(true), 2000);
    }
  };

  // Setup socket listeners
  useEffect(() => {
    if (socketService) {
      const unsubscribeMental = socketService.on('mental-state-update', handleMentalStateUpdate);
      const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
      const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
      
      return () => {
        if (unsubscribeMental) unsubscribeMental();
        if (unsubscribeProgress) unsubscribeProgress();
        if (unsubscribeIncremental) unsubscribeIncremental();
      };
    }
  }, []);

  // ✅ FIXED: Robust fetchData function
  const fetchData = async (silent = false) => {
    if (!silent) setFetchLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching mental state data...');
      
      // Try to get data with fallbacks
      let historyRes = { data: { currentState: null, entries: [] } };
      let insightsRes = { data: { insights: [], recommendations: [] } };
      let trendsRes = { data: [] };
      
      // Fetch history
      try {
        historyRes = await mentalStateAPI.getHistory(30);
        console.log('✅ getHistory response:', historyRes);
      } catch (err) {
        console.warn('getHistory failed:', err);
        historyRes = { data: { currentState: null, entries: [] } };
      }
      
      // Fetch insights
      try {
        insightsRes = await mentalStateAPI.getInsights();
        console.log('✅ getInsights response:', insightsRes);
      } catch (err) {
        console.warn('getInsights failed:', err);
        insightsRes = { data: { insights: [], recommendations: [] } };
      }
      
      // Fetch trends
      try {
        trendsRes = await mentalStateAPI.getTrends('week');
        console.log('✅ getTrends response:', trendsRes);
      } catch (err) {
        console.warn('getTrends failed:', err);
        trendsRes = { data: [] };
      }
      
      // Extract data safely
      const historyData = historyRes.data || {};
      const insightsData = insightsRes.data || {};
      const trendsData = trendsRes.data || [];
      
      setHistory(historyData);
      setInsights(insightsData);
      setTrends(trendsData);
      
      // Extract current state safely from different possible paths
      let currentStateData = null;
      
      if (historyData.currentState) {
        currentStateData = historyData.currentState;
      } else if (historyData.data?.currentState) {
        currentStateData = historyData.data.currentState;
      } else if (historyData.state) {
        currentStateData = historyData.state;
      } else if (historyData[0]) {
        // If history is an array, take the first entry
        currentStateData = historyData[0];
      }
      
      if (currentStateData) {
        setCurrentState(currentStateData);
        setFormData(prev => ({
          ...prev,
          stressLevel: currentStateData.stressLevel || 'medium',
          motivationLevel: currentStateData.motivationLevel || 'medium',
          energyLevel: currentStateData.energyLevel || 'medium',
          focusLevel: currentStateData.focusLevel || 'medium',
          mood: currentStateData.mood || 'neutral'
        }));
      } else {
        // Set default state if no data
        console.log('No current state found, using defaults');
        setCurrentState({
          stressLevel: 'medium',
          motivationLevel: 'medium',
          energyLevel: 'medium',
          focusLevel: 'medium',
          mood: 'neutral'
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching mental state data:', error);
      setError(error.message || 'Failed to load data');
      if (!silent) {
        toast.error('Failed to load mental state data');
      }
      // Set default state on error
      setCurrentState({
        stressLevel: 'medium',
        motivationLevel: 'medium',
        energyLevel: 'medium',
        focusLevel: 'medium',
        mood: 'neutral'
      });
    } finally {
      if (!silent) setFetchLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
    
    // Set up real-time updates via polling as fallback (every 30 seconds)
    const interval = setInterval(() => {
      if (!socketService.getConnectionStatus()) {
        fetchData(true);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    if (isOnline) {
      socketService.requestProgressUpdate();
    }
    toast.success('Wellness data refreshed!');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const newFactors = checked
        ? [...formData.factors, value]
        : formData.factors.filter(f => f !== value);
      setFormData(prev => ({ ...prev, factors: newFactors }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const mentalStateData = {
        stressLevel: formData.stressLevel,
        motivationLevel: formData.motivationLevel,
        energyLevel: formData.energyLevel,
        focusLevel: formData.focusLevel,
        mood: formData.mood,
        notes: formData.notes || '',
        factors: formData.factors || [],
        sleepHours: formData.sleepHours ? parseFloat(formData.sleepHours) : null,
        exerciseMinutes: formData.exerciseMinutes ? parseInt(formData.exerciseMinutes) : null
      };

      const response = await mentalStateAPI.updateMentalState(mentalStateData);
      
      if (response.success) {
        toast.success('Mental state updated successfully!');
        
        // Emit socket event for real-time update
        if (isOnline && socketService.getConnectionStatus()) {
          socketService.emit('mental-state-update', {
            currentState: mentalStateData,
            timestamp: new Date()
          });
          socketService.requestProgressUpdate();
        }
        
        fetchData(false);
        setFormData(prev => ({
          ...prev,
          notes: '',
          sleepHours: '',
          exerciseMinutes: '',
          factors: [],
        }));
      } else {
        toast.error(response.message || 'Failed to update mental state');
      }
    } catch (error) {
      console.error('Error updating mental state:', error);
      toast.error('Failed to update mental state');
    } finally {
      setLoading(false);
    }
  };

  const handleJournalSubmit = async () => {
    if (!journalEntry.trim()) {
      toast.error('Please write something in your journal');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await mentalStateAPI.addJournalEntry({
        content: journalEntry,
        type: journalType
      });
      
      if (response.success) {
        toast.success('Journal entry added!');
        
        if (isOnline && socketService.getConnectionStatus()) {
          socketService.emit('journal-entry-added', {
            type: journalType,
            timestamp: new Date()
          });
        }
        
        setJournalEntry('');
        setShowJournal(false);
        fetchData(true);
      } else {
        toast.error(response.message || 'Failed to add journal entry');
      }
    } catch (error) {
      console.error('Error adding journal entry:', error);
      toast.error('Failed to add journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      happy: '😊',
      neutral: '😐',
      sad: '😔',
      anxious: '😰',
      tired: '😴',
      energetic: '⚡'
    };
    return moods[mood] || '😐';
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: '#10b981',
      neutral: '#6b7280',
      sad: '#3b82f6',
      anxious: '#f59e0b',
      tired: '#8b5cf6',
      energetic: '#ef4444'
    };
    return colors[mood] || '#6b7280';
  };

  const getLevelIcon = (level) => {
    if (level === 'high') return <FaBatteryFull />;
    if (level === 'medium') return <FaBatteryThreeQuarters />;
    return <FaBatteryQuarter />;
  };

  const getLevelColor = (level) => {
    if (level === 'high') return '#10b981';
    if (level === 'medium') return '#f59e0b';
    return '#ef4444';
  };

  // if (fetchLoading) {
  //   return (
  //     <div className="mental-state-loading">
  //       <FaSpinner className="spinner" />
  //       <p className='text-white'>Loading your wellness dashboard...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="mental-state-container">
      {/* Header with Refresh */}
      <div className="mental-state-header">
        <div className="header-content mt-0 pt-0">
          <h2 className="mental-state-title">
         Mental Wellness Tracker
          </h2>
          <p className="mental-state-subtitle">
            Track your mood, stress, and energy levels for better learning
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleRefresh} 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Syncing...' : 'Sync'}
          </button>
          {!isOnline && <span className="offline-badge">offline</span>}
          {isOnline && <span className="live-badge text-white">Live</span>}
        </div>
      </div>

      {/* Current State Card */}
      {currentState && (
        <motion.div 
          className="current-state-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="current-mood">
            <div 
              className="mood-emoji-large"
              style={{ background: `${getMoodColor(currentState.mood)}20` }}
            >
              {getMoodEmoji(currentState.mood)}
            </div>
            <div className="mood-info">
              <h3>Current Mood</h3>
              <span className="mood-label" style={{ color: getMoodColor(currentState.mood) }}>
                {currentState.mood?.toUpperCase() || 'NEUTRAL'}
              </span>
            </div>
          </div>
          
          <div className="current-levels">
            <div className="level-item">
              <span className="level-icon" style={{ color: getLevelColor(currentState.stressLevel) }}>
                {getLevelIcon(currentState.stressLevel)}
              </span>
              <div>
                <small>Stress</small>
                <strong>{currentState.stressLevel || 'medium'}</strong>
              </div>
            </div>
            <div className="level-item">
              <span className="level-icon" style={{ color: getLevelColor(currentState.motivationLevel) }}>
                {getLevelIcon(currentState.motivationLevel)}
              </span>
              <div>
                <small>Motivation</small>
                <strong>{currentState.motivationLevel || 'medium'}</strong>
              </div>
            </div>
            <div className="level-item">
              <span className="level-icon" style={{ color: getLevelColor(currentState.energyLevel) }}>
                {getLevelIcon(currentState.energyLevel)}
              </span>
              <div>
                <small>Energy</small>
                <strong>{currentState.energyLevel || 'medium'}</strong>
              </div>
            </div>
            <div className="level-item">
              <span className="level-icon" style={{ color: getLevelColor(currentState.focusLevel) }}>
                {getLevelIcon(currentState.focusLevel)}
              </span>
              <div>
                <small>Focus</small>
                <strong>{currentState.focusLevel || 'medium'}</strong>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Update Form */}
      <div className="mental-state-form-container">
        <h3 className="form-title">How are you feeling right now?</h3>
        
        <form onSubmit={handleSubmit} className="mental-state-form">
          {/* Mood Selection */}
          <div className="form-group">
            <label>Mood</label>
            <div className="mood-selector">
              {['happy', 'neutral', 'sad', 'anxious', 'tired', 'energetic'].map(mood => (
                <button
                  key={mood}
                  type="button"
                  className={`mood-btn ${formData.mood === mood ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, mood }))}
                  style={{ 
                    background: formData.mood === mood ? getMoodColor(mood) : 'rgba(255,255,255,0.1)',
                    borderColor: getMoodColor(mood)
                  }}
                >
                  <span className="mood-emoji">{getMoodEmoji(mood)}</span>
                  <span className="mood-name">{mood}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stress Level</label>
              <select name="stressLevel" value={formData.stressLevel} onChange={handleChange}>
                <option value="low">Low - Feeling calm</option>
                <option value="medium">Medium - Manageable</option>
                <option value="high">High - Overwhelmed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Motivation Level</label>
              <select name="motivationLevel" value={formData.motivationLevel} onChange={handleChange}>
                <option value="low">Low - Struggling to start</option>
                <option value="medium">Medium - Ready to work</option>
                <option value="high">High - Very motivated</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Energy Level</label>
              <select name="energyLevel" value={formData.energyLevel} onChange={handleChange}>
                <option value="low">Low - Need rest</option>
                <option value="medium">Medium - Normal</option>
                <option value="high">High - Full of energy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Focus Level</label>
              <select name="focusLevel" value={formData.focusLevel} onChange={handleChange}>
                <option value="low">Low - Easily distracted</option>
                <option value="medium">Medium - Can concentrate</option>
                <option value="high">High - Deep focus</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Factors (What's affecting you?)</label>
            <div className="factors-grid1">
              {[
                { value: 'sleep', icon: <FaMoon />, label: 'Sleep' },
                { value: 'exercise', icon: <FaWalking />, label: 'Exercise' },
                { value: 'diet', icon: <FaAppleAlt />, label: 'Diet' },
                { value: 'social', icon: <FaUsers />, label: 'Social' },
                { value: 'workload', icon: <FaBriefcase />, label: 'Workload' },
                { value: 'personal', icon: <FaHeart />, label: 'Personal' }
              ].map(factor => (
                <label key={factor.value} className="factor-checkbox">
                  <input
                    type="checkbox"
                    value={factor.value}
                    checked={formData.factors.includes(factor.value)}
                    onChange={handleChange}
                  />
                  <span className="factor-icon">{factor.icon}</span>
                  <span className="factor-label">{factor.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sleep (hours)</label>
              <input
                type="number"
                name="sleepHours"
                value={formData.sleepHours}
                onChange={handleChange}
                step="0.5"
                placeholder="e.g., 7.5"
              />
            </div>

            <div className="form-group">
              <label>Exercise (minutes)</label>
              <input
                type="number"
                name="exerciseMinutes"
                value={formData.exerciseMinutes}
                onChange={handleChange}
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="How are you feeling? Any specific thoughts?"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <FaSpinner className="spinner-small" /> : 'Update State'}
          </button>
        </form>
      </div>

      {/* Insights Section */}
      {insights && insights.insights && insights.insights.length > 0 && (
        <div className="insights-section">
          <h3 className="section-title">
            <FaChartLine /> Wellness Insights
          </h3>
          <div className="insights-grid">
            {insights.insights.map((insight, index) => (
              <motion.div 
                key={index} 
                className="insight-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="insight-icon">{insight.icon || '💡'}</span>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights && (insights.recommendations?.length > 0 || insights.studySuggestions?.length > 0) && (
        <div className="recommendations-section">
          <h3 className="section-title">
            <FaLandMineOn /> Personalized Recommendations
          </h3>
          
          {insights.recommendations?.length > 0 && (
            <div className="recommendations-grid">
              {insights.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <span className="rec-icon">{rec.icon || '💭'}</span>
                  <div>
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    {rec.action && (
                      <button className="rec-action-btn">{rec.action}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {insights.studySuggestions?.length > 0 && (
            <div className="study-suggestions">
              <h4>Study Suggestions</h4>
              {insights.studySuggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <span className="suggestion-icon">📚</span>
                  <p>{suggestion.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Journal Button */}
      <button className="journal-btn" onClick={() => setShowJournal(true)}>
        <FaHeart /> Write in Journal
      </button>

      {/* Journal Modal */}
      <AnimatePresence>
        {showJournal && (
          <motion.div 
            className="journal-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJournal(false)}
          >
            <motion.div 
              className="journal-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>📔 Journal Entry</h3>
              
              <div className="journal-type-selector">
                <button
                  className={journalType === 'general' ? 'active' : ''}
                  onClick={() => setJournalType('general')}
                >
                  General
                </button>
                <button
                  className={journalType === 'grateful' ? 'active' : ''}
                  onClick={() => setJournalType('grateful')}
                >
                  🙏 Grateful
                </button>
                <button
                  className={journalType === 'challenge' ? 'active' : ''}
                  onClick={() => setJournalType('challenge')}
                >
                  💪 Challenge
                </button>
                <button
                  className={journalType === 'reflection' ? 'active' : ''}
                  onClick={() => setJournalType('reflection')}
                >
                  🤔 Reflection
                </button>
              </div>
              
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Write your thoughts here..."
                rows="6"
              />
              
              <div className="journal-actions">
                <button onClick={() => setShowJournal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleJournalSubmit} className="save-btn" disabled={submitting}>
                  {submitting ? <FaSpinner className="spinner-small" /> : 'Save Entry'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentalStateTracker;