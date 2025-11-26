import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

import MoodTree from '../MoodTree';
import QuizResult from '../../components/Quiz/QuizResult';
import { Loading } from '../../components/Others/Loading';
import { userService } from '../../services/userService';
import { treeService } from '../../services/treeService';

import './TreePage.css';

const TreePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [currentTree, setCurrentTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [isProcessingQuizResult, setIsProcessingQuizResult] = useState(false);

  // Check for pending quiz result ONCE on mount
  useEffect(() => {
    const storedResult = sessionStorage.getItem('quizResult');
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setQuizResult(parsed);
      } catch (e) {
        console.error("Failed to parse quiz result", e);
        sessionStorage.removeItem('quizResult');
      }
    }
  }, []); // Empty deps - only run once

  // Fetch User Data and Tree
  const initializeUserData = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      // A. Load or Create Profile
      try {
        await userService.getUserProfile(userId);
      } catch (err) {
        await userService.createUserProfile(userId, {
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'User',
        });
      }

      // B. Load Trees
      const trees = await treeService.getUserTrees(userId);
      
      if (trees && trees.length > 0) {
        const tree = trees[0];
        setCurrentTree(tree);

        // C. Only redirect to quiz if:
        // - Quiz not completed
        // - No pending result
        // - Not currently processing a result
        const hasPendingResult = !!sessionStorage.getItem('quizResult');
        
        if (!tree.completed_quiz && !hasPendingResult && !isProcessingQuizResult) {
          console.log('Redirecting to quiz: Tree exists but quiz not done');
          navigate('/quiz');
          return;
        }
      } else {
        // D. No Tree - Create and go to Quiz
        console.log('No tree found, creating new and redirecting');
        await treeService.createTree(userId, 'greenapple', false);
        sessionStorage.setItem('quizAccess', 'firstTime');
        navigate('/quiz');
        return;
      }

    } catch (err) {
      console.error('Error loading tree data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, user, isProcessingQuizResult]);

  // Initialize ONLY when user changes and NOT processing quiz result
  useEffect(() => {
    if (user?.id && !isProcessingQuizResult && !quizResult) {
      initializeUserData(user.id);
    }
  }, [user?.id]); // Only depend on user.id

  // Handle User clicking "Continue" on Quiz Result
  const handleStartTree = async () => {
    console.log('🌳 handleStartTree called');
    
    if (!quizResult || !currentTree) {
      console.error('❌ Missing quizResult or currentTree', { quizResult, currentTree });
      return;
    }

    // Prevent re-entry
    if (isProcessingQuizResult) {
      console.log('⏸️ Already processing');
      return;
    }

    try {
      setIsProcessingQuizResult(true);
      console.log('🔄 Processing quiz result...');
      
      const isRetaking = sessionStorage.getItem('isRetakingQuiz') === 'true';
      let updatedTree;

      if (isRetaking) {
        console.log('🔄 Resetting tree');
        updatedTree = await treeService.resetTree(currentTree.id, quizResult.fruitType);
        
        await userService.updateUserProfile(user.id, { 
          seed_type: quizResult.fruitType,
          current_tree_id: updatedTree.id
        });
        
        sessionStorage.removeItem('isRetakingQuiz');
      } else {
        console.log('✅ Marking quiz completed');
        updatedTree = await treeService.markQuizCompleted(currentTree.id, quizResult.fruitType);
        
        await userService.updateUserProfile(user.id, { 
          seed_type: quizResult.fruitType,
          current_tree_id: currentTree.id
        });
      }

      console.log('✅ Tree updated successfully', updatedTree);

      // Update tree state
      setCurrentTree(updatedTree);
      
      // Clear quiz result - this will trigger the view change
      sessionStorage.removeItem('quizResult');
      sessionStorage.removeItem('justCompletedQuiz');
      setQuizResult(null);

      console.log('✅ All done! Showing tree now');

    } catch (err) {
      console.error('❌ Error starting tree:', err);
      setError(err.message);
    } finally {
      setIsProcessingQuizResult(false);
    }
  };

  const handleRetakeQuiz = () => {
    sessionStorage.setItem('quizAccess', 'retake');
    sessionStorage.setItem('isRetakingQuiz', 'true');
    navigate('/quiz');
  };

  // --- RENDER ---

  if (loading && !quizResult) {
    return <Loading message={t('common.loading')} size="full" />;
  }

  if (error) {
    return (
      <div className="tree-page-error">
        <p>{error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // PRIORITY 1: Show quiz result
  if (quizResult) {
    if (!quizResult.fruitInfo || !quizResult.fruitType) {
      return (
        <div className="tree-page-error">
          <p>Invalid quiz result data.</p>
          <button className="retry-btn" onClick={handleRetakeQuiz}>Retake Quiz</button>
        </div>
      );
    }

    return (
      <QuizResult 
        result={quizResult} 
        onContinue={handleStartTree}
        onRetake={handleRetakeQuiz}
        isRetaking={sessionStorage.getItem('isRetakingQuiz') === 'true'}
        isLoading={isProcessingQuizResult}
      />
    );
  }

  // PRIORITY 2: Show the Tree
  if (currentTree) {
    return (
      <div className='page-with-header'>
        <div className="tree-page">
          <MoodTree 
            treeId={currentTree.id}
            currentUserId={user.id}
            isOwner={true}
            treeData={currentTree}
            onTreeUpdate={setCurrentTree}
            onRetakeQuiz={handleRetakeQuiz}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default TreePage;