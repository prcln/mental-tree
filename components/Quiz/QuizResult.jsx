import React from 'react';
import './QuizResult.css';

const QuizResult = ({ result, onContinue }) => {
  return (
    <div className="quiz-result-container">
      <div className="quiz-result-card">
        <div className="result-header">
          <div className="result-icon">{result.fruitInfo.emoji}</div>
          <h2 className="result-title">You're a {result.fruitInfo.name}!</h2>
          <p className="result-trait">{result.fruitInfo.traits?.[0] || 'Unique personality'}</p>
        </div>

        <p className="result-description">
          {result.fruitInfo.description}
        </p>

        <button
          onClick={onContinue}
          className="result-continue-btn"
        >
          Start Growing Your Tree! 🌱
        </button>
      </div>
    </div>
  );
};

export default QuizResult;