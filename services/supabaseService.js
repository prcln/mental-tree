import { supabase } from "../supabase/client";

// ==================== HELPER FUNCTIONS ====================

const calculateStage = (moodScore) => {
  if (moodScore < 10) return 'seed';
  if (moodScore < 30) return 'sprout';
  if (moodScore < 60) return 'sapling';
  if (moodScore < 100) return 'young';
  if (moodScore < 150) return 'mature';
  return 'blooming';
};

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
    if (!canResetTree) {
      throw new Error('You can only reset your tree once every 24 hours');
    }

    // Get tree owner
    const tree = await supabaseService.getTree(treeId);

    // Delete all messages associated with this tree
    await supabase.from('messages').delete().eq('tree_id', treeId);

    // Reset the tree
    const { data, error } = await supabase
      .from('trees')
      .update({
        tree_type: newTreeType,
        mood_score: 0,
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

  addMoodCheckIn: async (treeId, moodData) => {
    // Check cooldown
    const { canCheckIn } = await supabaseService.canCheckIn(treeId);
    if (!canCheckIn) {
      throw new Error('You can only check in once per hour');
    }

    // Get current tree
    const currentTree = await fetchSingleRow(
      supabase.from('trees').select('mood_score, stage, user_id').eq('id', treeId),
      'addMoodCheckIn'
    );

    // Calculate new values
    const moodPoints = moodData.mood || 5;
    const newMoodScore = currentTree.mood_score + moodPoints;
    const newStage = calculateStage(newMoodScore);

    // Update tree
    const { data, error } = await supabase
      .from('trees')
      .update({
        mood_score: newMoodScore,
        stage: newStage,
        last_check_in: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', treeId)
      .select();

    if (error) handleQueryError(error, 'addMoodCheckIn update');

    // Update user stats (non-blocking)
    supabaseService.updateUserProfile(currentTree.user_id, {
      last_active: new Date().toISOString()
    }).catch(console.error);

    return { tree: data[0] };
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