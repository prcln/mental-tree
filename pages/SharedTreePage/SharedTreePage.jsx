import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Lock } from 'lucide-react';
import MoodTree from '../MoodTree';

import './SharedTreePage.css';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { treeService } from '../../services/treeService';
import { userService } from '../../services/userService';

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
      
      const treeData = await treeService.getTree(treeId);
      
      // Check if tree is public
      if (!treeData.is_public) {
        setError('This tree is private and cannot be viewed.');
        return;
      }
      
      setTree(treeData);
      
      // Load owner's profile
      try {
        const profile = await userService.getUserProfile(treeData.user_id);
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
          <p>{t('common.loading')}</p>
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
            <h2>{t('shared.oops')}</h2>
            <p>{error}</p>
            <button className="home-btn" onClick={() => navigate('/')}>
              <Home size={18} />
              {t('shared.goToTree')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = user?.id === tree.user_id;
  const displayName = ownerProfile?.display_name || ownerProfile?.username || t('shared.someone');

  return (
    <div className='page-with-header'>
    <div className="shared-tree-page">
      <div className="shared-header">
        <button className="home-btn" onClick={() => navigate('/')}>
          <Home size={18} />
          {t('shared.myTree')}
        </button>
      </div>

      <div className="shared-banner">
        <div className="banner-content">
          <h1>🌳 {displayName}{t('shared.s')} {tree.tree_type ? tree.tree_type.charAt(0).toUpperCase() + tree.tree_type.slice(1) : ''} {t('shared.tree')}</h1>
          {!isOwner && (
            <p className="banner-subtitle">{t('shared.sendMessage')}</p>
          )}
          {isOwner && (
            <p className="banner-subtitle owner-notice">
            {t('shared.yourTree')}  
            </p>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="owner-warning">
          <span className="warning-icon">⚠️</span>
          <span>{t('shared.cannotSend')}</span>
        </div>
      )}

      <MoodTree 
        treeId={treeId}
        currentUserId={user?.id}
        isOwner={isOwner}
        treeData={tree}
        onTreeUpdate={setTree}
      />
    </div>
    </div>
  );
};

export default SharedTreePage;