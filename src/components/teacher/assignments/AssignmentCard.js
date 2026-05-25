// frontend/src/components/teacher/assignments/AssignmentCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Users, Download, Eye } from 'lucide-react';

const AssignmentCard = ({ assignment, onClick, onViewSubmissions }) => {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="assignment-card"
      style={{
        background: 'rgba(16, 46, 80, 0.8)',
        borderRadius: '20px',
        padding: '1.25rem',
        border: '1px solid rgba(245, 196, 94, 0.2)',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="#F5C45E" />
          <h3 style={{ color: 'white', fontSize: '1rem', margin: 0 }}>{assignment.title}</h3>
        </div>
        {isOverdue && (
          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem' }}>
            Overdue
          </span>
        )}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        {assignment.description?.substring(0, 100)}...
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          <Calendar size={12} />
          Due: {dueDate.toLocaleDateString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          <Users size={12} />
          {assignment.submissionsCount || 0} submissions
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={(e) => { e.stopPropagation(); window.open(assignment.attachment.url, '_blank'); }}
          style={{
            flex: 1,
            background: 'rgba(245, 196, 94, 0.15)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem',
            color: '#F5C45E',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Download size={12} /> Download
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onViewSubmissions(); }}
          style={{
            flex: 1,
            background: 'rgba(59, 130, 246, 0.15)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Eye size={12} /> Submissions
        </button>
      </div>
    </motion.div>
  );
};

export default AssignmentCard;