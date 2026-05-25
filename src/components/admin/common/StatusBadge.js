// frontend/src/components/admin/common/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
    // Get badge styles based on status
    const getBadgeStyles = () => {
        const statusMap = {
            // Active/Approved statuses
            active: { 
                background: 'rgba(16, 185, 129, 0.12)', 
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.25)'
            },
            approved: { 
                background: 'rgba(16, 185, 129, 0.12)', 
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.25)'
            },
            // Pending status
            pending: { 
                background: 'rgba(245, 158, 11, 0.12)', 
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.25)'
            },
            // Blocked/Rejected statuses
            blocked: { 
                background: 'rgba(239, 68, 68, 0.12)', 
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)'
            },
            rejected: { 
                background: 'rgba(239, 68, 68, 0.12)', 
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)'
            },
            // Role badges
            student: { 
                background: 'rgba(59, 130, 246, 0.12)', 
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.25)'
            },
            teacher: { 
                background: 'rgba(139, 92, 246, 0.12)', 
                color: '#a78bfa',
                border: '1px solid rgba(139, 92, 246, 0.25)'
            },
            admin: { 
                background: 'rgba(245, 196, 94, 0.12)', 
                color: '#F5C45E',
                border: '1px solid rgba(245, 196, 94, 0.25)'
            }
        };
        
        return statusMap[status] || statusMap.default || {
            background: 'rgba(148, 163, 184, 0.12)',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.25)'
        };
    };
    
    const getLabel = () => {
        const labels = {
            active: 'Active',
            approved: 'Approved',
            pending: 'Pending',
            blocked: 'Blocked',
            rejected: 'Rejected',
            student: 'Student',
            teacher: 'Teacher',
            admin: 'Admin',
            inactive: 'Inactive'
        };
        return labels[status] || (typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');
    };
    
    const styles = getBadgeStyles();
    
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            background: styles.background,
            color: styles.color,
            border: styles.border,
            transition: 'all 0.2s ease',
        }}>
            {/* Optional: Add a small dot indicator */}
            <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: styles.color,
                marginRight: '6px',
                opacity: 0.8,
            }} />
            {getLabel()}
        </span>
    );
};

export default StatusBadge;