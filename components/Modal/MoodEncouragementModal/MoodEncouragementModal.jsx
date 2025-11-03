import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Sun, Cloud, Star, Zap } from 'lucide-react';

import { encouragementMessages, contextBonusMessages } from '../../../constants/moodEncouragement';

const MoodEncouragement = ({ score, hasContext, onClose }) => {
  const [message, setMessage] = useState('');
  const [bonusMessage, setBonusMessage] = useState('');
  const [icon, setIcon] = useState(null);
  const [bgColor, setBgColor] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);

  useEffect(() => {
    // Determine score category and select random message
    let category;
    let selectedIcon;
    let color;

    // Score ranges: 0-3, 4-6, 7-8, 9-10
    if (score <= 3) {
      category = 'veryLow';
      selectedIcon = <Cloud size={32} className="encouragement-icon" />;
      color = 'bg-blue-100 border-blue-300';
    } else if (score <= 6) {
      category = 'low';
      selectedIcon = <Heart size={32} className="encouragement-icon" />;
      color = 'bg-purple-100 border-purple-300';
    } else if (score <= 8) {
      category = 'medium';
      selectedIcon = <Sparkles size={32} className="encouragement-icon" />;
      color = 'bg-green-100 border-green-300';
    } else {
      category = 'high';
      selectedIcon = <Zap size={32} className="encouragement-icon" />;
      color = 'bg-yellow-100 border-yellow-300';
    }

    const messages = encouragementMessages[category];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    setMessage(randomMessage);
    setIcon(selectedIcon);
    setBgColor(color);

    // Add bonus message if context was provided
    if (hasContext && score >= 7) {
      const bonusMsg = contextBonusMessages[Math.floor(Math.random() * contextBonusMessages.length)];
      setBonusMessage(bonusMsg);
    }

    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Animate score counter
    let current = 0;
    const increment = score / 20;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setScoreDisplay(score);
        clearInterval(timer);
      } else {
        setScoreDisplay(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [score, hasContext]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  const getScoreLabel = () => {
    if (score <= 3) return { text: 'Good Start!', color: 'text-blue-600' };
    if (score <= 6) return { text: 'Great Job!', color: 'text-purple-600' };
    if (score <= 8) return { text: 'Excellent!', color: 'text-green-600' };
    return { text: 'Outstanding!', color: 'text-yellow-600' };
  };

  const scoreLabel = getScoreLabel();

  return (
    <div 
      className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className={`${bgColor} border-2 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Animated Icon */}
          <div className="animate-bounce">
            {icon}
          </div>
          
          {/* Score Display */}
          <div className="flex items-center gap-3">
            <div className="text-5xl font-bold text-gray-800">
              {scoreDisplay}
              <span className="text-2xl text-gray-500">/10</span>
            </div>
            <Star className="text-yellow-500 fill-yellow-500" size={32} />
          </div>

          <div className={`text-xl font-semibold ${scoreLabel.color}`}>
            {scoreLabel.text}
          </div>

          {/* Main Message */}
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {message}
          </p>

          {/* Bonus Message for Context */}
          {bonusMessage && (
            <p className="text-sm font-medium text-gray-700 bg-white/60 rounded-lg px-4 py-2 leading-relaxed">
              {bonusMessage}
            </p>
          )}

          {/* Score Breakdown (optional) */}
          <div className="w-full bg-white/60 rounded-lg px-4 py-3 mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Score Progress</span>
              <span className="font-semibold">{score * 10}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 transition-all duration-1000 ease-out"
                style={{ width: `${score * 10}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleClose}
            className="mt-4 px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all duration-200 shadow-sm border border-gray-200 hover:scale-105"
          >
            Continue Growing 🌱
          </button>
        </div>
      </div>

      <style jsx>{`
        .encouragement-icon {
          color: #6b7280;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
      `}</style>
    </div>
  );
};

export default MoodEncouragement;