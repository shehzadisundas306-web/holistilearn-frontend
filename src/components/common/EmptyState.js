// frontend/src/components/common/EmptyState.jsx
import React from 'react';

const EmptyState = ({ 
  icon = '📭', 
  title = 'Nothing here yet', 
  message = 'Start by adding some content',
  actionText,
  onAction 
}) => {
  return (
    <>
      <style>
        {`
          .empty-state-container {
            text-align: center;
            padding: 8px 2px;
            background: #0F3052;
            backdrop-filter: blur(8px);
            border-radius: 28px;
            // border: 1px solid rgba(245, 196, 94, 0.2);
            margin: 16px 0;
          }
          .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 16px;
            display: inline-block;
          }
          .empty-state-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: white;
            margin-bottom: 8px;
          }
          .empty-state-message {
            color: var(--gray, #aba8a8);
            font-size: 0.9rem;
            margin-bottom: 20px;
          }
          .empty-state-action {
            background: var(--blue, #F5C45E);
            border: none;
            border-radius: 40px;
            padding: 10px 24px;
            font-weight: 600;
            color: var(--navy, #102E50);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
          }
          .empty-state-action:hover {
            background: #e0a82b;
            transform: translateY(-1px);
          }
        `}
      </style>
      <div className="empty-state-container">
        <div className="empty-state-icon">{icon}</div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-message">{message}</p>
        {actionText && onAction && (
          <button className="empty-state-action" onClick={onAction}>
            {actionText}
          </button>
        )}
      </div>
    </>
  );
};

export default EmptyState;