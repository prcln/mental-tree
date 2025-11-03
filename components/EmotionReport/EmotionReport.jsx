import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import supabaseService from '../../services/supabaseService';

// Emotion emoji mapping
const emotionEmojis = {
  1: '😢', 2: '😟', 3: '😕', 4: '😐', 5: '🙂', 6: '😊', 7: '😄'
};

const getEmotionColor = (level) => {
  if (level <= 3) return 'text-red-500';
  if (level <= 5) return 'text-yellow-500';
  return 'text-green-500';
};



function getEmotionBg(level) {
  if (level <= 3) return 'bg-red-50 border-red-200';
  if (level <= 5) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

// Daily Emotion Report Component
const DailyEmotionReport = ({ treeId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);

  useEffect(() => {
    loadDailyData();
    loadWeekData();
  }, [selectedDate, treeId]);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const data = await supabaseService.getDailyEmotionSummary(treeId, start, end);
      setDailyData(data[0] || null);
    } catch (error) {
      console.error('Error loading daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekData = async () => {
    try {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const data = await supabaseService.getDailyEmotionSummary(treeId, start, end);
      setWeekData(data);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateTrend = () => {
    if (weekData.length < 2) return null;
    const recent = weekData.slice(-3).reduce((sum, d) => sum + d.avgEmotion, 0) / 3;
    const older = weekData.slice(0, 3).reduce((sum, d) => sum + d.avgEmotion, 0) / 3;
    return recent - older;
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Daily Emotion Log</h2>
        <Calendar className="text-blue-500" size={32} />
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">{formatDate(selectedDate)}</div>
          <div className="text-sm text-gray-500">
            {selectedDate.toDateString() === new Date().toDateString() && 'Today'}
          </div>
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={selectedDate >= new Date()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Daily Summary */}
      {dailyData ? (
        <div className="space-y-4">
          {/* Main Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Average Emotion</div>
                <div className="flex items-center gap-2">
                  <span className="text-5xl">{emotionEmojis[Math.round(dailyData.avgEmotion)]}</span>
                  <span className={`text-3xl font-bold ${getEmotionColor(dailyData.avgEmotion)}`}>
                    {dailyData.avgEmotion.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Check-ins</div>
                <div className="text-3xl font-bold text-gray-800">{dailyData.checkCount}</div>
              </div>
            </div>

            {/* Week Trend */}
            {trend !== null && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                trend > 0 ? 'bg-green-50 text-green-700' : 
                trend < 0 ? 'bg-red-50 text-red-700' : 
                'bg-gray-50 text-gray-700'
              }`}>
                {trend > 0 ? <TrendingUp size={20} /> : 
                 trend < 0 ? <TrendingDown size={20} /> : 
                 <Minus size={20} />}
                <span className="text-sm font-medium">
                  {trend > 0 ? `Up ${trend.toFixed(1)} from last week` :
                   trend < 0 ? `Down ${Math.abs(trend).toFixed(1)} from last week` :
                   'Stable this week'}
                </span>
              </div>
            )}
          </div>

          {/* Individual Check-ins */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-800">Check-ins Today</h3>
            {dailyData.checkIns.map((checkIn, idx) => (
              <div key={checkIn.id} className={`border-2 rounded-2xl p-4 ${getEmotionBg(checkIn.emotion_level)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{emotionEmojis[checkIn.emotion_level]}</span>
                    <div>
                      <div className={`text-lg font-semibold ${getEmotionColor(checkIn.emotion_level)}`}>
                        Level {checkIn.emotion_level}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(checkIn.created_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {checkIn.descriptions && checkIn.descriptions.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">Feeling:</div>
                    <div className="flex flex-wrap gap-1">
                      {checkIn.descriptions.map((desc, i) => (
                        <span key={i} className="px-2 py-1 bg-white bg-opacity-50 rounded-lg text-xs font-medium">
                          {desc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {checkIn.impacts && checkIn.impacts.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">Impact:</div>
                    <div className="flex flex-wrap gap-1">
                      {checkIn.impacts.map((impact, i) => (
                        <span key={i} className="px-2 py-1 bg-white bg-opacity-50 rounded-lg text-xs font-medium">
                          {impact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {checkIn.context && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Note:</div>
                    <div className="text-sm text-gray-800">{checkIn.context}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Week Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Week Overview</h3>
            <div className="grid grid-cols-7 gap-2">
              {weekData.map((day, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`p-2 rounded-xl ${getEmotionBg(day.avgEmotion)}`}>
                    <div className="text-2xl mb-1">{emotionEmojis[Math.round(day.avgEmotion)]}</div>
                    <div className={`text-xs font-semibold ${getEmotionColor(day.avgEmotion)}`}>
                      {day.avgEmotion.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-md">
          <div className="text-6xl mb-4">📝</div>
          <div className="text-xl font-medium text-gray-800 mb-2">No check-ins yet</div>
          <div className="text-gray-500">Start logging your emotions to see insights here</div>
        </div>
      )}
    </div>
  );
};

// Monthly Emotion Report Component
const MonthlyEmotionReport = ({ treeId }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
  }, [selectedMonth, treeId]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const data = await supabaseService.getMonthlyEmotionSummary(treeId, year, month);
      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">Monthly Report</h2>
        <Calendar className="text-purple-500" size={32} />
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-xl font-semibold text-gray-800">{formatMonth(selectedMonth)}</div>
        <button
          onClick={() => changeMonth(1)}
          disabled={selectedMonth >= new Date()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {monthlyData && monthlyData.checkCount > 0 ? (
        <div className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-md text-center">
              <div className="text-3xl mb-2">{emotionEmojis[Math.round(monthlyData.avgEmotion)]}</div>
              <div className={`text-2xl font-bold ${getEmotionColor(monthlyData.avgEmotion)}`}>
                {monthlyData.avgEmotion.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Average</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-md text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-gray-800">{monthlyData.checkCount}</div>
              <div className="text-xs text-gray-500 mt-1">Check-ins</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-md text-center">
              <div className="text-3xl mb-2">{emotionEmojis[monthlyData.maxEmotion]}</div>
              <div className={`text-2xl font-bold ${getEmotionColor(monthlyData.maxEmotion)}`}>
                {monthlyData.maxEmotion}
              </div>
              <div className="text-xs text-gray-500 mt-1">Best Day</div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-md text-center">
              <div className="text-3xl mb-2">{emotionEmojis[monthlyData.minEmotion]}</div>
              <div className={`text-2xl font-bold ${getEmotionColor(monthlyData.minEmotion)}`}>
                {monthlyData.minEmotion}
              </div>
              <div className="text-xs text-gray-500 mt-1">Toughest Day</div>
            </div>
          </div>

          {/* Most Common Feelings */}
          {monthlyData.mostCommonDescriptions.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Most Common Feelings</h3>
              <div className="space-y-2">
                {monthlyData.mostCommonDescriptions.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{item.description}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / monthlyData.checkCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{item.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biggest Impacts */}
          {monthlyData.mostCommonImpacts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Biggest Impacts</h3>
              <div className="grid grid-cols-2 gap-2">
                {monthlyData.mostCommonImpacts.map((item, idx) => (
                  <div key={idx} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
                    <div className="font-medium text-gray-800">{item.impact}</div>
                    <div className="text-sm text-purple-600">{item.count} times</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-md">
          <div className="text-6xl mb-4">📅</div>
          <div className="text-xl font-medium text-gray-800 mb-2">No data for this month</div>
          <div className="text-gray-500">Check in regularly to see your monthly insights</div>
        </div>
      )}
    </div>
  );
};

// Combined Export Component
const EmotionReports = ({ treeId }) => {
  const [activeTab, setActiveTab] = useState('daily');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'daily'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Daily Log
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'monthly'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Monthly Report
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {activeTab === 'daily' ? (
          <DailyEmotionReport treeId={treeId} />
        ) : (
          <MonthlyEmotionReport treeId={treeId} />
        )}
      </div>
    </div>
  );
};

export default EmotionReports;

export { DailyEmotionReport, MonthlyEmotionReport };