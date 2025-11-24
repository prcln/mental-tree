import React, { useState, useEffect, useRef } from 'react';
import './PersonalityQuiz.css';
import { QUIZ_CONFIG } from '../../constants/QUIZ_CONFIG';
import StartPortal from './StartPortal';

// Import your background images here
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

const PersonalityQuiz = ({ onComplete, animationsEnabled = true, showCard = true }) => {
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const questionInitialized = useRef(false);
  const [showWhiteOverlay, setShowWhiteOverlay] = useState(false);
  
  const { questions, fruitTypes, backgrounds } = QUIZ_CONFIG;

  // Map of background images
  const backgroundImages = {
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

  // Preload all background images to eliminate loading jitter
  useEffect(() => {
    Object.values(backgroundImages).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (hasStarted && !showResults) {
      // For first question, show card immediately
      if (currentQuestion === 0) {
        setShowQuizCard(true);
        setQuestionStage('answer');
        setBackgroundDim(false);
        setIsTransitioning(false);
        return;
      }

      // For subsequent questions, animate in (or skip animation if disabled)
      setShowQuizCard(false);
      setQuestionStage('in');
      setBackgroundDim(false);
      setIsTransitioning(true);

      // Show card after delay (or immediately if animations disabled)
      const cardTimer = setTimeout(() => {
        setShowQuizCard(true);
      }, animationsEnabled ? 2500 : 0);

      const inTimer = setTimeout(() => {
        setQuestionStage('answer');
        setIsTransitioning(false);
      }, animationsEnabled ? 1000 : 0);

      return () => {
        clearTimeout(cardTimer);
        clearTimeout(inTimer);
      };
    }
  }, [currentQuestion, showResults, hasStarted, animationsEnabled]);

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

    const dimDelay = animationsEnabled ? 700 : 0;
    const transitionDelay = animationsEnabled ? 500 : 0;

    // Wait a moment while dimmed, then transition out
    setTimeout(() => {
      setQuestionStage('out');
      setShowWhiteOverlay(true);
      
      // Stage 3: Transition out to next question
      setTimeout(() => {
        setShowWhiteOverlay(false);
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setBackgroundDim(false);
        } else {
          const resultType = calculateResult(newScores);
          const totalScore = newScores.bold + newScores.balanced + newScores.cautious;
          
          const quizResult = {
            fruitType: resultType,
            fruitInfo: fruitTypes[resultType],
            scores: newScores,
            totalScore
          };
          
          setResult(quizResult);
          setShowResults(true);
          
          // Call onComplete callback if provided
          if (onComplete) {
            onComplete(quizResult);
          }
        }
        setIsTransitioning(false);
      }, transitionDelay);
    }, dimDelay);
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

  const getCurrentBackground = () => {
    if (showResults) {
      return backgrounds?.default || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    // Get the background image for the current question
    const questionKey = `question${currentQuestion + 1}`;
    return `url(${backgroundImages[questionKey]})`;
  };

  const getBackgroundStyle = () => {
    return {
      backgroundImage: getCurrentBackground(),
      backgroundSize: 'auto 100vh',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    };
  };

  // Start Page
  if (!hasStarted) {
    return <StartPortal onStart={handleStart} questionCount={questions.length} />;
  }

  // Results Page - No longer shown here, handled by QuizPage
  if (showResults && result) {
    // Return null or empty div since results are shown in QuizPage
    return null;
  }

  // Quiz Questions - Card directly on background
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div 
      className={`quiz-container stage-${questionStage} ${backgroundDim ? 'dimmed' : ''}`}
      style={getBackgroundStyle()}
    >
      {/* White overlay with z-index 500 */}
      {showWhiteOverlay && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white',
            zIndex: 500
          }}
        />
      )}

      <div 
        className={`quiz-card transparent ${showQuizCard ? 'show-card' : 'hide-card'} stage-${questionStage} ${isTransitioning ? 'transitioning' : ''} ${!showCard ? 'force-hidden' : ''}`}
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