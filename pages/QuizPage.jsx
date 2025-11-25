import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalityQuiz from '../components/Quiz/Quiz';
import QuizResult from '../components/Quiz/QuizResult';
import './QuizPage.css';

const QuizPage = () => {
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showQuestionCard, setShowQuestionCard] = useState(true);

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

  const handleRetake = () => {
    // Clear the quiz result to go back to quiz
    setQuizResult(null);
  };

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  const toggleQuestionCard = () => {
    setShowQuestionCard(!showQuestionCard);
  };

  // Show result page
  if (quizResult) {
    return (
      <QuizResult 
        result={quizResult} 
        onContinue={handleContinue}
        onRetake={handleRetake}
      />
    );
  }

  return (
    <div className={`quiz-page ${!animationsEnabled ? 'no-animations' : ''}`}>
      <div className="quiz-controls">
        <button 
          onClick={toggleQuestionCard}
          className="control-btn toggle-question-btn"
          title={showQuestionCard ? "Hide Question" : "Show Question"}
        >
          {showQuestionCard ? "🙈 Hide" : "👁️ Show"}
        </button>
        <button 
          onClick={toggleAnimations}
          className="control-btn animation-toggle-btn"
          title={animationsEnabled ? "Disable animations" : "Enable animations"}
        >
          {animationsEnabled ? "🎬" : "⏸️"}
        </button>
      </div>
      <PersonalityQuiz 
        onComplete={handleQuizComplete} 
        animationsEnabled={animationsEnabled}
        showCard={showQuestionCard}
      />
    </div>
  );
};

export default QuizPage;