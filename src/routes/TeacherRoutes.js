import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTeacher } from '../context/TeacherContext';

// Layout Component
import TeacherDashboardLayout from '../pages/teacher/TeacherDashboardLayout';

// Teacher Pages
import SetupProfile from '../pages/teacher/SetupProfile';
import PendingApproval from '../pages/teacher/PendingApproval';
import TeacherOverview from '../pages/teacher/TeacherOverview';
import TeacherSubjects from '../pages/teacher/TeacherSubjects';
import TeacherClasses from '../pages/teacher/TeacherClasses';
import TeacherClassDetails from '../pages/teacher/TeacherClassDetails';
import TeacherQuizManager from '../pages/teacher/TeacherQuizManager';
import TeacherMessages from '../pages/teacher/TeacherMessages';
import TeacherSettings from '../pages/teacher/TeacherSettings';
import TeacherReports from '../pages/teacher/TeacherReports';
import TeacherJoinLiveClass from '../pages/teacher/TeacherJoinLiveClass';

// Loading Component
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useGetData } from '../context/userContext';

// ==================== TEACHER PROTECTED ROUTE ====================
const TeacherProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useGetData();
  const { profileLoading, isProfileComplete, isApproved, pendingApproval, rejectionReason } = useTeacher();

  console.log('TeacherProtectedRoute - Auth:', { 
    isAuthenticated, 
    authLoading, 
    profileLoading,
    userRole: user?.role,
    isProfileComplete,
    isApproved,
    pendingApproval
  });

  if (authLoading || profileLoading) {
    return <LoadingSpinner text="Loading teacher dashboard..." />;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'teacher') {
    console.log('User is not a teacher, redirecting');
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// ==================== PROFILE CHECK ROUTE ====================
const ProfileCheckRoute = ({ children }) => {
  const { isProfileComplete, profileLoading, isApproved, pendingApproval, rejectionReason } = useTeacher();

  console.log('ProfileCheckRoute - Status:', { 
    isProfileComplete, 
    isApproved, 
    pendingApproval,
    rejectionReason,
    profileLoading 
  });

  if (profileLoading) {
    return <LoadingSpinner text="Checking profile..." />;
  }

  // If profile is not complete, go to setup page
  if (!isProfileComplete) {
    console.log('Profile incomplete, redirecting to setup');
    return <Navigate to="/teacher/setup" replace />;
  }

  // If profile exists but not approved, show pending approval page
  if (isProfileComplete && !isApproved && !pendingApproval) {
    console.log('Profile pending approval, redirecting to pending page');
    return <Navigate to="/teacher/pending-approval" replace />;
  }

  // If rejected, redirect to setup with error message
  if (isProfileComplete && rejectionReason) {
    console.log('Profile rejected, redirecting to setup with message');
    return <Navigate to="/teacher/setup?rejected=true" replace />;
  }

  return children;
};

// ==================== APPROVAL CHECK ROUTE ====================
const ApprovalCheckRoute = ({ children }) => {
  const { isProfileComplete, isApproved, profileLoading } = useTeacher();

  if (profileLoading) {
    return <LoadingSpinner text="Verifying approval status..." />;
  }

  // If profile is not complete, go to setup
  if (!isProfileComplete) {
    return <Navigate to="/teacher/setup" replace />;
  }

  // If not approved, go to pending approval page
  if (!isApproved) {
    return <Navigate to="/teacher/pending-approval" replace />;
  }

  return children;
};

// ==================== TEACHER ROUTES ====================
const TeacherRoutes = () => {
  return (
    <Routes>
      {/* Setup Route - No approval check needed */}
      <Route 
        path="setup" 
        element={
          <TeacherProtectedRoute>
            <SetupProfile />
          </TeacherProtectedRoute>
        } 
      />

      {/* Pending Approval Route */}
      <Route 
        path="pending-approval" 
        element={
          <TeacherProtectedRoute>
            <PendingApproval />
          </TeacherProtectedRoute>
        } 
      />

      {/* Main Teacher Dashboard Routes - With Layout */}
      <Route 
        path="dashboard" 
        element={
          <TeacherProtectedRoute>
            <ProfileCheckRoute>
              <ApprovalCheckRoute>
                <TeacherDashboardLayout />
              </ApprovalCheckRoute>
            </ProfileCheckRoute>
          </TeacherProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={
          <ApprovalCheckRoute>
            <TeacherOverview />
          </ApprovalCheckRoute>
        } />
        <Route path="subjects" element={
          <ApprovalCheckRoute>
            <TeacherSubjects />
          </ApprovalCheckRoute>
        } />
        <Route path="reports" element={
          <ApprovalCheckRoute>
            <TeacherReports />
          </ApprovalCheckRoute>
        } />
        <Route path="classes" element={
          <ApprovalCheckRoute>
            <TeacherClasses />
          </ApprovalCheckRoute>
        } />
        <Route path="classes/:classId" element={
          <ApprovalCheckRoute>
            <TeacherClassDetails />
          </ApprovalCheckRoute>
        } />
        <Route path="quiz" element={
          <ApprovalCheckRoute>
            <TeacherQuizManager />
          </ApprovalCheckRoute>
        } />
        <Route path="quiz/:quizId" element={
          <ApprovalCheckRoute>
            <TeacherQuizManager />
          </ApprovalCheckRoute>
        } />
        <Route path="messages" element={
          <ApprovalCheckRoute>
            <TeacherMessages />
          </ApprovalCheckRoute>
        } />
        <Route path="messages/:chatId" element={
          <ApprovalCheckRoute>
            <TeacherMessages />
          </ApprovalCheckRoute>
        } />
        <Route path="join-live/:sessionId" element={
          <ApprovalCheckRoute>
            <TeacherJoinLiveClass />
          </ApprovalCheckRoute>
        } />
        <Route path="settings" element={
          <ApprovalCheckRoute>
            <TeacherSettings />
          </ApprovalCheckRoute>
        } />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
    </Routes>
  );
};

export default TeacherRoutes;