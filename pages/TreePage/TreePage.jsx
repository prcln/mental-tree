import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import MoodTree from '../MoodTree';
import supabaseService from '../../services/supabaseService';
import './TreePage.css';

const TreePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentTreeId, setCurrentTreeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserTree(user.id);
    }
  }, [user]);

  const loadUserTree = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const trees = await supabaseService.getUserTrees(userId);
      
      if (trees && trees.length > 0) {
        setCurrentTreeId(trees[0].id);
      } else {
        // Create a new tree for the user
        const newTree = await supabaseService.createTree(userId);
        setCurrentTreeId(newTree.id);
      }
    } catch (err) {
      console.error('Error loading user tree:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      />
    </div>
  );
};

export default TreePage;