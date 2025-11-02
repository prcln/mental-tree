import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import PersonalityQuiz from '../../components/Quiz/Quiz';
import QuizResult from '../../components/Quiz/QuizResult';
import supabaseService from '../../services/supabaseService';
import './QuizPage.css';

const QuizPage = ({ isRetaking = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState(null);
  const [currentTreeId, setCurrentTreeId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserTree();
    }
  }, [user]);

  const checkUserTree = async () => {
    try {
      setLoading(true);
      const trees = await supabaseService.getUserTrees(user.id);
      
      if (trees && trees.length > 0) {
        setCurrentTreeId(trees[0].id);
        
        // If user already completed quiz and not retaking, redirect to tree
        if (trees[0].completed_quiz && !isRetaking) {
          navigate('/tree');
          return;
        }
      } else {
        // Create new tree for first-time users
        const newTree = await supabaseService.createTree(user.id);
        setCurrentTreeId(newTree.id);
      }
    } catch (err) {
      console.error('Error checking user tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (result) => {
    setQuizResult(result);
  };

  const handleStartTree = async () => {
    try {
      if (!currentTreeId) {
        console.error('No tree ID available');
        return;
      }

      if (isRetaking) {
        // Reset tree with new type
        await supabaseService.resetTree(currentTreeId, quizResult.treeType);
      } else {
        // Mark quiz as completed for first-time users
        await supabaseService.markQuizCompleted(currentTreeId, quizResult.treeType);
      }
      
      // Navigate to tree page
      navigate('/tree');
    } catch (err) {
      console.error('Error completing quiz:', err);
      alert('Failed to save quiz result. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="quiz-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show quiz result
  if (quizResult) {
    return (
      <QuizResult 
        result={quizResult} 
        onContinue={handleStartTree}
        isRetaking={isRetaking}
      />
    );
  }

  // Show quiz
  return <PersonalityQuiz onComplete={handleQuizComplete} />;
};

export default QuizPage;