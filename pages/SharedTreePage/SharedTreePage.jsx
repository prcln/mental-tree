import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Lock } from 'lucide-react';
import MoodTree from '../MoodTree';
import supabaseService from '../../services/supabaseService';
import './SharedTreePage.css';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

const SharedTreePage = () => {
  const { treeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSharedTree();
  }, [treeId]);

  const loadSharedTree = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const treeData = await supabaseService.getTree(treeId);
      
      // Check if tree is public
      if (!treeData.is_public) {
        setError('This tree is private and cannot be viewed.');
        return;
      }
      
      setTree(treeData);
      
      // Load owner's profile
      try {
        const profile = await supabaseService.getUserProfile(treeData.user_id);
        setOwnerProfile(profile);
      } catch (err) {
        console.error('Error loading owner profile:', err);
        // Continue even if profile fails to load
      }
    } catch (err) {
      console.error('Error loading shared tree:', err);
      setError('Tree not found or no longer available.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shared-tree-page">
        <div className="shared-loading">
          <div className="loading-spinner"></div>
          <p>Loading tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-tree-page">
        <div className="shared-error-container">
          <div className="shared-error">
            <div className="error-icon">
              <Lock size={48} />
            </div>
            <h2>😔 Oops!</h2>
            <p>{error}</p>
            <button className="home-btn" onClick={() => navigate('/')}>
              <Home size={18} />
              Go to Your Tree
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = user?.id === tree.user_id;
  const displayName = ownerProfile?.display_name || ownerProfile?.username || 'Someone';

  return (
    <div className="shared-tree-page">
      <div className="shared-header">
        <button className="home-btn" onClick={() => navigate('/')}>
          <Home size={18} />
          My Tree
        </button>
      </div>

      <div className="shared-banner">
        <div className="banner-content">
          <h1>🌳 {displayName}'s {tree.tree_type ? tree.tree_type.charAt(0).toUpperCase() + tree.tree_type.slice(1) : ''} Tree</h1>
          {!isOwner && (
            <p className="banner-subtitle">Send an encouraging message to help their tree grow!</p>
          )}
          {isOwner && (
            <p className="banner-subtitle owner-notice">
              ✨ This is your tree! Share this link with friends to receive encouragement.
            </p>
          )}
        </div>

        {ownerProfile && (
          <div className="owner-stats">
            <div className="stat-badge">
              <span className="stat-emoji">🌳</span>
              <span className="stat-value">{ownerProfile.total_trees_grown}</span>
              <span className="stat-label">Trees Grown</span>
            </div>
            <div className="stat-badge">
              <span className="stat-emoji">💬</span>
              <span className="stat-value">{ownerProfile.total_comments_received}</span>
              <span className="stat-label">Encouragements</span>
            </div>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="owner-warning">
          <span className="warning-icon">⚠️</span>
          <span>You cannot send messages to your own tree</span>
        </div>
      )}

      <MoodTree 
        treeId={treeId}
        userId={user?.id}
        isOwner={isOwner}
        treeData={tree}
        onTreeUpdate={setTree}
      />
    </div>
  );
};

export default SharedTreePage;