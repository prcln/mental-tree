import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import MoodTree from '../MoodTree';
import PersonalityQuiz from '../../components/Quiz/Quiz';
import QuizResult from '../../components/Quiz/QuizResult';
import './TreePage.css';
import { userService } from '../../services/userService';
import { treeService } from '../../services/treeService';

const TreePage = () => {
  const { user, signOut } = useAuth();
  const currentUserId = user.id;
  const navigate = useNavigate();
  const [currentTreeId, setCurrentTreeId] = useState(null);
  const [currentTree, setCurrentTree] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [treeLoaded, setTreeLoaded] = useState(false);
  const [isRetakingQuiz, setIsRetakingQuiz] = useState(false);

  useEffect(() => {
    if (user && !treeLoaded) {
      initializeUserData(user.id);
    }
  }, [user, treeLoaded]);

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
          setShowQuiz(true);
        }
      } else {
        // Create a new tree for the user with their seed type
        const newTree = await treeService.createTree(currentUserId, profile.seed_type);
        setCurrentTreeId(newTree.id);
        setCurrentTree(newTree);
        setShowQuiz(true);
      }
      
      setTreeLoaded(true);
    } catch (err) {
      console.error('Error initializing user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (result) => {
    setQuizResult(result);
  };

  const handleStartTree = async () => {
    try {
      if (currentTreeId) {
        if (isRetakingQuiz) {
          // Reset tree with new tree type
          const updatedTree = await treeService.resetTree(currentTreeId, quizResult.treeType);
          setCurrentTree(updatedTree);
          
          // Update user profile seed type
          await userService.updateUserProfile(user.id, { 
            seed_type: quizResult.treeType 
          });
          
          setIsRetakingQuiz(false);
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
      setShowQuiz(false);
    } catch (err) {
      console.error('Error completing quiz:', err);
    }
  };

  const handleRetakeQuiz = () => {
    setIsRetakingQuiz(true);
    setShowQuiz(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  if (loading) {
    return (
      <div className="tree-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading your tree...</p>
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

  // Show quiz
  if (showQuiz && !quizResult) {
    return <PersonalityQuiz onComplete={handleQuizComplete} />;
  }

  // Show quiz result
  if (quizResult) {
    return (
      <QuizResult 
        result={quizResult} 
        onContinue={handleStartTree}
        isRetaking={isRetakingQuiz}
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
        userId={currentUserId}
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