import { supabase } from "../supabase/client";
import { handleQueryError, fetchSingleRow } from "../utils/helpers";
import { userService } from "./userService";
import { cooldownService } from "./cooldownService";
import { messageService } from "./messageService";

export const treeService = {
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
      await treeService.linkTreeToUser(userId, tree.id);
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

  linkTreeToUser: async (userId, treeId) => {
    return userService.updateUserProfile(userId, { current_tree_id: treeId });
  },

  markQuizCompleted: async (treeId, treeType) => {
    return treeService.updateTree(treeId, {
      completed_quiz: true,
      tree_type: treeType
    });
  },

  resetTree: async (treeId, newTreeType = 'oak') => {
    // Check cooldown
    const { canResetTree } = await cooldownService.canResetTree(treeId);
    
    if (!canResetTree) {
      throw new Error('You can only reset your tree once every 24 hours');
    }

    // Get tree owner
    const tree = await treeService.getTree(treeId);

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
    userService.incrementUserStats(tree.user_id, 'total_trees_grown').catch(console.error);

    return data[0];
  },

  toggleTreePublic: async (treeId) => {
    const tree = await treeService.getTree(treeId);
    return treeService.updateTree(treeId, { is_public: !tree.is_public });
  },

  getTreeWithOwner: async (treeId) => {
    const tree = await treeService.getTree(treeId);
    let ownerProfile = null;

    try {
      ownerProfile = await userService.getUserProfile(tree.user_id);
    } catch (error) {
      console.error('Error loading owner profile:', error);
    }

    return { tree, ownerProfile };
  },

  getTreeStats: async (treeId) => {
    const [tree, messages] = await Promise.all([
      treeService.getTree(treeId),
      messageService.getMessages(treeId)
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