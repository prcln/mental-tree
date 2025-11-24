import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalityQuiz from '../components/Quiz/Quiz';
import QuizResult from '../components/Quiz/QuizResult';
import './QuizPage.css';

const QuizPage = () => {
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showQuizCard, setShowQuizCard] = useState(true);

  useEffect(() => {
    // Check if user has permission to access quiz
    const quizAccess = sessionStorage.getItem('quizAccess');
    
    if (!quizAccess || (quizAccess !== 'firstTime' && quizAccess !== 'retake')) {
      // User doesn't have permission, redirect to tree page
      navigate('/tree', { replace: true });
    }
  }, [navigate]);

  const handleQuizComplete = (result) => {
    // Show result page first
    setQuizResult(result);
  };

  const handleContinue = () => {
    // Store result in sessionStorage (keep original structure)
    sessionStorage.setItem('quizResult', JSON.stringify(quizResult));
    
    // Clear quiz access permission
    sessionStorage.removeItem('quizAccess');
    
    // Navigate back to tree page
    navigate('/tree');
  };

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  const toggleQuizCard = () => {
    setShowQuizCard(!showQuizCard);
  };

  // Show result page
  if (quizResult) {
    return <QuizResult result={quizResult} onContinue={handleContinue} />;
  }

  return (
    <div className={`quiz-page ${!animationsEnabled ? 'no-animations' : ''}`}>
      <div className="quiz-controls">
        <button 
          onClick={toggleAnimations}
          className="control-btn animation-toggle-btn"
          title={animationsEnabled ? "Disable animations" : "Enable animations"}
        >
          {animationsEnabled ? "🎬" : "⏸️"}
        </button>
        <button 
          onClick={toggleQuizCard}
          className="control-btn card-toggle-btn"
          title={showQuizCard ? "Hide quiz card (view background)" : "Show quiz card"}
        >
          {showQuizCard ? "👁️" : "🖼️"}
        </button>
      </div>
      <PersonalityQuiz 
        onComplete={handleQuizComplete} 
        animationsEnabled={animationsEnabled}
        showCard={showQuizCard}
      />
    </div>
  );
};

export default QuizPage;