import React, { useState, useEffect } from 'react';
import './PersonalityQuiz.css';
import { QUIZ_CONFIG } from '../../constants/QUIZ_CONFIG';
import StartPortal from './StartPortal';
import QuizResult from './QuizResult';

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

  // Map of background images
  const backgroundImages =  {
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

const PersonalityQuiz = ({ onComplete, animationsEnabled = true, showCard = true, hideQuestionCard }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ bold: 0, balanced: 0, cautious: 0 });
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Stage management
  const [questionStage, setQuestionStage] = useState('in');
  const [backgroundDim, setBackgroundDim] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showQuizCard, setShowQuizCard] = useState(false);
  const [showWhiteOverlay, setShowWhiteOverlay] = useState(false);

  // Enhanced narrative state for multiple narratives
  const [showNarrative, setShowNarrative] = useState(false);
  const [currentNarrativeIndex, setCurrentNarrativeIndex] = useState(0);
  const [narrativesComplete, setNarrativesComplete] = useState(false);
  
  const { questions, fruitTypes, backgrounds, animations } = QUIZ_CONFIG;

  // Preload all background images to eliminate loading jitter
  useEffect(() => {
    const imagesToPreload = Object.values(backgroundImages);
    let loadedCount = 0;

    const imagePromises = imagesToPreload.map((src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(imagePromises)
      .then(() => {
        setImagesLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to preload images:', error);
        setImagesLoaded(true); // Proceed anyway
      });
  }, []);

  // Handle narrative sequence when question changes
  useEffect(() => {
    if (!hasStarted || showResults) return;

    const currentQ = questions[currentQuestion];
    const narratives = currentQ?.narratives || (currentQ?.narrative ? [currentQ.narrative] : []);
    const hasNarratives = narratives.length > 0;

    // Reset narrative state for new question
    setCurrentNarrativeIndex(0);
    setNarrativesComplete(false);

    // Check if current question has narratives
    if (hasNarratives) {
      // Start narrative sequence
      setShowNarrative(true);
      setShowQuizCard(false);
      setQuestionStage('in');
      setBackgroundDim(false);
    } else {
      // No narratives - proceed normally to question
      if (currentQuestion === 0) {
        setShowQuizCard(true);
        setQuestionStage('answer');
        setBackgroundDim(false);
        setIsTransitioning(false);
        return;
      }

      // Don't immediately show the card - wait for white overlay to finish
      setQuestionStage('in');
      setBackgroundDim(false);

      const cardTimer = setTimeout(() => {
        setShowQuizCard(true);
        setIsTransitioning(true);
      }, animationsEnabled ? animations.cardDelay : 100);

      const inTimer = setTimeout(() => {
        setQuestionStage('answer');
        setIsTransitioning(false);
      }, animationsEnabled ? animations.stageInDuration : 100);

      return () => {
        clearTimeout(cardTimer);
        clearTimeout(inTimer);
      };
    }
  }, [currentQuestion, showResults, hasStarted, animationsEnabled, questions, animations]);

  // Handle multiple narrative sequence
  useEffect(() => {
    if (!hasStarted || showResults) return;

    const currentQ = questions[currentQuestion];
    const narratives = currentQ?.narratives || (currentQ?.narrative ? [currentQ.narrative] : []);
    const hasNarratives = narratives.length > 0;

    if (!showNarrative || !hasNarratives || narrativesComplete) return;

    const currentNarrative = narratives[currentNarrativeIndex];
    const narrativeDuration = animationsEnabled 
      ? (currentNarrative.duration || animations.narrativeDisplay) 
      : 100;

    const narrativeTimer = setTimeout(() => {
      // Check if there are more narratives
      if (currentNarrativeIndex < narratives.length - 1) {
        // Move to next narrative
        setCurrentNarrativeIndex(currentNarrativeIndex + 1);
      } else {
        // All narratives complete - show question
        setNarrativesComplete(true);
        setShowQuizCard(true);
        setQuestionStage('answer');
        
        // Small delay before showing question card
        setTimeout(() => {
          setShowNarrative(false);
        }, animationsEnabled ? 50 : 0);
      }
    }, narrativeDuration);

    return () => clearTimeout(narrativeTimer);
  }, [showNarrative, currentNarrativeIndex, narrativesComplete, animationsEnabled, showResults, hasStarted, currentQuestion, questions, animations]);

  const calculateResult = (finalScores) => {
    const totalScore = finalScores.bold + finalScores.balanced + finalScores.cautious;
    
    if (totalScore <= 21) return 'peach';
    if (totalScore <= 30) return 'greenapple';
    if (totalScore <= 40) return 'mango';
    if (totalScore <= 50) return 'strawberry';
    if (totalScore <= 60) return 'pineapple';
    return 'grapes';
  };

  const handleAnswer = (option) => {
    const newScores = { ...scores };
    Object.entries(option.points).forEach(([type, points]) => {
      newScores[type] = (newScores[type] || 0) + points;
    });
    setScores(newScores);

    // Reset narrative state for next question
    setNarrativesComplete(false);
    setCurrentNarrativeIndex(0);

    if (!animationsEnabled) {
      // No animations - instant transition
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
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
        
        if (onComplete) {
          onComplete(quizResult);
        }
      }
      return;
    }

    // Stage 2: Dim the background and hide card when answer is clicked
    setQuestionStage('answer');
    setBackgroundDim(true);
    setIsTransitioning(true);

    // Wait a moment while dimmed, then transition out
    setTimeout(() => {
  setQuestionStage('out');
  setShowWhiteOverlay(true);
  
  // Stage 3: Transition out to next question
  setTimeout(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowWhiteOverlay(false);              // ← Clear immediately
      setBackgroundDim(false);
      setIsTransitioning(false);
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
      
      if (onComplete) {
        onComplete(quizResult);
      }
      
      setShowWhiteOverlay(false);
      setIsTransitioning(false);
    }
  }, animations.whiteOverlayDuration);
}, animations.backgroundDim);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // Reset narrative state
      setNarrativesComplete(false);
      setCurrentNarrativeIndex(0);
      
      if (!animationsEnabled) {
        setCurrentQuestion(currentQuestion - 1);
        return;
      }
      
      setQuestionStage('out');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setBackgroundDim(false);
        setIsTransitioning(false); 
        setShowQuizCard(true);       
        setQuestionStage('answer');
      }, animations.stageOutDuration);
    }
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleRetake = () => {
    // Reset all quiz state
    setHasStarted(false);
    setCurrentQuestion(0);
    setScores({ bold: 0, balanced: 0, cautious: 0 });
    setShowResults(false);
    setResult(null);
    setQuestionStage('in');
    setBackgroundDim(false);
    setIsTransitioning(false);
    setShowQuizCard(false);
    setShowWhiteOverlay(false);
    setShowNarrative(false);
    setCurrentNarrativeIndex(0);
    setNarrativesComplete(false);
  };

  const getCurrentBackground = () => {
    if (showResults) {
      return backgrounds?.default || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
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

  // Results Page
  if (showResults && result) {
    return (
      <QuizResult 
        result={result} 
        onContinue={onComplete ? () => onComplete(result) : null}
        onRetake={handleRetake}
      />
    );
  }

  // Quiz Questions
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const narratives = currentQ?.narratives || (currentQ?.narrative ? [currentQ.narrative] : []);
  const currentNarrative = narratives[currentNarrativeIndex];

  return (
    <div 
      className={`quiz-container stage-${questionStage} ${backgroundDim ? 'dimmed' : ''} ${!animationsEnabled ? 'no-animation' : ''}`}
      style={getBackgroundStyle()}
    >
      {/* Narrative Card - shows current narrative in sequence */}
      {showNarrative && currentNarrative && (
        <div className={`narrative-card ${animationsEnabled ? 'animate' : ''}`}>
          <div className="narrative-emoji">{currentNarrative.emoji}</div>
          <p className="narrative-text">{currentNarrative.text}</p>
          {narratives.length > 1 && (
            <div className="narrative-progress">
              {narratives.map((_, idx) => (
                <div 
                  key={idx}
                  className={`narrative-dot ${idx === currentNarrativeIndex ? 'active' : ''} ${idx < currentNarrativeIndex ? 'completed' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* White overlay */}
      {showWhiteOverlay && animationsEnabled && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white',
            zIndex: 500
          }}
        />
      )}

      {/* Quiz Card - only show when NOT showing narrative */}
      {!showNarrative && (
        <div 
          className={`quiz-card transparent ${showQuizCard ? 'show-card' : 'hide-card'} stage-${questionStage} ${isTransitioning ? 'transitioning' : ''} ${!showCard ? 'force-hidden' : ''} ${hideQuestionCard ? 'force-hidden' : ''}`}
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
                  animationDelay: animationsEnabled ? `${idx * (animations.optionStagger / 1000)}s` : '0s'
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
      )}
    </div>
  );
};

export default PersonalityQuiz;