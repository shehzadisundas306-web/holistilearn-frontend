import React, { useState, useEffect, useCallback } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { getClassAnalytics } from '../../api/teacherApi';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import socketService from '../../services/socketService';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  FileQuestion,
  Award,
  Calendar,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const TeacherReports = () => {
  const { 
    classes, 
    dashboardStats, 
    dashboardLoading, 
    refreshAllData,
    loadTeacherClasses 
  } = useTeacher();
  
  const [classAnalytics, setClassAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const COLORS = ['#F5C45E', '#60a5fa', '#34d399', '#f97316', '#a855f7'];

  // Fetch analytics for all classes
  const fetchAllClassAnalytics = useCallback(async () => {
    if (!classes.length) {
      setClassAnalytics([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const results = await Promise.all(
        classes.map(async (cls) => {
          try {
            const res = await getClassAnalytics(cls.id);
            if (res.success) {
              return {
                id: cls.id,
                name: cls.className,
                subject: cls.subject,
                studentCount: res.analytics.totalStudents,
                avgScore: res.analytics.classAverage,
                quizCount: res.analytics.totalQuizzes,
                students: res.analytics.studentPerformance
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );
      setClassAnalytics(results.filter(r => r !== null));
    } catch (err) {
      console.error('Error fetching class analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [classes]);

  // ✅ Add real-time socket listeners
  useEffect(() => {
    // Setup socket listeners for real-time updates
    const setupSocketListeners = () => {
      if (!socketService) return;
      
      // Listen for quiz submissions
      socketService.on('quiz:submitted', (data) => {
        console.log('📊 Real-time: Quiz submitted - refreshing reports', data);
        // Refresh analytics when a quiz is submitted
        refreshAnalyticsData();
        toast.info(`New quiz submission from ${data.studentName || 'a student'}!`, {
          duration: 3000,
          icon: '📝'
        });
      });
      
      // Listen for student joining classes
      socketService.on('class:student-joined', (data) => {
        console.log('👨‍🎓 Real-time: Student joined class - refreshing reports', data);
        refreshAnalyticsData();
      });
      
      // Listen for progress updates
      socketService.on('progress-update', (data) => {
        if (data.type === 'quiz_completed') {
          console.log('📊 Real-time: Quiz completed - refreshing reports');
          refreshAnalyticsData();
        }
      });
      
      // Listen for class updates
      socketService.on('class:updated', (data) => {
        console.log('📚 Real-time: Class updated - refreshing reports');
        refreshAnalyticsData();
      });
      
      // Check connection status
      setIsOnline(socketService.getConnectionStatus());
      
      // Listen for connection events
      socketService.on('socket:connected', () => {
        console.log('✅ Socket connected in Reports');
        setIsOnline(true);
        refreshAnalyticsData();
      });
      
      socketService.on('socket:disconnected', () => {
        console.log('🔌 Socket disconnected in Reports');
        setIsOnline(false);
      });
    };
    
    setupSocketListeners();
    
    // Cleanup listeners on unmount
    return () => {
      if (!socketService) return;
      socketService.off('quiz:submitted');
      socketService.off('class:student-joined');
      socketService.off('progress-update');
      socketService.off('class:updated');
      socketService.off('socket:connected');
      socketService.off('socket:disconnected');
    };
  }, []);

  // ✅ Auto-refresh every 30 seconds (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !refreshing) {
        console.log('🔄 Auto-refreshing reports...');
        refreshAnalyticsData();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Refresh analytics data function
  const refreshAnalyticsData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAllData();
      await loadTeacherClasses();
      await fetchAllClassAnalytics();
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch analytics when classes change
  useEffect(() => {
    fetchAllClassAnalytics();
  }, [fetchAllClassAnalytics]);

  // Listen for custom events (e.g., quiz created)
  useEffect(() => {
    const handleQuizCreated = () => {
      refreshAnalyticsData();
    };
    window.addEventListener('quiz-created', handleQuizCreated);
    return () => window.removeEventListener('quiz-created', handleQuizCreated);
  }, []);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAnalyticsData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.loading('Refreshing reports...', { id: 'report-refresh' });
    try {
      await refreshAllData();
      await loadTeacherClasses();
      await fetchAllClassAnalytics();
      toast.success('Reports refreshed!', { id: 'report-refresh' });
    } catch (err) {
      toast.error('Failed to refresh reports', { id: 'report-refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  // Prepare chart data
  const classPerformanceData = classAnalytics.map(cls => ({
    name: cls.name.length > 15 ? cls.name.substring(0, 12) + '...' : cls.name,
    avgScore: Math.round(cls.avgScore),
    students: cls.studentCount
  }));

  // Calculate real trend data from actual analytics
  const calculateTrendData = () => {
    // Get last 5 months of data from class analytics if available
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      
      // Calculate average score for this month (you would need historical data)
      // For now, use available data or estimate
      const avgScore = classAnalytics.length > 0 
        ? Math.round(classAnalytics.reduce((sum, c) => sum + c.avgScore, 0) / classAnalytics.length)
        : 0;
      
      monthlyData.push({
        month: monthName,
        submissions: dashboardStats?.totalQuizzes || 0,
        avgScore: avgScore
      });
    }
    
    return monthlyData;
  };

  const trendData = calculateTrendData();

  // Subject distribution
  const subjectDistribution = {};
  classAnalytics.forEach(cls => {
    subjectDistribution[cls.subject] = (subjectDistribution[cls.subject] || 0) + 1;
  });
  const subjectData = Object.entries(subjectDistribution).map(([name, value]) => ({ name, value }));

  // Top students
  const topStudents = classAnalytics.flatMap(cls =>
    cls.students?.map(s => ({
      name: s.name,
      score: s.averageScore,
      className: cls.name,
      quizzesCompleted: s.quizzesCompleted
    })) || []
  ).sort((a, b) => b.score - a.score).slice(0, 5);

  if (dashboardLoading || loading) return <LoadingSpinner text="Loading reports..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="teacher-reports">
      <div className="reports-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Deep insights into your teaching performance and student progress</p>
          {!isOnline && <span className="offline-badge">⚡ Offline Mode - Data may not be real-time</span>}
        </div>
        <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="reports-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><BookOpen size={24} /></div>
          <div className="stat-info">
            <h3>{classes.length}</h3>
            <p>Total Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FileQuestion size={24} /></div>
          <div className="stat-info">
            <h3>{dashboardStats?.totalQuizzes || 0}</h3>
            <p>Total Quizzes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h3>{dashboardStats?.averageScore || 0}%</h3>
            <p>Avg. Score</p>
          </div>
        </div>
      </div>

      <div className="reports-charts-grid">
        {/* Bar Chart */}
        <div className="chart-card">
          <h3>Class Performance</h3>
          <p className="chart-subtitle">Average quiz scores per class</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="name" stroke="#a0aec0" />
              <YAxis domain={[0, 100]} stroke="#a0aec0" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="avgScore" fill="#F5C45E" name="Average Score (%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="chart-card">
          <h3>Quiz Engagement Trend</h3>
          <p className="chart-subtitle">Submissions & average score over time</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="month" stroke="#a0aec0" />
              <YAxis yAxisId="left" stroke="#a0aec0" />
              <YAxis yAxisId="right" orientation="right" stroke="#F5C45E" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="submissions" stroke="#60a5fa" name="Submissions" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#F5C45E" name="Avg Score (%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h3>Subjects Distribution</h3>
          <p className="chart-subtitle">Number of classes per subject</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={subjectData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Students */}
        <div className="chart-card">
          <h3>Top Performing Students</h3>
          <p className="chart-subtitle">Highest average scores across all classes</p>
          <div className="top-students-list">
            {topStudents.length === 0 ? (
              <p className="empty-text">No quiz data yet</p>
            ) : (
              topStudents.map((student, idx) => (
                <div key={idx} className="top-student-item">
                  <div className="rank-badge">#{idx + 1}</div>
                  <div className="student-info">
                    <span className="student-name">{student.name}</span>
                    <span className="student-class">{student.className}</span>
                  </div>
                  <div className="student-score">
                    <Award size={16} />
                    <span>{Math.round(student.score)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="class-details-table">
        <h3>Class Performance Breakdown</h3>
        <div className="table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Subject</th>
                <th>Students</th>
                <th>Quizzes</th>
                <th>Avg Score</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {classAnalytics.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.name}</td>
                  <td>{cls.subject}</td>
                  <td>{cls.studentCount}</td>
                  <td>{cls.quizCount}</td>
                  <td>{Math.round(cls.avgScore)}%</td>
                  <td>
                    <div className="performance-bar">
                      <div 
                        className="performance-fill" 
                        style={{ 
                          width: `${cls.avgScore}%`, 
                          backgroundColor: cls.avgScore >= 70 ? '#34d399' : cls.avgScore >= 50 ? '#F5C45E' : '#ef4444' 
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;