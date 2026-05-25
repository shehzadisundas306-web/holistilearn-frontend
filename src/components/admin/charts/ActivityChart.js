// frontend/src/components/admin/charts/ActivityChart.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../../../styles/admin/UserGrowthChart.css';

const ActivityChart = ({ data, height = 300, showStats = true }) => {
    const [hoveredBar, setHoveredBar] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [animated, setAnimated] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        setTimeout(() => setAnimated(true), 100);
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="activity-chart-empty">
                <div className="empty-icon">📊</div>
                <h4>No Activity Data Available</h4>
                <p>Complete quizzes to see analytics and performance trends</p>
            </div>
        );
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a._id) - new Date(b._id));
    const maxCount = Math.max(...sortedData.map(d => d.count), 10);
    const totalSubmissions = sortedData.reduce((sum, d) => sum + d.count, 0);
    const avgScore = Math.round(sortedData.reduce((sum, d) => sum + (d.avgScore || 0), 0) / sortedData.length);
    const successRate = totalSubmissions > 0 ? Math.round((totalSubmissions / (sortedData.length * maxCount)) * 100) : 0;
    
    // Calculate trend
    const lastThreeAvg = sortedData.slice(-3).reduce((sum, d) => sum + (d.avgScore || 0), 0) / 3;
    const previousThreeAvg = sortedData.slice(-6, -3).reduce((sum, d) => sum + (d.avgScore || 0), 0) / 3;
    const trend = lastThreeAvg - previousThreeAvg;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleMouseMove = (e, index) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 15
        });
    };

    return (
        <div className="activity-chart" ref={chartRef}>
            {/* Header with Legend */}
            <div className="chart-header">
                <div className="chart-title">
                    <span className="title-icon">📈</span>
                    <span>Quiz Activity Overview</span>
                    {trend !== 0 && (
                        <span className={`trend-badge ${trend > 0 ? 'positive' : 'negative'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs previous period
                        </span>
                    )}
                </div>
                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-dot submissions"></span>
                        <span>Quiz Submissions</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot score"></span>
                        <span>Average Score (%)</span>
                    </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="chart-wrapper">
                {/* Y-Axis Labels */}
                <div className="y-axis">
                    <div className="y-label">{maxCount}</div>
                    <div className="y-label">{Math.round(maxCount * 0.75)}</div>
                    <div className="y-label">{Math.round(maxCount * 0.5)}</div>
                    <div className="y-label">{Math.round(maxCount * 0.25)}</div>
                    <div className="y-label">0</div>
                </div>

                {/* Chart Bars */}
                <div className="bars-container" style={{ height: `${height - 100}px` }}>
                    {sortedData.map((item, index) => {
                        const barHeight = animated ? (item.count / maxCount) * 100 : 0;
                        const isHovered = hoveredBar === index;
                        const scorePercentage = Math.round(item.avgScore || 0);

                        return (
                            <div
                                key={index}
                                className={`bar-wrapper ${isHovered ? 'hovered' : ''}`}
                                onMouseEnter={(e) => {
                                    setHoveredBar(index);
                                    handleMouseMove(e, index);
                                }}
                                onMouseLeave={() => setHoveredBar(null)}
                                onMouseMove={(e) => handleMouseMove(e, index)}
                            >
                                {/* Score Line Indicator */}
                                <div 
                                    className="score-line"
                                    style={{ bottom: `${(scorePercentage / 100) * 100}%` }}
                                >
                                    <div className="score-dot"></div>
                                </div>

                                {/* Bar */}
                                <div 
                                    className="activity-bar"
                                    style={{ height: `${barHeight}%` }}
                                >
                                    {barHeight > 20 && (
                                        <span className="bar-value">{item.count}</span>
                                    )}
                                </div>

                                {/* X-Axis Label */}
                                <div className={`bar-label ${isHovered ? 'hovered' : ''}`}>
                                    {formatDate(item._id)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredBar !== null && sortedData[hoveredBar] && (
                <div 
                    className="chart-tooltip"
                    style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
                >
                    <div className="tooltip-header">
                        📅 {formatDate(sortedData[hoveredBar]._id)}
                    </div>
                    <div className="tooltip-body">
                        <div className="tooltip-row">
                            <span className="tooltip-icon">📝</span>
                            <span>Submissions:</span>
                            <strong className="tooltip-value">{sortedData[hoveredBar].count}</strong>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-icon">⭐</span>
                            <span>Average Score:</span>
                            <strong className="tooltip-value score">
                                {Math.round(sortedData[hoveredBar].avgScore || 0)}%
                            </strong>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-icon">📊</span>
                            <span>Success Rate:</span>
                            <strong className="tooltip-value">
                                {Math.round((sortedData[hoveredBar].count / maxCount) * 100)}%
                            </strong>
                        </div>
                    </div>
                    <div className="tooltip-footer">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ width: `${Math.round(sortedData[hoveredBar].avgScore || 0)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Footer */}
            {showStats && (
                <div className="chart-stats">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Submissions</span>
                            <strong className="stat-value">{totalSubmissions.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-info">
                            <span className="stat-label">Average Score</span>
                            <strong className="stat-value">{avgScore}%</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <span className="stat-label">Success Rate</span>
                            <strong className="stat-value">{successRate}%</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-info">
                            <span className="stat-label">Peak Activity</span>
                            <strong className="stat-value">{maxCount}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Insights */}
            {totalSubmissions > 0 && (
                <div className="chart-insights">
                    <div className="insight-badge">
                        <span>💡</span>
                        <span>
                            {avgScore >= 80 
                                ? "Excellent performance! Students are excelling in their quizzes."
                                : avgScore >= 60
                                ? "Good progress! Keep encouraging participation and practice."
                                : "Room for improvement. Consider providing additional learning resources."
                            }
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityChart;