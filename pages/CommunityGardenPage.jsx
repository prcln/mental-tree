import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Users, Heart, Flower2, Sparkles } from 'lucide-react';
import SendEncouragement from '../components/MoodTree/SendEncouragement.jsx';
import MessageDecoration from '../components/MessageComponents/MessageDecoration.jsx';
import { messageService } from '../services/messageService.js';
import { realtimeService } from '../services/realtimeService.js';
import { useLanguage } from '../contexts/LanguageContext/LanguageContext.jsx';
import { Loading } from '../components/Others/Loading.jsx';

import './CommunityGardenPage.css';
import { useAuth } from '../contexts/AuthContext/AuthContext.jsx';

const CommunityGarden = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isSubmittingRef = useRef(false);

  const { user } = useAuth();

  // TODO:Fix this into a constant list of positions
  const generateMessagePositions = (messageCount) => {
    const positions = [];
    const rows = Math.ceil(messageCount / 5);
    const messagesPerRow = Math.min(5, messageCount);
    
    for (let i = 0; i < messageCount; i++) {
      const row = Math.floor(i / messagesPerRow);
      const col = i % messagesPerRow;
      const rowCount = Math.min(messagesPerRow, messageCount - row * messagesPerRow);
      
      positions.push({
        x: 15 + (col * (70 / (rowCount - 1 || 1))),
        y: 20 + (row * 25)
      });
    }
    
    return positions;
  };

  const messagePositions = generateMessagePositions(messages.length);

  // Load messages - only called on initial mount
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messageService.getCommunityMessages();
      setMessages(data);
    } catch (err) {
      console.error('Error loading community messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount only
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription - optimized to only reload when NEW messages are added
  useEffect(() => {
    const channel = realtimeService.subscribeToCommunityGarden((payload) => {
      // Only reload for INSERT events (new messages)
      // For UPDATE events (likes/replies), let optimistic updates handle it
      if (payload.eventType === 'INSERT') {
        loadMessages();
      }
    });

    return () => {
      realtimeService.unsubscribeFromCommunityGarden(channel);
    };
  }, [loadMessages]);

  // Handle new message - with optimistic update
  const handleNewMessage = useCallback(async (messageData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      messageData.sender_id = user.id || null;
      
      // Optimistic update - add message immediately
      const optimisticMessage = {
        ...messageData,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        likes: 0,
        isOptimistic: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setShowMessageModal(false);

      // Send to server
      const newMessage = await messageService.addCommunityMessage(messageData);
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(m => m.id === optimisticMessage.id ? newMessage : m)
      );
    } catch (error) {
      console.error('Error adding message:', error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.isOptimistic));
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      isSubmittingRef.current = false;
    }
  }, [user.id]);

  // Update a specific message in the list (for likes/replies)
  const handleMessageUpdate = useCallback((messageId, updates) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    );
  }, []);

  if (loading) {
    return (
      <div>
      <Loading message={t('common.loading')} size="full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="garden-error">
        <p>Error: {error}</p>
        <button onClick={loadMessages} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="page-with-header">
    <div className="community-garden-container">
      {/* Sky Background */}
      <div className="garden-sky">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
      </div>

      {/* Header */}
      <div className="garden-header">
        <h1>🌸 Community Garden 🌸</h1>
        <p className="garden-subtitle">A shared space for hope, support, and positivity</p>
        
        <div className="garden-stats">
          <div className="stat">
            <Users size={20} />
            <span>{messages.length} messages</span>
          </div>
          <div className="stat">
            <Heart size={20} />
            <span>Growing together</span>
          </div>
        </div>
      </div>

      {/* Main Content - Messages on Grass */}
      <div className="garden-content">
        <div className="grass-field">

          {/* Messages using MessageDecoration component */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="no-messages">
                <Flower2 size={48} className="no-messages-icon" />
                <p>Be the first to plant a message in the garden!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageDecoration
                  key={message.id}
                  message={message}
                  position={messagePositions[index]}
                  index={index}
                  currentUserId={user.id}
                  onUpdate={(updates) => handleMessageUpdate(message.id, updates)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        className="fab-button"
        onClick={() => setShowMessageModal(true)}
      >
        <MessageCircle size={24} />
        <span>Leave a Message</span>
      </button>

      {/* Info Section */}
      <div className="garden-info">
        <p>💫 Share your thoughts, encouragement, or words of wisdom</p>
        <p>🌱 Every positive message helps our community garden bloom</p>
        <p>💖 Click on messages to like and reply</p>
      </div>
    </div>
      {/* Modal */}
      {showMessageModal && (
        <SendEncouragement
          onSubmit={handleNewMessage}
          onClose={() => setShowMessageModal(false)}
          isCommunityGarden={true}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};

export default CommunityGarden;