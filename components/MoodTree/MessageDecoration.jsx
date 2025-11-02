import React, { useState } from 'react';
import './MessageDecoration.css';

const MessageDecoration = ({ message, position, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const iconMap = {
    butterfly: '/assets/icons/butterfly.svg',
    bird: '/assets/icons/bird.svg',
    flower: '/assets/icons/flower.svg'
  };

  return (
    <div
      className={`message-decoration ${isHovered ? 'hovered' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={iconMap[message.type] || iconMap.flower}
        alt={message.type}
        className={`message-icon ${message.type}`}
      />
      
      {isHovered && (
        <div className="message-tooltip">
          <div className="message-text">{message.text}</div>
          <div className="message-author">— {message.author}</div>
        </div>
      )}
    </div>
  );
};

export default MessageDecoration;