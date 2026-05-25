// frontend/src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGetData } from '../context/userContext';

const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const { user, loading, isAuthenticated, hasRole, logout } = useGetData();

  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - Loading:', loading);
  console.log('ProtectedRoute - IsAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - User isActive:', user?.isActive);
  console.log('ProtectedRoute - User role:', user?.role);
  console.log('ProtectedRoute - Teacher approved:', user?.teacherData?.isApproved);

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // Blocked user check
  if (user.isActive === false) {
    console.log('User account is blocked, logging out...');
    logout();
    return <Navigate to="/login" replace />;
  }

  // ✅ TEACHER APPROVAL CHECK
  if (user.role === 'teacher' && allowedRoles.includes('teacher')) {
    // Check if teacher has profile and is approved
    const isTeacherApproved = user.teacherData?.isApproved === true;
    const hasProfile = user.teacherData?.isProfileComplete === true;
    
    console.log('Teacher approval check:', { hasProfile, isTeacherApproved });
    
    // No profile - redirect to profile form
    if (!hasProfile) {
      console.log('Teacher profile incomplete, redirecting to profile form');
      return <Navigate to="/teacher/profile" replace />;
    }
    
    // Profile exists but not approved - redirect to pending approval
    if (!isTeacherApproved) {
      console.log('Teacher account pending approval, redirecting to pending page');
      return <Navigate to="/teacher/pending-approval" replace />;
    }
  }

  // Role validation
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => hasRole(role));
    if (!hasAllowedRole) {
      let defaultPath = '/';
      if (user?.role === 'teacher') defaultPath = '/teacher/dashboard';
      else if (user?.role === 'student') defaultPath = '/student/dashboard';
      else if (user?.role === 'admin') defaultPath = '/admin/dashboard';
      else defaultPath = '/select-role';
      
      console.log(`Role mismatch. User role: ${user?.role}, Redirecting to: ${defaultPath}`);
      return <Navigate to={defaultPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

// ==================== SPECIFIC ROLE PROTECTED ROUTES ====================

export const TeacherRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['teacher']}>
    {children}
  </ProtectedRoute>
);

export const StudentRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['student']}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);