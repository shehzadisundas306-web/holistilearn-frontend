import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams} from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ShieldMoonIcon from '@mui/icons-material/ShieldMoon';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../styles/verification.css'

const VerifyOTP = () => {
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();
    // const location = useLocation();
    const inputRefs = useRef([]);
    const {email} =  useParams();

    // Get email from ForgotPassword page state
    // const email = location.state?.email || "your email";

    useEffect(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, []);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Move to next input box automatically
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        // Move to previous box on backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpCode = otp.join("");
        if (otpCode.length < 6) return setError("Please enter all 6 digits.");

        setLoading(true);
        setError("");
        try {
            const res = await axios.post(`http://localhost:5000/user/verifyOtp/${email}`, { 
                otp: otpCode 
            });
            if (res.data.success) {
                // // Pass the resetToken to the next page securely
                // navigate(`/changePassword/${email}`, { 
                //     state: { token: res.data.resetToken, email } 
                // });
                navigate(`/changePassword/${email}`, { 
                state: { 
                 token: res.data.resetToken || "verified", 
                 email: email 
                } 
    });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or Expired OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper d-flex align-items-center justify-content-center">
            <div className="auth-circle-bg c1"></div>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-11 col-sm-10 col-md-8 col-lg-5">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="verify-card-premium text-center">
                            <div className="verify-icon-box mx-auto mb-4">
                                <ShieldMoonIcon className="text-blue" style={{ fontSize: '2.5rem' }} />
                            </div>
                            <h2 className="verify-status-title mb-2">Verify OTP</h2>
                            <p className="verify-description mb-4">Enter the 6-digit code sent to: <br/> <span className="text-white fw-bold">{email}</span></p>
                            
                            <form onSubmit={handleVerify}>
                                <div className="d-flex justify-content-center gap-2 mb-4">
                                    {otp.map((data, index) => (
                                        <input key={index} type="text" maxLength="1" className="otp-field" value={data}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            onChange={(e) => handleChange(e.target, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                        />
                                    ))}
                                </div>
                                {error && <p className="text-orange small mb-3 fw-bold">{error}</p>}
                                <button className="btn btn-verify-action w-100" disabled={loading}>
                                    {loading ? "Verifying..." : "Verify & Continue"}
                                </button>
                            </form>
                            <div className="mt-4 pt-3 border-top border-secondary opacity-25"></div>
                            <button onClick={() => navigate(-1)} className="back-link btn btn-link text-white text-decoration-none mx-auto d-flex align-items-center gap-2">
                                <ArrowBackIcon fontSize="small"  /> Change Email
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;