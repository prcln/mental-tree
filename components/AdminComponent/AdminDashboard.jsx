import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, TrendingUp, Users, Activity, Award } from 'lucide-react';
import { adminAnalyticsService } from '../../services/adminAnalyticsService';
import './AdminDashboard.css';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import { isAdmin } from '../../utils/adminCheck';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // ALL STATE HOOKS FIRST - Before any conditional returns
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [engagementSegments, setEngagementSegments] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [cohortRetention, setCohortRetention] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Check admin authorization
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const adminStatus = await isAdmin(user.id);
        if (!adminStatus) {
          alert('Access denied: Admin only');
          navigate('/');
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  // Load analytics data only when authorized
  useEffect(() => {
    if (authorized) {
      loadAllData();
    }
  }, [authorized]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        overviewData,
        trendData,
        segmentsData,
        featuresData,
        cohortData,
        usersData
      ] = await Promise.all([
        adminAnalyticsService.getPlatformOverview(),
        adminAnalyticsService.getDailyActivityTrend(30),
        adminAnalyticsService.getEngagementSegments(),
        adminAnalyticsService.getFeatureUsage(),
        adminAnalyticsService.getCohortRetention(),
        adminAnalyticsService.getTopUsers(50)
      ]);

      setOverview(overviewData);
      setDailyTrend(trendData);
      setEngagementSegments(segmentsData);
      setFeatureUsage(featuresData);
      setCohortRetention(cohortData);
      setTopUsers(usersData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      alert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (data, filename, format = 'csv') => {
    if (format === 'csv') {
      adminAnalyticsService.exportToCSV(data, filename);
    } else {
      adminAnalyticsService.exportToJSON(data, filename);
    }
  };

  // NOW we can do conditional rendering - after all hooks are called
  if (checkingAuth) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Checking permissions...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Access denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Admin Analytics Dashboard</h1>
        <button onClick={loadAllData} className="btn-refresh">
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          Retention
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">
                <Users size={32} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">{overview?.total_users || 0}</div>
                <div className="kpi-label">Total Users</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <Activity size={32} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">{overview?.daily_active_users || 0}</div>
                <div className="kpi-label">Daily Active Users</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <TrendingUp size={32} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">{overview?.weekly_active_users || 0}</div>
                <div className="kpi-label">Weekly Active Users</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">
                <Award size={32} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">
                  {Math.floor((overview?.avg_session_duration || 0) / 60)}m
                </div>
                <div className="kpi-label">Avg Session</div>
              </div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="stats-section">
            <h2>Today's Activity</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{overview?.today_check_ins || 0}</span>
                <span className="stat-label">Check-ins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{overview?.today_messages || 0}</span>
                <span className="stat-label">Messages</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{overview?.today_fruits_collected || 0}</span>
                <span className="stat-label">Fruits Collected</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{overview?.today_trades || 0}</span>
                <span className="stat-label">Trades</span>
              </div>
            </div>
          </div>

          {/* User Engagement Segments */}
          <div className="chart-section">
            <div className="chart-header">
              <h2>User Engagement Segments</h2>
              <button
                onClick={() => handleExport(engagementSegments, 'engagement-segments')}
                className="btn-export"
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementSegments}
                  dataKey="user_count"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {engagementSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Usage */}
          <div className="chart-section">
            <div className="chart-header">
              <h2>Feature Usage (Last 30 Days)</h2>
              <button
                onClick={() => handleExport(featureUsage, 'feature-usage')}
                className="btn-export"
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users_used" fill="#8884d8" name="Users" />
                <Bar dataKey="total_usage" fill="#82ca9d" name="Total Usage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="tab-content">
          <div className="chart-section">
            <div className="chart-header">
              <h2>Daily Active Users (Last 30 Days)</h2>
              <button
                onClick={() => handleExport(dailyTrend, 'daily-trend')}
                className="btn-export"
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active_users" stroke="#8884d8" name="Active Users" />
                <Line type="monotone" dataKey="total_sessions" stroke="#82ca9d" name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <div className="chart-header">
              <h2>Activity by Type</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_check_ins" stroke="#8884d8" name="Check-ins" />
                <Line type="monotone" dataKey="total_messages" stroke="#82ca9d" name="Messages" />
                <Line type="monotone" dataKey="total_fruits_collected" stroke="#ffc658" name="Fruits" />
                <Line type="monotone" dataKey="total_trades_completed" stroke="#ff7c7c" name="Trades" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="table-section">
            <div className="table-header">
              <h2>Top Users (Last 30 Days)</h2>
              <button
                onClick={() => handleExport(topUsers, 'top-users')}
                className="btn-export"
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Current Streak</th>
                    <th>Total Active Days</th>
                    <th>Actions (30d)</th>
                    <th>Check-ins</th>
                    <th>Messages</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user, index) => (
                    <tr key={user.user_id}>
                      <td>
                        <div className="user-cell">
                          <span className="user-rank">#{index + 1}</span>
                          {user.username || 'Anonymous'}
                        </div>
                      </td>
                      <td>
                        <span className="streak-badge">
                          🔥 {user.current_streak || 0}
                        </span>
                      </td>
                      <td>{user.total_active_days || 0}</td>
                      <td>{user.total_actions_30d || 0}</td>
                      <td>{user.total_check_ins_30d || 0}</td>
                      <td>{user.total_messages_30d || 0}</td>
                      <td>
                        {user.last_active_date 
                          ? new Date(user.last_active_date).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="tab-content">
          <div className="table-section">
            <div className="table-header">
              <h2>Cohort Retention Analysis</h2>
              <button
                onClick={() => handleExport(cohortRetention, 'cohort-retention')}
                className="btn-export"
              >
                <Download size={16} />
                Export
              </button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cohort Week</th>
                    <th>Cohort Size</th>
                    <th>Day 1 Retention</th>
                    <th>Week 1 Retention</th>
                    <th>Month 1 Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortRetention.map((cohort) => (
                    <tr key={cohort.cohort_week}>
                      <td>
                        {new Date(cohort.cohort_week).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td>{cohort.cohort_size}</td>
                      <td>
                        <div className="retention-cell">
                          <div className="retention-bar">
                            <div
                              className="retention-fill"
                              style={{ width: `${cohort.day_1_retention_pct}%` }}
                            />
                          </div>
                          <span className="retention-pct">
                            {cohort.day_1_retention_pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="retention-cell">
                          <div className="retention-bar">
                            <div
                              className="retention-fill"
                              style={{ width: `${cohort.week_1_retention_pct}%` }}
                            />
                          </div>
                          <span className="retention-pct">
                            {cohort.week_1_retention_pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="retention-cell">
                          <div className="retention-bar">
                            <div
                              className="retention-fill"
                              style={{ width: `${cohort.month_1_retention_pct}%` }}
                            />
                          </div>
                          <span className="retention-pct">
                            {cohort.month_1_retention_pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
