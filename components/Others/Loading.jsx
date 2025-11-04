// Loading.jsx
import React from 'react';
import './Loading.css';

export const Loading = ({ 
  message = 'Loading...', 
  size = 'medium',
  fullPage = false 
}) => {
  const sizeClasses = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium',
    large: 'loading-spinner-large'
  };

  const containerClass = fullPage 
    ? 'tree-page-loading' 
    : 'loading-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};