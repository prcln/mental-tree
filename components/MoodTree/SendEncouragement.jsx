import React, { useState } from 'react';
import './SendEncouragement.css';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

// List of encouraging words to check for
const ENCOURAGING_WORDS = [
  // Positive emotions
  'love', 'hope', 'joy', 'happy', 'proud', 'grateful', 'blessed', 'wonderful',
  'amazing', 'beautiful', 'fantastic', 'awesome', 'great', 'excellent', 'brilliant',
  
  // Support & encouragement
  'support', 'encourage', 'believe', 'faith', 'trust', 'care', 'here', 'together',
  'strong', 'brave', 'courage', 'strength', 'power', 'capable', 'can do',
  
  // Growth & positivity
  'grow', 'flourish', 'thrive', 'bloom', 'shine', 'bright', 'light', 'inspire',
  'motivate', 'uplift', 'positive', 'forward', 'progress', 'achieve', 'succeed',
  
  // Affirmations
  'proud of you', 'believe in you', 'got this', 'you can', 'keep going',
  'don\'t give up', 'stay strong', 'you\'re doing great', 'keep it up',
  
  // Emotional support
  'thinking of you', 'here for you', 'not alone', 'with you', 'root for you',
  'sending love', 'hugs', 'smile', 'better', 'improve', 'healing', 'peace',
  
  // Emojis count as encouraging too
  '❤️', '💪', '🌟', '✨', '🌈', '☀️', '🌸', '🌺', '🌻', '🦋', '💫', '⭐'
];

// Function to check if message contains encouraging words
const isEncouragingMessage = (message) => {
  if (!message || message.trim().length === 0) return false;
  
  const lowerMessage = message.toLowerCase();
  
  // Check if any encouraging word is in the message
  return ENCOURAGING_WORDS.some(word => lowerMessage.includes(word.toLowerCase()));
};

const SendEncouragement = ({ currentUserId, onSubmit, onClose, isCommunityGarden = false }) => {
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flower');
  const [showWarning, setShowWarning] = useState(false);


  const iconOptions = [
    { id: 'butterfly', label: '🦋 Butterfly', icon: '/assets/icons/butterfly.svg' },
    { id: 'bird', label: '🐦 Bird', icon: '/assets/icons/bird.svg' },
    { id: 'flower', label: '🌸 Flower', icon: '/assets/icons/flower.svg' }
  ];

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    // Hide warning when user starts typing again
    if (showWarning) setShowWarning(false);
  };

  const handleSubmit = () => {
    if (!message.trim()) return;

    // Check if message is encouraging
    const isEncouraging = isEncouragingMessage(message);
    if (!isEncouraging) {
      setShowWarning(true);
      return;
    }

    onSubmit({
      text: message.trim(),
      author: author.trim() || 'Anonymous Friend',
      type: selectedIcon,
      isEncouraging: isEncouraging,
      sender_id: currentUserId
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal encouragement-modal" onClick={e => e.stopPropagation()}>
        <h2>{isCommunityGarden 
            ? '🌸 Share with the Community' 
            : 'Send a message of support 💫'}</h2>
        
        <textarea
          placeholder="Write something encouraging..."
          value={message}
          onChange={handleMessageChange}
          maxLength={150}
          className={`encouragement-message ${showWarning ? 'has-warning' : ''}`}
        />
        
        <div className="character-count">
          {message.length}/150
        </div>

        {showWarning && (
          <div className="encouragement-warning">
            <span className="warning-icon">⚠️</span>
            <p>
              Please write an encouraging message! Include positive words like 
              "hope", "believe", "strong", "proud", or "you can do it" 💪
            </p>
          </div>
        )}

        <input
          type="text"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={30}
          className="encouragement-author"
        />

        <div className="icon-selector">
          <label>Choose an icon:</label>
          <div className="icon-options">
            {iconOptions.map(option => (
              <button
                key={option.id}
                className={`icon-option ${selectedIcon === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedIcon(option.id)}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-submit"
            disabled={!message.trim()}
          >
            Send 💫
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEncouragement;