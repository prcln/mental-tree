export const calculateStage = (moodScore) => {
  if (moodScore < 20) return 'seed';
  if (moodScore < 50) return 'sprout';
  if (moodScore < 80) return 'sapling';
  if (moodScore < 120) return 'young';
  if (moodScore < 200) return 'mature';
  return 'blooming';
};

export const pointsUntilNextStage = (moodScore) => {
  if (moodScore < 20) return 20 - moodScore;
  if (moodScore < 50) return 50 - moodScore;
  if (moodScore < 80) return 80 - moodScore;
  if (moodScore < 120) return 120 - moodScore;
  if (moodScore < 200) return 200 - moodScore;
  return 0; // Already at max stage
};