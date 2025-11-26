import { fruitImages, fruitEmojis } from '../../constants/fruits';
import { supabase } from "../../supabase/client";
import { fruitService } from "../../services/fruitService";

// Image error tracking (stored in memory, not localStorage)
let imageErrors = {};

const handleFruitImageError = (fruitType) => {
  imageErrors[fruitType] = true;
};

const resetImageErrors = () => {
  imageErrors = {};
};

// Render fruit with image or emoji fallback (returns JSX)
const renderFruit = (fruitType, size = 'md') => {
  const useEmoji = imageErrors[fruitType] || !fruitImages[fruitType];
  
  const sizeClasses = {
    sm: 'w-6 h-6 sm:w-8 sm:h-8',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16'
  };

  const textSizeClasses = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-5xl'
  };

  if (useEmoji) {
    return (
      <span className={textSizeClasses[size]}>
        {fruitEmojis[fruitType] || '🍎'}
      </span>
    );
  }

  return (
    <img 
      src={fruitImages[fruitType]}
      alt={fruitType}
      className={`${sizeClasses[size]} object-contain`}
      onError={() => handleFruitImageError(fruitType)}
    />
  );
};

// Get emoji only (for non-JSX contexts)
const getFruitEmoji = (fruitName) => {
  const normalizedName = fruitName?.toLowerCase();
  return fruitEmojis[normalizedName] || '🍎';
};

const getTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
};

const getTradeUsername = (trade) => {
  return trade.user_profiles?.username || trade.user?.username || 'Anonymous';
};

const debugFruitSpawn = async (treeId) => {
  console.log('=== FRUIT SPAWN DEBUG ===');
  
  try {
    // 1. Check tree data
    const { data: tree, error: treeError } = await supabase
      .from('trees')
      .select('*')
      .eq('id', treeId)
      .single();
    
    console.log('1. Tree data:', tree);
    if (treeError) console.error('Tree error:', treeError);

    // 2. Check spawn settings table exists
    const { data: settings1, error: error1 } = await supabase
      .from('fruit_spawn_settings')
      .select('*')
      .eq('tree_stage', tree?.stage)
      .maybeSingle();
    
    console.log('2. fruit_spawn_settings:', settings1 || 'Table not found');
    if (error1) console.log('Error:', error1.message);

    // 3. Try alternate table name
    const { data: settings2, error: error2 } = await supabase
      .from('fruit_types')
      .select('*')
      .eq('tree_stage', tree?.stage)
      .maybeSingle();
    
    console.log('3. fruit_types:', settings2 || 'Table not found');
    if (error2) console.log('Error:', error2.message);

    // 4. Check current fruits
    const { data: fruits, error: fruitsError } = await supabase
      .from('tree_fruits')
      .select('*')
      .eq('tree_id', treeId)
      .eq('is_collected', false);
    
    console.log('4. Current fruits:', fruits?.length || 0);
    if (fruitsError) console.log('Error:', fruitsError.message);

    // 5. Try spawning
    console.log('5. Attempting spawn...');
    const result = await fruitService.spawnFruits(treeId);
    console.log('Spawn result:', result);

    // 6. Check if RPC function exists
    const { data: functions } = await supabase.rpc('pg_catalog.pg_proc');
    console.log('6. Available RPC functions:', functions);

  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log('=== END DEBUG ===');
};

export { 
  getTradeUsername, 
  getTimeRemaining, 
  getFruitEmoji, 
  renderFruit,
  handleFruitImageError,
  resetImageErrors,
  debugFruitSpawn 
};