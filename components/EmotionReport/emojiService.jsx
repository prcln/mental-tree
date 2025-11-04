// Emotion emoji mapping
export const emotionEmojis = {
  1: '😢', 2: '😟', 3: '😕', 4: '😐', 5: '🙂', 6: '😊', 7: '😄'
};

export const getEmotionColor = (level) => {
  if (level <= 3) return 'text-red-500';
  if (level <= 5) return 'text-yellow-500';
  return 'text-green-500';
};

export function getEmotionBg(level) {
  if (level <= 3) return 'bg-red-50 border-red-200';
  if (level <= 5) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}