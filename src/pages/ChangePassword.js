import React, { useState } from 'react';
import { useNavigate,  useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import '../styles/verification.css'

const ChangePassword = () => {
    const [passwords, setPasswords] = useState({ newPass: "", confirmPass: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    
    const navigate = useNavigate();
    const {email} = useParams();
    // const location = useLocation();
    // const token = location.state?.token; // Token passed from VerifyOTP

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirmPass) return setMessage("Passwords do not match.");
        // if (!token) return setMessage("Session expired. Please restart the process.");

        setLoading(true);
        try {
            const res = await axios.post(`http://localhost:5000/user/changePassword/${email}`, {
                newPassword: passwords.newPass,
                confirmPassword: passwords.confirmPass
                 }
                // { password: passwords.newPass },
                // { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setMessage("Password updated successfully!");
                setTimeout(() => navigate('/login'), 2500);
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper d-flex align-items-center justify-content-center">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-9 col-md-7 col-lg-5">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="verify-card-premium">
                            <div className="verify-icon-box mx-auto mb-4">
                                <LockResetIcon className="text-blue" style={{ fontSize: '2.5rem' }} />
                            </div>
                            <h2 className="verify-status-title text-center mb-4">Set New Password</h2>
                            
                            <form onSubmit={handleSubmit} className="px-2">
                                <div className="position-relative mb-3">
                                    <input 
                                        type={showPass ? "text" : "password"} 
                                        className="form-control auth-input" 
                                        placeholder="New Password" 
                                        onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
                                        required
                                    />
                                    <span 
                                        className="password-toggle" 
                                        style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#aba8a8' }}
                                        onClick={() => setShowPass(!showPass)}
                                    >
                                        {showPass ? <VisibilityOffIcon fontSize="small"/> : <VisibilityIcon fontSize="small"/>}
                                    </span>
                                </div>
                                <input 
                                    type="password" 
                                    className="form-control auth-input mb-4" 
                                    placeholder="Confirm New Password" 
                                    onChange={(e) => setPasswords({...passwords, confirmPass: e.target.value})}
                                    required
                                />
                                <button className="btn btn-verify-action w-100" disabled={loading}>
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                            {message && (
                                <p className={`mt-3 text-center small fw-bold ${message.includes("success") ? "text-blue" : "text-orange"}`}>
                                    {message}
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;