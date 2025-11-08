import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Users, Heart, Flower2 } from 'lucide-react';
import SendEncouragement from '../components/MoodTree/SendEncouragement.jsx';
import MessageDecoration from '../components/MessageComponents/MessageDecoration.jsx';
import PaginationControls from '../components/Buttons/PaginationControls.jsx';
import { messageService } from '../services/messageService.js';
import { realtimeService } from '../services/realtimeService.js';
import { useLanguage } from '../contexts/LanguageContext/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext/AuthContext.jsx';
import { Loading } from '../components/Others/Loading.jsx';
import { usePagination, positionPresets } from '../utils/usePagination.jsx';

import grassField from '../src/assets/grassField.svg'
import './CommunityGardenPage.css';

const CommunityGarden = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isSubmittingRef = useRef(false);

  // Use pagination hook with dense garden layout
  const pagination = usePagination(messages, positionPresets.gardenDense);

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
        <p>{t('common.error')}: {error}</p>
        <button onClick={loadMessages} className="btn btn-primary">{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div className="page-with-header">
      <div className="community-garden-container">
        {/* Header */}
        <div className="garden-header">
          <h1>🌸 {t('garden.title')} 🌸</h1>
          <p className="garden-subtitle">{t('garden.subtitle')}</p>
          
          <div className="garden-stats">
            <div className="stat">
              <Users size={20} />
              <span>{messages.length} {t('garden.messages')}</span>
            </div>
            <div className="stat">
              <Heart size={20} />
              <span>{t('garden.growingTogether')}</span>
            </div>
            {pagination.totalPages > 1 && (
              <div className="stat pagination-stat">
                <span>{t('garden.page')} {pagination.currentPage + 1} {t('garden.of')} {pagination.totalPages}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Messages on Grass */}
        <div className="garden-content">
          <div className="grass-field">
            {/* SVG Background */}
            <img 
              src={grassField}
              alt="Grass field" 
              className="grass-field-svg"
            />

            {/* Messages using MessageDecoration component */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <Flower2 size={48} className="no-messages-icon" />
                  <p>{t('garden.noMessages')}</p>
                </div>
              ) : (
                pagination.visibleItems.map((message, index) => (
                  <MessageDecoration
                    key={message.id}
                    message={message}
                    position={pagination.currentPositions[index]}
                    index={pagination.startIdx + index}
                    currentUserId={user.id}
                    onUpdate={(updates) => handleMessageUpdate(message.id, updates)}
                  />
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              startIdx={pagination.startIdx}
              endIdx={pagination.endIdx}
              totalItems={pagination.totalItems}
              onNextPage={pagination.nextPage}
              onPrevPage={pagination.prevPage}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              variant="floating"
            />
          </div>
        </div>

        {/* Floating Action Button */}
        <button 
          className="fab-button"
          onClick={() => setShowMessageModal(true)}
        >
          <MessageCircle size={24} />
          <span>{t('garden.leaveMessage')}</span>
        </button>

        {/* Info Section */}
        <div className="garden-info">
          <p>{t('garden.info1')}</p>
          <p>{t('garden.info2')}</p>
          <p>{t('garden.info3')}</p>
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