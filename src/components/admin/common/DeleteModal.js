// frontend/src/components/admin/common/DeleteModal.jsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    if (!isOpen) return null;
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(135deg, #0f2a42 0%, #0a1a2e 100%)',
                borderRadius: '24px',
                width: '450px',
                maxWidth: '90%',
                border: '1px solid rgba(245, 196, 94, 0.2)',
                animation: 'slideUp 0.3s ease-out',
                overflow: 'hidden',
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(245, 196, 94, 0.1)',
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 style={{
                        flex: 1,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#F5C45E',
                        margin: 0,
                    }}>{title || 'Confirm Delete'}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(245, 196, 94, 0.08)',
                            border: 'none',
                            color: '#94a3b8',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(245, 196, 94, 0.08)';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        ×
                    </button>
                </div>
                
                {/* Body */}
                <div style={{ padding: '24px' }}>
                    <p style={{
                        color: '#e5e7eb',
                        fontSize: '14px',
                        margin: '0 0 16px 0',
                        lineHeight: '1.5',
                    }}>{message || 'Are you sure you want to delete this item?'}</p>
                    <p style={{
                        color: '#f87171',
                        fontSize: '12px',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        padding: '10px 12px',
                        borderRadius: '10px',
                    }}>
                        <AlertTriangle size={14} />
                        This action cannot be undone.
                    </p>
                </div>
                
                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(245, 196, 94, 0.1)',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(245, 196, 94, 0.08)',
                            border: '1px solid rgba(245, 196, 94, 0.2)',
                            borderRadius: '10px',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '13px',
                            fontWeight: '500',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(245, 196, 94, 0.15)';
                            e.currentTarget.style.color = '#F5C45E';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(245, 196, 94, 0.08)';
                            e.currentTarget.style.color = '#94a3b8';
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            background: loading ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#f87171',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '13px',
                            fontWeight: '500',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            }
                        }}
                    >
                        {loading ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                </div>
            </div>
            
            {/* Add keyframe animations to document head */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default DeleteModal;