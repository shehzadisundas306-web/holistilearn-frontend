// frontend/src/pages/teacher/PendingApproval.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { getTeacherProfile } from '../../api/teacherApi';
import { useGetData } from '../../context/userContext';
import { useTeacher } from '../../context/TeacherContext';
import { toast } from 'sonner';
import '../../styles/PendingApproval.css';

const PendingApproval = () => {
    const navigate = useNavigate();
    const { user, logout } = useGetData();
    const { loadTeacherProfile } = useTeacher();
    const [checking, setChecking] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [rejectionReason, setRejectionReason] = useState(null);

    // Poll for approval status every 30 seconds
    useEffect(() => {
        const checkApprovalStatus = async () => {
            try {
                const response = await getTeacherProfile();
                console.log('Approval status check:', response);
                
                if (response.success && response.profile) {
                    if (response.profile.isApproved) {
                        setIsApproved(true);
                        toast.success('Your teacher account has been approved!');
                        
                        // ✅ Reload teacher profile in context
                        await loadTeacherProfile();
                        
                        // ✅ Navigate after a short delay
                        setTimeout(() => {
                            navigate('/teacher/dashboard', { replace: true });
                        }, 1500);
                    } else if (response.profile.rejectionReason) {
                        setRejectionReason(response.profile.rejectionReason);
                    }
                }
            } catch (error) {
                console.error('Error checking approval status:', error);
            } finally {
                setChecking(false);
            }
        };

        // Check immediately
        checkApprovalStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkApprovalStatus, 30000);

        return () => clearInterval(interval);
    }, [navigate, loadTeacherProfile]);

    const handleGoToDashboard = () => {
        navigate('/teacher/dashboard', { replace: true });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isApproved) {
        return (
            <div className="pending-approval-container">
                <div className="pending-approval-card approved">
                    <div className="pending-icon approved">
                        <CheckCircle size={64} />
                    </div>
                    <h1>Account Approved!</h1>
                    <p className="pending-message">
                        Congratulations! Your teacher account has been approved.
                    </p>
                    <div className="action-buttons">
                        <button 
                            className="dashboard-btn"
                            onClick={handleGoToDashboard}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (rejectionReason) {
        return (
            <div className="pending-approval-container">
                <div className="pending-approval-card rejected">
                    <div className="pending-icon rejected">
                        <AlertCircle size={64} />
                    </div>
                    <h1>Application Not Approved</h1>
                    <p className="pending-message">
                        Your teacher application was not approved at this time.
                    </p>
                    {rejectionReason && (
                        <div className="rejection-box">
                            <strong>Reason:</strong>
                            <p>{rejectionReason}</p>
                        </div>
                    )}
                    <div className="action-buttons">
                        <button 
                            className="edit-btn"
                            onClick={() => navigate('/teacher/setup')}
                        >
                            Edit Profile & Re-submit
                        </button>
                        <button 
                            className="logout-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-approval-container">
            <div className="pending-approval-card">
                <div className="pending-icon">
                    <Clock size={64} />
                </div>
                
                <h1>Application Under Review</h1>
                
                <p className="pending-message">
                    Your teacher application has been submitted successfully.
                    Our admin team will review your application and notify you once approved.
                </p>
                
                <div className="info-box">
                    <Mail size={18} />
                    <p>
                        You will receive a notification when your application is reviewed.
                        This process typically takes 24-48 hours.
                    </p>
                </div>
                
                <div className="action-buttons">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>
                    <button 
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;