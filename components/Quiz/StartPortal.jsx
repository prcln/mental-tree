import React from 'react';
import './StartPortal.css';
import startBg from '../../assets/backgrounds/start.jpg';

const StartPortal = ({ onStart, questionCount }) => {
  const getBackgroundStyle = () => {
    return {
      backgroundImage: `url(${startBg})`,
      backgroundSize: 'auto 100vh',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    };
  };

  return (
    <div className="portal-container" style={getBackgroundStyle()}>
      <div className="portal-card">
        <div className="portal-hero-image">
          <div className="image-placeholder">
            🍊🍓🍇
            <span className="placeholder-text">Welcome to Fruitville</span>
          </div>
        </div>

        <div className="portal-content">
          <h1 className="portal-title">
            Discover Your Fruit Personality
          </h1>
          
          <p className="portal-description">
            Step through the mysterious portal into Fruitville! 
            Journey through floating orchards and discover which fruit reflects your true essence.
          </p>

          <div className="portal-features">
            <div className="feature-item">
              <div className="feature-image-placeholder">
                <span className="feature-emoji">✨</span>
              </div>
              <h3>Magical Journey</h3>
              <p>{questionCount} enchanted questions</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-image-placeholder">
                <span className="feature-emoji">🍑</span>
              </div>
              <h3>Your Fruit Self</h3>
              <p>Discover your personality</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-image-placeholder">
                <span className="feature-emoji">🌈</span>
              </div>
              <h3>Unique Results</h3>
              <p>Personalized insights</p>
            </div>
          </div>

          <button onClick={onStart} className="btn-start">
            Enter the Portal
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPortal;