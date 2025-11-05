import { supabase } from "../supabase/client";

export const fruitService = {
  /**
   * Get all fruits for a tree
   */
  getTreeFruits: async (treeId) => {
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
    return data; // Returns count of spawned fruits
  },

  /**
   * Collect a fruit
   */
  collectFruit: async (fruitId, userId) => {
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
      // Get collectible details
      const { data: collectible, error: collectibleError } = await supabase
        .from('collectibles')
        .select('*')
        .eq('id', collectibleId)
        .single();

      if (collectibleError) throw collectibleError;

      // Get user inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'fruit');

      if (inventoryError) throw inventoryError;

      // Check if user has enough fruits
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

      // Deduct fruits from inventory
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

      // Add collectible to user's collection
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
        // If already owned, increment quantity
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
   * Check if tree should spawn fruits
   */
  shouldSpawnFruits: async (treeId) => {
    try {
      // Get tree info
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .select('stage, updated_at')
        .eq('id', treeId)
        .single();

      if (treeError) throw treeError;

      // Get spawn settings for tree stage
      const { data: settings, error: settingsError } = await supabase
        .from('fruit_spawn_settings')
        .select('spawn_interval_hours, max_fruits_per_tree')
        .eq('tree_stage', tree.stage)
        .single();

      if (settingsError) throw settingsError;

      // If spawn interval is 0, don't spawn (e.g., seed stage)
      if (settings.spawn_interval_hours === 0) {
        return false;
      }

      // Check current fruit count
      const { data: currentFruits, error: countError } = await supabase
        .from('tree_fruits')
        .select('id', { count: 'exact' })
        .eq('tree_id', treeId)
        .eq('is_collected', false);

      if (countError) throw countError;

      const currentFruitCount = currentFruits?.length || 0;

      // Don't spawn if already at max
      if (currentFruitCount >= settings.max_fruits_per_tree) {
        return false;
      }

      // Check last spawn time - use maybeSingle() instead of single()
      const { data: lastFruits, error: lastFruitError } = await supabase
        .from('tree_fruits')
        .select('spawned_at')
        .eq('tree_id', treeId)
        .order('spawned_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to handle no results

      if (lastFruitError) throw lastFruitError;

      // If no fruits spawned yet, should spawn
      if (!lastFruits) {
        return true;
      }

      // Check if enough time has passed
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