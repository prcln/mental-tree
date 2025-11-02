import { supabase } from '../supabase/client';

class SupabaseService {
  // ==================== TREE OPERATIONS ====================
  
  async createTree(userId, treeData = {}) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .insert([
          {
            user_id: userId,
            stage: 'seed',
            mood_score: 0,
            message_count: 0,
            is_public: true,
            completed_quiz: false,
            last_check_in: null,
            ...treeData
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tree:', error);
      throw error;
    }
  }

  async getTree(treeId) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('id', treeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting tree:', error);
      throw error;
    }
  }

  async updateTree(treeId, updates) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .update(updates)
        .eq('id', treeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tree:', error);
      throw error;
    }
  }

  async getUserTrees(userId) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user trees:', error);
      throw error;
    }
  }

  async markQuizCompleted(treeId) {
    try {
      const { data, error } = await supabase
        .from('trees')
        .update({ completed_quiz: true })
        .eq('id', treeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking quiz as completed:', error);
      throw error;
    }
  }

  // ==================== MOOD CHECK-IN OPERATIONS ====================
  
  async addMoodCheckIn(treeId, moodData) {
    try {
      // Insert check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('mood_check_ins')
        .insert([
          {
            tree_id: treeId,
            mood: moodData.mood,
            points: moodData.points,
            note: moodData.note || null
          }
        ])
        .select()
        .single();

      if (checkInError) throw checkInError;

      // Update tree score
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .select('mood_score')
        .eq('id', treeId)
        .single();

      if (treeError) throw treeError;

      const { data: updatedTree, error: updateError } = await supabase
        .from('trees')
        .update({
          mood_score: tree.mood_score + moodData.points,
          last_check_in: new Date().toISOString()
        })
        .eq('id', treeId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { checkIn, tree: updatedTree };
    } catch (error) {
      console.error('Error adding mood check-in:', error);
      throw error;
    }
  }

  async getMoodCheckIns(treeId, limitCount = 30) {
    try {
      const { data, error } = await supabase
        .from('mood_check_ins')
        .select('*')
        .eq('tree_id', treeId)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting mood check-ins:', error);
      throw error;
    }
  }

  // ==================== MESSAGE OPERATIONS ====================
  
  async addMessage(treeId, messageData) {
    try {
      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            tree_id: treeId,
            text: messageData.text,
            author: messageData.author,
            type: messageData.type,
            likes: 0
          }
        ])
        .select()
        .single();

      if (messageError) throw messageError;

      // Update tree score and message count
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .select('mood_score, message_count')
        .eq('id', treeId)
        .single();

      if (treeError) throw treeError;

      const { data: updatedTree, error: updateError } = await supabase
        .from('trees')
        .update({
          mood_score: tree.mood_score + 5,
          message_count: tree.message_count + 1
        })
        .eq('id', treeId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { message, tree: updatedTree };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async getMessages(treeId, limitCount = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('tree_id', treeId)
        .order('created_at', { ascending: true })
        .limit(limitCount);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async likeMessage(messageId) {
    try {
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('likes')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('messages')
        .update({ likes: message.likes + 1 })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error liking message:', error);
      throw error;
    }
  }

  // ==================== REALTIME SUBSCRIPTIONS ====================
  
  subscribeToTree(treeId, callback) {
    const channel = supabase
      .channel(`tree-${treeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trees',
          filter: `id=eq.${treeId}`
        },
        (payload) => {
          callback('tree', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `tree_id=eq.${treeId}`
        },
        (payload) => {
          callback('message', payload);
        }
      )
      .subscribe();

    return channel;
  }

  unsubscribeFromTree(channel) {
    supabase.removeChannel(channel);
  }
}

export default new SupabaseService();