import { supabase } from "../supabase/client";

export const fruitService = {
  /**
   * Get all fruits for a tree
   * If userId provided, verify ownership. Otherwise return empty for non-owners.
   */
  getTreeFruits: async (treeId, userId = null) => {
    // If userId provided, verify ownership
    if (userId) {
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .select('user_id')
        .eq('id', treeId)
        .single();

      if (treeError) throw treeError;
      
      // Only owner can see their fruits
      if (tree.user_id !== userId) {
        return [];
      }
    }

    const { data, error } = await supabase
      .from('tree_fruits')
      .select('*')
      .eq('tree_id', treeId)
      .eq('is_collected', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Spawn fruits on a tree
   */
  spawnFruits: async (treeId) => {
    const { data, error } = await supabase
      .rpc('spawn_tree_fruits', { p_tree_id: treeId });

    if (error) throw error;
    return data;
  },

  /**
   * Collect a fruit (owner only)
   */
  collectFruit: async (fruitId, userId) => {
    // Verify ownership before collecting
    const { data: fruit, error: fruitError } = await supabase
      .from('tree_fruits')
      .select(`
        *,
        tree:trees(user_id)
      `)
      .eq('id', fruitId)
      .single();

    if (fruitError) throw fruitError;

    // Check if user owns the tree
    if (fruit.tree.user_id !== userId) {
      throw new Error('You can only collect fruits from your own trees');
    }

    const { data, error } = await supabase
      .rpc('collect_fruit', { 
        p_fruit_id: fruitId, 
        p_user_id: userId 
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get user's fruit inventory
   */
  getUserInventory: async (userId) => {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_type', 'fruit')
      .order('item_name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all available collectibles
   */
  getCollectibles: async () => {
    const { data, error } = await supabase
      .from('collectibles')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get user's collectibles
   */
  getUserCollectibles: async (userId) => {
    const { data, error } = await supabase
      .from('user_collectibles')
      .select(`
        *,
        collectible:collectibles(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Exchange fruits for a collectible
   */
  exchangeForCollectible: async (userId, collectibleId) => {
    try {
      const { data: collectible, error: collectibleError } = await supabase
        .from('collectibles')
        .select('*')
        .eq('id', collectibleId)
        .single();

      if (collectibleError) throw collectibleError;

      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'fruit');

      if (inventoryError) throw inventoryError;

      const exchangeCost = collectible.exchange_cost;
      const userFruits = {};
      inventory.forEach(item => {
        userFruits[item.item_name] = item.quantity;
      });

      for (const [fruitType, required] of Object.entries(exchangeCost)) {
        if ((userFruits[fruitType] || 0) < required) {
          throw new Error(`Not enough ${fruitType}s. Need ${required}, have ${userFruits[fruitType] || 0}`);
        }
      }

      for (const [fruitType, required] of Object.entries(exchangeCost)) {
        const { error: deductError } = await supabase
          .from('user_inventory')
          .update({ 
            quantity: userFruits[fruitType] - required 
          })
          .eq('user_id', userId)
          .eq('item_type', 'fruit')
          .eq('item_name', fruitType);

        if (deductError) throw deductError;
      }

      const { data: newCollectible, error: addError } = await supabase
        .from('user_collectibles')
        .insert({
          user_id: userId,
          collectible_id: collectibleId,
          quantity: 1
        })
        .select(`
          *,
          collectible:collectibles(*)
        `)
        .single();

      if (addError) {
        if (addError.code === '23505') {
          const { data: updated, error: updateError } = await supabase
            .from('user_collectibles')
            .update({ 
              quantity: supabase.raw('quantity + 1')
            })
            .eq('user_id', userId)
            .eq('collectible_id', collectibleId)
            .select(`
              *,
              collectible:collectibles(*)
            `)
            .single();

          if (updateError) throw updateError;
          return updated;
        }
        throw addError;
      }

      return newCollectible;
    } catch (error) {
      console.error('Error exchanging for collectible:', error);
      throw error;
    }
  },

  /**
   * Create a trade offer
   */
  createTradeOffer: async (userId, offeredFruits, requestedFruits) => {
    try {
      // Verify user has the fruits they're offering
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'fruit');

      if (inventoryError) throw inventoryError;

      const userFruits = {};
      inventory.forEach(item => {
        userFruits[item.item_name] = item.quantity;
      });

      for (const [fruitType, quantity] of Object.entries(offeredFruits)) {
        if ((userFruits[fruitType] || 0) < quantity) {
          throw new Error(`Not enough ${fruitType}s to offer`);
        }
      }

      // Create trade offer
      const { data, error } = await supabase
        .from('trade_offers')
        .insert({
          user_id: userId,
          offered_fruits: offeredFruits,
          requested_fruits: requestedFruits,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating trade offer:', error);
      throw error;
    }
  },

  /**
   * Get all open trade offers (excluding user's own offers)
   */
  getTradeOffers: async (userId) => {
    const { data, error } = await supabase
      .from('trade_offers')
      .select(`
        *,
        user:user_profiles!trade_offers_user_id_fkey(username, user_id)
      `)
      .eq('status', 'open')
      .neq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get user's own trade offers
   */
  getUserTradeOffers: async (userId) => {
    const { data, error } = await supabase
      .from('trade_offers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Accept a trade offer
   */
  acceptTradeOffer: async (tradeId, acceptingUserId) => {
    try {
      // Get trade offer details
      const { data: trade, error: tradeError } = await supabase
        .from('trade_offers')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (tradeError) throw tradeError;

      if (trade.status !== 'open') {
        throw new Error('Trade offer is no longer available');
      }

      // Verify accepting user has the requested fruits
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', acceptingUserId)
        .eq('item_type', 'fruit');

      if (inventoryError) throw inventoryError;

      const userFruits = {};
      inventory.forEach(item => {
        userFruits[item.item_name] = item.quantity;
      });

      for (const [fruitType, quantity] of Object.entries(trade.requested_fruits)) {
        if ((userFruits[fruitType] || 0) < quantity) {
          throw new Error(`Not enough ${fruitType}s to complete trade`);
        }
      }

      // Execute trade using RPC function for atomicity
      const { data, error } = await supabase
        .rpc('execute_trade', {
          p_trade_id: tradeId,
          p_accepting_user_id: acceptingUserId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error accepting trade:', error);
      throw error;
    }
  },

  /**
   * Cancel a trade offer
   */
  cancelTradeOffer: async (tradeId, userId) => {
    const { data, error } = await supabase
      .from('trade_offers')
      .update({ status: 'cancelled' })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'open')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check if tree should spawn fruits
   */
  shouldSpawnFruits: async (treeId) => {
    try {
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .select('stage, updated_at')
        .eq('id', treeId)
        .single();

      if (treeError) throw treeError;

      const { data: settings, error: settingsError } = await supabase
        .from('fruit_spawn_settings')
        .select('spawn_interval_hours, max_fruits_per_tree')
        .eq('tree_stage', tree.stage)
        .single();

      if (settingsError) throw settingsError;

      if (settings.spawn_interval_hours === 0) {
        return false;
      }

      const { data: currentFruits, error: countError } = await supabase
        .from('tree_fruits')
        .select('id', { count: 'exact' })
        .eq('tree_id', treeId)
        .eq('is_collected', false);

      if (countError) throw countError;

      const currentFruitCount = currentFruits?.length || 0;

      if (currentFruitCount >= settings.max_fruits_per_tree) {
        return false;
      }

      const { data: lastFruits, error: lastFruitError } = await supabase
        .from('tree_fruits')
        .select('spawned_at')
        .eq('tree_id', treeId)
        .order('spawned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastFruitError) throw lastFruitError;

      if (!lastFruits) {
        return true;
      }

      const hoursSinceSpawn = (Date.now() - new Date(lastFruits.spawned_at).getTime()) / (1000 * 60 * 60);
      return hoursSinceSpawn >= settings.spawn_interval_hours;

    } catch (error) {
      console.error('Error checking if should spawn fruits:', error);
      throw error;
    }
  },

  /**
   * Get spawn settings for a tree
   */
  getSpawnSettings: async (treeStage) => {
    const { data, error } = await supabase
      .from('fruit_spawn_settings')
      .select('*')
      .eq('tree_stage', treeStage)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get total fruit count for a tree (uncollected)
   */
  getTreeFruitCount: async (treeId) => {
    const { data, error } = await supabase
      .from('tree_fruits')
      .select('id', { count: 'exact' })
      .eq('tree_id', treeId)
      .eq('is_collected', false);

    if (error) throw error;
    return data?.length || 0;
  }
};