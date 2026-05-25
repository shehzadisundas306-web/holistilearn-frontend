// frontend/src/components/student/dashboard/ActivityTimeline.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, FaStar, FaStickyNote, FaHistory, 
  FaSpinner, FaBrain, FaFire, FaTrophy, FaBook,
  FaTrash, FaTrashAlt, FaTimes, FaExclamationTriangle, 
  FaChevronRight, FaChevronLeft 
} from "react-icons/fa";
import { activityAPI } from '../../../api/activity';
import { formatTimeAgo } from '../../../utils/helpers';
import { toast } from 'sonner';
import '../../../styles/ActivtyTimeline.css';

const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalActivities, setTotalActivities] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [modalConfig, setModalConfig] = useState({ 
    show: false, 
    type: null, 
    targetId: null,
    message: '',
    actionText: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage]);

  const fetchActivities = async (pageNum) => {
    try {
      setLoading(true);
      const skip = (pageNum - 1) * limit;
      const response = await activityAPI.getRecentActivities(limit, skip);
      
      if (response.success) {
        const formatted = response.data.activities.map(act => ({
          ...act,
          text: act.description || act.title,
          icon: getActivityIcon(act.type),
          color: act.color || getActivityColor(act.type),
        }));
        setActivities(formatted);
        setTotalActivities(response.data.total);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch activities error:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalActivities / limit);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectionMode(false);
    setSelectedActivities([]);
  };

  const getActivityIcon = (type) => {
    const icons = {
      'quiz_completed': <FaStar />,
      'quiz_generated': <FaBrain />,
      'notes_generated': <FaStickyNote />,
      'topic_started': <FaBook />,
      'topic_completed': <FaCheckCircle />,
      'achievement_earned': <FaTrophy />,
      'streak_milestone': <FaFire />
    };
    return icons[type] || <FaHistory />;
  };

  const getActivityColor = (type) => {
    const colors = {
      'quiz_completed': '#F5C45E',
      'quiz_generated': '#A855F7',
      'notes_generated': '#10B981',
      'topic_started': '#3B82F6',
      'topic_completed': '#10B981',
      'achievement_earned': '#f59e0b',
      'streak_milestone': '#EF4444'
    };
    return colors[type] || '#94A3B8';
  };

  const handleDeleteSingle = (activityId) => {
    setModalConfig({
      show: true,
      type: 'single',
      targetId: activityId,
      message: 'Are you sure you want to delete this activity? This action cannot be undone.',
      actionText: 'Delete Activity'
    });
  };

  const handleBulkDelete = () => {
    if (selectedActivities.length === 0) {
      toast.error('No activities selected');
      return;
    }
    setModalConfig({
      show: true,
      type: 'bulk',
      targetId: null,
      message: `Are you sure you want to delete ${selectedActivities.length} selected activities? This action cannot be undone.`,
      actionText: `Delete ${selectedActivities.length} Activities`
    });
  };

  const handleClearAll = () => {
    if (totalActivities === 0) {
      toast.error('No activities to clear');
      return;
    }
    setModalConfig({
      show: true,
      type: 'clear',
      targetId: null,
      message: 'Are you sure you want to clear ALL activities? This action cannot be undone.',
      actionText: 'Clear All Activities'
    });
  };

  const handleConfirmAction = async () => {
    const { type, targetId } = modalConfig;
    
    // Close modal immediately
    setModalConfig({ show: false, type: null, targetId: null, message: '', actionText: '' });

    try {
      let res;
      let successMessage = '';
      
      if (type === 'single') {
        res = await activityAPI.deleteActivity(targetId);
        successMessage = 'Activity deleted successfully';
      } else if (type === 'bulk') {
        res = await activityAPI.bulkDeleteActivities(selectedActivities);
        successMessage = `${selectedActivities.length} activities deleted successfully`;
      } else if (type === 'clear') {
        res = await activityAPI.clearAllActivities();
        successMessage = 'All activities cleared successfully';
      }

      if (res?.success) {
        toast.success(successMessage);
        
        // Refresh current page
        await fetchActivities(currentPage);
        
        // If current page becomes empty and it's not page 1, go to previous page
        if (activities.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
        
        // Reset selection mode and selected activities
        setSelectionMode(false);
        setSelectedActivities([]);
      } else {
        toast.error(res?.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const toggleActivitySelection = (activityId) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedActivities.length === activities.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(activities.map(a => a.id));
    }
  };

  return (
    <div className="activity-container-premium">
      <header className="timeline-header-premium">
        <div className="d-flex align-items-center gap-3">
          <div className="icon-badge-navy">
            <FaHistory />
          </div>
          <div>
            <h3 className="m-0 text-white fw-bold">Activity Stream</h3>
            <span className="text-gold-muted">Your learning journey, tracked.</span>
          </div>
        </div>

        <div className="header-actions-wrapper">
          {!selectionMode ? (
            <div className="d-flex align-items-center gap-3">
              {unreadCount > 0 && <span className="glass-pill-unread">{unreadCount} New</span>}
              {activities.length > 0 && (
                <>
                  <button className="icon-btn-gold" onClick={() => setSelectionMode(true)} title="Select Multiple">
                    <FaTrashAlt />
                  </button>
                  <button className="text-btn-gold-link" onClick={handleClearAll}>
                    Clear All
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="selection-controls-inline animate-in">
              <label className="select-all-label">
                <input 
                  type="checkbox" 
                  checked={selectedActivities.length === activities.length && activities.length > 0}
                  onChange={toggleSelectAll}
                />
                <span>Select All</span>
              </label>
              <span className="selection-count">{selectedActivities.length} Selected</span>
              <button 
                className="btn-danger-glass" 
                onClick={handleBulkDelete}
                disabled={selectedActivities.length === 0}
              >
                <FaTrash /> Delete
              </button>
              <button className="btn-close-glass" onClick={() => {
                setSelectionMode(false);
                setSelectedActivities([]);
              }}>
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="timeline-viewport">
  {activities.length === 0 ? (
    <div className="empty-timeline">
      <FaHistory className="empty-icon" />
      <h4>No Activity Yet</h4>
      <p>Start learning to see your activity here!</p>
    </div>
  ) : (
    <div className="timeline-wrapper">
      <AnimatePresence mode="popLayout">
        {activities.map((item, index) => (
          <motion.div 
            layout
            key={`${item.id}-${currentPage}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`timeline-item-card ${!item.isRead ? 'unread-glow' : ''} ${selectionMode ? 'select-mode' : ''}`}
          >
            <div className="timeline-visual">
              <div 
                className="node-dot" 
                style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} 
              />
              {index !== activities.length - 1 && <div className="node-connector" />}
            </div>

            {selectionMode && (
              <div className="selection-checkbox">
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(item.id)}
                  onChange={() => toggleActivitySelection(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="activity-glass-card">
              <div 
                className="activity-icon-wrap" 
                style={{ color: item.color, background: `${item.color}15` }}
              >
                {item.icon}
              </div>

              <div className="activity-info">
                <p className="activity-text">{item.text}</p>
                <span className="activity-time">{formatTimeAgo(item.time)}</span>
              </div>

              {!selectionMode && (
                <button 
                  className="delete-hover-btn" 
                  onClick={() => handleDeleteSingle(item.id)}
                  title="Delete this activity"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )}
</div>

      {totalActivities > limit && (
        <footer className="pagination-glass-footer">
          <button 
            className="pag-nav" 
            disabled={currentPage === 1} 
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <FaChevronLeft />
          </button>
          <div className="pag-info">
            <span>Page</span>
            <strong className="text-gold">{currentPage}</strong>
            <span className="opacity-50">/ {totalPages}</span>
          </div>
          <button 
            className="pag-nav" 
            disabled={currentPage === totalPages} 
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <FaChevronRight />
          </button>
        </footer>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modalConfig.show && (
          <motion.div 
            className="modal-overlay-blur" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setModalConfig({ show: false, type: null, targetId: null, message: '', actionText: '' })}
          >
            <motion.div 
              className="premium-confirm-card" 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="warning-icon-glow">
                <FaExclamationTriangle />
              </div>
              <h4>Confirm Action</h4>
              <p>{modalConfig.message}</p>
              <div className="modal-actions">
                <button 
                  className="btn-secondary-glass" 
                  onClick={() => setModalConfig({ show: false, type: null, targetId: null, message: '', actionText: '' })}
                >
                  Cancel
                </button>
                <button className="btn-danger-solid" onClick={handleConfirmAction}>
                  {modalConfig.actionText || 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityTimeline;