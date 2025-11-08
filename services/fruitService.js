import { supabase } from "../supabase/client";

// Constants
const DEFAULT_TIMEOUT = 10000;
const LONG_TIMEOUT = 15000;

// Timeout helper - prevents requests from hanging indefinitely
const withTimeout = (promise, timeoutMs = DEFAULT_TIMEOUT) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Error handler helper
const handleError = (context, error) => {
  console.error(`Error in ${context}:`, error);
  
  // Provide user-friendly error messages
  if (error.message === 'Request timeout') {
    throw new Error('The request took too long. Please try again.');
  }
  
  if (error.code === '23505') {
    throw new Error('This item already exists.');
  }
  
  if (error.code === 'PGRST116') {
    throw new Error('Item not found.');
  }
  
  throw error;
};

export const fruitService = {
  /**
   * Get all fruits for a tree
   * Only owner can see their fruits
   */
  getTreeFruits: async (treeId, userId = null) => {
    try {
      // If userId provided, verify ownership first
      if (userId) {
        const { data: tree, error: treeError } = await withTimeout(
          supabase
            .from('trees')
            .select('user_id')
            .eq('id', treeId)
            .single()
        );

        if (treeError) throw treeError;
        
        // Only owner can see their fruits
        if (tree.user_id !== userId) {
          return [];
        }
      }

      const { data, error } = await withTimeout(
        supabase
          .from('tree_fruits')
          .select('*')
          .eq('tree_id', treeId)
          .eq('is_collected', false)
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('getTreeFruits', error);
    }
  },



  /**
   * Collect a fruit (owner only)
   */
  collectFruit: async (fruitId, userId) => {
    try {
      if (!fruitId || !userId) {
        throw new Error('Fruit ID and User ID are required');
      }

      // Verify ownership before collecting
      const { data: fruit, error: fruitError } = await withTimeout(
        supabase
          .from('tree_fruits')
          .select('*, tree:trees!inner(user_id)')
          .eq('id', fruitId)
          .single()
      );

      if (fruitError) throw fruitError;

      // Check if user owns the tree
      if (fruit.tree.user_id !== userId) {
        throw new Error('You can only collect fruits from your own trees');
      }

      // Check if already collected
      if (fruit.is_collected) {
        throw new Error('This fruit has already been collected');
      }

      const { data, error } = await withTimeout(
        supabase.rpc('collect_fruit', {
          p_fruit_id: fruitId,
          p_user_id: userId
        })
      );

      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('collectFruit', error);
    }
  },

  /**
   * Get user's fruit inventory
   */
  getUserInventory: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await withTimeout(
        supabase
          .from('user_inventory')
          .select('*')
          .eq('user_id', userId)
          .eq('item_type', 'fruit')
          .order('item_name', { ascending: true })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('getUserInventory', error);
    }
  },

  /**
   * Get all available collectibles
   */
  getCollectibles: async () => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('collectibles')
          .select('*')
          .eq('is_active', true)
          .order('rarity', { ascending: false })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('getCollectibles', error);
    }
  },

  /**
   * Get user's collectibles
   */
  getUserCollectibles: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await withTimeout(
        supabase
          .from('user_collectibles')
          .select('*, collectible:collectibles(*)')
          .eq('user_id', userId)
          .order('unlocked_at', { ascending: false })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('getUserCollectibles', error);
    }
  },

  /**
   * Exchange fruits for a collectible
   * Uses RPC function for atomic transaction
   */
  exchangeForCollectible: async (userId, collectibleId) => {
    try {
      if (!userId || !collectibleId) {
        throw new Error('User ID and Collectible ID are required');
      }

      // Get collectible details and user inventory in parallel
      const [collectibleResult, inventoryResult] = await Promise.all([
        withTimeout(
          supabase
            .from('collectibles')
            .select('*')
            .eq('id', collectibleId)
            .single()
        ),
        withTimeout(
          supabase
            .from('user_inventory')
            .select('*')
            .eq('user_id', userId)
            .eq('item_type', 'fruit')
        )
      ]);

      if (collectibleResult.error) throw collectibleResult.error;
      if (inventoryResult.error) throw inventoryResult.error;

      const collectible = collectibleResult.data;
      const inventory = inventoryResult.data;

      // Validate user has enough fruits
      const exchangeCost = collectible.exchange_cost;
      const userFruits = {};
      
      (inventory || []).forEach(item => {
        userFruits[item.item_name] = item.quantity;
      });

      // Check if user has enough of each required fruit
      const missingFruits = [];
      for (const [fruitType, required] of Object.entries(exchangeCost)) {
        const available = userFruits[fruitType] || 0;
        if (available < required) {
          missingFruits.push(`${fruitType} (need ${required}, have ${available})`);
        }
      }

      if (missingFruits.length > 0) {
        throw new Error(`Not enough fruits: ${missingFruits.join(', ')}`);
      }

      // Use RPC function for atomic transaction (create this if it doesn't exist)
      // This is safer than multiple sequential operations
      const { data, error } = await withTimeout(
        supabase.rpc('exchange_for_collectible', {
          p_user_id: userId,
          p_collectible_id: collectibleId
        }),
        LONG_TIMEOUT
      );

      if (error) throw error;

      // If RPC doesn't exist, fall back to manual transaction
      // (This is less safe - race conditions possible)
      if (!data) {
        return await this._manualExchange(userId, collectibleId, exchangeCost, userFruits);
      }

      return data;
    } catch (error) {
      return handleError('exchangeForCollectible', error);
    }
  },

  /**
   * Manual exchange fallback (if RPC doesn't exist)
   * WARNING: This has race condition risks
   */
  _manualExchange: async (userId, collectibleId, exchangeCost, userFruits) => {
    try {
      // Deduct fruits from inventory
      for (const [fruitType, required] of Object.entries(exchangeCost)) {
        const { error: deductError } = await withTimeout(
          supabase
            .from('user_inventory')
            .update({ 
              quantity: userFruits[fruitType] - required,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('item_type', 'fruit')
            .eq('item_name', fruitType)
        );

        if (deductError) throw deductError;
      }

      // Check if user already has this collectible
      const { data: existing, error: checkError } = await withTimeout(
        supabase
          .from('user_collectibles')
          .select('*')
          .eq('user_id', userId)
          .eq('collectible_id', collectibleId)
          .maybeSingle()
      );

      if (checkError) throw checkError;

      if (existing) {
        // Update existing collectible
        const { data: updated, error: updateError } = await withTimeout(
          supabase
            .from('user_collectibles')
            .update({ 
              quantity: existing.quantity + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('collectible_id', collectibleId)
            .select('*, collectible:collectibles(*)')
            .single()
        );

        if (updateError) throw updateError;
        return updated;
      } else {
        // Insert new collectible
        const { data: newCollectible, error: insertError } = await withTimeout(
          supabase
            .from('user_collectibles')
            .insert({
              user_id: userId,
              collectible_id: collectibleId,
              quantity: 1
            })
            .select('*, collectible:collectibles(*)')
            .single()
        );

        if (insertError) throw insertError;
        return newCollectible;
      }
    } catch (error) {
      throw new Error(`Exchange failed: ${error.message}`);
    }
  },

  /**
   * Spawn fruits on a tree
   * FIXED: Added better error handling and logging
   */
  spawnFruits: async (treeId) => {
  try {
    
    const { data, error } = await withTimeout(
      supabase.rpc('spawn_tree_fruits', { p_tree_id: treeId })
    );

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Spawn error:', error);
    return handleError('spawnFruits', error);
  }
},

/**
 * Auto-spawn fruits based on time passed since last spawn
 * Call this on login or tree view to catch up on missed spawns
 */
/**
 * Auto-spawn fruits based on time passed since last spawn
 * Call this on login or tree view to catch up on missed spawns
 */
autoSpawnFruitsOnLogin: async (treeId) => {
  try {
    if (!treeId) {
      throw new Error('Tree ID is required');
    }


    // Get tree details - use maybeSingle() instead of single()
    const { data: tree, error: treeError } = await withTimeout(
      supabase
        .from('trees')
        .select('stage, last_fruit_spawn')
        .eq('id', treeId)
        .maybeSingle()
    );

    if (treeError) throw treeError;
    
    // Tree doesn't exist
    if (!tree) {
      return { spawned: 0, cycles: 0, reason: 'tree_not_found' };
    }

    // Get spawn settings - use maybeSingle() (already correct)
    const { data: settings, error: settingsError } = await withTimeout(
      supabase
        .from('fruit_spawn_settings')
        .select('spawn_interval_hours, max_fruits_per_tree')
        .eq('tree_stage', tree.stage)
        .maybeSingle()
    );

    if (settingsError) throw settingsError;

    // No settings or interval is 0 = no spawning for this stage
    if (!settings || settings.spawn_interval_hours === 0) {
      return { spawned: 0, cycles: 0, reason: 'no_settings' };
    }

    // Check current fruit count
    const { count: currentCount, error: countError } = await withTimeout(
      supabase
        .from('tree_fruits')
        .select('*', { count: 'exact', head: true })
        .eq('tree_id', treeId)
        .eq('is_collected', false)
    );

    if (countError) throw countError;

    // Already at max capacity
    if (currentCount >= settings.max_fruits_per_tree) {
      return { spawned: 0, cycles: 0, reason: 'max_capacity' };
    }

    // Calculate cycles passed
    const now = Date.now();
    const lastSpawnTime = tree.last_fruit_spawn 
      ? new Date(tree.last_fruit_spawn).getTime() 
      : now - (settings.spawn_interval_hours * 60 * 60 * 1000); // If never spawned, assume 1 cycle ago

    const millisPerCycle = settings.spawn_interval_hours * 60 * 60 * 1000;
    const timePassed = now - lastSpawnTime;
    const cyclesPassed = Math.floor(timePassed / millisPerCycle);

    // No cycles have passed yet
    if (cyclesPassed === 0) {
      return { spawned: 0, cycles: 0, reason: 'no_cycles_passed' };
    }

    // Calculate how many fruits to spawn (can't exceed max)
    const maxToSpawn = settings.max_fruits_per_tree - currentCount;
    const cyclesToSpawn = Math.min(cyclesPassed, maxToSpawn);

    if (cyclesToSpawn === 0) {
      return { spawned: 0, cycles: cyclesPassed, reason: 'would_exceed_max' };
    }

    // Spawn fruits for each cycle
    let totalSpawned = 0;
    for (let i = 0; i < cyclesToSpawn; i++) {
      try {
        const spawnResult = await withTimeout(
          supabase.rpc('spawn_tree_fruits', { p_tree_id: treeId })
        );

        if (spawnResult.error) {
          console.error('Error spawning cycle', i + 1, ':', spawnResult.error);
          break; // Stop spawning on error
        }

        totalSpawned += (spawnResult.data || 0);
        
        // Small delay between spawns to avoid rate limiting
        if (i < cyclesToSpawn - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Failed to spawn cycle', i + 1, ':', error);
        break;
      }
    }


    return {
      spawned: totalSpawned,
      cycles: cyclesPassed,
      cyclesProcessed: cyclesToSpawn,
      currentCount: currentCount + totalSpawned,
      maxCapacity: settings.max_fruits_per_tree
    };
  } catch (error) {
    // Don't throw error, just return empty result
    return { spawned: 0, cycles: 0, error: error.message };
  }
},

  /**
   * Check if tree should spawn fruits
   * FIXED: Better table name handling
   */
  shouldSpawnFruits: async (treeId) => {
    try {
      if (!treeId) {
        throw new Error('Tree ID is required');
      }

      // Get tree with last spawn time
      const { data: tree, error: treeError } = await withTimeout(
        supabase
          .from('trees')
          .select('stage, last_fruit_spawn')
          .eq('id', treeId)
          .single()
      );

      if (treeError) throw treeError;

      // Try both table names for spawn settings
      let settings = null;
      let settingsError = null;

      // Try fruit_spawn_settings first (from Edge Function)
      const { data: settings1, error: error1 } = await withTimeout(
        supabase
          .from('fruit_spawn_settings')
          .select('spawn_interval_hours, max_fruits_per_tree, spawn_probability')
          .eq('tree_stage', tree.stage)
          .maybeSingle()
      );

      if (!error1 && settings1) {
        settings = settings1;
      } else {
        // Fallback to fruit_types
        const { data: settings2, error: error2 } = await withTimeout(
          supabase
            .from('fruit_types')
            .select('spawn_interval_hours, max_fruits_per_tree, spawn_probability')
            .eq('tree_stage', tree.stage)
            .maybeSingle()
        );

        if (!error2 && settings2) {
          settings = settings2;
        } else {
          settingsError = error2;
        }
      }

      if (settingsError) throw settingsError;

      // If no settings found for this stage, don't spawn
      if (!settings || settings.spawn_interval_hours === 0) {
        return false;
      }

      // Check current fruit count - try both table names
      let count = 0;
      const { count: count1, error: countError1 } = await withTimeout(
        supabase
          .from('tree_fruits')
          .select('*', { count: 'exact', head: true })
          .eq('tree_id', treeId)
          .eq('is_collected', false)
      );

      if (countError1) {
        // Try alternate table name
        const { count: count2, error: countError2 } = await withTimeout(
          supabase
            .from('fruits')
            .select('*', { count: 'exact', head: true })
            .eq('tree_id', treeId)
            .eq('status', 'on_tree')
        );

        if (countError2) throw countError2;
        count = count2 || 0;
      } else {
        count = count1 || 0;
      }

      // Don't spawn if at max capacity
      if (count >= settings.max_fruits_per_tree) {
        return false;
      }

      // Check if enough time has passed
      if (!tree.last_fruit_spawn) {
        return true;
      }

      const hoursSinceSpawn = 
        (Date.now() - new Date(tree.last_fruit_spawn).getTime()) / (1000 * 60 * 60);
  
      
      return hoursSinceSpawn >= settings.spawn_interval_hours;
    } catch (error) {
      console.error('Error in shouldSpawnFruits:', error);
      return handleError('shouldSpawnFruits', error);
    }
  },

  /**
   * Get spawn settings for a tree
   */
  getSpawnSettings: async (treeStage) => {
    try {
      if (!treeStage) {
        throw new Error('Tree stage is required');
      }

      const { data, error } = await withTimeout(
        supabase
          .from('fruit_types')
          .select('*')
          .eq('tree_stage', treeStage)
          .maybeSingle()
      );

      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('getSpawnSettings', error);
    }
  },

  /**
   * Get total fruit count for a tree (uncollected)
   */
  getTreeFruitCount: async (treeId) => {
    try {
      if (!treeId) {
        throw new Error('Tree ID is required');
      }

      const { count, error } = await withTimeout(
        supabase
          .from('tree_fruits')
          .select('*', { count: 'exact', head: true })
          .eq('tree_id', treeId)
          .eq('is_collected', false)
      );

      if (error) throw error;
      return count || 0;
    } catch (error) {
      return handleError('getTreeFruitCount', error);
    }
  },

  /**
   * Get available trade offers (exclude user's own trades and expired)
   */
  getTradeOffers: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await withTimeout(
        supabase
          .from('trade_offers')
          .select('*, user_profiles(username, user_id)')
          .eq('status', 'open')
          .neq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('getTradeOffers', error);
    }
  },

  /**
   * Get user's own trade offers
   */
  getUserTradeOffers: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await withTimeout(
        supabase
          .from('trade_offers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('getUserTradeOffers', error);
    }
  },

  /**
   * Create a new trade offer with expiration
   */
  createTradeOffer: async (userId, offeredFruits, requestedFruits, expirationHours = 24) => {
    try {
      if (!userId) throw new Error('User ID is required');
      if (!offeredFruits || Object.keys(offeredFruits).length === 0) {
        throw new Error('Must offer at least one fruit');
      }
      if (!requestedFruits || Object.keys(requestedFruits).length === 0) {
        throw new Error('Must request at least one fruit');
      }
      if (expirationHours <= 0 || expirationHours > 168) {
        throw new Error('Expiration must be between 1 and 168 hours (7 days)');
      }

      // Verify user has enough fruits to offer
      const { data: inventory, error: invError } = await withTimeout(
        supabase
          .from('user_inventory')
          .select('*')
          .eq('user_id', userId)
          .eq('item_type', 'fruit')
      );

      if (invError) throw invError;

      const inventoryMap = {};
      (inventory || []).forEach(item => {
        inventoryMap[item.item_name] = item.quantity;
      });

      const missingFruits = [];
      for (const [fruit, quantity] of Object.entries(offeredFruits)) {
        const available = inventoryMap[fruit] || 0;
        if (available < quantity) {
          missingFruits.push(`${fruit} (have: ${available}, need: ${quantity})`);
        }
      }

      if (missingFruits.length > 0) {
        throw new Error(`Not enough fruits to offer: ${missingFruits.join(', ')}`);
      }

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const { data, error } = await withTimeout(
        supabase
          .from('trade_offers')
          .insert({
            user_id: userId,
            offered_fruits: offeredFruits,
            requested_fruits: requestedFruits,
            status: 'open',
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single()
      );

      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('createTradeOffer', error);
    }
  },

  /**
   * Accept a trade offer
   */
  acceptTradeOffer: async (tradeId, userId) => {
    try {
      if (!tradeId || !userId) {
        throw new Error('Trade ID and User ID are required');
      }

      // Get trade details
      const { data: trade, error: fetchError } = await withTimeout(
        supabase
          .from('trade_offers')
          .select('*, user_profiles(username)')
          .eq('id', tradeId)
          .eq('status', 'open')
          .gt('expires_at', new Date().toISOString())
          .single()
      );

      if (fetchError) throw fetchError;
      if (!trade) throw new Error('Trade offer not found or has expired');

      // Prevent accepting own trade
      if (trade.user_id === userId) {
        throw new Error('You cannot accept your own trade offer');
      }

      // Verify acceptor has required fruits
      const { data: inventory, error: invError } = await withTimeout(
        supabase
          .from('user_inventory')
          .select('*')
          .eq('user_id', userId)
          .eq('item_type', 'fruit')
      );

      if (invError) throw invError;

      const inventoryMap = {};
      (inventory || []).forEach(item => {
        inventoryMap[item.item_name] = item.quantity;
      });

      const missingFruits = [];
      for (const [fruit, quantity] of Object.entries(trade.requested_fruits)) {
        const available = inventoryMap[fruit] || 0;
        if (available < quantity) {
          missingFruits.push(`${fruit} (have: ${available}, need: ${quantity})`);
        }
      }

      if (missingFruits.length > 0) {
        throw new Error(`You don't have enough: ${missingFruits.join(', ')}`);
      }

      // Execute trade via RPC (atomic transaction)
      const { data, error: tradeError } = await withTimeout(
        supabase.rpc('execute_trade', {
          p_trade_id: tradeId,
          p_accepting_user_id: userId
        }),
        LONG_TIMEOUT
      );

      if (tradeError) throw tradeError;

      return { success: true, data };
    } catch (error) {
      return handleError('acceptTradeOffer', error);
    }
  },

  /**
   * Cancel a trade offer
   */
  cancelTradeOffer: async (tradeId, userId) => {
    try {
      if (!tradeId || !userId) {
        throw new Error('Trade ID and User ID are required');
      }

      const { data, error } = await withTimeout(
        supabase
          .from('trade_offers')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', tradeId)
          .eq('user_id', userId)
          .eq('status', 'open')
          .select()
          .single()
      );

      if (error) throw error;
      if (!data) throw new Error('Trade not found or already processed');
      
      return data;
    } catch (error) {
      return handleError('cancelTradeOffer', error);
    }
  },

  /**
   * Clean up expired trades
   */
  cleanupExpiredTrades: async () => {
    try {
      // Use RPC function if available for better performance
      const { data, error } = await withTimeout(
        supabase.rpc('cancel_expired_trades')
      );

      if (error && error.code !== '42883') { // Function doesn't exist
        throw error;
      }

      // Fallback to manual cleanup if RPC doesn't exist
      if (error?.code === '42883') {
        const { data: fallbackData, error: fallbackError } = await withTimeout(
          supabase
            .from('trade_offers')
            .update({ 
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('status', 'open')
            .lt('expires_at', new Date().toISOString())
            .select()
        );

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    } catch (error) {
      console.error('Error cleaning up expired trades:', error);
      // Don't throw - cleanup failures shouldn't break the app
      return [];
    }
  }
};