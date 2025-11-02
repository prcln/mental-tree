import React, { memo, useState, useEffect } from 'react';
import { Droplets, MessageCircle, Star } from 'lucide-react';
import TreeVisualization from '../components/MoodTree/TreeVisualization.jsx';
import DailyCheckIn from '../components/MoodTree/DailyCheckin.jsx';
import SendEncouragement from '../components/MoodTree/SendEncouragement.jsx';
import supabaseService from '../services/supabaseService';
import './MoodTree.css';

// Constant for stage names, taken from Code 1
const stageNames = {
  seed: 'Seed of Hope',
  sprout: 'New Beginning',
  sapling: 'Growing Strong',
  young: 'Reaching Higher',
  mature: 'Flourishing',
  blooming: 'Full Bloom'
};

const MoodTree = ({ treeId, userId, isOwner, treeData, onTreeUpdate }) => {
  // --- State ---
  
  // UI state for modals (from Code 1)
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const ONE_HOUR_MS = 60 * 60 * 1000;
  const STORAGE_KEY = `mood-tree-check-in-${treeId}`;
  const [canCheckIn, setCanCheckIn] = useState(true); 
  const [timeLeftMessage, setTimeLeftMessage] = useState('');

  // Data state for messages (managed internally, from Code 2)
  const [messages, setMessages] =useState([]);
  const [error, setError] = useState(null);
  
  // --- Data Loading ---

  // Function to load only messages
  const loadMessages = async () => {
    if (!treeId) return;
    try {
      setError(null);
      const data = await supabaseService.getMessages(treeId);
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    // This logic only needs to run for the tree's owner
    if (!isOwner) return;

    // Function to check the time
    const checkTimeout = () => {
      const lastCheckInTime = localStorage.getItem(STORAGE_KEY);

      if (!lastCheckInTime) {
        setCanCheckIn(true); // No record, so user can check in
        return;
      }

      const lastCheckInDate = new Date(parseInt(lastCheckInTime));
      const now = new Date();
      const timeDiff = now.getTime() - lastCheckInDate.getTime();

      if (timeDiff >= ONE_HOUR_MS) {
        // More than 1 hour has passed
        setCanCheckIn(true);
        setTimeLeftMessage('');
        localStorage.removeItem(STORAGE_KEY); // Clean up old key
      } else {
        // Still within the 1-hour window
        setCanCheckIn(false);
        const remainingMs = ONE_HOUR_MS - timeDiff;
        const minutes = Math.floor((remainingMs / 1000 / 60) % 60);
        const seconds = Math.floor((remainingMs / 1000) % 60);
        setTimeLeftMessage(`Wait ${minutes}m ${seconds}s`);
      }
    };

    // Run the check immediately on load
    checkTimeout();

    // Set up an interval to update the countdown every second
    const intervalId = setInterval(checkTimeout, 1000);

    // Cleanup: clear the interval when the component unmounts
    return () => clearInterval(intervalId);

  }, [isOwner, STORAGE_KEY]); // Re-run if the owner or treeId changes
  
  // Effect to load messages when treeId changes (from Code 2)
  useEffect(() => {
    loadMessages();
  }, [treeId]);

  // Real-time subscription (from Code 1, adapted for new data flow)
  useEffect(() => {
    if (!treeId) return;

    const channel = supabaseService.subscribeToTree(treeId, (type, payload) => {
      if (type === 'tree') {
        // When the tree changes, notify the PARENT (Code 2's pattern)
        if (onTreeUpdate) {
          onTreeUpdate(payload.new);
        }
      } else if (type === 'message') {
        // When a new message arrives, reload the messages list
        loadMessages();
        // An alternative: optimistically add the new message
        // setMessages(prev => [...prev, payload.new]);
      }
    });

    return () => {
      supabaseService.unsubscribeFromTree(channel);
    };
  }, [treeId, onTreeUpdate]); // Make sure to include onTreeUpdate

  // --- Handlers (from Code 2, with UI logic from Code 1) ---

  const handleMoodCheckIn = async (moodData) => {
    try {
      // 1. Call Supabase
      const result = await supabaseService.addMoodCheckIn(treeId, moodData);
      
      // 2. Notify parent of the updated tree (Code 2's pattern)
      if (onTreeUpdate) {
        onTreeUpdate(result.tree);
      }
      
      localStorage.setItem(STORAGE_KEY, new Date().getTime().toString());

      // Manually disable the button immediately
      setCanCheckIn(false);

      // 3. Close the modal (Code 1's UI logic)
      setShowCheckIn(false);
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in. Please try again.');
    }
  };

  const handleNewMessage = async (messageData) => {
    try {
      // 1. Call Supabase
      const result = await supabaseService.addMessage(treeId, messageData);
      
      // 3. Notify parent of the updated tree (e.g., new message count)
      if (onTreeUpdate) {
        onTreeUpdate(result.tree);
      }
      
      // 4. Close the modal (Code 1's UI logic)
      setShowEncouragement(false);
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

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

  // Full UI (from Code 1)
  return (
    <div className="mood-tree-container">
      <div className="mood-tree-header">
        <h1>✨ Your Mood Tree ✨</h1>
        <div className="tree-stats">
          <div className="stat">
            <Droplets size={20} />
            {/* Use treeData prop */}
            <span>{treeData.mood_score} growth points</span>
          </div>
          <div className="stat">
            <MessageCircle size={20} />
            {/* Use internal messages state */}
            <span>{messages.length} messages</span>
          </div>
        </div>
      </div>

      <div className="stage-label">
        <Star size={16} />
        {/* Use treeData prop */}
        <span>{stageNames[treeData.stage]}</span>
      </div>

      <TreeVisualization 
        stage={treeData.stage}
        messages={messages} // Pass internal messages state
        moodScore={treeData.mood_score}
      />

      <div className="mood-tree-controls">
        {isOwner && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCheckIn(true)}
            disabled={!canCheckIn}
          >
            <Droplets size={18} />
            {canCheckIn ? 'Daily Check-in' : timeLeftMessage}
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

      {/* Modals (from Code 1) */}
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

// Use the more thorough memoization from Code 2
export default memo(MoodTree, (prevProps, nextProps) => {
  return (
    prevProps.treeId === nextProps.treeId &&
    prevProps.userId === nextProps.userId &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.treeData?.mood_score === nextProps.treeData?.mood_score &&
    prevProps.treeData?.stage === nextProps.treeData?.stage
  );
});