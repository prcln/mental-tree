import React, { useState } from 'react';
import './DailyCheckIn.css';

const DailyCheckIn = ({ onSubmit, onClose }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');

  const moodOptions = [
    { id: 'great', emoji: '😊', label: 'Great!', points: 15, color: '#4CAF50' },
    { id: 'good', emoji: '🙂', label: 'Good', points: 10, color: '#8BC34A' },
    { id: 'okay', emoji: '😐', label: 'Okay', points: 5, color: '#FFC107' },
    { id: 'trying', emoji: '💪', label: 'Trying', points: 3, color: '#FF9800' }
  ];

  const handleSubmit = () => {
    if (!selectedMood) return;

    const moodData = moodOptions.find(m => m.id === selectedMood);
    onSubmit({
      mood: selectedMood,
      points: moodData.points,
      note: note.trim(),
      timestamp: new Date()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal daily-checkin-modal" onClick={e => e.stopPropagation()}>
        <h2>How are you feeling today?</h2>
        
        <div className="mood-options">
          {moodOptions.map(mood => (
            <button
              key={mood.id}
              className={`mood-btn ${selectedMood === mood.id ? 'selected' : ''}`}
              style={{
                borderColor: selectedMood === mood.id ? mood.color : '#ddd'
              }}
              onClick={() => setSelectedMood(mood.id)}
            >
              <span className="mood-emoji">{mood.emoji}</span>
              <span className="mood-label">{mood.label}</span>
              <span className="mood-points">+{mood.points}</span>
            </button>
          ))}
        </div>

        <textarea
          placeholder="Anything you'd like to note? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="mood-note"
        />

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-submit"
            disabled={!selectedMood}
          >
            Save Check-in 💧
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;