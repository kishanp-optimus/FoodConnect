import React from 'react';
import './EmptyState.css';

const EmptyState = ({
  icon = '📭',
  title = 'No data found',
  description = 'There is nothing to display here.',
  action,
  actionLabel = 'Take Action',
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {(action || onAction) && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
