import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalityQuiz from '../components/Quiz/Quiz';
import './QuizPage.css';

const QuizPage = () => {
  const navigate = useNavigate();
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showQuestionCard, setShowQuestionCard] = useState(true);

  useEffect(() => {
    // Check if user has permission to access quiz
    const quizAccess = sessionStorage.getItem('quizAccess');
    
    if (!quizAccess || (quizAccess !== 'firstTime' && quizAccess !== 'retake' && quizAccess !== 'resume')) {
      // User doesn't have permission, redirect to tree page
      navigate('/tree', { replace: true });
    }
  }, [navigate]);

  const handleQuizComplete = (result) => {
    console.log('Quiz completed, storing result and navigating to tree');
    
    // Store result in sessionStorage
    sessionStorage.setItem('quizResult', JSON.stringify(result));
    
    // Clear quiz access permission
    sessionStorage.removeItem('quizAccess');
    
    // Navigate to tree page immediately - TreePage will show the result
    navigate('/tree');
  };

  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
  };

  const toggleQuestionCard = () => {
    setShowQuestionCard(!showQuestionCard);
  };

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