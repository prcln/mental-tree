import React, { useState } from 'react';
import './SendEncouragement.css';

const SendEncouragement = ({ onSubmit, onClose }) => {
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flower');

  const iconOptions = [
    { id: 'butterfly', label: '🦋 Butterfly', icon: '/assets/icons/butterfly.svg' },
    { id: 'bird', label: '🐦 Bird', icon: '/assets/icons/bird.svg' },
    { id: 'flower', label: '🌸 Flower', icon: '/assets/icons/flower.svg' }
  ];

  const handleSubmit = () => {
    if (!message.trim()) return;

    onSubmit({
      text: message.trim(),
      author: author.trim() || 'Anonymous Friend',
      type: selectedIcon
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal encouragement-modal" onClick={e => e.stopPropagation()}>
        <h2>Send a message of support 💫</h2>
        
        <textarea
          placeholder="Write something encouraging..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={150}
          className="encouragement-message"
        />
        
        <div className="character-count">
          {message.length}/150
        </div>

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