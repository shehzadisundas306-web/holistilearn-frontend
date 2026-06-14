// frontend/src/context/userContext.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // ✅ Track auth state

  // ==================== AUTH FUNCTIONS ====================

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('https://holistilearn-backend.vercel.app/user/login', { email, password });
      
      if (response.data.success) {
        const userData = response.data.user;
        const newToken = response.data.accessToken || response.data.token;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setToken(newToken);
        setIsAuthenticated(true);
        
        // Determine redirect path
        let redirectPath = '/';
        if (userData.role === 'teacher') {
          redirectPath = '/teacher/dashboard';
        } else if (userData.role === 'student') {
          redirectPath = '/student/dashboard';
        } else if (userData.role === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (userData.role === 'none') {
          redirectPath = '/select-role';
        }
        
        return { success: true, redirectPath };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await axios.post('https://holistilearn-backend.vercel.app/user/register', { username, email, password });
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        await axios.post('https://holistilearn-backend.vercel.app/user/logout', {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  // ✅ Check if user is active
  const isUserActive = () => {
    return user?.isActive !== false;
  };

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('UserContext Init - Token:', !!storedToken);
        console.log('UserContext Init - Stored User:', storedUser);
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // ✅ Check if user is blocked during initialization
          if (parsedUser.isActive === false) {
            console.log('User is blocked, clearing session...');
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
          } else {
            setUser(parsedUser);
            setToken(storedToken);
            setIsAuthenticated(true);
            console.log('User loaded from storage, role:', parsedUser.role, 'isActive:', parsedUser.isActive);
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

  // Sync user with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
    }
  }, [user]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const updatedUser = JSON.parse(e.newValue);
            // ✅ Check if blocked in cross-tab update
            if (updatedUser.isActive === false) {
              logout();
            } else {
              setUser(updatedUser);
              setIsAuthenticated(true);
            }
            console.log('User updated from another tab:', updatedUser);
          } catch {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      if (e.key === 'token' || e.key === 'accessToken') {
        const newToken = localStorage.getItem('token');
        setToken(newToken);
        setIsAuthenticated(!!newToken);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAuthenticated,
    isUserActive  // ✅ Add this helper
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useGetData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useGetData must be used within a UserProvider");
  }
  return context;
};