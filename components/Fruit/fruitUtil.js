import { FRUIT_EMOJI_MAP } from "./constants";

const getFruitEmoji = (fruitName) => {
  return FRUIT_EMOJI_MAP[fruitName?.toLowerCase()] || FRUIT_EMOJI_MAP.default;
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

export { getTradeUsername, getTimeRemaining, getFruitEmoji }