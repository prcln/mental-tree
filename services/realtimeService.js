import { supabase } from "../supabase/client";
import { COMMUNITY_GARDEN_ID } from "../constants/tree";

export const realtimeService = {
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

  // Subscribe to community garden
  subscribeToCommunityGarden: (callback) => {
    const channel = supabase
      .channel('community-garden-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `tree_id=eq.${COMMUNITY_GARDEN_ID}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  },

  // Unsubscribe from community garden
  unsubscribeFromCommunityGarden: (channel) => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};