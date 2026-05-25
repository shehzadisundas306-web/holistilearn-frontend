// frontend/src/components/LogoutModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaTimes } from 'react-icons/fa';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  content: {
    background: '#102E50',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '400px',
    border: '1px solid rgba(245, 196, 94, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 24px 0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    background: 'rgba(190, 61, 42, 0.15)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '1.5rem',
    color: '#be3d2a',
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: '#aba8a8',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  body: {
    padding: '20px 24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.3rem',
    color: '#ffffff',
    marginBottom: '8px',
  },
  text: {
    color: '#aba8a8',
    fontSize: '0.9rem',
    marginBottom: '8px',
  },
  warning: {
    fontSize: '0.8rem',
    color: '#be3d2a',
    marginTop: '8px',
  },
  footer: {
    padding: '16px 24px 24px 24px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  confirmBtn: {
    background: 'linear-gradient(135deg, #be3d2a, #9a2e1f)',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          style={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            style={styles.content}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.header}>
              <div style={styles.iconWrapper}>
                <FaSignOutAlt style={styles.icon} />
              </div>
              <button 
                style={styles.closeButton}
                onClick={onClose}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(190, 61, 42, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={styles.body}>
              <h3 style={styles.title}>Sign Out</h3>
              <p style={styles.text}>Are you sure you want to sign out?</p>
              <p style={styles.warning}>You'll need to login again to access your account.</p>
            </div>
            
            <div style={styles.footer}>
              <button 
                style={styles.cancelBtn}
                onClick={onClose}
                disabled={isLoggingOut}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmBtn}
                onClick={onConfirm}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <span className="logout-spinner"></span>
                    Signing out...
                  </>
                ) : (
                  <>
                    <FaSignOutAlt /> Sign Out
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;