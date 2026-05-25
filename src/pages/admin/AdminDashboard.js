// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserCheck, 
    UserX, 
    School, 
    FileQuestion, 
    TrendingUp,
    Activity,
    Calendar,
    AlertCircle,
    GraduationCap
} from 'lucide-react';
import { getDashboardStats, getPlatformAnalytics } from '../../api/adminApi';
import StatsCard from '../../components/admin/common/StatsCard';
import UserGrowthChart from '../../components/admin/charts/UserGrowthChart';
import ActivityChart from '../../components/admin/charts/ActivityChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [period, setPeriod] = useState('week');

    useEffect(() => {
        fetchDashboardData();
    }, [period]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [statsRes, analyticsRes] = await Promise.all([
                getDashboardStats(),
                getPlatformAnalytics(period)
            ]);
            
            if (statsRes.success) setStats(statsRes.stats);
            if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
        } catch (error) {
            console.error('Dashboard error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading dashboard..." />;

    const statCards = [
        { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: '#3b82f6', change: `+${stats?.recentUsers || 0} this week` },
        { title: 'Total Teachers', value: stats?.totalTeachers || 0, icon: UserCheck, color: '#10b981', change: `${stats?.pendingTeachers || 0} pending approval` },
        { title: 'Total Students', value: stats?.totalStudents || 0, icon: GraduationCap, color: '#8b5cf6', change: `${stats?.blockedUsers || 0} blocked` },
        { title: 'Total Classes', value: stats?.totalClasses || 0, icon: School, color: '#f59e0b', change: `+${stats?.recentClasses || 0} new` },
        { title: 'Total Quizzes', value: stats?.totalQuizzes || 0, icon: FileQuestion, color: '#ef4444', change: `+${stats?.recentQuizzes || 0} new` },
        { title: 'Quiz Submissions', value: stats?.totalSubmissions || 0, icon: TrendingUp, color: '#06b6d4', change: 'Total attempts' }
    ];

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header-admin">
                <h2>Welcome back, Admin</h2>
                <p>Here's what's happening on your platform today.</p>
            </div>
            
            <div className="stats-grid">
                {statCards.map((card, index) => (
                    <StatsCard key={index} {...card} />
                ))}
            </div>
            
            <div className="dashboard-charts">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>User Growth</h3>
                        <div className="period-selector">
                            <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Week</button>
                            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Month</button>
                            <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Year</button>
                        </div>
                    </div>
                    <UserGrowthChart data={analytics?.userRegistrations || []} />
                </div>
                
                <div className="chart-card">
                    <h3 className='mb-2'>Platform Activity</h3>
                    <ActivityChart data={analytics?.quizActivity || []} />
                </div>
            </div>
            
            <div className="dashboard-footer">
                <div className="info-card">
                    <AlertCircle size={20} />
                    <div>
                        <h4>Pending Approvals</h4>
                        <p>{stats?.pendingTeachers || 0} teacher applications waiting for review</p>
                    </div>
                </div>
                <div className="info-card">
                    <Activity size={20} />
                    <div>
                        <h4>Recent Activity</h4>
                        <p>{stats?.recentUsers || 0} new users joined in the last 7 days</p>
                    </div>
                </div>
                <div className="info-card">
                    <Calendar size={20} />
                    <div>
                        <h4>Platform Health</h4>
                        <p>All systems operational</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;