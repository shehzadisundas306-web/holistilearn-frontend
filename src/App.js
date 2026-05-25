// frontend/src/App.js - Simplified version
import { Route, Routes } from 'react-router-dom';
import './App.css';
// import './styles/responsive.css';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/RoleSelection';
import TeacherOnboarding from './pages/TeacherOnboarding';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import AIFeatures from './pages/AIFeatures';
import VerifyEmail from './pages/VerifyEmail';
import Verify from './pages/Verify';
import ProtectedRoute, { TeacherRoute } from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ChangePassword from './pages/ChangePassword';
import { ResetFlowGuard } from './components/ResetFlowGuard';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import StudentRoutes from './routes/StudentRoutes';
import socketService from './services/socketService';
import { useEffect } from 'react';
// In App.js or index.js
import notificationService from './services/notificationService';
import SettingsService from './services/settingsService';
import SetupProfile from './pages/teacher/SetupProfile';
import TeacherRoutes from './routes/TeacherRoutes';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminRoutes from './routes/AdminRoutes';



function App() {
  // useEffect(() => {
  //   // Initialize socket only when user is logged in
  //   const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  //   if (token) {
  //     // Small delay to ensure everything is ready
  //     const timer = setTimeout(() => {
  //       socketService.connect();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, []);
  // ✅ Initialize notification service once when app loads
  
  useEffect(() => {
    notificationService.init();
    SettingsService.loadSettings();
    
    // Initialize socket only when user is logged in
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      const timer = setTimeout(() => {
        socketService.connect();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);


  return (
    <div>
      
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/select-role' element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
        <Route path='/teacher-onboarding' element={<SetupProfile/>} />

        <Route path='/about' element={<AboutPage />} />
        <Route path='/Aifeatures' element={<AIFeatures />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verifyOtp/:email' element={<ResetFlowGuard requiredKey='email'><VerifyOTP /></ResetFlowGuard>} />
        <Route path='/changePassword/:email' element={<ResetFlowGuard requiredKey='token'><ChangePassword /></ResetFlowGuard>} />
        <Route path='/teacher-dashboard' element={
          <ProtectedRoute allowedRoles={['teacher']}>
          <TeacherDashboard/>
          </ProtectedRoute>
          }/>
        
        <Route path='/student/*' element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentRoutes />
          </ProtectedRoute>
        } />
        <Route path="/teacher/*" element={
  <ProtectedRoute>
    <TeacherRoutes />
  </ProtectedRoute>
} />



// Add admin route
<Route path="/admin/*" element={<AdminRoutes />} />
        
        <Route path='/verify' element={<VerifyEmail />} />
        <Route path='/verify/:token' element={<Verify />} />
        <Route path="/google-success" element={<GoogleAuthSuccess />} />
      </Routes>


      
    </div>
  );
}

export default App;