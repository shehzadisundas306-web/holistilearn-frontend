// frontend/src/components/admin/charts/UserGrowthChart.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../../../styles/admin/UserGrowthChart.css';

const UserGrowthChart = ({ data, height = 300, showStats = true }) => {
    const [hoveredBar, setHoveredBar] = useState(null);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [animated, setAnimated] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setAnimated(true), 100);
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="user-growth-chart-empty">
                <div className="empty-icon">📊</div>
                <h4>No User Growth Data</h4>
                <p>User registration data will appear here as users join the platform</p>
            </div>
        );
    }

    // Process and sort data
    const sortedData = [...data].sort((a, b) => {
        const dateA = a._id || a.date;
        const dateB = b._id || b.date;
        return new Date(dateA) - new Date(dateB);
    });

    // Calculate max values
    const maxTotal = Math.max(...sortedData.map(d => (d.students || 0) + (d.teachers || 0)), 10);
    const maxStudents = Math.max(...sortedData.map(d => d.students || 0), 5);
    const maxTeachers = Math.max(...sortedData.map(d => d.teachers || 0), 5);
    
    // Calculate totals
    const totalStudents = sortedData.reduce((sum, d) => sum + (d.students || 0), 0);
    const totalTeachers = sortedData.reduce((sum, d) => sum + (d.teachers || 0), 0);
    const totalUsers = totalStudents + totalTeachers;
    const averageGrowth = totalUsers > 0 ? Math.round((totalUsers / sortedData.length) / (sortedData.length) * 100) : 0;
    
    // Get latest period growth
    const latestPeriod = sortedData[sortedData.length - 1];
    const previousPeriod = sortedData[sortedData.length - 2];
    const growthRate = previousPeriod 
        ? Math.round(((latestPeriod.students + latestPeriod.teachers) - (previousPeriod.students + previousPeriod.teachers)) / (previousPeriod.students + previousPeriod.teachers) * 100)
        : 0;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getFullDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleMouseMove = (e, index, segment, value) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 15
        });
        setHoveredBar(index);
        setHoveredSegment(segment);
    };

    return (
        <div className="user-growth-chart" ref={chartRef}>
            {/* Header with Legend */}
            <div className="chart-header">
                <div className="chart-title">
                    <span className="title-icon">📈</span>
                    <span>User Registration Trends</span>
                    {growthRate !== 0 && (
                        <span className={`growth-badge ${growthRate > 0 ? 'positive' : 'negative'}`}>
                            {growthRate > 0 ? '↑' : '↓'} {Math.abs(growthRate)}% vs last period
                        </span>
                    )}
                </div>
                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-dot students"></span>
                        <span>Students</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot teachers"></span>
                        <span>Teachers</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot total"></span>
                        <span>Total Users</span>
                    </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="chart-wrapper">
                {/* Y-Axis Labels */}
                <div className="y-axis">
                    <div className="y-label">{maxTotal}</div>
                    <div className="y-label">{Math.round(maxTotal * 0.75)}</div>
                    <div className="y-label">{Math.round(maxTotal * 0.5)}</div>
                    <div className="y-label">{Math.round(maxTotal * 0.25)}</div>
                    <div className="y-label">0</div>
                </div>

                {/* Chart Bars */}
                <div className="bars-container" style={{ height: `${height - 100}px` }}>
                    {sortedData.map((item, index) => {
                        const students = item.students || 0;
                        const teachers = item.teachers || 0;
                        const total = students + teachers;
                        const isHovered = hoveredBar === index;
                        const studentHeight = animated ? (students / maxTotal) * 100 : 0;
                        const teacherHeight = animated ? (teachers / maxTotal) * 100 : 0;

                        return (
                            <div
                                key={index}
                                className="bar-wrapper"
                                onMouseEnter={() => setHoveredBar(index)}
                                onMouseLeave={() => {
                                    setHoveredBar(null);
                                    setHoveredSegment(null);
                                }}
                            >
                                <div className="bar-group">
                                    {/* Students Bar */}
                                    <div
                                        className={`bar student-bar ${isHovered && hoveredSegment === 'students' ? 'hovered' : ''}`}
                                        style={{ height: `${studentHeight}%` }}
                                        onMouseEnter={(e) => handleMouseMove(e, index, 'students', students)}
                                    >
                                        {isHovered && hoveredSegment === 'students' && students > 0 && (
                                            <span className="bar-value">{students}</span>
                                        )}
                                    </div>
                                    
                                    {/* Teachers Bar */}
                                    <div
                                        className={`bar teacher-bar ${isHovered && hoveredSegment === 'teachers' ? 'hovered' : ''}`}
                                        style={{ height: `${teacherHeight}%` }}
                                        onMouseEnter={(e) => handleMouseMove(e, index, 'teachers', teachers)}
                                    >
                                        {isHovered && hoveredSegment === 'teachers' && teachers > 0 && (
                                            <span className="bar-value">{teachers}</span>
                                        )}
                                    </div>
                                </div>

                                {/* X-Axis Label */}
                                <div className={`bar-label ${isHovered ? 'hovered' : ''}`}>
                                    {formatDate(item._id || item.date)}
                                </div>

                                {/* Total indicator line */}
                                {isHovered && (
                                    <div 
                                        className="total-indicator"
                                        style={{ top: `${(1 - (total / maxTotal)) * 100}%` }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredBar !== null && hoveredSegment && sortedData[hoveredBar] && (
                <div 
                    className="chart-tooltip"
                    style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
                >
                    <div className="tooltip-header">
                        📅 {getFullDate(sortedData[hoveredBar]._id || sortedData[hoveredBar].date)}
                    </div>
                    <div className="tooltip-body">
                        <div className="tooltip-row">
                            <span className="tooltip-icon">
                                {hoveredSegment === 'students' ? '👨‍🎓' : '👨‍🏫'}
                            </span>
                            <span>{hoveredSegment === 'students' ? 'Students' : 'Teachers'}:</span>
                            <strong className="tooltip-value">
                                {hoveredSegment === 'students' 
                                    ? sortedData[hoveredBar].students || 0
                                    : sortedData[hoveredBar].teachers || 0}
                            </strong>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-icon">📊</span>
                            <span>Total Users:</span>
                            <strong className="tooltip-value">
                                {(sortedData[hoveredBar].students || 0) + (sortedData[hoveredBar].teachers || 0)}
                            </strong>
                        </div>
                        <div className="tooltip-divider"></div>
                        <div className="tooltip-total">
                            <span>Student-Teacher Ratio:</span>
                            <strong>
                                {((sortedData[hoveredBar].students || 0) / (sortedData[hoveredBar].teachers || 1)).toFixed(1)}:1
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Footer */}
            {showStats && (
                <div className="chart-stats">
                    <div className="stat-card">
                        <div className="stat-icon">👨‍🎓</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Students</span>
                            <strong className="stat-value">{totalStudents.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👨‍🏫</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Teachers</span>
                            <strong className="stat-value">{totalTeachers.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Users</span>
                            <strong className="stat-value">{totalUsers.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <span className="stat-label">Avg Growth Rate</span>
                            <strong className="stat-value">{averageGrowth}%</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserGrowthChart;