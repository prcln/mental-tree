import { supabase } from "../supabase/client";

export const messageInteractionService = {
  /**
   * Toggle like on a message
   * @param {string} messageId - The message ID
   * @param {string} userId - The user ID
   * @returns {Promise<{liked: boolean, likes: number}>}
   */
  toggleMessageLike: async (messageId, userId) => {
    if (!userId) throw new Error('User ID is required to like messages');

    try {
      // Check if user already liked this message
      const { data: existingLike } = await supabase
        .from('message_likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLike) {
        // Unlike: Remove the like
        const { error: deleteError } = await supabase
          .from('message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // Decrement likes count using RPC
        const { data: newLikesCount, error: updateError } = await supabase
          .rpc('decrement_message_likes', { message_id: messageId });

        if (updateError) throw updateError;

        // Ensure likes never go below 0
        const safeLikesCount = Math.max(0, newLikesCount || 0);

        return { liked: false, likes: safeLikesCount };
      } else {
        // Like: Add the like
        const { error: insertError } = await supabase
          .from('message_likes')
          .insert({ message_id: messageId, user_id: userId });

        if (insertError) throw insertError;

        // Increment likes count using RPC
        const { data: newLikesCount, error: updateError } = await supabase
          .rpc('increment_message_likes', { message_id: messageId });

        if (updateError) throw updateError;

        // Ensure likes is a valid number
        const safeLikesCount = Math.max(0, newLikesCount || 0);

        return { liked: true, likes: safeLikesCount };
      }
    } catch (error) {
      console.error('Error toggling message like:', error);
      throw error;
    }
  },

  /**
   * Check if user has liked a message
   * @param {string} messageId - The message ID
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>}
   */
  hasUserLikedMessage: async (messageId, userId) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('message_likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking message like:', error);
      return false;
    }
  },

  /**
   * Get all likes for a message
   * @param {string} messageId - The message ID
   * @returns {Promise<Array>}
   */
  getMessageLikes: async (messageId) => {
    try {
      const { data, error } = await supabase
        .from('message_likes')
        .select('*, user_profiles(username, display_name)')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message likes:', error);
      throw error;
    }
  },

  /**
   * Add a reply to a message
   * @param {string} messageId - The message ID
   * @param {object} replyData - Contains text, author, user_id
   * @returns {Promise<Object>}
   */
  addMessageReply: async (messageId, replyData) => {
    if (!messageId) throw new Error('Message ID is required');
    if (!replyData.text) throw new Error('Reply text is required');
    if (!replyData.author) throw new Error('Reply author is required');

    try {
      const { data, error } = await supabase
        .from('message_replies')
        .insert({
          message_id: messageId,
          user_id: replyData.user_id || null,
          author: replyData.author,
          text: replyData.text
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding message reply:', error);
      throw error;
    }
  },

  /**
   * Get all replies for a message
   * @param {string} messageId - The message ID
   * @returns {Promise<Array>}
   */
  getMessageReplies: async (messageId) => {
    try {
      const { data, error } = await supabase
        .from('message_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message replies:', error);
      throw error;
    }
  },

  /**
   * Delete a reply
   * @param {string} replyId - The reply ID
   * @param {string} userId - The user ID (must match reply owner)
   * @returns {Promise<boolean>}
   */
  deleteMessageReply: async (replyId, userId) => {
    try {
      // Verify ownership
      const { data: reply } = await supabase
        .from('message_replies')
        .select('user_id')
        .eq('id', replyId)
        .single();

      if (!reply || reply.user_id !== userId) {
        throw new Error('You can only delete your own replies');
      }

      const { error } = await supabase
        .from('message_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message reply:', error);
      throw error;
    }
  }
};