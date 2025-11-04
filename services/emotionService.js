import { supabase } from "../supabase/client";
import { calculateStage } from "./stageHelper";
import { cooldownService } from "./cooldownService";

export const emotionService = {
  /**
   * Add an emotion check-in
   * @param {string} treeId - The tree ID
   * @param {object} emotionData - Contains emotion_level, descriptions, impacts, context
   * @returns {Promise<{checkIn, tree}>}
   */
  addEmotionCheckIn: async (treeId, emotionData) => {
    try {
      // Check if user can check in (cooldown logic)
      const { canCheckIn } = await cooldownService.canCheckIn(treeId);
      if (!canCheckIn) {
        throw new Error('Please wait before checking in again');
      }

      // Calculate points based on emotion level
      const points = emotionData.score;

      // Insert emotion check-in
      const { data: checkIn, error: checkInError } = await supabase
        .from('emotion_check_ins')
        .insert({
          tree_id: treeId,
          emotion_level: emotionData.emotion_level,
          descriptions: emotionData.descriptions || [],
          impacts: emotionData.impacts || [],
          context: emotionData.context || null,
          score: points
        })
        .select()
        .single();

      if (checkInError) throw checkInError;

      // First, get the current tree data
      const { data: currentTree, error: fetchError } = await supabase
        .from('trees')
        .select('mood_score, stage')
        .eq('id', treeId)
        .single();

      if (fetchError) throw fetchError;

      // Update tree's mood score and last check-in time
      const newMoodScore = currentTree.mood_score + points;
      
      const { data: tree, error: treeError } = await supabase
        .from('trees')
        .update({
          mood_score: newMoodScore,
          last_check_in: new Date().toISOString()
        })
        .eq('id', treeId)
        .select()
        .single();

      if (treeError) throw treeError;

      // Calculate new stage based on updated mood score
      const newStage = calculateStage(tree.mood_score);
      
      // Update stage if it changed
      if (newStage !== tree.stage) {
        const { data: updatedTree, error: stageError } = await supabase
          .from('trees')
          .update({ stage: newStage })
          .eq('id', treeId)
          .select()
          .single();

        if (stageError) throw stageError;
        return { checkIn, tree: updatedTree };
      }

      return { checkIn, tree };
    } catch (error) {
      console.error('Error adding emotion check-in:', error);
      throw error;
    }
  },

  /**
   * Get emotion check-ins for a tree
   * @param {string} treeId - The tree ID
   * @param {number} limit - Number of check-ins to fetch
   * @returns {Promise<Array>}
   */
  getEmotionCheckIns: async (treeId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('tree_id', treeId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching emotion check-ins:', error);
      throw error;
    }
  },

  /**
   * Get daily emotion summary
   * @param {string} treeId - The tree ID
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>}
   */
  getDailyEmotionSummary: async (treeId, startDate, endDate) => {
    try {
      // Ensure treeId is a string
      const treeIdString = typeof treeId === 'string' ? treeId : treeId?.id || String(treeId);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('tree_id', treeIdString)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData = {};
      
      (data || []).forEach(checkIn => {
        const date = new Date(checkIn.created_at).toISOString().split('T')[0];
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            checkIns: [],
            totalEmotion: 0,
            count: 0,
            descriptions: new Set(),
            impacts: new Set()
          };
        }

        dailyData[date].checkIns.push(checkIn);
        dailyData[date].totalEmotion += checkIn.emotion_level;
        dailyData[date].count += 1;

        // Collect unique descriptions and impacts
        if (checkIn.descriptions) {
          checkIn.descriptions.forEach(desc => dailyData[date].descriptions.add(desc));
        }
        if (checkIn.impacts) {
          checkIn.impacts.forEach(impact => dailyData[date].impacts.add(impact));
        }
      });

      // Convert to array and calculate averages
      return Object.values(dailyData).map(day => ({
        date: day.date,
        checkCount: day.count,
        avgEmotion: day.totalEmotion / day.count,
        checkIns: day.checkIns,
        descriptions: Array.from(day.descriptions),
        impacts: Array.from(day.impacts)
      }));
    } catch (error) {
      console.error('Error fetching daily emotion summary:', error);
      throw error;
    }
  },

  /**
   * Get monthly emotion summary
   * @param {string} treeId - The tree ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>}
   */
  getMonthlyEmotionSummary: async (treeId, year, month) => {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('tree_id', treeId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          year,
          month,
          checkCount: 0,
          avgEmotion: 0,
          maxEmotion: 0,
          minEmotion: 0,
          mostCommonDescriptions: [],
          mostCommonImpacts: [],
          checkIns: []
        };
      }

      // Calculate statistics
      const emotions = data.map(c => c.emotion_level);
      const totalEmotion = emotions.reduce((sum, e) => sum + e, 0);
      
      // Count descriptions and impacts
      const descriptionCounts = {};
      const impactCounts = {};

      data.forEach(checkIn => {
        if (checkIn.descriptions) {
          checkIn.descriptions.forEach(desc => {
            descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
          });
        }
        if (checkIn.impacts) {
          checkIn.impacts.forEach(impact => {
            impactCounts[impact] = (impactCounts[impact] || 0) + 1;
          });
        }
      });

      // Get top 5 most common
      const topDescriptions = Object.entries(descriptionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([desc, count]) => ({ description: desc, count }));

      const topImpacts = Object.entries(impactCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([impact, count]) => ({ impact, count }));

      return {
        year,
        month,
        checkCount: data.length,
        avgEmotion: totalEmotion / data.length,
        maxEmotion: Math.max(...emotions),
        minEmotion: Math.min(...emotions),
        mostCommonDescriptions: topDescriptions,
        mostCommonImpacts: topImpacts,
        checkIns: data
      };
    } catch (error) {
      console.error('Error fetching monthly emotion summary:', error);
      throw error;
    }
  }
};