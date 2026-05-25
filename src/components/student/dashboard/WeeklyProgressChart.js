// frontend/src/components/student/dashboard/WeeklyProgressChart.js
import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { FaChartBar, FaSpinner, FaSync, FaExclamationTriangle } from "react-icons/fa";
import { progressAPI } from "../../../api/progress";
import socketService from "../../../services/socketService";
import { toast } from "sonner";

// frontend/src/components/student/dashboard/WeeklyProgressChart.js
// Update the CustomTooltip component

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const minutes = payload[0].value;
    // Show minutes if less than 60, otherwise show hours and minutes
    const displayTime = minutes >= 60 
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` 
      : `${minutes} min`;
    
    return (
      <div className="custom-chart-tooltip">
        <p className="label">{displayTime}</p>
        <p className="desc">on {label}</p>
      </div>
    );
  }
  return null;
};

const WeeklyProgressChart = () => {
  const [data, setData] = useState([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState({ direction: 'stable', change: 0 });
  const [mostProductiveDay, setMostProductiveDay] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasRealData, setHasRealData] = useState(false);

  const fetchWeeklyData = useCallback(async () => {
    try {
      const response = await progressAPI.getWeeklyActivity();
      
      if (response.success && response.data) {
        const weeklyData = response.data.currentWeek;
        
        if (weeklyData && weeklyData.days && weeklyData.days.length > 0) {
          // Check if we have real data with study time
          const realDataExists = weeklyData.days.some(day => (day.studyTime || 0) > 0);
          setHasRealData(realDataExists);
          
          if (realDataExists) {
            // Use real data only
            const chartData = weeklyData.days.map(day => ({
              day: day.dayName?.substring(0, 3) || 'Mon',
              hours: (day.studyTime || 0) ,
              xpEarned: day.xpEarned || 0,
              quizzesTaken: day.quizzesTaken || 0,
              topicsCompleted: day.topicsCompleted || 0
            }));
            
            setData(chartData);
            setAverage(response.data.averageDaily ? response.data.averageDaily / 60 : 0);
            setTrend({
              direction: response.data.trend?.direction || 'stable',
              change: parseFloat(response.data.trend?.studyTimeChange || 0)
            });
            setMostProductiveDay(response.data.mostProductiveDay);
            setLastUpdated(new Date());
          } else {
            // No real data - show empty state
            setData([]);
            setAverage(0);
            setHasRealData(false);
          }
        } else {
          setData([]);
          setHasRealData(false);
        }
      } else {
        setData([]);
        setHasRealData(false);
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setData([]);
      setHasRealData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time progress updates
  const handleProgressUpdate = useCallback(() => {
    console.log('📊 WeeklyProgressChart: Progress update received, refreshing data');
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Handle quiz completion
  const handleQuizCompleted = useCallback(() => {
    console.log('📝 WeeklyProgressChart: Quiz completed, refreshing data');
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Handle topic completion
  const handleTopicCompleted = useCallback(() => {
    console.log('📚 WeeklyProgressChart: Topic completed, refreshing data');
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Handle socket connection
  const handleSocketConnected = useCallback(() => {
    console.log('Socket connected in WeeklyProgressChart');
    setIsOnline(true);
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Manual refresh
  const handleRefresh = () => {
    fetchWeeklyData();
    toast.info('Refreshing weekly data...', { duration: 1500, icon: '🔄' });
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Setup socket listeners
  useEffect(() => {
    if (!socketService) return;
    
    console.log('📡 Setting up WeeklyProgressChart socket listeners...');
    
    const unsubscribeProgress = socketService.on('progress-update', handleProgressUpdate);
    const unsubscribeIncremental = socketService.on('progress-incremental', handleProgressUpdate);
    const unsubscribeQuiz = socketService.on('quiz-completed', handleQuizCompleted);
    const unsubscribeTopic = socketService.on('topic-completed', handleTopicCompleted);
    const unsubscribeConnected = socketService.on('socket:connected', handleSocketConnected);
    
    setIsOnline(socketService.getConnectionStatus());
    
    return () => {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeIncremental) unsubscribeIncremental();
      if (unsubscribeQuiz) unsubscribeQuiz();
      if (unsubscribeTopic) unsubscribeTopic();
      if (unsubscribeConnected) unsubscribeConnected();
    };
  }, [handleProgressUpdate, handleQuizCompleted, handleTopicCompleted, handleSocketConnected]);

  const getTrendColor = () => {
    if (trend.direction === 'up') return '#10b981';
    if (trend.direction === 'down') return '#ef4444';
    return '#F5C45E';
  };

  if (loading) {
    return (
      <motion.div className="chart-card-premium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading your weekly activity...</p>
        </div>
      </motion.div>
    );
  }

  const hasData = data.length > 0 && data.some(d => d.hours > 0);

  return (
    <motion.div className="chart-card-premium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="chart-header">
        <div className="chart-title-box">
          <div className="chart-icon-bg"><FaChartBar /></div>
          <div>
            <h3>Weekly Activity</h3>
            <p>
              {hasData 
                ? `Average ${average.toFixed(1)} hours/day` 
                : "Complete quizzes and topics to see your progress"}
            </p>
          </div>
        </div>
        <div className="chart-actions">
          {!isOnline && <span className="offline-badge-small">offline</span>}
          <button 
            onClick={handleRefresh} 
            className="refresh-chart-btn"
            title="Refresh data"
            disabled={loading}
          >
            <FaSync className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {hasData && trend.change !== 0 && (
        <div className="trend-indicator" style={{ color: getTrendColor() }}>
          {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'} 
          {Math.abs(trend.change).toFixed(1)}% {trend.direction === 'up' ? 'increase' : 'decrease'} from last week
        </div>
      )}

      {hasData ? (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5C45E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F5C45E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#aba8a8', fontSize: 12 }} dy={10} />
              // In the AreaChart component, update the YAxis:

<YAxis 
  axisLine={false} 
  tickLine={false} 
  tick={{ fill: '#aba8a8', fontSize: 12 }}
  tickFormatter={(value) => {
    if (value >= 60) {
      return `${Math.floor(value / 60)}h`;
    }
    return `${value}m`;
  }}
  domain={[0, 'auto']}
/>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(245, 196, 94, 0.2)', strokeWidth: 2 }} />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="#F5C45E" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorHours)" 
                animationDuration={1000}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
          {mostProductiveDay && (
            <div className="productive-day-note">
              <span>🏆 Most productive: {mostProductiveDay.day}</span>
            </div>
          )}
          {lastUpdated && (
            <div className="last-updated-note">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-chart">
          <div className="empty-chart-icon">
            <FaChartBar />
          </div>
          <p>📊 No study data yet this week</p>
          <p className="empty-subtitle">
            {isOnline 
              ? "Complete quizzes and topics to see your progress here!" 
              : "Connect to the internet to sync your learning data"}
          </p>
          {isOnline && (
            <button onClick={handleRefresh} className="empty-chart-refresh-btn">
              <FaSync /> Refresh Data
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default WeeklyProgressChart;