import React from 'react';
import { motion } from 'framer-motion';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import '../styles/verification.css'

const VerifyEmail = () => {
  return (
    <div className="auth-page-wrapper">
      {/* Decorative Background Blobs to match your Hero Section */}
      <div className="auth-blob c1"></div>
      <div className="auth-blob c2"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="verify-card-glass"
      >
        <div className="verify-icon-wrapper">
          <MarkEmailReadIcon className="verify-icon" />
        </div>

        <h2 className="verify-title">Check Your Email</h2>
        <p className="verify-text">
          We've sent a verification link to your inbox. 
          Please click the link to activate your <strong>HolistiLearn</strong> account.
        </p>
        <Link to="/login" className="back-to-login">
          <ArrowBackIcon fontSize="small" /> Back to Login
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;