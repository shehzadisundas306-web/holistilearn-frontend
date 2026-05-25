// frontend/src/components/admin/common/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, change }) => {
    // Helper to determine if change is positive
    const isPositive = change && change.toString().includes('+');
    const isNegative = change && change.toString().includes('-');
    
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f2a42 0%, #0a1a2e 100%)',
            borderRadius: '20px',
            padding: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            border: '1px solid rgba(245, 196, 94, 0.12)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(245, 196, 94, 0.3)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(245, 196, 94, 0.12)';
            e.currentTarget.style.boxShadow = 'none';
        }}>
            {/* Gradient line at top */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${color}, transparent)`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'} />
            
            {/* Icon Container */}
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.3s ease',
            }}>
                <Icon size={28} color={color} />
            </div>
            
            {/* Info Container */}
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#ffffff',
                    margin: '0 0 4px 0',
                    lineHeight: 1.2,
                }}>
                    {value?.toLocaleString() || 0}
                </h3>
                <p style={{
                    color: '#94a3b8',
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '500',
                }}>
                    {title}
                </p>
                {change && (
                    <span style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        display: 'inline-block',
                        color: isPositive ? '#10b981' : isNegative ? '#ef4444' : '#94a3b8',
                        fontWeight: '500',
                    }}>
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatsCard;