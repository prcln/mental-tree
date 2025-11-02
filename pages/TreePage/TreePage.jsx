import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import MoodTree from '../MoodTree';
import supabaseService from '../../services/supabaseService';
import './TreePage.css';

const TreePage = ({ currentUser }) => {
  const [currentTreeId, setCurrentTreeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadUserTree(currentUser.id);
    } else {
      createDemoTree();
    }
  }, [currentUser]);

  const loadUserTree = async (userId) => {
    try {
      setLoading(true);
      const trees = await supabaseService.getUserTrees(userId);
      
      if (trees && trees.length > 0) {
        setCurrentTreeId(trees[0].id);
      } else {
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

  const createDemoTree = async () => {
    try {
      setLoading(true);
      let demoTreeId = localStorage.getItem('demoTreeId');
      
      if (demoTreeId) {
        try {
          await supabaseService.getTree(demoTreeId);
          setCurrentTreeId(demoTreeId);
          setLoading(false);
          return;
        } catch (error) {
          localStorage.removeItem('demoTreeId');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const newTree = await supabaseService.createTree(user, {
        is_public: true
      });
      
      setCurrentTreeId(newTree.id);
      localStorage.setItem('demoTreeId', newTree.id);
    } catch (err) {
      console.error('Error creating demo tree:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('demoTreeId');
      window.location.reload();
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

  if (error || !currentTreeId) {
    return (
      <div className="tree-page-error">
        <p>{error || 'Unable to load tree'}</p>
        <button className="retry-btn" onClick={() => createDemoTree()}>
          Create Demo Tree
        </button>
      </div>
    );
  }

  return (
    <div className="tree-page">
      {currentUser && (
        <button className="sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      )}

      <MoodTree 
        treeId={currentTreeId}
        userId={currentUser?.id || 'demo'}
        isOwner={true}
      />
    </div>
  );
};

export default TreePage;