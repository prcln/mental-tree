import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

const UserStatsPanel = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const [summaryData, dailyData] = await Promise.all([
          analyticsService.getUserSummary(user.id),
          analyticsService.getDailyStats(user.id, 7)
        ]);

        setSummary(summaryData);
        setDailyStats(dailyData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (loading) return <div>Loading stats...</div>;
  if (!summary) return <div>No stats available</div>;

  return (
    <div className="stats-panel">
      <h2>Your Activity</h2>
      
      {/* Today's Stats */}
      <div className="stat-card">
        <h3>Today</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-value">{summary.today.actions_count || 0}</span>
            <span className="stat-label">Actions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{summary.today.check_ins || 0}</span>
            <span className="stat-label">Check-ins</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{summary.today.messages_sent || 0}</span>
            <span className="stat-label">Messages</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{summary.today.fruits_collected || 0}</span>
            <span className="stat-label">Fruits</span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="stat-card">
        <h3>🔥 Streak</h3>
        <div className="streak-info">
          <div className="streak-current">
            <span className="streak-number">{summary.streak.current_streak || 0}</span>
            <span className="streak-label">days</span>
          </div>
          <div className="streak-best">
            Best: {summary.streak.longest_streak || 0} days
          </div>
        </div>
      </div>

      {/* This Week */}
      <div className="stat-card">
        <h3>This Week</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <span className="stat-value">{summary.thisWeek.active_days || 0}</span>
            <span className="stat-label">Active Days</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{summary.thisWeek.total_actions || 0}</span>
            <span className="stat-label">Total Actions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Math.floor((summary.thisWeek.total_session_duration_seconds || 0) / 60)}m
            </span>
            <span className="stat-label">Time Spent</span>
          </div>
        </div>
      </div>

      {/* Last 7 Days Chart */}
      <div className="stat-card">
        <h3>Last 7 Days</h3>
        <div className="daily-chart">
          {dailyStats.map(day => (
            <div key={day.date} className="chart-bar">
              <div 
                className="bar" 
                style={{ height: `${(day.actions_count / 50) * 100}%` }}
              />
              <span className="bar-label">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStatsPanel;