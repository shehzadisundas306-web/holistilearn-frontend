import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHome, FaCompass, FaBrain, FaQuestionCircle, 
  FaChartLine, FaSignOutAlt, FaBars, FaChevronLeft 
} from "react-icons/fa";
import { toast } from "sonner";
import axios from "axios";
import LogoutModal from "../../../pages/LogoutModal";
import socketService from "../../../services/socketService";
import { useGetData } from "../../../context/userContext";
import { RiMentalHealthFill } from "react-icons/ri";
import { FaRegNoteSticky } from "react-icons/fa6";
import { RxActivityLog } from "react-icons/rx";

// ✅ Added isMobileOpen and setIsMobileOpen props to wire up mobile drawers cleanly
const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user: contextUser, setUser: setContextUser } = useGetData();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard", icon: <FaHome />, path: "/student" },
    { name: "Discover Topics", icon: <FaCompass />, path: "/student/discover" },
    { name: "Learning Path", icon: <FaBrain />, path: "/student/learning-path" },
    { name: "Quiz Engine", icon: <FaQuestionCircle />, path: "/student/quiz" },
    { name: "Progress Analytics", icon: <FaChartLine />, path: "/student/progress" },
    { name: "Mental State Engine", icon: <RiMentalHealthFill />, path: "/student/mental" },
    { name: "Recent Activity History", icon: <RxActivityLog />, path: "/student/history" },
    { name: "AI Notes", icon: <FaRegNoteSticky />, path: "/student/ai" }
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowLogoutModal(false);
    
    try {
      toast.loading("Logging out...");
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/user/logout',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.dismiss();
      
      if (response.data.success) {
        toast.success("Logged out successfully!");
        socketService.disconnect();
        localStorage.clear();
        sessionStorage.clear();
        
        if (setContextUser) {
          setContextUser(null);
        }
        setLocalUser(null);
        setIsProfileOpen(false);
        if (setIsMobileOpen) setIsMobileOpen(false); // Close drawer on redirect
        navigate('/login?loggedOut=true', { replace: true });
      } else {
        toast.error(response.data.message || "Logout failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Unique outer sidebar container wrapper class names */}
      <aside className={`student-sb-container ${isCollapsed ? "student-sb-collapsed" : ""}`}>
        
        {/* Floating Toggle Trigger Action Button Control */}
        <button className="student-sb-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <FaBars /> : <FaChevronLeft />}
        </button>

        {/* 1. Logo Workspace Branding Header */}
        <div className="student-sb-header">
          <div className="student-sb-logo-box">
            <FaBrain className="student-sb-logo-icon" />
          </div>
          {!isCollapsed && (
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="student-sb-logo-text">
              Holisti<span className="student-sb-logo-gold">Learn</span>
            </motion.h2>
          )}
        </div>

        {/* 2. Main Group Navigation Sub-links */}
        <nav className="student-sb-nav-scroller">
          <p className="student-sb-nav-label">{isCollapsed ? "•••" : "Main Menu"}</p>
          {menu.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              // Automatically closes mobile popouts when clicking options
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className={({ isActive }) =>
                isActive ? "student-sb-link student-sb-link-active" : "student-sb-link"
              }
            >
              <div className="student-sb-link-inner">
                <span className="student-sb-link-icon">{item.icon}</span>
                {/* Fixed structure text breaks */}
                {/* <span className="student-sb-link-text">{item.name}</span> */}
                {/* Fixed structure text breaks */}
                {!isCollapsed && <span className="student-sb-link-text">{item.name}</span>}
              </div>
              {!isCollapsed && <div className="student-sb-active-indicator" />}
            </NavLink>
          ))}
        </nav>

        {/* 3. Operational Action Footer */}
        <div className="student-sb-footer">
          <button 
            className="student-sb-logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <FaSignOutAlt className="student-sb-logout-icon" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Confirmation Dialog Component Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
};

export default Sidebar;