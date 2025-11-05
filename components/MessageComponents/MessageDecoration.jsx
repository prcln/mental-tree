import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import MessagePreviewTooltip from './MessagePreviewTooltip';
import MessageModal from './MessageModal';

const MessageDecoration = ({ message, position, index, currentUserId, onUpdate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const triggerRef = useRef(null);
  
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
        ref={triggerRef}
        className="absolute cursor-pointer transition-all duration-300 hover:scale-110"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          willChange: 'transform'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      >
        <span className="text-3xl hover:drop-shadow-lg transition-all" style={{ display: 'block' }}>
          {icon}
        </span>
      </div>
        
      {isHovered && (
        <MessagePreviewTooltip 
          message={message} 
          icon={icon} 
          triggerRef={triggerRef}
        />
      )}

      {showModal && createPortal(
        <MessageModal
          message={message}
          icon={icon}
          index={index}
          currentUserId={currentUserId}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />,
        document.getElementById('modal-root') || document.body
      )}
    </>
  );
};

export default MessageDecoration;