import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

import './Header.css';
import { userService } from '../../services/userService';
import { treeService } from '../../services/treeService';

function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTreeId, setCurrentTreeId] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  
  // Determine context
  const isViewingOtherTree = location.pathname.match(/^\/tree\/(.+)$/);
  const viewedUserId = isViewingOtherTree ? isViewingOtherTree[1] : null;

  // Load user profile when logged in
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Load viewed user's profile when viewing someone else's tree
  useEffect(() => {
    if (viewedUserId && viewedUserId !== user?.id) {
      loadViewedProfile(viewedUserId);
    } else {
      setViewingProfile(null);
    }
  }, [viewedUserId, user]);

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile(user.id);
      setUserProfile(profile);
      
      const trees = await treeService.getUserTrees(user.id);
      
      if (trees && trees.length > 0) {
        const tree = trees[0];
        setCurrentTreeId(tree.id);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadViewedProfile = async (userId) => {
    try {
      const profile = await supabaseService.getUserProfile(userId);
      setViewingProfile(profile);
    } catch (error) {
      console.error('Error loading viewed profile:', error);
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

  const handleReport = () => {
    navigate(`/report/${currentTreeId}`);
  };

  const handleHome = () => {
    navigate('/tree');
  };

  const handleGarden = () => {
    navigate('/garden');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  // Guest viewing someone else's tree (not logged in)
  if (!user && isViewingOtherTree) {
    return (
      <div className="tree-page-header">
        <div className="header-user-info">
          <span>Viewing {viewingProfile?.display_name || 'User'}'s Tree 🌳</span>
          {viewingProfile && (
            <span className="user-stats">
              🌳 {viewingProfile.total_trees_grown} trees grown • 
              💬 {viewingProfile.total_comments_received} encouragements received
            </span>
          )}
        </div>
        <div className="header-actions">
          <button className="report-btn" onClick={handleSignIn}>
            Sign In
          </button>
          <button className="sign-out-btn" onClick={handleSignUp}>
            Create Your Tree
          </button>
        </div>
      </div>
    );
  }

  // User not logged in (on other public pages)
  if (!user) {
    return (
      <div className="tree-page-header">
        <div className="header-user-info">
          <span>Welcome to MoodTree! 🌳</span>
        </div>
        <div className="header-actions">
          <button className="report-btn" onClick={handleSignIn}>
            Sign In
          </button>
          <button className="sign-out-btn" onClick={handleSignUp}>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Logged in user viewing someone else's tree
  if (user && isViewingOtherTree && viewedUserId !== user.id) {
    return (
      <div className="tree-page-header">
        <div className="header-user-info">
          <span>Viewing {viewingProfile?.display_name || 'User'}'s Tree 🌳</span>
          {viewingProfile && (
            <span className="user-stats">
              🌳 {viewingProfile.total_trees_grown} trees grown • 
              💬 {viewingProfile.total_comments_received} encouragements received
            </span>
          )}
        </div>
        <div className="header-actions">
          <button className="my-tree-btn" onClick={handleHome}>
            My Tree
          </button>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Logged in user on their own tree (default)
  return (
    <div className="tree-page-header">
      <div className="header-user-info">
        <span>Welcome, {userProfile?.display_name || 'User'}!</span>
        {userProfile && (
          <span className="user-stats">
            🌳 {userProfile.total_trees_grown} trees grown • 
            💬 {userProfile.total_comments_received} encouragements received
          </span>
        )}
      </div>
      <div className="header-actions">
        <button className="report-btn" onClick={handleGarden}>
            Garden
        </button>
        <button 
          className="my-tree-btn" onClick={handleHome}>
            My Tree
        </button>
        <button className="report-btn" onClick={handleReport}>
          Emotion Report
        </button>
        <button className="sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Header;