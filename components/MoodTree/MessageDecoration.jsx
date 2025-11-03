import React, { useState } from 'react';
import './MessageDecoration.css';

const MessageDecoration = ({ message, position, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Support both emoji strings and SVG paths
  const iconMap = {
    butterfly: '🦋',
    bird: '🐦',
    flower: '🌸',
    leaf: '🍃',
    heart: '💚'
  };

  // Check if icon is an emoji (string) or SVG path
  const icon = message.type ? iconMap[message.type] : iconMap.flower;
  const isEmoji = typeof icon === 'string' && !icon.includes('/');

  return (
    <>
      <div
        className={`message-decoration ${isHovered ? 'hovered' : ''}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      >
        {isEmoji ? (
          <span className={`message-icon message-icon-emoji ${message.type}`}>
            {icon}
          </span>
        ) : (
          <img 
            src={icon}
            alt={message.type}
            className={`message-icon ${message.type}`}
          />
        )}
        
        {isHovered && (
          <div className="message-tooltip">
            <div className="message-text">{message.text}</div>
            <div className="message-author">— {message.author}</div>
          </div>
        )}
      </div>

      {showModal && (
        <div 
          className="message-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="message-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="message-modal-header">
              <button
                onClick={() => setShowModal(false)}
                className="message-modal-close"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="message-modal-header-content">
                {isEmoji ? (
                  <span className="message-modal-icon message-modal-icon-emoji">
                    {icon}
                  </span>
                ) : (
                  <img 
                    src={icon}
                    alt={message.type}
                    className="message-modal-icon"
                  />
                )}
                <div>
                  <h3 className="message-modal-title">Message #{index + 1}</h3>
                  <p className="message-modal-subtitle">A heartfelt message</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="message-modal-content">
              <div className="message-modal-section">
                <label className="message-modal-label">Message</label>
                <p className="message-modal-text">
                  "{message.text}"
                </p>
              </div>

              <div className="message-modal-section">
                <label className="message-modal-label">From</label>
                <p className="message-modal-author">{message.author}</p>
              </div>

              {message.date && (
                <div className="message-modal-section">
                  <label className="message-modal-label">Date</label>
                  <p className="message-modal-date">{message.date}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="message-modal-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`"${message.text}" - ${message.author}`);
                    alert('Message copied to clipboard!');
                  }}
                  className="message-modal-btn message-modal-btn-copy"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="message-modal-btn message-modal-btn-close"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageDecoration;