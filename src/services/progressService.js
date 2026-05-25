// frontend/src/services/progressService.js
import api from './api';
import socketService from './socketService';

class ProgressService {
  constructor() {
    this.progressListeners = new Map();
    this.currentProgress = null;
    this.isSubscribed = false;
  }

  /**
   * Fetch initial progress data from API
   */
  async fetchProgress() {
    try {
      const response = await api.get('/student/progress');
      if (response.data.success) {
        this.currentProgress = response.data.data;
        return this.currentProgress;
      }
      return null;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time progress updates
   */
  subscribeToProgress(userId, onUpdate) {
    // Store callback
    if (!this.progressListeners.has(userId)) {
      this.progressListeners.set(userId, []);
    }
    this.progressListeners.get(userId).push(onUpdate);

    // Setup socket listeners if not already subscribed
    if (!this.isSubscribed) {
      this.setupSocketListeners();
      this.isSubscribed = true;
    }

    // Join progress room
    if (socketService.getConnectionStatus()) {
      socketService.emit('join-progress-room');
      // Request initial update
      socketService.requestProgressUpdate();
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.progressListeners.get(userId);
      if (listeners) {
        const index = listeners.indexOf(onUpdate);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          this.progressListeners.delete(userId);
        }
      }
      
      // Leave room if no more listeners
      if (this.progressListeners.size === 0 && socketService.getConnectionStatus()) {
        socketService.emit('leave-progress-room');
        this.isSubscribed = false;
      }
    };
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    // Handle full progress update
    socketService.on('progress-update', (data) => {
      if (data.type === 'full_update' && data.data) {
        this.currentProgress = data.data;
        this.notifyListeners(data.data);
      }
    });

    // Handle incremental updates
    socketService.on('progress-incremental', (data) => {
      if (this.currentProgress) {
        this.applyIncrementalUpdate(data);
        this.notifyListeners(this.currentProgress);
      }
    });

    // Handle connection established
    socketService.on('connected', () => {
      // Request initial progress update when connected
      socketService.requestProgressUpdate();
    });
  }

  /**
   * Apply incremental updates to current progress
   */
  applyIncrementalUpdate(update) {
    if (!this.currentProgress) return;

    switch (update.type) {
      case 'xp_earned':
        if (this.currentProgress.stats) {
          this.currentProgress.stats.xpPoints += update.data.amount;
          // Recalculate level if needed
          const newLevel = Math.floor(this.currentProgress.stats.xpPoints / 100) + 1;
          if (newLevel > this.currentProgress.stats.level) {
            this.currentProgress.stats.level = newLevel;
          }
        }
        break;

      case 'quiz_completed':
        if (this.currentProgress.stats) {
          this.currentProgress.stats.quizzesTaken += 1;
          this.currentProgress.stats.averageScore = 
            (this.currentProgress.stats.averageScore * (this.currentProgress.stats.quizzesTaken - 1) + update.data.score) 
            / this.currentProgress.stats.quizzesTaken;
        }
        break;

      case 'topic_completed':
        if (this.currentProgress.stats) {
          this.currentProgress.stats.completedTopics += 1;
          this.currentProgress.stats.completedLessons += 1;
        }
        if (this.currentProgress.inProgress) {
          const completedTopic = this.currentProgress.inProgress.find(
            t => t.topicId === update.data.topicId
          );
          if (completedTopic) {
            this.currentProgress.inProgress = this.currentProgress.inProgress.filter(
              t => t.topicId !== update.data.topicId
            );
          }
        }
        break;

      case 'study_time_updated':
        if (this.currentProgress.stats) {
          this.currentProgress.stats.todayStudyTime = update.data.todayStudyTime;
          this.currentProgress.stats.weeklyStudyTime = update.data.weeklyStudyTime;
          this.currentProgress.stats.totalStudyTime = update.data.totalStudyTime;
        }
        break;

      case 'streak_updated':
        if (this.currentProgress.stats) {
          this.currentProgress.stats.learningStreak = update.data.streak;
        }
        break;

      default:
        // For unknown updates, we'll fetch full data
        this.fetchProgress();
    }

    this.currentProgress.lastUpdated = new Date();
  }

  /**
   * Notify all listeners of progress update
   */
  notifyListeners(progressData) {
    this.progressListeners.forEach((listeners) => {
      listeners.forEach(callback => {
        try {
          callback(progressData);
        } catch (error) {
          console.error('Error in progress listener:', error);
        }
      });
    });
  }

  /**
   * Force refresh progress data
   */
  async refreshProgress() {
    const freshData = await this.fetchProgress();
    if (freshData) {
      this.notifyListeners(freshData);
    }
    return freshData;
  }

  /**
   * Get current cached progress
   */
  getCurrentProgress() {
    return this.currentProgress;
  }
}

// Create singleton instance
const progressService = new ProgressService();
export default progressService;