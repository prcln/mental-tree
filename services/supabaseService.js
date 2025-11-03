import { supabase } from "../supabase/client";
import { calculateStage } from "./stageHelper";

// Generic error handler for queries
const handleQueryError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  throw new Error(`${context}: ${error.message}`);
};

// Safe single row fetch (returns first row or throws meaningful error)
const fetchSingleRow = async (query, context) => {
  const { data, error } = await query;
  
  if (error) handleQueryError(error, context);
  if (!data || data.length === 0) throw new Error(`${context}: No data found`);
  
  return data[0];
};

// ==================== SUPABASE SERVICE ====================

const supabaseService = {
  // ==================== USER PROFILE METHODS ====================

  getUserProfile: async (userId) => {
    return fetchSingleRow(
      supabase.from('user_profiles').select('*').eq('user_id', userId),
      'getUserProfile'
    );
  },

  createUserProfile: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: profileData.username,
        display_name: profileData.display_name,
        seed_type: profileData.seed_type || 'oak',
        ...profileData
      })
      .select();

    if (error) handleQueryError(error, 'createUserProfile');
    return data[0];
  },

  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (error) handleQueryError(error, 'updateUserProfile');
    return data[0];
  },

  updateUserSeedType: async (userId, seedType) => {
    return supabaseService.updateUserProfile(userId, { seed_type: seedType });
  },

  linkTreeToUser: async (userId, treeId) => {
    return supabaseService.updateUserProfile(userId, { current_tree_id: treeId });
  },

  incrementUserStats: async (userId, stat) => {
    if (!userId) return;

    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (error || !profiles?.length) {
        console.log('Skipping stats update - user profile not found');
        return;
      }

      const profile = profiles[0];
      await supabase
        .from('user_profiles')
        .update({
          [stat]: (profile[stat] || 0) + 1,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error incrementing user stats:', error);
    }
  },

  getUserByUsername: async (username) => {
    return fetchSingleRow(
      supabase.from('user_profiles').select('*').eq('username', username),
      'getUserByUsername'
    );
  },

  // ==================== TREE METHODS ====================

  createTree: async (userId, treeType = 'oak') => {
    const { data, error } = await supabase
      .from('trees')
      .insert({
        user_id: userId,
        tree_type: treeType,
        mood_score: 0,
        stage: 'seed',
        is_public: false,
        completed_quiz: false,
        last_check_in: null
      })
      .select();

    if (error) handleQueryError(error, 'createTree');

    const tree = data[0];
    
    // Link tree to user profile (don't fail if this errors)
    try {
      await supabaseService.linkTreeToUser(userId, tree.id);
    } catch (linkError) {
      console.error('Error linking tree to user:', linkError);
    }

    return tree;
  },

  getTree: async (treeId) => {
    return fetchSingleRow(
      supabase.from('trees').select('*').eq('id', treeId),
      'getTree'
    );
  },

  getUserTrees: async (userId) => {
    const { data, error } = await supabase
      .from('trees')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) handleQueryError(error, 'getUserTrees');
    return data || [];
  },

  updateTree: async (treeId, updates) => {
    const { data, error } = await supabase
      .from('trees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', treeId)
      .select();

    if (error) handleQueryError(error, 'updateTree');
    return data[0];
  },

  markQuizCompleted: async (treeId, treeType) => {
    return supabaseService.updateTree(treeId, {
      completed_quiz: true,
      tree_type: treeType
    });
  },

  resetTree: async (treeId, newTreeType = 'oak') => {
    // Check cooldown
    const { canResetTree } = await supabaseService.canResetTree(treeId);
    console.log(treeId);
    if (!canResetTree) {
      throw new Error('You can only reset your tree once every 24 hours');
    }

    // Get tree owner
    const tree = await supabaseService.getTree(treeId);

    // Delete all messages associated with this tree
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('tree_id', treeId);

    if (deleteError) {
      console.error('Failed to delete messages:', deleteError);
      handleQueryError(deleteError, 'resetTree - delete messages');
    }

    // Reset the tree
    const { data, error } = await supabase
      .from('trees')
      .update({
        tree_type: newTreeType,
        mood_score: 0,
        message_count: 0,
        stage: 'seed',
        completed_quiz: true,
        last_check_in: null,
        last_reset_tree: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', treeId)
      .select();

    if (error) handleQueryError(error, 'resetTree');

    // Increment stats (non-blocking)
    supabaseService.incrementUserStats(tree.user_id, 'total_trees_grown').catch(console.error);

    return data[0];
  },

  toggleTreePublic: async (treeId) => {
    const tree = await supabaseService.getTree(treeId);
    return supabaseService.updateTree(treeId, { is_public: !tree.is_public });
  },

  // ==================== COOLDOWN METHODS ====================

  canResetTree: async (treeId) => {
    const tree = await fetchSingleRow(
      supabase.from('trees').select('last_reset_tree').eq('id', treeId),
      'canResetTree'
    );

    if (!tree.last_reset_tree) {
      return { canResetTree: true, timeLeft: 0 };
    }

    const timeDiff = Date.now() - new Date(tree.last_reset_tree).getTime();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours

    return timeDiff >= cooldownPeriod
      ? { canResetTree: true, timeLeft: 0 }
      : { canResetTree: false, timeLeft: cooldownPeriod - timeDiff };
  },

  canCheckIn: async (treeId) => {
    const tree = await fetchSingleRow(
      supabase.from('trees').select('last_check_in').eq('id', treeId),
      'canCheckIn'
    );

    if (!tree.last_check_in) {
      return { canCheckIn: true, timeLeft: 0 };
    }

    const timeDiff = Date.now() - new Date(tree.last_check_in).getTime();
    const cooldownPeriod = 60 * 60 * 1000; // 1 hour

    return timeDiff >= cooldownPeriod
      ? { canCheckIn: true, timeLeft: 0 }
      : { canCheckIn: false, timeLeft: cooldownPeriod - timeDiff };
  },

  // ==================== CHECK-IN METHODS ====================
  // EMOTION LOG METHODS
  /**
   * Add an emotion check-in
   * @param {string} treeId - The tree ID
   * @param {object} emotionData - Contains emotion_level, descriptions, impacts, context
   * @returns {Promise<{checkIn, tree}>}
   */
  async addEmotionCheckIn(treeId, emotionData) {
    try {
      // Check if user can check in (cooldown logic)
      const { canCheckIn } = await this.canCheckIn(treeId);
      if (!canCheckIn) {
        throw new Error('Please wait before checking in again');
      }

      // Calculate points based on emotion level
      // Higher emotions give more points
      const points = emotionData.score

      // Insert emotion check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('emotion_check_ins')
        .insert({
          tree_id: treeId,
          emotion_level: emotionData.emotion_level,
          descriptions: emotionData.descriptions || [],
          impacts: emotionData.impacts || [],
          context: emotionData.context || null,
          score: points
        })
        .select()
        .single();

      if (checkInError) throw checkInError;

      // First, get the current tree data
      const { data: currentTree, error: fetchError } = await supabase
        .from('trees')
        .select('mood_score, stage')
        .eq('id', treeId)
        .single();

      if (fetchError) throw fetchError;

      // Update tree's mood score and last check-in time
      const newMoodScore = currentTree.mood_score + points;
      
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .update({
          mood_score: newMoodScore,
          last_check_in: new Date().toISOString()
        })
        .eq('id', treeId)
        .select()
        .single();

      if (treeError) throw treeError;

      // Calculate new stage based on updated mood score
      const newStage = calculateStage(tree.mood_score);
      
      // Update stage if it changed
      if (newStage !== tree.stage) {
        const { data: updatedTree, error: stageError } = await supabase
          .from('trees')
          .update({ stage: newStage })
          .eq('id', treeId)
          .select()
          .single();

        if (stageError) throw stageError;
        return { checkIn, tree: updatedTree };
      }

      return { checkIn, tree };
    } catch (error) {
      console.error('Error adding emotion check-in:', error);
      throw error;
    }
  },

  /**
   * Get emotion check-ins for a tree
   * @param {string} treeId - The tree ID
   * @param {number} limit - Number of check-ins to fetch
   * @returns {Promise<Array>}
   */
  async getEmotionCheckIns(treeId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('tree_id', treeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching emotion check-ins:', error);
      throw error;
    }
  },

  /**
   * Get daily emotion summary
   * @param {string} treeId - The tree ID
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>}
   */
  async getDailyEmotionSummary(treeId, startDate, endDate) {
    try {
      // Ensure treeId is a string
      const treeIdString = typeof treeId === 'string' ? treeId : treeId?.id || String(treeId);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('tree_id', treeIdString)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData = {};
      
      (data || []).forEach(checkIn => {
        const date = new Date(checkIn.created_at).toISOString().split('T')[0];
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            checkIns: [],
            totalEmotion: 0,
            count: 0,
            descriptions: new Set(),
            impacts: new Set()
          };
        }

        dailyData[date].checkIns.push(checkIn);
        dailyData[date].totalEmotion += checkIn.emotion_level;
        dailyData[date].count += 1;

        // Collect unique descriptions and impacts
        if (checkIn.descriptions) {
          checkIn.descriptions.forEach(desc => dailyData[date].descriptions.add(desc));
        }
        if (checkIn.impacts) {
          checkIn.impacts.forEach(impact => dailyData[date].impacts.add(impact));
        }
      });

      // Convert to array and calculate averages
      return Object.values(dailyData).map(day => ({
        date: day.date,
        checkCount: day.count,
        avgEmotion: day.totalEmotion / day.count,
        checkIns: day.checkIns,
        descriptions: Array.from(day.descriptions),
        impacts: Array.from(day.impacts)
      }));
    } catch (error) {
      console.error('Error fetching daily emotion summary:', error);
      throw error;
    }
  },

  /**
   * Get monthly emotion summary
   * @param {string} treeId - The tree ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>}
   */
  async getMonthlyEmotionSummary(treeId, year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('tree_id', treeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          year,
          month,
          checkCount: 0,
          avgEmotion: 0,
          maxEmotion: 0,
          minEmotion: 0,
          mostCommonDescriptions: [],
          mostCommonImpacts: [],
          checkIns: []
        };
      }

      // Calculate statistics
      const emotions = data.map(c => c.emotion_level);
      const totalEmotion = emotions.reduce((sum, e) => sum + e, 0);
      
      // Count descriptions and impacts
      const descriptionCounts = {};
      const impactCounts = {};

      data.forEach(checkIn => {
        if (checkIn.descriptions) {
          checkIn.descriptions.forEach(desc => {
            descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
          });
        }
        if (checkIn.impacts) {
          checkIn.impacts.forEach(impact => {
            impactCounts[impact] = (impactCounts[impact] || 0) + 1;
          });
        }
      });

      // Get top 5 most common
      const topDescriptions = Object.entries(descriptionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([desc, count]) => ({ description: desc, count }));

      const topImpacts = Object.entries(impactCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([impact, count]) => ({ impact, count }));

      return {
        year,
        month,
        checkCount: data.length,
        avgEmotion: totalEmotion / data.length,
        maxEmotion: Math.max(...emotions),
        minEmotion: Math.min(...emotions),
        mostCommonDescriptions: topDescriptions,
        mostCommonImpacts: topImpacts,
        checkIns: data
      };
    } catch (error) {
      console.error('Error fetching monthly emotion summary:', error);
      throw error;
    }
  },

  // ==================== MESSAGE METHODS ====================

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
    supabaseService.incrementUserStats(tree.user_id, 'total_comments_received').catch(console.error);
    
    if (messageData.sender_id) {
      supabaseService.incrementUserStats(messageData.sender_id, 'total_comments_given').catch(console.error);
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

  // ==================== REAL-TIME SUBSCRIPTION ====================

  subscribeToTree: (treeId, callback) => {
    const channel = supabase
      .channel(`tree-${treeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trees',
        filter: `id=eq.${treeId}`
      }, (payload) => callback('tree', payload))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `tree_id=eq.${treeId}`
      }, (payload) => callback('message', payload))
      .subscribe();

    return channel;
  },

  unsubscribeFromTree: (channel) => {
    if (channel) supabase.removeChannel(channel);
  },

  // ==================== UTILITY METHODS ====================

  getTreeWithOwner: async (treeId) => {
    const tree = await supabaseService.getTree(treeId);
    let ownerProfile = null;

    try {
      ownerProfile = await supabaseService.getUserProfile(tree.user_id);
    } catch (error) {
      console.error('Error loading owner profile:', error);
    }

    return { tree, ownerProfile };
  },

  getTreeStats: async (treeId) => {
    const [tree, messages] = await Promise.all([
      supabaseService.getTree(treeId),
      supabaseService.getMessages(treeId)
    ]);

    return {
      treeId,
      stage: tree.stage,
      moodScore: tree.mood_score,
      totalMessages: messages.length,
      isPublic: tree.is_public,
      treeType: tree.tree_type,
      createdAt: tree.created_at,
      lastCheckIn: tree.last_check_in
    };
  }
};

export default supabaseService;