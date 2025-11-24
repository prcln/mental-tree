import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/useAuth';

import MoodTree from '../MoodTree';
import QuizResult from '../../components/Quiz/QuizResult';
import { Loading } from '../../components/Others/Loading';

import './TreePage.css';
import { userService } from '../../services/userService';
import { treeService } from '../../services/treeService';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

const TreePage = () => {
  const { user, signOut } = useAuth();
  const currentUserId = user.id;
  const navigate = useNavigate();
  const [currentTreeId, setCurrentTreeId] = useState(null);
  const [currentTree, setCurrentTree] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [treeLoaded, setTreeLoaded] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    if (user && !treeLoaded) {
      initializeUserData(user.id);
    }
  }, [user, treeLoaded]);

  // Check if returning from quiz with result
  useEffect(() => {
    const storedResult = sessionStorage.getItem('quizResult');
    if (storedResult) {
      setQuizResult(JSON.parse(storedResult));
      sessionStorage.removeItem('quizResult');
    }
  }, []);

  const initializeUserData = async (currentUserId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load or create user profile
      let profile;
      try {
        profile = await userService.getUserProfile(currentUserId);
      } catch (err) {
        // If profile doesn't exist, create it
        profile = await userService.createUserProfile(currentUserId, {
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'User',
          seed_type: 'oak'
        });
      }
      setUserProfile(profile);

      // Load user trees
      const trees = await treeService.getUserTrees(currentUserId);
      
      if (trees && trees.length > 0) {
        const tree = trees[0];
        setCurrentTreeId(tree.id);
        setCurrentTree(tree);
        
        // Check if user has completed the quiz
        if (!tree.completed_quiz) {
          // Navigate to quiz page for first time users
          sessionStorage.setItem('quizAccess', 'firstTime');
          navigate('/quiz');
        }
      } else {
        // Create a new tree for the user with their seed type
        const newTree = await treeService.createTree(currentUserId, profile.seed_type);
        setCurrentTreeId(newTree.id);
        setCurrentTree(newTree);
        // Navigate to quiz page for new users
        sessionStorage.setItem('quizAccess', 'firstTime');
        navigate('/quiz');
      }
      
      setTreeLoaded(true);
    } catch (err) {
      console.error('Error initializing user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTree = async () => {
    try {
      if (currentTreeId && quizResult) {
        const isRetaking = sessionStorage.getItem('isRetakingQuiz') === 'true';
        
        if (isRetaking) {
          // Reset tree with new tree type
          const updatedTree = await treeService.resetTree(currentTreeId, quizResult.treeType);
          setCurrentTree(updatedTree);
          
          // Update user profile seed type
          await userService.updateUserProfile(user.id, { 
            seed_type: quizResult.treeType 
          });
          
          sessionStorage.removeItem('isRetakingQuiz');
        } else {
          // First time completing quiz
          const updatedTree = await treeService.markQuizCompleted(currentTreeId, quizResult.treeType);
          setCurrentTree(updatedTree);
          
          // Update user profile seed type
          await userService.updateUserProfile(user.id, { 
            seed_type: quizResult.treeType 
          });
        }
      }
      setQuizResult(null);
    } catch (err) {
      console.error('Error completing quiz:', err);
    }
  };

  const handleRetakeQuiz = () => {
    // Set flag for retaking quiz
    sessionStorage.setItem('quizAccess', 'retake');
    sessionStorage.setItem('isRetakingQuiz', 'true');
    navigate('/quiz');
  };

  if (loading) {
    return (
      <div>
        <Loading message={t('common.loading')} size="full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="tree-page-error">
        <p>{error}</p>
        <button className="retry-btn" onClick={() => initializeUserData(user.id)}>
          Retry
        </button>
      </div>
    );
  }

  // Show quiz result
  if (quizResult) {
    return (
      <QuizResult 
        result={quizResult} 
        onContinue={handleStartTree}
        isRetaking={sessionStorage.getItem('isRetakingQuiz') === 'true'}
      />
    );
  }

  if (!currentTreeId) {
    return (
      <div className="tree-page-error">
        <p>Unable to load tree</p>
        <button className="retry-btn" onClick={() => initializeUserData(user.id)}>
          Create New Tree
        </button>
      </div>
    );
  }

  return (
    <div className='page-with-header'>
      <div className="tree-page">
        <MoodTree 
          treeId={currentTreeId}
          currentUserId={currentUserId}
          isOwner={true}
          treeData={currentTree}
          onTreeUpdate={setCurrentTree}
          onRetakeQuiz={handleRetakeQuiz}
        />
      </div>
    </div>
  );
};

export default TreePage;