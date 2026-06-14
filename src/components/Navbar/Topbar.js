// frontend/src/components/Topbar.js
import React, { useState, useEffect } from "react";
import { CiMail } from "react-icons/ci";
import { FaPhone } from "react-icons/fa6";
import { CiLogin } from "react-icons/ci";
import { IoMdPerson } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import '../../styles/landingpage.css';
import { useGetData } from "../../context/userContext";
import { toast } from "sonner";
import axios from "axios";

const Topbar = () => {
  const navigate = useNavigate();
  const { user, loading, updateUser } = useGetData();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // ✅ Verify user status on mount and when user changes
  useEffect(() => {
    const verifyUserStatus = async () => {
      if (!user) return;
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) return;
      
      try {
        const response = await axios.get('https://holistilearn-backend.vercel.app/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.user) {
          const freshUser = response.data.user;
          
          // Check if user is blocked or deleted
          if (freshUser.isActive === false) {
            toast.error('Your account has been blocked. Please contact support.');
            handleLogout();
            return;
          }
          
          // Update local user data if changed
          if (freshUser.role !== user.role || freshUser.name !== user.name) {
            const updatedUser = { ...user, ...freshUser };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            updateUser(updatedUser);
          }
        }
      } catch (error) {
        console.error('User verification failed:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        }
      }
    };
    
    verifyUserStatus();
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    updateUser(null);
    navigate('/login');
    toast.info('Please login again');
  };

  const handleGoToConsole = async () => {
    if (loading || isCheckingAuth) return;

    if (!user) {
      navigate("/login");
      return;
    }

    setIsCheckingAuth(true);
    
    try {
      // Verify user is still active before navigating
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        const response = await axios.get('https://holistilearn-backend.vercel.app/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.user) {
          const verifiedUser = response.data.user;
          
          // Check if user is blocked
          if (verifiedUser.isActive === false) {
            toast.error('Your account has been blocked. Please contact support.');
            handleLogout();
            return;
          }
          
          // Update user data
          const userData = {
            id: verifiedUser._id || verifiedUser.id,
            name: verifiedUser.name || verifiedUser.username,
            username: verifiedUser.username,
            email: verifiedUser.email,
            role: verifiedUser.role,
            isActive: verifiedUser.isActive
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          updateUser(userData);
          
          // Navigate based on role
          if (verifiedUser.role === "student") {
            navigate("/student");
          } else if (verifiedUser.role === "teacher") {
            navigate("/teacher/dashboard");
          } else if (verifiedUser.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/select-role");
          }
        } else {
          handleLogout();
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        navigate("/login");
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-container">
        {/* LEFT SECTION */}
        <div className="topbar-left">
          <div className="topbar-item">
            <CiMail />
            <span>info@holistilearn.com</span>
          </div>
          <div className="topbar-item">
            <FaPhone />
            <span>+92 345 6123323</span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="topbar-right">
          <div className="topbar-action">
            <span className="console-btn" onClick={handleGoToConsole}>
              {isCheckingAuth ? "Verifying..." : "Go to Console"}
            </span>
          </div>
          <div className="topbar-action register" onClick={() => navigate("/register")}>
            <IoMdPerson />
            <span>Register</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;