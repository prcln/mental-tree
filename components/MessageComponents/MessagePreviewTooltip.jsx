import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, MessageCircle } from 'lucide-react';
import './MessagePreviewTooltip.css';

const MessagePreviewTooltip = ({ message, icon, triggerRef }) => {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState('top'); // 'top' or 'bottom'

  useEffect(() => {
    if (!triggerRef?.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      
      // Estimate tooltip height (or get actual if rendered)
      const tooltipHeight = tooltipEl?.offsetHeight || 120; // fallback estimate
      const gap = 8; // gap between tooltip and trigger
      
      // Check if there's enough space above
      const spaceAbove = triggerRect.top;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      
      // Determine placement
      const shouldPlaceBelow = spaceAbove < tooltipHeight + gap && spaceBelow > spaceAbove;
      
      setPlacement(shouldPlaceBelow ? 'bottom' : 'top');
      
      // Position at the appropriate edge of the trigger
      const top = shouldPlaceBelow ? triggerRect.bottom : triggerRect.top;
      const left = triggerRect.left + (triggerRect.width / 2);

      setPosition({ top, left });
      
      if (!isVisible) {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }
    };

    // Initial position
    updatePosition();
    
    // Re-calculate after tooltip renders to get accurate height
    const timer = setTimeout(updatePosition, 0);
    
    // Update on scroll and resize
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [triggerRef, isVisible]);

  if (!position) return null;

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={`message-tooltip ${isVisible ? 'tooltip-visible' : ''} tooltip-${placement}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Arrow pointing to the trigger */}
      <div className={`tooltip-arrow tooltip-arrow-${placement}`}></div>
      
      <div className="tooltip-content">
        <div className="text-sm text-gray-700 font-medium mb-1 line-clamp-2">
          {message.text}
        </div>
        <div className="text-xs text-gray-500">
          — {message.author}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1 tooltip-stat">
            <Heart className="w-3 h-3" />
            {message.likes || 0}
          </span>
          <span className="flex items-center gap-1 tooltip-stat">
            <MessageCircle className="w-3 h-3" />
            {message.reply_count || 0}
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(tooltipContent, document.body);
};

export default MessagePreviewTooltip;