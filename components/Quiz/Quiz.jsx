import React, { useState, useEffect } from 'react';
import './PersonalityQuiz.css';
import { QUIZ_CONFIG } from '../../constants/QUIZ_CONFIG';

// Import your background images here
import startBg from '../../assets/backgrounds/start.jpg';
import question1Bg from '../../assets/backgrounds/question1.jpg';
import question2Bg from '../../assets/backgrounds/question2.jpg';
import question3Bg from '../../assets/backgrounds/question3.jpg';
import question4Bg from '../../assets/backgrounds/question4.jpg';
import question5Bg from '../../assets/backgrounds/question5.jpg';
import question6Bg from '../../assets/backgrounds/question6.jpg';
import question7Bg from '../../assets/backgrounds/question7.jpg';
import question8Bg from '../../assets/backgrounds/question8.jpg';
import question9Bg from '../../assets/backgrounds/question9.jpg';
import question10Bg from '../../assets/backgrounds/question10.jpg';

const PersonalityQuiz = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ bold: 0, balanced: 0, cautious: 0 });
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState(null);

  // Stage management
  const [questionStage, setQuestionStage] = useState('in'); // 'in', 'answer', 'out'
  const [backgroundDim, setBackgroundDim] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showQuizCard, setShowQuizCard] = useState(false);
  
  const { questions, fruitTypes, backgrounds } = QUIZ_CONFIG;

  // Map of background images
  const backgroundImages = {
    start: startBg,
    question1: question1Bg,
    question2: question2Bg,
    question3: question3Bg,
    question4: question4Bg,
    question5: question5Bg,
    question6: question6Bg,
    question7: question7Bg,
    question8: question8Bg,
    question9: question9Bg,
    question10: question10Bg,
  };

  useEffect(() => {
    if (hasStarted && !showResults) {
      // Start with 'in' stage
      setShowQuizCard(false);
      setQuestionStage('in');
      setBackgroundDim(false);
      setIsTransitioning(true);

      // After 2-3 seconds, move to 'answer' stage
      // Show card after delay
      const cardTimer = setTimeout(() => {
        setShowQuizCard(true);
      }, 3500); // Card appears after 2 seconds

      const inTimer = setTimeout(() => {
        setQuestionStage('answer');
        setIsTransitioning(false);
      }, 1500);

      return () => {
      clearTimeout(cardTimer);
      clearTimeout(inTimer);
    };
    }
  }, [currentQuestion, hasStarted, showResults]);

  const calculateResult = (finalScores) => {
    const totalScore = finalScores.bold + finalScores.balanced + finalScores.cautious;
    
    if (totalScore <= 21) return 'peach';
    if (totalScore <= 30) return 'greenApple';
    if (totalScore <= 40) return 'mango';
    if (totalScore <= 50) return 'strawberry';
    if (totalScore <= 60) return 'pineapple';
    return 'grapes';
  };

  const handleAnswer = (option) => {
    // Stage 2: Dim the background when answer is clicked
    setQuestionStage('answer');
    setBackgroundDim(true);
    setIsTransitioning(true);
    
    const newScores = { ...scores };
    Object.entries(option.points).forEach(([type, points]) => {
      newScores[type] = (newScores[type] || 0) + points;
    });
    setScores(newScores);

    // Wait a moment while dimmed, then transition out
    setTimeout(() => {
      setQuestionStage('out');
      
      // Stage 3: Transition out to next question
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setBackgroundDim(false);
        } else {
          const resultType = calculateResult(newScores);
          const totalScore = newScores.bold + newScores.balanced + newScores.cautious;
          
          setResult({
            fruitType: resultType,
            fruitInfo: fruitTypes[resultType],
            scores: newScores,
            totalScore
          });
          setShowResults(true);
        }
        setIsTransitioning(false);
      }, 600);
    }, 800);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setQuestionStage('out');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setBackgroundDim(false);
      }, 400);
    }
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleRestart = () => {
    setHasStarted(false);
    setCurrentQuestion(0);
    setScores({ bold: 0, balanced: 0, cautious: 0 });
    setShowResults(false);
    setResult(null);
    setQuestionStage('in');
    setBackgroundDim(false);
  };

  const getCurrentBackground = () => {
    if (showResults) {
      return backgrounds?.default || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    if (!hasStarted) {
      return `url(${backgroundImages.start})`;
    }
    // Get the background image for the current question
    const questionKey = `question${currentQuestion + 1}`;
    return `url(${backgroundImages[questionKey]})`;
  };

  // Start Page
  if (!hasStarted) {
    return (
      <div className="quiz-container" 
        style={{ 
          backgroundImage: getCurrentBackground(), 
          backgroundSize: 'auto 100vh', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="quiz-card start-page">
          <div className="start-hero-image">
            <div className="image-placeholder">
              🍊🍓🍇
              <span className="placeholder-text">Welcome to Fruitville</span>
            </div>
          </div>

          <div className="start-content">
            <h1 className="start-title">
              Discover Your Fruit Personality
            </h1>
            
            <p className="start-description">
              Step through the mysterious portal into Fruitville! 
              Journey through floating orchards and discover which fruit reflects your true essence.
            </p>

            <div className="start-features">
              <div className="feature-item">
                <div className="feature-image-placeholder">
                  <span className="feature-emoji">✨</span>
                </div>
                <h3>Magical Journey</h3>
                <p>{questions.length} enchanted questions</p>
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

            <button onClick={handleStart} className="btn-start">
              Enter the Portal
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Page
  if (showResults && result) {
    return (
      <div className="quiz-container" 
        style={{ 
          backgroundImage: getCurrentBackground(), 
          backgroundSize: 'auto 100vh', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="quiz-card results-page">
          <div className="results-header">
            <div className="results-emoji-large">{result.fruitInfo.emoji}</div>
            <h1 className="results-title">You are...</h1>
            <h2 className="results-fruit-name">{result.fruitInfo.name}</h2>
            <p className="results-description">{result.fruitInfo.description}</p>
          </div>

          <div className="results-score">
            <h3>Your Score: {result.totalScore}</h3>
            <div className="score-breakdown">
              <div className="score-item">
                <span className="score-label">Bold</span>
                <div className="score-bar">
                  <div className="score-fill bold" style={{ width: `${(result.scores.bold / result.totalScore) * 100}%` }}></div>
                </div>
                <span className="score-value">{result.scores.bold}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Balanced</span>
                <div className="score-bar">
                  <div className="score-fill balanced" style={{ width: `${(result.scores.balanced / result.totalScore) * 100}%` }}></div>
                </div>
                <span className="score-value">{result.scores.balanced}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Cautious</span>
                <div className="score-bar">
                  <div className="score-fill cautious" style={{ width: `${(result.scores.cautious / result.totalScore) * 100}%` }}></div>
                </div>
                <span className="score-value">{result.scores.cautious}</span>
              </div>
            </div>
          </div>

          <div className="results-traits">
            <h3>Your Traits</h3>
            <div className="traits-grid">
              {result.fruitInfo.traits.map((trait, idx) => (
                <div key={idx} className="trait-badge">{trait}</div>
              ))}
            </div>
          </div>

          <button onClick={handleRestart} className="btn-restart">
            Take Quiz Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz Questions - Card directly on background
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div 
      className={`quiz-container stage-${questionStage} ${backgroundDim ? 'dimmed' : ''}`}
      style={{ 
        backgroundImage: getCurrentBackground(), 
        backgroundSize: 'auto 100vh', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div 
        className={`quiz-card transparent ${showQuizCard ? 'show-card' : 'hide-card'} stage-${questionStage} ${isTransitioning ? 'transitioning' : ''}`}
      >
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

        <h2 className="quiz-question">
          {currentQ.question}
        </h2>

        <div className="quiz-options">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              className="quiz-option"
              disabled={isTransitioning}
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

        <div className="quiz-navigation">
          {currentQuestion > 0 && (
            <button onClick={handlePrevious} className="btn-previous" disabled={isTransitioning}>
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