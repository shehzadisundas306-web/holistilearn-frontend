// frontend/src/pages/admin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, FileQuestion, School, Calendar, Award,
  Download, Filter, ChevronDown, BarChart3, PieChart,
  Activity, UserCheck, UserX, Clock, Star, Zap, CheckCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { getPlatformAnalytics, getDashboardStats, getTeacherStats, getStudentStats } from '../../api/adminApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import UserGrowthChart from '../../components/admin/charts/UserGrowthChart';
import ActivityChart from '../../components/admin/charts/ActivityChart';
import '../../styles/admin/AdminAnalytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [teacherStats, setTeacherStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [activeChart, setActiveChart] = useState('userGrowth');

  useEffect(() => {
    fetchAllAnalytics();
  }, [period]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, statsRes, teacherStatsRes, studentStatsRes] = await Promise.all([
        getPlatformAnalytics(period),
        getDashboardStats(),
        getTeacherStats(),
        getStudentStats()
      ]);
      
      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      if (statsRes.success) setStats(statsRes.stats);
      if (teacherStatsRes.success) setTeacherStats(teacherStatsRes.stats);
      if (studentStatsRes.success) setStudentStats(studentStatsRes.stats);
    } catch (error) {
      console.error('Analytics error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    setExporting(true);
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        period: period,
        stats: stats,
        teacherStats: teacherStats,
        studentStats: studentStats,
        analytics: analytics
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${period}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const userGrowthTrend = calculateTrend(stats?.totalUsers, stats?.totalUsers - stats?.recentUsers);
  const quizTrend = calculateTrend(stats?.totalQuizzes, stats?.totalQuizzes - stats?.recentQuizzes);
  const classTrend = calculateTrend(stats?.totalClasses, stats?.totalClasses - stats?.recentClasses);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;

  return (
    <div className="analytics-page-admin">
      <div className="page-header">
        <div>
          <h2>Analytics & Reports</h2>
          <p>Comprehensive platform insights and performance metrics</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>
              Last 7 Days
            </button>
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>
              Last 30 Days
            </button>
            <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>
              Last Year
            </button>
          </div>
          <button className="export-btn" onClick={exportData} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon users">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <h3>{stats?.totalUsers?.toLocaleString() || 0}</h3>
            <p>Total Users</p>
            <span className={`trend ${userGrowthTrend >= 0 ? 'up' : 'down'}`}>
              {userGrowthTrend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(userGrowthTrend))}% vs last period
            </span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon teachers">
            <UserCheck size={24} />
          </div>
          <div className="metric-info">
            <h3>{teacherStats?.approvedTeachers?.toLocaleString() || 0}</h3>
            <p>Approved Teachers</p>
            <span className="trend neutral">{teacherStats?.pendingTeachers || 0} pending approval</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon classes">
            <School size={24} />
          </div>
          <div className="metric-info">
            <h3>{stats?.totalClasses?.toLocaleString() || 0}</h3>
            <p>Active Classes</p>
            <span className={`trend ${classTrend >= 0 ? 'up' : 'down'}`}>
              {classTrend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(classTrend))}% vs last period
            </span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon quizzes">
            <FileQuestion size={24} />
          </div>
          <div className="metric-info">
            <h3>{stats?.totalQuizzes?.toLocaleString() || 0}</h3>
            <p>Total Quizzes</p>
            <span className={`trend ${quizTrend >= 0 ? 'up' : 'down'}`}>
              {quizTrend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(quizTrend))}% vs last period
            </span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon submissions">
            <Activity size={24} />
          </div>
          <div className="metric-info">
            <h3>{stats?.totalSubmissions?.toLocaleString() || 0}</h3>
            <p>Quiz Submissions</p>
            <span className="trend neutral">Total attempts</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon score">
            <Award size={24} />
          </div>
          <div className="metric-info">
            <h3>{Math.round(stats?.averageScore || 0)}%</h3>
            <p>Avg. Quiz Score</p>
            <span className="trend neutral">Platform average</span>
          </div>
        </div>
      </div>

      {/* Chart Navigation Tabs */}
      <div className="chart-tabs">
        <button 
          className={`chart-tab ${activeChart === 'userGrowth' ? 'active' : ''}`}
          onClick={() => setActiveChart('userGrowth')}
        >
          <BarChart3 size={16} />
          User Growth
        </button>
        <button 
          className={`chart-tab ${activeChart === 'quizActivity' ? 'active' : ''}`}
          onClick={() => setActiveChart('quizActivity')}
        >
          <Activity size={16} />
          Quiz Activity
        </button>
        <button 
          className={`chart-tab ${activeChart === 'teacherPerformance' ? 'active' : ''}`}
          onClick={() => setActiveChart('teacherPerformance')}
        >
          <UserCheck size={16} />
          Teacher Performance
        </button>
        <button 
          className={`chart-tab ${activeChart === 'studentPerformance' ? 'active' : ''}`}
          onClick={() => setActiveChart('studentPerformance')}
        >
          <Star size={16} />
          Student Performance
        </button>
      </div>

      {/* User Growth Chart */}
      {activeChart === 'userGrowth' && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>User Registration Trends</h3>
            <div className="chart-legend">
              <span><span className="legend-dot students"></span> Students</span>
              <span><span className="legend-dot teachers"></span> Teachers</span>
            </div>
          </div>
          <UserGrowthChart data={analytics?.userRegistrations || []} height={350} />
        </div>
      )}

      {/* Quiz Activity Chart */}
      {activeChart === 'quizActivity' && (
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Quiz Activity Overview</h3>
            <div className="chart-legend">
              <span><span className="legend-dot submissions"></span> Submissions</span>
              <span><span className="legend-dot score-line"></span> Average Score</span>
            </div>
          </div>
          <ActivityChart data={analytics?.quizActivity || []} height={350} />
        </div>
      )}

      {/* Teacher Performance Section */}
      {activeChart === 'teacherPerformance' && (
        <div className="two-columns">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Teacher Performance</h3>
              <TrendingUp size={18} className="chart-icon" />
            </div>
            <div className="teacher-stats-container">
              <div className="stat-circle-large">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                  <circle 
                    cx="60" cy="60" r="54" fill="none" 
                    stroke="#10b981" strokeWidth="8"
                    strokeDasharray={`${(teacherStats?.approvalRate || 0) * 3.39} 339`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="circle-percentage">
                  {Math.round(teacherStats?.approvalRate || 0)}%
                </div>
                <div className="circle-label">Approval Rate</div>
              </div>
              <div className="teacher-metrics">
                <div className="metric-row">
                  <div className="metric-card-small">
                    <div className="metric-value">{teacherStats?.totalTeachers || 0}</div>
                    <div className="metric-label">Total Teachers</div>
                  </div>
                  <div className="metric-card-small">
                    <div className="metric-value success">{teacherStats?.approvedTeachers || 0}</div>
                    <div className="metric-label">Approved</div>
                  </div>
                  <div className="metric-card-small">
                    <div className="metric-value warning">{teacherStats?.pendingTeachers || 0}</div>
                    <div className="metric-label">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Teacher Activity</h3>
              <Activity size={18} className="chart-icon" />
            </div>
            <div className="teacher-activity">
              <div className="activity-stat">
                <div className="stat-header">
                  <span>Classes Created</span>
                  <strong>{stats?.totalClasses || 0}</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }} />
                </div>
              </div>
              <div className="activity-stat">
                <div className="stat-header">
                  <span>Quizzes Created</span>
                  <strong>{stats?.totalQuizzes || 0}</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '82%' }} />
                </div>
              </div>
              <div className="activity-stat">
                <div className="stat-header">
                  <span>Active Teachers</span>
                  <strong>{Math.round((teacherStats?.approvedTeachers / (teacherStats?.totalTeachers || 1)) * 100)}%</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(teacherStats?.approvedTeachers / (teacherStats?.totalTeachers || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Performance Section */}
      {activeChart === 'studentPerformance' && (
        <div className="two-columns">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Student Performance</h3>
              <Star size={18} className="chart-icon" />
            </div>
            <div className="student-metrics-container">
              <div className="metric-item-large">
                <div className="metric-label">Active Students</div>
                <div className="metric-value">{studentStats?.activeStudents || 0}</div>
                <div className="progress-bar">
                  <div className="progress-fill success" style={{ width: `${(studentStats?.activeStudents / (studentStats?.totalStudents || 1)) * 100}%` }} />
                </div>
              </div>
              <div className="metric-item-large">
                <div className="metric-label">Inactive Students</div>
                <div className="metric-value">{studentStats?.inactiveStudents || 0}</div>
                <div className="progress-bar">
                  <div className="progress-fill warning" style={{ width: `${(studentStats?.inactiveStudents / (studentStats?.totalStudents || 1)) * 100}%` }} />
                </div>
              </div>
              <div className="metric-item-large">
                <div className="metric-label">Average Quiz Score</div>
                <div className="metric-value">{Math.round(stats?.averageScore || 0)}%</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats?.averageScore || 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Quick Stats</h3>
              <Zap size={18} className="chart-icon" />
            </div>
            <div className="quick-stats-grid">
              <div className="quick-stat-card">
                <div className="stat-value">{stats?.recentUsers || 0}</div>
                <div className="stat-label">New Users (7d)</div>
              </div>
              <div className="quick-stat-card">
                <div className="stat-value">{stats?.recentClasses || 0}</div>
                <div className="stat-label">New Classes (7d)</div>
              </div>
              <div className="quick-stat-card">
                <div className="stat-value">{stats?.recentQuizzes || 0}</div>
                <div className="stat-label">New Quizzes (7d)</div>
              </div>
              <div className="quick-stat-card">
                <div className="stat-value">{teacherStats?.pendingTeachers || 0}</div>
                <div className="stat-label">Pending Approvals</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Health Indicators */}
      <div className="health-section">
        <h3>Platform Health</h3>
        <div className="health-grid">
          <div className="health-card">
            <CheckCircle size={24} className="health-icon success" />
            <div>
              <h4>System Status</h4>
              <p>All systems operational</p>
            </div>
          </div>
          <div className="health-card">
            <Clock size={24} className="health-icon info" />
            <div>
              <h4>Uptime</h4>
              <p>99.9% over last 30 days</p>
            </div>
          </div>
          <div className="health-card">
            <Activity size={24} className="health-icon warning" />
            <div>
              <h4>Active Users</h4>
              <p>{Math.round((studentStats?.activeStudents || 0) / (studentStats?.totalStudents || 1) * 100)}% engagement rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;