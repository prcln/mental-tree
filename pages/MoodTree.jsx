import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Droplets, MessageCircle, Star, Share2, RotateCcw, Apple, Store } from 'lucide-react';
import FruitInventory from '../components/Fruit/FruitInventory.jsx';
import TreeVisualization from '../components/MoodTree/TreeVisualization.jsx';
import HourlyEmotionLog from '../components/MoodTree/HourlyEmotionLog.jsx';
import SendEncouragement from '../components/MoodTree/SendEncouragement.jsx';
import TreeShare from '../components/MoodTree/TreeShare.jsx';
import RetakeQuizModal from '../components/Modal/QuizRetakeWarn/QuizRetakeWarning.jsx';
import MoodEncouragement from '../components/Modal/MoodEncouragementModal/MoodEncouragementModal.jsx';
import FruitTrade from '../components/Fruit/FruitTrade.jsx';

import './MoodTree.css';
import { messageService } from '../services/messageService.js';
import { cooldownService } from '../services/cooldownService.js';
import { emotionService } from '../services/emotionService.js';
import { realtimeService } from '../services/realtimeService.js';
import { fruitService } from '../services/fruitService.js';

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
  const [showTrade, setShowTrade] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryKey, setInventoryKey] = useState(0);

  // Check-in availability state
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [timeLeftMessage, setTimeLeftMessage] = useState('');

  const [canResetTree, setCanResetTree] = useState(true);
  const [timeLeftResetTree, setTimeLeftResetTree] = useState('');

  // Data state for messages
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Fruit state
  const [fruits, setFruits] = useState([]);
  const [collectedFruit, setCollectedFruit] = useState(null);

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

  // Function to load fruits
  const loadFruits = useCallback(async () => {
    if (!treeId) return;
    try {
      const data = await fruitService.getTreeFruits(treeId);
      setFruits(data);
    } catch (err) {
      console.error('Error loading fruits:', err);
    }
  }, [treeId]);

  // Check if user can check in
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

  
  // Effect to load messages and fruits when treeId changes
  useEffect(() => {
    loadMessages();
    loadFruits();
  }, [loadMessages, loadFruits]);

  // Real-time subscription
  useEffect(() => {
    if (!treeId) return;

    const channel = realtimeService.subscribeToTree(treeId, (type, payload) => {
      if (type === 'tree') {
        if (onTreeUpdate) {
          onTreeUpdate(payload.new);
        }
      } else if (type === 'message') {
        loadMessages();
      }
    });

    return () => {
      realtimeService.unsubscribeFromTree(channel);
    };
  }, [treeId, onTreeUpdate, loadMessages]);

  // --- Handlers ---

  const handleEmotionCheckIn = useCallback(async (moodData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const result = await emotionService.addEmotionCheckIn(treeId, moodData);
      
      if (onTreeUpdate) {
        onTreeUpdate(result.tree);
      }
      
      setCanCheckIn(false);
      setShowCheckIn(false);
      
      setLastEmotionLog(moodData);
      setShowEncouragement(true);
      
      checkCanCheckIn();
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert(error.message || 'Failed to save check-in. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [treeId, onTreeUpdate, checkCanCheckIn]);

  const handleNewMessage = useCallback(async (messageData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (!treeId) {
        throw new Error('No tree ID available');
      }

      messageData.sender_id = currentUserId || null;
      
      const result = await messageService.addMessage(treeId, messageData);
      
      if (onTreeUpdate) {
        onTreeUpdate(result.tree);
      }
      
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

  // Fruit collection handler
  const handleFruitCollect = useCallback(async (result) => {
    if (result?.fruit_type || result?.success) {
      const fruitType = result.fruit_type;
      setCollectedFruit(fruitType);
      
      setFruits(prevFruits => prevFruits.filter(f => f.id !== result.fruit_id));
      
      setTimeout(() => setCollectedFruit(null), 3000);
      
      setInventoryKey(prev => prev + 1);
      
      await loadFruits();
    }
  }, [loadFruits]);


  // --- Render Logic ---

  if (!treeData) {
    return <div className="mood-tree-loading">Loading your tree...</div>;
  }

  if (error) {
    return (
      <div className="mood-tree-error">
        <p>Error loading messages: {error}</p>
        <button onClick={loadMessages}>Retry</button>
      </div>
    );
  }

  return (
    <div className="mood-tree-container">
      <div className="mood-tree-header">
        <h1>
          ✨  {treeData.tree_type ? treeData.tree_type.charAt(0).toUpperCase() + treeData.tree_type.slice(1) : ''} Tree ✨
        </h1>
        <div className="tree-stats">
          <div className="stat">
            <Droplets size={18} />
            <span>{treeData.mood_score}</span>
          </div>
          <div className="stat">
            <MessageCircle size={18} />
            <span>{messages.length}</span>
          </div>
          <div className="stat">
            <Apple size={18} />
            <span>{fruits.length}</span>
          </div>
          <div className="stat stage-stat">
            <Star size={16} />
            <span>{stageNames[treeData.stage]}</span>
          </div>
        </div>
      </div>

      {/* Fruit collection notification */}
      {collectedFruit && (
        <div className="fruit-notification collect-notification">
          🎉 Collected {collectedFruit}!
        </div>
      )}

      <TreeVisualization 
        currentStage={treeData.stage || 'seed'}
        messages={messages}
        moodScore={treeData.mood_score}
        treeType={treeData.tree_type || 'oak'}
        currentUserId={currentUserId}
        treeId={treeId}
        fruits={fruits}
        onFruitCollect={handleFruitCollect}
        lastFruitSpawn={treeData.last_fruit_spawn}
      />

      {/* Tree Controls */}
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

      {/* Modals */}
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

      {/* Quick access buttons */}
      <div className="quick-access-buttons">
        <button 
          className="btn-quick-access"
          onClick={() => setShowInventory(true)}
          title="Inventory"
        >
          🎒
        </button>
        <button 
          className="btn-quick-access"
          onClick={() => setShowTrade(true)}
          title="Trade Market"
        >
          <Store size={20} />
        </button>
      </div>

      {/* Inventory modal */}
      {showInventory && (
        <FruitInventory
          key={inventoryKey}  
          userId={currentUserId}
          onClose={() => setShowInventory(false)}
        />
      )}

      {/* Trade modal */}
      {showTrade && (
        <FruitTrade
          userId={currentUserId}
          onClose={() => setShowTrade(false)}
          onTradeComplete={() => {
            setInventoryKey(prev => prev + 1);
            loadFruits();
          }}
        />
      )}
    </div>
  );
};

export default memo(MoodTree, (prevProps, nextProps) => {
  return (
    prevProps.treeId === nextProps.treeId &&
    prevProps.currentUserId === nextProps.userId &&
    prevProps.isOwner === nextProps.isOwner
  );
});