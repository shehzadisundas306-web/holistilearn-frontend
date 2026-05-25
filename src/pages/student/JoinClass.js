import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetData } from '../../context/userContext';
import { joinClassWithCode } from '../../api/studentApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { School, LogIn, ArrowRight, Sparkles, Users, BookOpen } from 'lucide-react';

const JoinClass = () => {
    const navigate = useNavigate();
    const { token, user } = useGetData();
    const [classCode, setClassCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const trimmedCode = classCode.trim().toUpperCase();
        if (!trimmedCode) {
            toast.error('Please enter a class code');
            return;
        }

        setLoading(true);
        try {
            const response = await joinClassWithCode(trimmedCode);
            if (response.success) {
                toast.success(response.message);
                navigate(`/student/classes/${response.class.id}`);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            console.error('Join class error:', error);
            toast.error(error.message || 'Failed to join class. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="join-class-container">
            <div className="join-class-card">
                {/* Header */}
                <div className="join-class-header">
                    <div className="header-icon">
                        <School size={48} />
                    </div>
                    <h1>Join a Class</h1>
                    <p>Enter the class code provided by your teacher to start learning</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="join-class-form">
                    <div className="input-wrapper">
                        <label>Class Code</label>
                        <input
                            type="text"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-digit code (e.g., ABC123)"
                            maxLength={6}
                            autoFocus
                            disabled={loading}
                        />
                        <span className="input-hint">
                            The code is case-insensitive and usually 6 characters long
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        className="join-btn"
                        disabled={loading || !classCode.trim()}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" />
                                Joining Class...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Join Class
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">
                    <span>or</span>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <button 
                        className="quick-action-btn"
                        onClick={() => navigate('/student/classes')}
                    >
                        <BookOpen size={20} />
                        View My Classes
                    </button>
                    <button 
                        className="quick-action-btn"
                        onClick={() => navigate('/student/discover')}
                    >
                        <Users size={20} />
                        Discover Teachers
                    </button>
                </div>

                {/* Info Box */}
                <div className="info-box">
                    <Sparkles size={20} />
                    <div>
                        <h4>Don't have a class code?</h4>
                        <p>Ask your teacher to share the unique 6-character code for their class.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinClass;