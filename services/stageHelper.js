export const calculateStage = (moodScore) => {
  if (moodScore < 10) return 'seed';
  if (moodScore < 30) return 'sprout';
  if (moodScore < 60) return 'sapling';
  if (moodScore < 100) return 'young';
  if (moodScore < 150) return 'mature';
  return 'blooming';
};

export const pointsUntilNextStage = (moodScore) => {
  if (moodScore < 10) return 10 - moodScore;
  if (moodScore < 30) return 30 - moodScore;
  if (moodScore < 60) return 60 - moodScore;
  if (moodScore < 100) return 100 - moodScore;
  if (moodScore < 150) return 150 - moodScore;
  return 0; // Already at max stage
};