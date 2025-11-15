import { supabase } from '../supabase/client';

export const analyticsService = {
  /**
   * Start a new session
   */
  startSession: async (userId) => {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_start: new Date().toISOString(),
          device_info: deviceInfo
        })
        .select()
        .single();

      if (error) throw error;

      // Store session ID in sessionStorage
      sessionStorage.setItem('analytics_session_id', data.id);
      
      // Update streak
      await supabase.rpc('update_user_streak', { p_user_id: userId });

      return data;
    } catch (error) {
      console.error('Error starting session:', error);
    }
  },

  /**
   * End current session
   */
  endSession: async () => {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) return;

      const { data: session } = await supabase
        .from('user_sessions')
        .select('session_start')
        .eq('id', sessionId)
        .single();

      if (session) {
        const duration = Math.floor((Date.now() - new Date(session.session_start).getTime()) / 1000);

        await supabase
          .from('user_sessions')
          .update({
            session_end: new Date().toISOString(),
            duration_seconds: duration,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      sessionStorage.removeItem('analytics_session_id');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  },

  /**
   * Track user activity
   */
  trackActivity: async (userId, activityType, activityData = {}) => {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id');

      // Log activity
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: userId,
          session_id: sessionId,
          activity_type: activityType,
          activity_data: activityData
        });

      // Update daily stats
      await supabase.rpc('update_daily_retention_stats', {
        p_user_id: userId,
        p_activity_type: activityType
      });

      // Update session action count
      if (sessionId) {
        await supabase.rpc('increment', {
          table_name: 'user_sessions',
          row_id: sessionId,
          column_name: 'actions_count'
        });
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  },

  /**
   * Track page view
   */
  trackPageView: async (page) => {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) return;

      await supabase.rpc('increment', {
        table_name: 'user_sessions',
        row_id: sessionId,
        column_name: 'page_views'
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  },

  /**
   * Get user retention stats
   */
  getRetentionStats: async (userId, days = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching retention stats:', error);
      return [];
    }
  },

  /**
   * Get user streak
   */
  getStreak: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching streak:', error);
      return null;
    }
  },

  /**
   * Get session history
   */
  getSessionHistory: async (userId, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_start', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching session history:', error);
      return [];
    }
  },

    /**
   * Get daily stats for a user
   */
  getDailyStats: async (userId, days = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return [];
    }
  },

  /**
   * Get weekly stats for a user
   */
  getWeeklyStats: async (userId, weeks = 12) => {
    try {
      const { data, error } = await supabase
        .from('weekly_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(weeks);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return [];
    }
  },

  /**
   * Get monthly stats for a user
   */
  getMonthlyStats: async (userId, months = 12) => {
    try {
      const { data, error } = await supabase
        .from('monthly_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(months);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return [];
    }
  },

  /**
   * Get user activity summary
   */
  getUserSummary: async (userId) => {
    try {
      // Get today's stats
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayStats } = await supabase
        .from('daily_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      // Get this week's stats
      const { data: weekStats } = await supabase
        .from('weekly_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get this month's stats
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      
      const { data: monthStats } = await supabase
        .from('monthly_retention_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      // Get streak info
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      return {
        today: todayStats || {},
        thisWeek: weekStats || {},
        thisMonth: monthStats || {},
        streak: streak || {}
      };
    } catch (error) {
      console.error('Error fetching user summary:', error);
      return null;
    }
  },

  /**
   * Run manual aggregation (for testing or admin)
   */
  runAggregation: async () => {
    try {
      await supabase.rpc('run_all_aggregations');
      console.log('[ANALYTICS] Aggregation completed');
      return { success: true };
    } catch (error) {
      console.error('[ANALYTICS] Aggregation failed:', error);
      throw error;
    }
  }
};