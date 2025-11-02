import React, { useState, useEffect } from 'react';
import { Droplets, MessageCircle, Star } from 'lucide-react';
import TreeVisualization from '../components/MoodTree/TreeVisualization.jsx'
import DailyCheckIn from '../components/MoodTree/DailyCheckin.jsx'
import SendEncouragement from '../components/MoodTree/SendEncouragement.jsx'
import supabaseService from '../services/supabaseService';
import './MoodTree.css';

const MoodTree = ({ treeId, userId, isOwner = true }) => {
  const [treeData, setTreeData] = useState({
    stage: 'seed',
    mood_score: 0,
    messages: [],
    last_check_in: null
  });
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tree data
  useEffect(() => {
    loadTreeData();
  }, [treeId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!treeId) return;

    const channel = supabaseService.subscribeToTree(treeId, (type, payload) => {
      if (type === 'tree') {
        setTreeData(prev => ({ ...prev, ...payload.new }));
      } else if (type === 'message') {
        loadMessages();
      }
    });

    return () => {
      supabaseService.unsubscribeFromTree(channel);
    };
  }, [treeId]);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tree, messages] = await Promise.all([
        supabaseService.getTree(treeId),
        supabaseService.getMessages(treeId)
      ]);

      setTreeData({ ...tree, messages });
    } catch (err) {
      console.error('Error loading tree:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messages = await supabaseService.getMessages(treeId);
      setTreeData(prev => ({ ...prev, messages }));
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleMoodCheckIn = async (moodData) => {
    try {
      await supabaseService.addMoodCheckIn(treeId, moodData);
      await loadTreeData();
      setShowCheckIn(false);
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in. Please try again.');
    }
  };

  const handleNewMessage = async (messageData) => {
    try {
      await supabaseService.addMessage(treeId, messageData);
      await loadTreeData();
      setShowEncouragement(false);
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to send message. Please try again.');
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

  if (loading) {
    return <div className="mood-tree-loading">Loading your tree...</div>;
  }

  if (error) {
    return (
      <div className="mood-tree-error">
        <p>Error loading tree: {error}</p>
        <button onClick={loadTreeData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="mood-tree-container">
      <div className="mood-tree-header">
        <h1>✨ Your Mood Tree ✨</h1>
        <div className="tree-stats">
          <div className="stat">
            <Droplets size={20} />
            <span>{treeData.mood_score} growth points</span>
          </div>
          <div className="stat">
            <MessageCircle size={20} />
            <span>{treeData.messages.length} messages</span>
          </div>
        </div>
      </div>

      <div className="stage-label">
        <Star size={16} />
        <span>{stageNames[treeData.stage]}</span>
      </div>

      <TreeVisualization 
        stage={treeData.stage}
        messages={treeData.messages}
        moodScore={treeData.mood_score}
      />

      <div className="mood-tree-controls">
        {isOwner && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCheckIn(true)}
          >
            <Droplets size={18} />
            Daily Check-in
          </button>
        )}
        <button 
          className="btn btn-secondary"
          onClick={() => setShowEncouragement(true)}
        >
          <MessageCircle size={18} />
          Send Encouragement
        </button>
      </div>

      {showCheckIn && (
        <DailyCheckIn
          onSubmit={handleMoodCheckIn}
          onClose={() => setShowCheckIn(false)}
        />
      )}

      {showEncouragement && (
        <SendEncouragement
          onSubmit={handleNewMessage}
          onClose={() => setShowEncouragement(false)}
        />
      )}
    </div>
  );
};

export default MoodTree;