import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        console.log('Auth Init - Token:', !!token);
        console.log('Auth Init - Current User:', currentUser);
        
        if (token && currentUser) {
          setUser(currentUser);
          
          // Verify token with backend (don't block on error)
          try {
            const response = await authService.getMe();
            if (response.success) {
              setUser(response.user);
              localStorage.setItem('user', JSON.stringify(response.user));
              console.log('User verified from backend, role:', response.user?.role);
            }
          } catch (err) {
            console.warn('Token verification failed, but using stored user:', err);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login({ email, password });
      
      if (response.success) {
        setUser(response.user);
        
        // Determine redirect path based on role
        let redirectPath = '/';
        if (response.user.role === 'teacher') {
          redirectPath = '/teacher/dashboard';
        } else if (response.user.role === 'student') {
          redirectPath = '/student';
        } else if (response.user.role === 'none') {
          redirectPath = '/select-role';
        }
        
        return { success: true, redirectPath };
      }
      return { success: false, error: response.message };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await authService.register({ username, email, password });
      
      if (response.success) {
        return { success: true, message: response.message };
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAuthenticated: authService.isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};