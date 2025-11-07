import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client.js';
import { Droplets, MessageCircle, Star, Share2, RotateCcw, Apple, Store, Clock } from 'lucide-react';
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

  // Check-in availability state (now from database)
  const [canCheckIn, setCanCheckIn] = useState(true);
  const [timeLeftMessage, setTimeLeftMessage] = useState('');

  const [canResetTree, setCanResetTree] = useState(true);
  const [timeLeftResetTree, setTimeLeftResetTree] = useState('');

  // Data state for messages (managed internally)
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Fruit state
  const [fruits, setFruits] = useState([]);
  const [isSpawningFruits, setIsSpawningFruits] = useState(false);
  const [spawnMessage, setSpawnMessage] = useState('');
  const [collectedFruit, setCollectedFruit] = useState(null);

  // ✅ NEW: Fruit spawn timer state
  const [nextSpawnTime, setNextSpawnTime] = useState(null);
  const [spawnTimeMessage, setSpawnTimeMessage] = useState('');
  const [canSpawnNow, setCanSpawnNow] = useState(false);

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

  // ✅ NEW: Check next spawn time
  const checkNextSpawnTime = useCallback(async () => {
    if (!treeId || !isOwner) return;

    try {
      // Get tree data with last spawn time
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .select('stage, last_fruit_spawn, tree_type')
        .eq('id', treeId)
        .single();

      if (treeError) throw treeError;

      // Get spawn settings
      const { data: settings, error: settingsError } = await supabase
        .from('fruit_types')
        .select('spawn_probability')
        .eq('tree_stage', tree.stage)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // If no settings or interval is 0, spawning is disabled
      if (!settings || settings.spawn_interval_hours === 0) {
        setSpawnTimeMessage('Fruit spawning not available');
        setCanSpawnNow(false);
        return;
      }

      // Check current fruit count
      const fruitCount = fruits.length;
      
      if (fruitCount >= settings.max_fruits_per_tree) {
        setSpawnTimeMessage('Maximum fruits reached! Collect some first.');
        setCanSpawnNow(false);
        return;
      }

      // Calculate next spawn time
      if (!tree.last_fruit_spawn) {
        setSpawnTimeMessage('Ready to spawn fruits!');
        setCanSpawnNow(true);
        return;
      }

      const lastSpawnTime = new Date(tree.last_fruit_spawn).getTime();
      const intervalMs = settings.spawn_interval_hours * 60 * 60 * 1000;
      const nextSpawnTimeMs = lastSpawnTime + intervalMs;
      const timeLeft = nextSpawnTimeMs - Date.now();

      setNextSpawnTime(nextSpawnTimeMs);

      if (timeLeft <= 0) {
        setSpawnTimeMessage('Ready to spawn fruits!');
        setCanSpawnNow(true);
      } else {
        setCanSpawnNow(false);
        // Format time left
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        if (hours > 0) {
          setSpawnTimeMessage(`Next spawn in ${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setSpawnTimeMessage(`Next spawn in ${minutes}m ${seconds}s`);
        } else {
          setSpawnTimeMessage(`Next spawn in ${seconds}s`);
        }
      }
    } catch (err) {
      console.error('Error checking spawn time:', err);
    }
  }, [treeId, isOwner, fruits.length]);

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
    checkNextSpawnTime(); // ✅ Initial check

    const intervalId1 = setInterval(checkCanCheckIn, 1000);
    const intervalId2 = setInterval(checkCanResetTree, 1000);
    const intervalId3 = setInterval(checkNextSpawnTime, 1000); // ✅ Update every second

    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
      clearInterval(intervalId3);
    };
  }, [isOwner, checkCanCheckIn, checkCanResetTree, checkNextSpawnTime]);

  
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

  // Fruit spawn handler
  const handleSpawnFruits = useCallback(async () => {
    if (!treeId || isSpawningFruits) return;
    
    setIsSpawningFruits(true);
    setSpawnMessage('');

    try {
      const result = await fruitService.spawnFruits(treeId);
      const spawnCount = typeof result === 'number' ? result : result?.count || 0;
      
      if (spawnCount > 0) {
        setSpawnMessage(`✨ ${spawnCount} fruit(s) spawned!`);
        
        // Reload fruits from database to get the new spawned fruits
        await loadFruits();
        
        // Update inventory key to refresh inventory modal
        setInventoryKey(prev => prev + 1);

        // ✅ Recheck spawn time after spawning
        checkNextSpawnTime();
      } else {
        setSpawnMessage('No fruits spawned. Try again later!');
      }

      // Clear message after 3 seconds
      setTimeout(() => setSpawnMessage(''), 3000);
    } catch (error) {
      console.error('Error spawning fruits:', error);
      setSpawnMessage('❌ Failed to spawn fruits');
      setTimeout(() => setSpawnMessage(''), 3000);
    } finally {
      setIsSpawningFruits(false);
    }
  }, [treeId, isSpawningFruits, loadFruits, checkNextSpawnTime]);

  // Fruit collection handler
  const handleFruitCollect = useCallback(async (result) => {
    if (result?.fruit_type || result?.success) {
      const fruitType = result.fruit_type;
      setCollectedFruit(fruitType);
      
      // Immediately update fruits count for instant UI feedback
      setFruits(prevFruits => prevFruits.filter(f => f.id !== result.fruit_id));
      
      // Clear notification after 3 seconds
      setTimeout(() => setCollectedFruit(null), 3000);
      
      // Update inventory key to refresh inventory modal
      setInventoryKey(prev => prev + 1);
      
      // Reload fruits from database to ensure sync
      await loadFruits();

      // ✅ Recheck spawn time after collection
      checkNextSpawnTime();
    }
  }, [loadFruits, checkNextSpawnTime]);


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

      {/* ✅ NEW: Fruit Spawn Timer Section */}
      {isOwner && (
        <div className={`fruit-spawn-timer ${canSpawnNow ? 'ready' : ''}`}>
          <Clock size={16} />
          <span>{spawnTimeMessage}</span>
          {canSpawnNow && <span className="ready-indicator">🌟</span>}
        </div>
      )}

      {/* Fruit notifications */}
      {spawnMessage && (
        <div className="fruit-notification spawn-notification">
          {spawnMessage}
        </div>
      )}

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
            {/* DEV: Fruit spawn button */}
            <button 
              className="btn btn-fruit-spawn"
              onClick={handleSpawnFruits}
              disabled={isSpawningFruits || !canSpawnNow}
              title={canSpawnNow ? "Spawn fruits now" : spawnTimeMessage}
            >
              <Apple size={18} />
              {isSpawningFruits ? 'Spawning...' : canSpawnNow ? '✨ Spawn Fruits' : '⏳ Wait...'}
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

// Simplified memoization - only check if core IDs change
export default memo(MoodTree, (prevProps, nextProps) => {
  return (
    prevProps.treeId === nextProps.treeId &&
    prevProps.currentUserId === nextProps.userId &&
    prevProps.isOwner === nextProps.isOwner
  );
});