// frontend/src/components/admin/layout/AdminSidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    GraduationCap, 
    UserCog,
    School,
    FileQuestion,
    BarChart3,
    Settings,
    LogOut,
    AlertTriangle,
    X
} from 'lucide-react';

const AdminSidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setIsLoggingOut(true);
        
        // Simulate logout process
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            // Redirect to login page
            navigate('/login', { replace: true });
            
            setIsLoggingOut(false);
            setShowLogoutModal(false);
        }, 500);
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'User Management' },
        { path: '/admin/teachers', icon: UserCog, label: 'Teachers' },
        { path: '/admin/students', icon: GraduationCap, label: 'Students' },
        { path: '/admin/classes', icon: School, label: 'Classes' },
        { path: '/admin/quizzes', icon: FileQuestion, label: 'Quizzes' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' }
    ];

    const sidebarContent = (
        <div className="admin-sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-icon">🎓</span>
                    {!collapsed && <span className="logo-text">HolistiLearn</span>}
                </div>
            </div>
            
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={onCloseMobile}
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
            
            <div className="sidebar-footer">
                <button onClick={handleLogoutClick} className="logout-btn">
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`admin-sidebar-desktop ${collapsed ? 'collapsed' : ''}`}>
                {sidebarContent}
            </div>
            
            {/* Mobile Sidebar */}
            {mobileOpen && (
                <>
                    <div className="mobile-overlay" onClick={onCloseMobile} />
                    <div className="admin-sidebar-mobile">
                        {sidebarContent}
                    </div>
                </>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="admin-logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div className="admin-logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-logout-modal-header">
                            <div className="admin-logout-icon-wrapper">
                                <AlertTriangle size={28} />
                            </div>
                            <h3>Confirm Logout</h3>
                            <button 
                                className="admin-logout-close-btn" 
                                onClick={() => setShowLogoutModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="admin-logout-modal-body">
                            <p>Are you sure you want to logout?</p>
                            <p className="admin-logout-warning">
                                You will need to login again to access your account.
                            </p>
                        </div>
                        
                        <div className="admin-logout-modal-footer">
                            <button 
                                className="admin-logout-cancel-btn"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="admin-logout-confirm-btn"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="admin-logout-spinner"></span>
                                        Logging out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut size={16} />
                                        Logout
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminSidebar;