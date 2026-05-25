// frontend/src/routes/AdminRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/layout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Users from '../pages/admin/Users';
import Teachers from '../pages/admin/Teachers';
import Students from '../pages/admin/Students';
import Classes from '../pages/admin/Classes';
import Quizzes from '../pages/admin/Quizzes';
import Analytics from '../pages/admin/Analytics';
import Settings from '../pages/admin/Settings';
import { useGetData } from '../context/userContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminRoutes = () => {
    const { user, loading } = useGetData();

    if (loading) {
        return <LoadingSpinner text="Verifying access..." />;
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="students" element={<Students />} />
                <Route path="classes" element={<Classes />} />
                <Route path="quizzes" element={<Quizzes />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;