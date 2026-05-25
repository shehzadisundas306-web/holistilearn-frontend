import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  getTeacherProfile, 
  checkProfileStatus, 
  getMyClasses,
  getTeacherDashboard 
} from '../api/teacherApi';
import { toast } from 'sonner';
import { useGetData } from './userContext';

const TeacherContext = createContext(null);

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
};

export const TeacherProvider = ({ children }) => {
  const { user, isAuthenticated } = useGetData();
  
  // Teacher Profile State
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Teacher Data State
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  
  // Dashboard State
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    averageScore: 0,
    recentActivity: [],
    upcomingTasks: []
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Last Updated Timestamps
  const [lastProfileUpdate, setLastProfileUpdate] = useState(null);
  const [lastClassesUpdate, setLastClassesUpdate] = useState(null);
  const [lastDashboardUpdate, setLastDashboardUpdate] = useState(null);

  // ==================== PROFILE MANAGEMENT ====================
  
  // Load teacher profile
  const loadTeacherProfile = useCallback(async (silent = false) => {
    if (!isAuthenticated || user?.role !== 'teacher') {
      setProfileLoading(false);
      return;
    }
    
    if (!silent) setProfileLoading(true);
    
    try {
      // First check profile status
      const statusRes = await checkProfileStatus();
      setIsProfileComplete(statusRes.isComplete);
      
      if (statusRes.isComplete) {
        // Load full profile
        const profileRes = await getTeacherProfile();
        if (profileRes.success) {
          setProfile(profileRes.profile);
          setSubjects(profileRes.profile.subjects || []);
          setTopics(profileRes.profile.topics || []);
          // ✅ Check approval status
          setIsApproved(profileRes.profile.isApproved || false);
          setPendingApproval(!profileRes.profile.isApproved);
          setRejectionReason(profileRes.profile.rejectionReason || '');
          setLastProfileUpdate(new Date());
          
          // ✅ If not approved, clear dashboard data
          if (!profileRes.profile.isApproved) {
            setDashboardStats({
              totalClasses: 0,
              totalStudents: 0,
              totalQuizzes: 0,
              averageScore: 0,
              recentActivity: [],
              upcomingTasks: []
            });
            setClasses([]);
          }
        }
      } else {
        setProfile(null);
        setSubjects([]);
        setTopics([]);
        setIsApproved(false);
        setPendingApproval(false);
      }
    } catch (error) {
      console.error('Error loading teacher profile:', error);
      if (!silent) {
        toast.error('Failed to load teacher profile');
      }
    } finally {
      setProfileLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Update profile (called after setup or edit)
  const updateTeacherProfile = useCallback((newProfile) => {
    setProfile(newProfile);
    setIsProfileComplete(true);
    setSubjects(newProfile.subjects || []);
    setTopics(newProfile.topics || []);
    // ✅ Check approval status from response
    setIsApproved(newProfile.isApproved || false);
    setPendingApproval(!newProfile.isApproved);
    setRejectionReason(newProfile.rejectionReason || '');
    setLastProfileUpdate(new Date());
  }, []);
  
  // Update subjects and topics
  const updateTeacherSubjects = useCallback((newSubjects, newTopics) => {
    setSubjects(newSubjects);
    setTopics(newTopics);
    if (profile) {
      setProfile({ ...profile, subjects: newSubjects, topics: newTopics });
    }
    setLastProfileUpdate(new Date());
  }, [profile]);
  
  // ==================== CLASS MANAGEMENT ====================
  
  // Load teacher's classes (only if approved)
  const loadTeacherClasses = useCallback(async (silent = false) => {
    if (!isAuthenticated || user?.role !== 'teacher') return;
    
    // ✅ Don't load classes if not approved
    if (!isApproved) {
      setClasses([]);
      return;
    }
    
    if (!silent) setClassesLoading(true);
    
    try {
      const response = await getMyClasses();
      if (response.success) {
        setClasses(response.classes || []);
        setLastClassesUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      if (!silent) {
        toast.error('Failed to load classes');
      }
    } finally {
      setClassesLoading(false);
    }
  }, [isAuthenticated, user, isApproved]);
  
  // Add a new class to state (optimistic update)
  const addClass = useCallback((newClass) => {
    setClasses(prev => [newClass, ...prev]);
    setLastClassesUpdate(new Date());
  }, []);
  
  // Update an existing class in state
  const updateClass = useCallback((classId, updatedData) => {
    setClasses(prev => prev.map(cls => 
      cls.id === classId ? { ...cls, ...updatedData } : cls
    ));
    setLastClassesUpdate(new Date());
  }, []);
  
  // Remove a class from state
  const removeClass = useCallback((classId) => {
    setClasses(prev => prev.filter(cls => cls.id !== classId));
    setLastClassesUpdate(new Date());
  }, []);
  
  // ==================== DASHBOARD MANAGEMENT ====================
  
  // Load dashboard statistics (only if approved)
  const loadDashboardStats = useCallback(async (silent = false) => {
    if (!isAuthenticated || user?.role !== 'teacher') return;
    
    // ✅ Don't load dashboard if not approved
    if (!isApproved) {
      setDashboardStats({
        totalClasses: 0,
        totalStudents: 0,
        totalQuizzes: 0,
        averageScore: 0,
        recentActivity: [],
        upcomingTasks: []
      });
      return;
    }
    
    if (!silent) setDashboardLoading(true);
    
    try {
      const response = await getTeacherDashboard();
      if (response.success) {
        setDashboardStats(response.dashboard);
        setLastDashboardUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      if (!silent) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setDashboardLoading(false);
    }
  }, [isAuthenticated, user, isApproved]);
  
  // Update dashboard stats (for real-time updates)
  const updateDashboardStats = useCallback((updates) => {
    setDashboardStats(prev => ({ ...prev, ...updates }));
    setLastDashboardUpdate(new Date());
  }, []);
  
  // ==================== REFRESH ALL DATA ====================
  
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      loadTeacherProfile(true),
      loadTeacherClasses(true),
      loadDashboardStats(true)
    ]);
    toast.success('Dashboard refreshed');
  }, [loadTeacherProfile, loadTeacherClasses, loadDashboardStats]);
  
  // ==================== INITIAL LOAD ====================
  
  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher') {
      loadTeacherProfile();
    }
  }, [isAuthenticated, user, loadTeacherProfile]);
  
  // Load classes and dashboard only when approved
  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher' && isApproved) {
      loadTeacherClasses();
      loadDashboardStats();
    }
  }, [isAuthenticated, user, isApproved, loadTeacherClasses, loadDashboardStats]);
  
  // ==================== CONTEXT VALUE ====================
  
  const value = {
    // Profile State
    profile,
    profileLoading,
    isProfileComplete,
    isApproved,
    pendingApproval,
    rejectionReason,
    subjects,
    topics,
    
    // Classes State
    classes,
    classesLoading,
    
    // Dashboard State
    dashboardStats,
    dashboardLoading,
    
    // Timestamps
    lastProfileUpdate,
    lastClassesUpdate,
    lastDashboardUpdate,
    
    // Profile Actions
    loadTeacherProfile,
    updateTeacherProfile,
    updateTeacherSubjects,
    
    // Class Actions
    loadTeacherClasses,
    addClass,
    updateClass,
    removeClass,
    
    // Dashboard Actions
    loadDashboardStats,
    updateDashboardStats,
    
    // Utility
    refreshAllData
  };
  
  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export default TeacherProvider;