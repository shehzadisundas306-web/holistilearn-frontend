// frontend/src/components/admin/layout/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { useGetData } from '../../../context/userContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import '../../../styles/admin/AdminDashboard.css';

const AdminLayout = () => {
    const { user, loading } = useGetData();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Check if user is admin
        if (!loading && user && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <LoadingSpinner text="Loading admin panel..." />;
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="admin-layout">
            <AdminSidebar 
                collapsed={sidebarCollapsed} 
                mobileOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
            />
            <div className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <AdminTopbar 
                    title={getPageTitle(location.pathname)}
                    onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onMobileMenu={() => setMobileMenuOpen(true)}
                />
                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const getPageTitle = (path) => {
    const titles = {
        '/admin/dashboard': 'Admin Portal',
        '/admin/users': 'User Management',
        '/admin/teachers': 'Teacher Management',
        '/admin/students': 'Student Management',
        '/admin/classes': 'Class Management',
        '/admin/quizzes': 'Quiz Management',
        '/admin/analytics': 'Analytics & Reports',
        '/admin/settings': 'System Settings'
    };
    return titles[path] || 'Admin Panel';
};

export default AdminLayout;