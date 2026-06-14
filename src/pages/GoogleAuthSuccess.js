// frontend/src/pages/GoogleAuthSuccess.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetData } from '../context/userContext';
import { toast } from 'sonner';
import LoadingSpinner from '../components/common/LoadingSpinner';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useGetData();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const requiresProfile = urlParams.get('requiresProfile');
    const pendingApproval = urlParams.get('pendingApproval');
    const selectRole = urlParams.get('selectRole');

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('Invalid authentication response');
      navigate('/login');
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await fetch('https://holistilearn-backend.vercel.app/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.user) {
          const user = data.user;
          
          // Save to localStorage
          localStorage.setItem('accessToken', token);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update context
          updateUser(user);
          
          toast.success(`Welcome, ${user.name || user.username || 'User'}!`);
          
          // Redirect based on user role and status
          if (selectRole === 'true' || user.role === 'none') {
            navigate('/select-role');
          } else if (requiresProfile === 'true') {
            navigate('/teacher/setup-profile');
          } else if (pendingApproval === 'true') {
            navigate('/teacher/pending-approval');
          } else if (user.role === 'teacher') {
            navigate('/teacher/dashboard');
          } else if (user.role === 'student') {
            navigate('/student');
          } else if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/select-role');
          }
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Google auth error:', error);
        toast.error('Failed to complete Google login');
        navigate('/login');
      }
    };

    fetchUserData();
  }, [location, navigate, updateUser]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#0a1220'
    }}>
      <LoadingSpinner text="Completing Google sign in..." />
    </div>
  );
};

export default GoogleAuthSuccess;