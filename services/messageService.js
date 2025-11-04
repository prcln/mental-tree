import { supabase } from "../supabase/client";
import { handleQueryError, fetchSingleRow } from "../utils/helpers";
import { calculateStage } from "./stageHelper";
import { userService } from "./userService";
import { COMMUNITY_GARDEN_ID } from "../constants/tree";

export const messageService = {
  getMessages: async (treeId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('tree_id', treeId)
      .order('created_at', { ascending: true });

    if (error) handleQueryError(error, 'getMessages');
    return data || [];
  },

  addMessage: async (treeId, messageData) => {
    if (!treeId) throw new Error('Tree ID is required');

    // Get tree owner
    const tree = await fetchSingleRow(
      supabase.from('trees').select('user_id, mood_score, stage').eq('id', treeId),
      'addMessage - fetch tree'
    );

    // Prevent self-messaging
    if (messageData.sender_id && tree.user_id === messageData.sender_id) {
      throw new Error("You cannot send messages to your own tree");
    }

    // Insert message
    const { data: messages, error: messageError } = await supabase
      .from('messages')
      .insert({
        tree_id: treeId,
        sender_id: messageData.sender_id || null,
        author: messageData.author || 'Anonymous',
        text: messageData.text,
        type: messageData.type || 'encouragement',
        is_encouraging: messageData.isEncouraging ?? true,
        likes: 0
      })
      .select();

    if (messageError) handleQueryError(messageError, 'addMessage - insert');
    if (!messages?.length) throw new Error('Message was not inserted');

    // Calculate new tree values
    const newMoodScore = tree.mood_score + 2;
    const newStage = calculateStage(newMoodScore);

    // Update tree
    const { data: updatedTrees, error: updateError } = await supabase
      .from('trees')
      .update({
        mood_score: newMoodScore,
        stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', treeId)
      .select();

    if (updateError) handleQueryError(updateError, 'addMessage - update tree');
    if (!updatedTrees?.length) throw new Error('Tree update failed');

    // Update stats (non-blocking)
    userService.incrementUserStats(tree.user_id, 'total_comments_received').catch(console.error);
    
    if (messageData.sender_id) {
      userService.incrementUserStats(messageData.sender_id, 'total_comments_given').catch(console.error);
    }

    return { message: messages[0], tree: updatedTrees[0] };
  },

  deleteMessage: async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) handleQueryError(error, 'deleteMessage');
    return true;
  },

  // Get community garden messages
  getCommunityMessages: async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        likes:message_likes(count),
        reply_count:message_replies(count)
      `)
      .eq('tree_id', COMMUNITY_GARDEN_ID)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    // Format the data to include counts
    return (data || []).map(msg => ({
      ...msg,
      likes: msg.likes?.[0]?.count || 0,
      reply_count: msg.reply_count?.[0]?.count || 0
    }));
  },

  // Add message to community garden
  addCommunityMessage: async (messageData) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        tree_id: COMMUNITY_GARDEN_ID,
        text: messageData.text,
        author: messageData.author || 'Anonymous',
        type: messageData.type || 'butterfly',
        sender_id: messageData.sender_id,
        is_encouraging: true // Always encouraging in community garden
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};