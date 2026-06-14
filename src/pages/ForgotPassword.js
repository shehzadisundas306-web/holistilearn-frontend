import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import '../styles/verification.css'

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`https://holistilearn-backend.vercel.app/user/forgotPassword`, { email });
            setMessage(res.data.message || "Reset link sent! Check your inbox.");
            if(res.data.success){
                navigate(`/verifyOtp/${email}`, {state: {email: email}});
                toast.success(res.data.message);
                setEmail("");
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Error sending email.");
        }
        setLoading(false);
    };

    return (
        <div className="auth-wrapper d-flex align-items-center justify-content-center">
            <div className="auth-circle-bg c1"></div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-9 col-md-7 col-lg-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="verify-card-premium text-center">
                            <div className="verify-icon-box mx-auto mb-4">
                                <VpnKeyIcon className="text-blue" style={{ fontSize: '2.5rem' }} />
                            </div>
                            <h2 className="verify-status-title mb-2">Forgot Password?</h2>
                            <p className="verify-description mb-4">Enter your email to receive a password reset link.</p>
                            
                            <form onSubmit={handleSubmit} className="px-3">
                                <input 
                                    type="email" 
                                    className="form-control auth-input mb-3" 
                                    placeholder="Enter your email"
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button className="btn btn-verify-action w-100" disabled={loading}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>

                            {message && <p className="mt-3 text-blue small fw-bold">{message}</p>}

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

export default ForgotPassword;