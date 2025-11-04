import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Droplets, MessageCircle, Star, Share2, RotateCcw } from 'lucide-react';
import TreeVisualization from '../components/MoodTree/TreeVisualization.jsx';
import HourlyEmotionLog from '../components/MoodTree/HourlyEmotionLog.jsx';
import SendEncouragement from '../components/MoodTree/SendEncouragement.jsx';
import TreeShare from '../components/MoodTree/TreeShare.jsx';
import RetakeQuizModal from '../components/Modal/QuizRetakeWarn/QuizRetakeWarning.jsx';
import MoodEncouragement from '../components/Modal/MoodEncouragementModal/MoodEncouragementModal.jsx';

import './MoodTree.css';
import { messageService } from '../services/messageService.js';
import { cooldownService } from '../services/cooldownService.js';
import { emotionService } from '../services/emotionService.js';
import { realtimeService } from '../services/realtimeService.js';

// Constant for stage names
const stageNames = {
  seed: 'Seed of Hope',
  sprout: 'New Beginning',
  sapling: 'Growing Strong',
  young: 'Reaching Higher',
  mature: 'Flourishing',
  blooming: 'Full Bloom'
};

const MoodTree = ({ treeId, currentUserId, isOwner, treeData, onTreeUpdate, onRetakeQuiz }) => {
  // --- State ---
  const [lastEmotionLog, setLastEmotionLog] = useState(null);

  // UI state for modals
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  // Check-in availability state (now from database)
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [timeLeftMessage, setTimeLeftMessage] = useState('');

  const [canResetTree, setCanResetTree] = useState(true);
  const [timeLeftResetTree, setTimeLeftResetTree] = useState('');

  // Data state for messages (managed internally)
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Use ref to prevent double-submission
  const isSubmittingRef = useRef(false);
  
  // --- Data Loading ---

  // Function to load only messages
  const loadMessages = useCallback(async () => {
    if (!treeId) return;
    try {
      setError(null);
      const data = await messageService.getMessages(treeId);
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    }
  }, [treeId]);

  // Check if user can check in (from database)
  const checkCanCheckIn = useCallback(async () => {
    if (!isOwner || !treeId) return;
    
    try {
      const { canCheckIn: able, timeLeft } = await cooldownService.canCheckIn(treeId);
      setCanCheckIn(able);
      
      if (!able && timeLeft > 0) {
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setTimeLeftMessage(`Wait ${minutes}m ${seconds}s`);
      } else {
        setTimeLeftMessage('');
      }
    } catch (err) {
      console.error('Error checking check-in availability:', err);
    }
  }, [isOwner, treeId]);

  const checkCanResetTree = useCallback(async () => {
    if (!isOwner || !treeId) return;
    
    try {
      const { canResetTree: able, timeLeft } = await cooldownService.canResetTree(treeId);
      setCanResetTree(able);
      
      if (!able && timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60)); 
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)); 
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000); 
        setTimeLeftResetTree(`Wait ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeftResetTree('');
      }
    } catch (err) {
      console.error('Error checking reset availability:', err);
    }
  }, [isOwner, treeId]);

  // Effect for cooldown checks
  useEffect(() => {
    if (!isOwner) return;

    checkCanCheckIn();
    checkCanResetTree();

    const intervalId1 = setInterval(checkCanCheckIn, 1000);
    const intervalId2 = setInterval(checkCanResetTree, 1000);

    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
    };
  }, [isOwner, checkCanCheckIn, checkCanResetTree]);

  
  // Effect to load messages when treeId changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!treeId) return;

    const channel = realtimeService.subscribeToTree(treeId, (type, payload) => {
      if (type === 'tree') {
        // When the tree changes, notify the parent
        if (onTreeUpdate) {
          onTreeUpdate(payload.new);
        }
      } else if (type === 'message') {
        // When a new message arrives, reload the messages list
        loadMessages();
      }
    });

    return () => {
      realtimeService.unsubscribeFromTree(channel);
    };
  }, [treeId, onTreeUpdate, loadMessages]);

  // --- Handlers ---

  const handleEmotionCheckIn = useCallback(async (moodData) => {
    // Prevent double submission
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const result = await emotionService.addEmotionCheckIn(treeId, moodData);
      
      // Notify parent of the updated tree
      if (onTreeUpdate) {
        onTreeUpdate(result.tree);
      }
      
      // Immediately update the UI
      setCanCheckIn(false);
      setShowCheckIn(false);
      
      // Show encouragement message
      setLastEmotionLog(moodData);
      setShowEncouragement(true);
      
      // Recheck availability
      checkCanCheckIn();
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert(error.message || 'Failed to save check-in. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [treeId, onTreeUpdate, checkCanCheckIn]);

  const handleNewMessage = useCallback(async (messageData) => {
    // Prevent double submission
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      // Validate treeId before attempting to add message
      if (!treeId) {
        throw new Error('No tree ID available');
      }

      // Data from SendEncouragement already has the right structure
      // Just add sender_id if available
      messageData.sender_id = currentUserId || null;
      
      // Call Supabase - messageData already has: text, author, type, isEncouraging, sender_id
      const result = await messageService.addMessage(treeId, messageData);
      
      // Notify parent of the updated tree
      if (onTreeUpdate) {
        onTreeUpdate(result.tree);
      }
      
      // Close the modal
      setShowComment(false);
    } catch (error) {
      console.error('Error adding message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [treeId, currentUserId, onTreeUpdate]);

  const handleRetakeQuiz = useCallback(() => {
    if (onRetakeQuiz) {
      onRetakeQuiz();
    }
  }, [onRetakeQuiz]);

  // --- Render Logic ---

  // Main loading state: We wait for the parent to provide treeData
  if (!treeData) {
    return <div className="mood-tree-loading">Loading your tree...</div>;
  }

  // Error state (if messages fail to load)
  if (error) {
    return (
      <div className="mood-tree-error">
        <p>Error loading messages: {error}</p>
        <button onClick={loadMessages}>Retry</button>
      </div>
    );
  }

  // Full UI
  return (
    <div className="mood-tree-container">
      <div className="mood-tree-header">
        <h1>
          ✨  {treeData.tree_type ? treeData.tree_type.charAt(0).toUpperCase() + treeData.tree_type.slice(1) : ''} Tree ✨
        </h1>
        <div className="tree-stats">
          <div className="stat">
            <Droplets size={20} />
            <span>{treeData.mood_score} growth points</span>
          </div>
          <div className="stat">
            <MessageCircle size={20} />
            <span>{messages.length} messages</span>
          </div>
        </div>
      </div>

      <div className="stage-label-header">
        <Star size={16} />
        <span>{stageNames[treeData.stage]}</span>
      </div>

      <TreeVisualization 
        currentStage={treeData.stage || 'seed'}
        messages={messages}
        moodScore={treeData.mood_score}
        treeType={treeData.tree_type || 'oak'}
        currentUserId={currentUserId}
      />

      <div className="mood-tree-controls">
        {isOwner && (
          <>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCheckIn(true)}
              disabled={!canCheckIn}
            >
              <Droplets size={18} />
              {canCheckIn ? 'Log your emotion!' : timeLeftMessage}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowShare(true)}
            >
              <Share2 size={18} />
              Share Tree
            </button>
            <button 
              className="btn btn-tertiary"
              onClick={() => setShowRetakeModal(true)}
            >
              <RotateCcw size={18} />
              Renew Seed
            </button>
          </>
        )}
        {!isOwner && (
          <button 
            className="btn btn-secondary"
            onClick={() => setShowComment(true)}
          >
            <MessageCircle size={18} />
            Send Encouragement
          </button>
        )}
      </div>

      {/* Modals - Only render if showing */}
      {showCheckIn && (
        <HourlyEmotionLog
          onSubmit={handleEmotionCheckIn}
          onClose={() => setShowCheckIn(false)}
        />
      )}

      {showRetakeModal && (
        <RetakeQuizModal
          onConfirm={handleRetakeQuiz}
          onCancel={() => setShowRetakeModal(false)}
          timeLeftMessage={timeLeftResetTree}
          canRetake={canResetTree}
        />
      )}

      {showComment && (
        <SendEncouragement
          onSubmit={handleNewMessage}
          onClose={() => setShowComment(false)}
        />
      )}

      {showShare && (
        <TreeShare
          treeId={treeId}
          treeName={`My ${treeData.tree_type || ''} Tree`}
          onClose={() => setShowShare(false)}
        />
      )}

      {showEncouragement && lastEmotionLog && (
        <MoodEncouragement
          score={lastEmotionLog.score}
          hasContext={!!lastEmotionLog.context}
          onClose={() => setShowEncouragement(false)}
        />
      )}
    </div>
  );
};

// Simplified memoization - only check if core IDs change
export default memo(MoodTree, (prevProps, nextProps) => {
  return (
    prevProps.treeId === nextProps.treeId &&
    prevProps.currentUserId === nextProps.userId &&
    prevProps.isOwner === nextProps.isOwner
  );
});