import React, { useState } from 'react';
import './PersonalityQuiz.css';
import { QUIZ_CONFIG } from '../../constants/QUIZ_CONFIG';

const PersonalityQuiz = ({ onComplete }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);

  const { questions, treeTypes, calculationMethod, calculationMethods, methodConfig } = QUIZ_CONFIG;

  const calculateResult = (finalAnswers) => {
    const method = calculationMethods[calculationMethod];
    
    if (!method) {
      console.error(`Invalid calculation method: ${calculationMethod}`);
      return calculationMethods.mostFrequent(finalAnswers);
    }

    switch (calculationMethod) {
      case 'weighted':
        return method(finalAnswers, methodConfig.questionWeights);
      case 'priority':
        return method(finalAnswers, methodConfig.priorityQuestions);
      case 'threshold':
        return method(finalAnswers, methodConfig.minThreshold);
      default:
        return method(finalAnswers);
    }
  };

  const handleAnswer = (treeType) => {
    setIsAnimating(true);
    
    const newAnswers = { 
      ...answers, 
      [questions[currentQuestion].id]: treeType 
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      const resultTreeType = calculateResult(newAnswers);
      
      setTimeout(() => {
        onComplete({
          treeType: resultTreeType,
          treeInfo: treeTypes[resultTreeType],
          answers: newAnswers,
          calculationMethod: calculationMethod
        });
      }, 500);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  // Start Page
  if (!hasStarted) {
    return (
      <div className="quiz-container">
        <div className="quiz-card start-page">
          {/* Hero Image Placeholder */}
          <div className="start-hero-image">
            <div className="image-placeholder">
              🌳
              <span className="placeholder-text">Hero Image</span>
            </div>
          </div>

          {/* Content */}
          <div className="start-content">
            <h1 className="start-title">
              Discover Your Tree Personality
            </h1>
            
            <p className="start-description">
              Ever wondered which tree reflects your unique personality? 
              Take our quiz to find out if you're a mighty Oak, graceful Willow, 
              or something else entirely!
            </p>

            {/* Feature Images Grid */}
            <div className="start-features">
              <div className="feature-item">
                <div className="feature-image-placeholder">
                  <span className="feature-emoji">🌲</span>
                  <span className="placeholder-text">Feature 1</span>
                </div>
                <h3>Quick & Fun</h3>
                <p>Just {questions.length} questions</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-image-placeholder">
                  <span className="feature-emoji">✨</span>
                  <span className="placeholder-text">Feature 2</span>
                </div>
                <h3>Insightful</h3>
                <p>Discover your strengths</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-image-placeholder">
                  <span className="feature-emoji">🎯</span>
                  <span className="placeholder-text">Feature 3</span>
                </div>
                <h3>Personal</h3>
                <p>Unique to you</p>
              </div>
            </div>

            {/* Start Button */}
            <button onClick={handleStart} className="btn-start">
              Start Quiz
              <span className="btn-arrow">→</span>
            </button>

            {/* Decorative Image Placeholder */}
            <div className="start-footer-image">
              <div className="image-placeholder small">
                <span className="placeholder-text">Decorative Image</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Questions
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="quiz-container">
      <div className={`quiz-card ${isAnimating ? 'animating' : ''}`}>
        {/* Progress Section */}
        <div className="quiz-header">
          <div className="progress-info">
            <span className="question-counter">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="header-emoji">{currentQ.headerEmoji}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="quiz-question">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="quiz-options">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option.treeType)}
              className="quiz-option"
              style={{
                animationDelay: `${idx * 0.1}s`
              }}
            >
              <div className="option-content">
                <span className="option-emoji">{option.emoji}</span>
                <div className="option-text">
                  <span className="option-label">{option.label}</span>
                  {option.description && (
                    <span className="option-description">{option.description}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="quiz-navigation">
          {currentQuestion > 0 && (
            <button onClick={handlePrevious} className="btn-previous">
              ← Previous
            </button>
          )}
          <div className="quiz-dots">
            {questions.map((_, idx) => (
              <div 
                key={idx}
                className={`dot ${idx === currentQuestion ? 'active' : ''} ${idx < currentQuestion ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;