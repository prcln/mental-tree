import { supabase } from "../supabase/client";
import { handleQueryError, fetchSingleRow } from "../utils/helpers";

export const userService = {
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
    return userService.updateUserProfile(userId, { seed_type: seedType });
  },

  incrementUserStats: async (userId, stat) => {
    if (!userId) return;

    try {
      const { data: profiles, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (fetchError) {
        console.error('Error fetching user profile:', fetchError);
        return;
      }

      if (!profiles?.length) {
        console.log('Skipping stats update - user profile not found');
        return;
      }

      const profile = profiles[0];
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          [stat]: (profile[stat] || 0) + 1,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();
      
      if (updateError) {
        console.error('Error updating user stats:', updateError);
        return;
      }

      if (!data?.length) {
        console.error('Stats update failed - no data returned');
        return;
      }

      console.log(`Successfully incremented ${stat} for user ${userId}`, data[0]);
      return data[0];
    } catch (error) {
      console.error('Error incrementing user stats:', error);
    }
  },

  getUserByUsername: async (username) => {
    return fetchSingleRow(
      supabase.from('user_profiles').select('*').eq('username', username),
      'getUserByUsername'
    );
  }
};