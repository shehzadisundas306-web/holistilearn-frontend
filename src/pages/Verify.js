import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../styles/verification.css'

const Verify = () => {
    const { token } = useParams();
    const [status, setStatus] = useState("Verifying your account...");
    const [isSuccess, setIsSuccess] = useState(null); 
    const navigate = useNavigate();

    useEffect(() => {
        const VerifyEmail = async () => {
            try {
                // Adjusting to your backend port/route
                const res = await axios.post(`https://holistilearn-backend.vercel.app/user/verify`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (res.data.success) {
                    setIsSuccess(true);
                    setStatus("Email Verified Successfully!");
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setIsSuccess(false);
                    setStatus("Invalid or Expired Link");
                }
            } catch (error) {
                console.error("Verification Error:", error);
                setIsSuccess(false);
                setStatus("Verification Failed");
            }
        };
        VerifyEmail();
    }, [token, navigate]);

    return (
        <div className="auth-wrapper d-flex align-items-center justify-content-center">
            {/* Background Decorations */}
            <div className="auth-circle-bg c1"></div>
            <div className="auth-circle-bg c2"></div>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-9 col-md-7 col-lg-5">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="verify-card-premium text-center"
                        >
                            {/* Icon Logic */}
                            <div className={`verify-icon-box mx-auto mb-4 ${isSuccess === false ? 'border-orange' : ''}`}>
                                {isSuccess === null && (
                                    <div className="spinner-border text-blue" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                )}
                                {isSuccess === true && (
                                    <MarkEmailReadIcon className="verify-main-icon text-blue" />
                                )}
                                {isSuccess === false && (
                                    <ErrorOutlineIcon className="verify-main-icon text-orange" />
                                )}
                            </div>

                            <h2 className="verify-status-title mb-3">{status}</h2>
                            
                            <p className="verify-description mb-4 px-3">
                                {isSuccess === true 
                                    ? "Your account is now active. Redirecting you to login..." 
                                    : "The verification link might be broken or has already been used."}
                            </p>

                            {isSuccess === false && (
                                <div className="d-grid px-4">
                                    <button className="btn btn-verify-action" onClick={() => window.location.reload()}>
                                        Try Again
                                    </button>
                                </div>
                            )}

                            <div className="mt-4 pt-3 border-top border-secondary opacity-25"></div>

                            <Link to="/login" className="back-link d-flex align-items-center justify-content-center gap-2">
                                <ArrowBackIcon fontSize="small" /> Back to Login
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verify;