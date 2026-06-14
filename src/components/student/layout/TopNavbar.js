import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBell, FaChevronDown, FaCog, FaSignOutAlt, FaUser, 
  FaComment, FaChalkboardTeacher, FaSpinner, FaPlus, 
  FaBookOpen, FaSchool, FaHome, FaBars
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useGetData } from "../../../context/userContext";
import LogoutModal from "../../../pages/LogoutModal";
import socketService from "../../../services/socketService";
import notificationService from "../../../services/notificationService";
import NotificationPanel from "../../NotificationPanel";
import SettingsModal from "../../SettingsModal";
import ProfileModal from "../../ProfileModel";
import '../../../styles/Setting.css';

const TopNavbar = ({ onMenuClick }) => {
  const { user: contextUser, setUser: setContextUser } = useGetData();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', bio: '' });
  const navigate = useNavigate();

  const isStudent = () => {
    const user = localUser || contextUser;
    return user?.role === 'student';
  };

  const isTeacher = () => {
    const user = localUser || contextUser;
    return user?.role === 'teacher';
  };

  useEffect(() => {
    const initializeUser = () => {
      if (contextUser && contextUser.id) {
        setLocalUser(contextUser);
        setFormData({
          name: contextUser.name || contextUser.username || '',
          email: contextUser.email || '',
          bio: contextUser.bio || 'Student at HolistiLearn'
        });
        return;
      }
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setLocalUser(parsedUser);
          setFormData({
            name: parsedUser.name || parsedUser.username || '',
            email: parsedUser.email || '',
            bio: parsedUser.bio || 'Student at HolistiLearn'
          });
          if (!contextUser && setContextUser) {
            setContextUser(parsedUser);
          }
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    };
    initializeUser();
  }, [contextUser, setContextUser]);

  useEffect(() => {
    notificationService.init();
  }, []);

  useEffect(() => {
    const updateUnreadCount = () => {
      const newCount = notificationService.getUnreadCount();
      setUnreadCount(newCount);
    };
    
    const handleNewNotification = () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      updateUnreadCount();
    };
    
    const unsubscribeNew = notificationService.on('new', handleNewNotification);
    const unsubscribeRead = notificationService.on('read', updateUnreadCount);
    const unsubscribeDelete = notificationService.on('delete', updateUnreadCount);
    const unsubscribeAllRead = notificationService.on('allRead', updateUnreadCount);
    const unsubscribeClearAll = notificationService.on('clearAll', updateUnreadCount);
    const unsubscribeCountChange = notificationService.on('unreadCountChanged', updateUnreadCount);
    
    updateUnreadCount();
    
    return () => {
      if (unsubscribeNew) unsubscribeNew();
      if (unsubscribeRead) unsubscribeRead();
      if (unsubscribeDelete) unsubscribeDelete();
      if (unsubscribeAllRead) unsubscribeAllRead();
      if (unsubscribeClearAll) unsubscribeClearAll();
      if (unsubscribeCountChange) unsubscribeCountChange();
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          setLocalUser(updatedUser);
          setFormData({
            name: updatedUser.name || updatedUser.username || '',
            email: updatedUser.email || '',
            bio: updatedUser.bio || 'Student at HolistiLearn'
          });
        } catch (e) {
          console.error('Error parsing updated user:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail?.user) {
        setLocalUser(event.detail.user);
        setFormData({
          name: event.detail.user.name || event.detail.user.username || '',
          email: event.detail.user.email || '',
          bio: event.detail.user.bio || 'Student at HolistiLearn'
        });
      }
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getUserInitials = () => {
    const user = localUser || contextUser;
    if (!user?.name && !user?.username) return 'U';
    const name = user?.name || user?.username || 'User';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    const user = localUser || contextUser;
    return user?.name?.split(' ')[0] || user?.username || 'User';
  };

  const getUserEmail = () => {
    const user = localUser || contextUser;
    return user?.email || 'user@example.com';
  };

  const getUserRole = () => {
    const user = localUser || contextUser;
    return user?.role === 'teacher' ? 'Teacher' : 'Student';
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowLogoutModal(false);
    try {
      toast.loading("Logging out...");
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await axios.post(
        'https://holistilearn-backend.vercel.app/user/logout',
        {},
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      toast.dismiss();
      if (response.data.success) {
        socketService.disconnect();
        localStorage.clear();
        sessionStorage.clear();
        if (setContextUser) setContextUser(null);
        setLocalUser(null);
        setIsProfileOpen(false);
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

  const handleUpdateProfile = async (updatedData) => {
    try {
      toast.loading("Updating profile...");
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await axios.put(
        'https://holistilearn-backend.vercel.app/user/profile',
        updatedData,
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      toast.dismiss();
      if (response.data.success) {
        const updatedUser = response.data.user || response.data.data;
        const userData = {
          id: updatedUser._id || updatedUser.id,
          name: updatedUser.name || updatedUser.username,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          bio: updatedUser.bio || 'Student at HolistiLearn',
          createdAt: updatedUser.createdAt
        };
        if (setContextUser) setContextUser(userData);
        setLocalUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: { user: userData } }));
        toast.success("Profile updated successfully!");
        setShowProfileModal(false);
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <>
      <nav className={`student-tnv-wrapper ${isScrolled ? "student-tnv-blur" : ""}`}>
        <div className="student-tnv-left-deck">
          {/* Mobile Hamburger Toggle */}
          <button className="student-tnv-burger-btn" onClick={onMenuClick} aria-label="Open Navigation">
            <FaBars />
          </button>

          {/* Home / Dashboard Links */}
          <div className="student-tnv-nav-links">
            <Link to={isStudent() ? "/student" : "/teacher/dashboard"} className="student-tnv-link">
              <FaHome className="student-tnv-icon" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Student Links */}
          {isStudent() && (
            <div className="student-tnv-nav-links">
              <Link to="/student/join" className="student-tnv-link">
                <FaPlus className="student-tnv-icon" />
                <span>Join Class</span>
              </Link>
              <Link to="/student/classes" className="student-tnv-link">
                <FaBookOpen className="student-tnv-icon" />
                <span>My Classes</span>
              </Link>
            </div>
          )}

          {/* Teacher Links */}
          {isTeacher() && (
            <div className="student-tnv-nav-links">
              <Link to="/teacher/dashboard/classes" className="student-tnv-link">
                <FaSchool className="student-tnv-icon" />
                <span>My Classes</span>
              </Link>
              <Link to="/teacher/dashboard/quiz" className="student-tnv-link">
                <FaBookOpen className="student-tnv-icon" />
                <span>Quiz Manager</span>
              </Link>
              <Link to="/teacher/dashboard/messages" className="student-tnv-link">
                <FaComment className="student-tnv-icon" />
                <span>Messages</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Controls Hub */}
        <div className="student-tnv-right-deck">
          <div className="student-tnv-bell-box">
            <button 
              className={`student-tnv-bell-btn ${isAnimating ? 'student-tnv-bell-ring' : ''}`}
              onClick={() => setShowNotifications(true)}
              aria-label="Notifications"
            >
              <FaBell className="student-tnv-bell-icon" />
              {unreadCount > 0 && (
                <motion.span 
                  className="student-tnv-badge"
                  key={unreadCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </button>
          </div>

          <div className="student-tnv-divider"></div>

          {/* User Profile Container */}
          <div className="student-tnv-profile-shell">
            <motion.button 
              className="student-tnv-profile-trigger"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="student-tnv-avatar">
                <span className="student-tnv-avatar-txt">{getUserInitials()}</span>
              </div>
              <div className="student-tnv-user-details">
                <span className="student-tnv-name">{getUserName()}</span>
                <span className="student-tnv-role">{getUserRole()}</span>
              </div>
              <motion.div animate={{ rotate: isProfileOpen ? 180 : 0 }} className="student-tnv-chevron">
                <FaChevronDown />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  className="student-tnv-dropdown"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="student-tnv-dd-header">
                    <div className="student-tnv-dd-avatar">
                      <span>{getUserInitials()}</span>
                    </div>
                    <div className="student-tnv-dd-info">
                      <h4>{getUserName()}</h4>
                      <p>{getUserEmail()}</p>
                      <span className="student-tnv-dd-role-tag">
                        {getUserRole() === 'Teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
                      </span>
                    </div>
                  </div>
                  <div className="student-tnv-dd-divider"></div>
                  <button 
                    className="student-tnv-dd-item"
                    onClick={() => { setIsProfileOpen(false); setShowProfileModal(true); }}
                  >
                    <FaUser className="student-tnv-dd-icon" />
                    <span>My Profile</span>
                  </button>
                  <button 
                    className="student-tnv-dd-item"
                    onClick={() => { setIsProfileOpen(false); setShowSettingsModal(true); }}
                  >
                    <FaCog className="student-tnv-dd-icon" />
                    <span>Settings</span>
                  </button>
                  <div className="student-tnv-dd-divider"></div>
                  <button 
                    className="student-tnv-dd-item student-tnv-dd-logout"
                    onClick={() => { setIsProfileOpen(false); setShowLogoutModal(true); }}
                  >
                    <FaSignOutAlt className="student-tnv-dd-icon" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Modals and Side Panels */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={localUser || contextUser}
        onUpdateProfile={handleUpdateProfile}
        getUserInitials={getUserInitials}
        getUserRole={getUserRole}
      />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} isLoggingOut={isLoggingOut} />
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};

export default TopNavbar;