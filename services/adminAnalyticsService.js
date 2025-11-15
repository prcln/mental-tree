import { supabase } from '../supabase/client';

export const adminAnalyticsService = {
  /**
   * Get platform overview
   */
  getPlatformOverview: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_platform_overview')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      throw error;
    }
  },

  /**
   * Get daily activity trend
   */
  getDailyActivityTrend: async (days = 30) => {
    try {
      const { data, error } = await supabase
        .from('admin_daily_activity_trend')
        .select('*')
        .order('date', { ascending: true })
        .limit(days);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily trend:', error);
      throw error;
    }
  },

  /**
   * Get user engagement segments
   */
  getEngagementSegments: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_user_engagement_segments')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching engagement segments:', error);
      throw error;
    }
  },

  /**
   * Get feature usage stats
   */
  getFeatureUsage: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_feature_usage')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      throw error;
    }
  },

  /**
   * Get cohort retention data
   */
  getCohortRetention: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_cohort_retention')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cohort retention:', error);
      throw error;
    }
  },

  /**
   * Get top users
   */
  getTopUsers: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('admin_top_users')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top users:', error);
      throw error;
    }
  },

  /**
   * Export data to CSV
   */
  exportToCSV: (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export data to JSON
   */
  exportToJSON: (data, filename) => {
    if (!data) {
      alert('No data to export');
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};