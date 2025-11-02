import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import MoodTree from '../MoodTree';
import PersonalityQuiz from '../../components/Quiz/Quiz';
import QuizResult from '../../components/Quiz/QuizResult';
import supabaseService from '../../services/supabaseService';
import './TreePage.css';

const TreePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentTreeId, setCurrentTreeId] = useState(null);
  const [currentTree, setCurrentTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [treeLoaded, setTreeLoaded] = useState(false);

  useEffect(() => {
    // Only load tree once when user is available and tree hasn't been loaded
    if (user && !treeLoaded) {
      loadUserTree(user.id);
    }
  }, [user, treeLoaded]);

  const loadUserTree = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const trees = await supabaseService.getUserTrees(userId);
      
      if (trees && trees.length > 0) {
        const tree = trees[0];
        setCurrentTreeId(tree.id);
        setCurrentTree(tree);
        
        // Check if user has completed the quiz
        if (!tree.completed_quiz) {
          setShowQuiz(true);
        }
      } else {
        // Create a new tree for the user
        const newTree = await supabaseService.createTree(userId);
        setCurrentTreeId(newTree.id);
        setCurrentTree(newTree);
        setShowQuiz(true); // New users must do the quiz
      }
      
      setTreeLoaded(true); // Mark tree as loaded
    } catch (err) {
      console.error('Error loading user tree:', err);
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
      // Mark quiz as completed
      if (currentTreeId) {
        await supabaseService.markQuizCompleted(currentTreeId);
        setCurrentTree(prev => ({ ...prev, completed_quiz: true }));
      }
      setQuizResult(null);
      setShowQuiz(false);
    } catch (err) {
      console.error('Error marking quiz as completed:', err);
    }
  };

  const stageNames = {
    seed: 'Seed of Hope',
    sprout: 'New Beginning',
    sapling: 'Growing Strong',
    young: 'Reaching Higher',
    mature: 'Flourishing',
    blooming: 'Full Bloom'
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
        <button className="retry-btn" onClick={() => loadUserTree(user.id)}>
          Retry
        </button>
      </div>
    );
  }

  // Show quiz if not completed
  if (showQuiz && !quizResult) {
    return <PersonalityQuiz onComplete={handleQuizComplete} />;
  }

  // Show quiz result
  if (quizResult) {
    return <QuizResult result={quizResult} onContinue={handleStartTree} />;
  }

  // Show tree if quiz completed or no tree
  if (!currentTreeId) {
    return (
      <div className="tree-page-error">
        <p>Unable to load tree</p>
        <button className="retry-btn" onClick={() => loadUserTree(user.id)}>
          Create New Tree
        </button>
      </div>
    );
  }

  return (
    <div className="tree-page">
      <button className="sign-out-btn" onClick={handleSignOut}>
        Sign Out
      </button>

      <MoodTree 
        treeId={currentTreeId}
        userId={user.id}
        isOwner={true}
        treeData={currentTree}
        onTreeUpdate={setCurrentTree}
      />
    </div>
  );
};

export default TreePage;