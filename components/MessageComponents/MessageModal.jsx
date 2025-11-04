import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import MessageActions from './MessageActions';
import RepliesList from './RepliesList';
import ReplyForm from './ReplyForm';
import { messageInteractionService } from '../../services/messageInteractionService';
import { userService } from '../../services/userService';

const MessageModal = ({ message, icon, index, currentUserId, onClose, onUpdate }) => {
  const [replies, setReplies] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [localLikes, setLocalLikes] = useState(message.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (message.id) {
      loadReplies();
      checkIfLiked();
    }
  }, [message.id]);

  const loadReplies = async () => {
    setIsLoadingReplies(true);
    try {
      const repliesData = await messageInteractionService.getMessageReplies(message.id);
      setReplies(repliesData);
    } catch (error) {
      console.error('Error loading replies:', error);
      setReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const checkIfLiked = async () => {
    if (!currentUserId) return;
    
    try {
      const liked = await messageInteractionService.hasUserLikedMessage(message.id, currentUserId);
      setHasLiked(liked);
    } catch (error) {
      console.error('Error checking like status:', error);
      setHasLiked(false);
    }
  };

  const handleLike = async (e) => {
    // Prevent event bubbling that might close modal
    e?.stopPropagation();
    
    if (!currentUserId) {
      alert('Please sign in to like messages');
      return;
    }

    // Optimistic update
    const previousLiked = hasLiked;
    const previousLikes = localLikes;
    
    setHasLiked(!hasLiked);
    setLocalLikes(hasLiked ? localLikes - 1 : localLikes + 1);

    try {
      const result = await messageInteractionService.toggleMessageLike(message.id, currentUserId);
      // Update with actual values from server
      setHasLiked(result.liked);
      setLocalLikes(result.likes);
      
      // Update parent component with new likes count
      if (onUpdate) {
        onUpdate({ likes: result.likes });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setHasLiked(previousLiked);
      setLocalLikes(previousLikes);
      alert('Failed to update like. Please try again.');
    }
  };

  const handleReplySubmit = async (replyText) => {
    if (!currentUserId) {
      alert('Please sign in to reply');
      return;
    }

    try {
      // Get user profile for optimistic update
      const userProfile = await userService.getUserProfile(currentUserId);
      const authorName = userProfile.display_name || userProfile.username || 'Anonymous';
      
      // Create optimistic reply
      const optimisticReply = {
        id: `temp-${Date.now()}`,
        message_id: message.id,
        user_id: currentUserId,
        author: authorName,
        text: replyText,
        created_at: new Date().toISOString(),
        isOptimistic: true
      };

      // Optimistic update
      setReplies([...replies, optimisticReply]);

      // Actual API call
      const newReply = await messageInteractionService.addMessageReply(message.id, {
        text: replyText,
        author: authorName,
        user_id: currentUserId
      });

      // Replace optimistic reply with real one
      setReplies(prevReplies => 
        prevReplies.map(r => 
          r.id === optimisticReply.id ? newReply : r
        )
      );
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error submitting reply:', error);
      // Remove optimistic reply on error
      setReplies(prevReplies => 
        prevReplies.filter(r => !r.isOptimistic)
      );
      throw error;
    }
  };

  const handleReplyDelete = async (replyId) => {
    // Optimistic update
    const replyToDelete = replies.find(r => r.id === replyId);
    setReplies(replies.filter(r => r.id !== replyId));

    try {
      await messageInteractionService.deleteMessageReply(replyId, currentUserId);
      // Notify parent if needed
      if (onUpdate) {
        onUpdate({ replyDeleted: true });
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      // Revert optimistic update on error
      if (replyToDelete) {
        setReplies(prevReplies => [...prevReplies, replyToDelete].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ));
      }
      throw error;
    }
  };

  const handleCopy = (e) => {
    // Prevent event bubbling that might close modal
    e?.stopPropagation();
    
    navigator.clipboard.writeText(`"${message.text}" - ${message.author}`);
    alert('Message copied to clipboard!');
  };

  const handleModalClick = (e) => {
    // Stop propagation to prevent closing when clicking inside modal
    e.stopPropagation();
  };

  const handleBackdropClick = (e) => {
    // Only close when clicking the backdrop itself
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{icon}</span>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Message #{index + 1}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  From {message.author}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Original Message */}
          <div className="p-6 border-b border-gray-100">
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-gray-800 text-lg leading-relaxed">
                "{message.text}"
              </p>
            </div>

            <MessageActions
              likes={localLikes}
              hasLiked={hasLiked}
              onLike={handleLike}
              onCopy={handleCopy}
            />
          </div>

          {/* Replies Section */}
          <div className="p-6">
            <RepliesList
              replies={replies}
              isLoading={isLoadingReplies}
              currentUserId={currentUserId}
              onDelete={handleReplyDelete}
            />

            <ReplyForm
              onSubmit={handleReplySubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;