import React, { useState } from 'react';
import MessagePreviewTooltip from './MessagePreviewTooltip';
import MessageModal from './MessageModal';

const MessageDecoration = ({ message, position, index, currentUserId, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false)
  // Icon mapping
  const iconMap = {
    butterfly: '🦋',
    bird: '🐦',
    flower: '🌸',
    leaf: '🍃',
    heart: '💚'
  };

  const icon = message.type ? iconMap[message.type] : iconMap.flower;

  return (
    <>
      <div
        className="absolute cursor-pointer transition-all duration-300 hover:scale-110"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      >
        <span className="text-3xl hover:drop-shadow-lg transition-all">
          {icon}
        </span>
        
        {isHovered && (
          <MessagePreviewTooltip message={message} icon={icon} />
        )}
      </div>

      {showModal && (
        <MessageModal
          message={message}
          icon={icon}
          index={index}
          currentUserId={currentUserId}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

export default MessageDecoration;