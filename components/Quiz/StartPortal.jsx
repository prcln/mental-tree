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
        <div className="portal-hero">
          <div className="hero-emoji">🍊🍓🍇</div>
          <div className="hero-title">Welcome to Fruitville</div>
        </div>

        <div className="portal-content">
          <h1 className="portal-title">
            Discover Your Fruit Personality
          </h1>
          
          <p className="portal-description">
            Journey through {questionCount} enchanted questions and discover which fruit reflects your true essence in the magical world of Fruitville.
          </p>

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