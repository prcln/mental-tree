import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, X } from 'lucide-react';
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

// Calendar Picker Component
const CalendarPicker = ({ selectedDate, onDateSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (newDate <= new Date()) {
      onDateSelect(newDate);
      onClose();
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isFuture = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > new Date();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => changeMonth(1)}
              disabled={currentMonth >= new Date()}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isFuture(day)}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  isSelected(day)
                    ? 'bg-blue-500 text-white shadow-md'
                    : isToday(day)
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-500'
                    : isFuture(day)
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              onDateSelect(new Date());
              onClose();
            }}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            Jump to Today
          </button>
        </div>
      </div>
    </div>
  );
};

// Daily Emotion Report Component
const DailyEmotionReport = ({ treeId, activeTab, setActiveTab }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

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

  const formatDate = (date, isMobile = false) => {
    if (isMobile) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Daily Emotion Log</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('monthly')}
            className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-600 transition-colors whitespace-nowrap"
          >
            Monthly
          </button>
          <button
            onClick={() => setShowCalendar(true)}
            className="p-2 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
          >
            <Calendar className="text-blue-500" size={24} />
          </button>
        </div>
      </div>

      {/* Calendar Picker Modal */}
      {showCalendar && (
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 sm:p-4 shadow-md">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div className="text-center flex-1 px-2">
          <div className="text-sm sm:text-lg font-semibold text-gray-800">
            <span className="hidden sm:inline">{formatDate(selectedDate)}</span>
            <span className="sm:hidden">{formatDate(selectedDate, true)}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {selectedDate.toDateString() === new Date().toDateString() && 'Today'}
          </div>
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={selectedDate >= new Date()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <ChevronRight size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Daily Summary */}
      {dailyData ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Main Stats */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Average Emotion</div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl sm:text-5xl">{emotionEmojis[Math.round(dailyData.avgEmotion)]}</span>
                  <span className={`text-2xl sm:text-3xl font-bold ${getEmotionColor(dailyData.avgEmotion)}`}>
                    {dailyData.avgEmotion.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Check-ins</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{dailyData.checkCount}</div>
              </div>
            </div>

            {/* Week Trend */}
            {trend !== null && (
              <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-xl ${
                trend > 0 ? 'bg-green-50 text-green-700' : 
                trend < 0 ? 'bg-red-50 text-red-700' : 
                'bg-gray-50 text-gray-700'
              }`}>
                {trend > 0 ? <TrendingUp size={18} /> : 
                 trend < 0 ? <TrendingDown size={18} /> : 
                 <Minus size={18} />}
                <span className="text-xs sm:text-sm font-medium">
                  {trend > 0 ? `Up ${trend.toFixed(1)} from last week` :
                   trend < 0 ? `Down ${Math.abs(trend).toFixed(1)} from last week` :
                   'Stable this week'}
                </span>
              </div>
            )}
          </div>

          {/* Individual Check-ins */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Check-ins Today</h3>
            {dailyData.checkIns.map((checkIn) => (
              <div key={checkIn.id} className={`border-2 rounded-2xl p-3 sm:p-4 ${getEmotionBg(checkIn.emotion_level)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">{emotionEmojis[checkIn.emotion_level]}</span>
                    <div>
                      <div className={`text-base sm:text-lg font-semibold ${getEmotionColor(checkIn.emotion_level)}`}>
                        Level {checkIn.emotion_level}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
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
                    <div className="text-xs sm:text-sm text-gray-800 break-words">{checkIn.context}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Week Overview */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md overflow-x-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Week Overview</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-max">
              {weekData.map((day, idx) => (
                <div key={idx} className="text-center min-w-[60px]">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`p-2 rounded-xl ${getEmotionBg(day.avgEmotion)}`}>
                    <div className="text-xl sm:text-2xl mb-1">{emotionEmojis[Math.round(day.avgEmotion)]}</div>
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
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-md">
          <div className="text-5xl sm:text-6xl mb-4">📝</div>
          <div className="text-lg sm:text-xl font-medium text-gray-800 mb-2">No check-ins yet</div>
          <div className="text-sm sm:text-base text-gray-500">Start logging your emotions to see insights here</div>
        </div>
      )}
    </div>
  );
};

// Monthly Emotion Report Component
const MonthlyEmotionReport = ({ treeId, activeTab, setActiveTab }) => {
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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Monthly Report</h2>
        <button
          onClick={() => setActiveTab('daily')}
          className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          Daily Log
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 sm:p-4 shadow-md">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div className="text-lg sm:text-xl font-semibold text-gray-800">{formatMonth(selectedMonth)}</div>
        <button
          onClick={() => changeMonth(1)}
          disabled={selectedMonth >= new Date()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      {monthlyData && monthlyData.checkCount > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">{emotionEmojis[Math.round(monthlyData.avgEmotion)]}</div>
              <div className={`text-xl sm:text-2xl font-bold ${getEmotionColor(monthlyData.avgEmotion)}`}>
                {monthlyData.avgEmotion.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Average</div>
            </div>
            
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">📊</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{monthlyData.checkCount}</div>
              <div className="text-xs text-gray-500 mt-1">Check-ins</div>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">{emotionEmojis[monthlyData.maxEmotion]}</div>
              <div className={`text-xl sm:text-2xl font-bold ${getEmotionColor(monthlyData.maxEmotion)}`}>
                {monthlyData.maxEmotion}
              </div>
              <div className="text-xs text-gray-500 mt-1">Best Day</div>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">{emotionEmojis[monthlyData.minEmotion]}</div>
              <div className={`text-xl sm:text-2xl font-bold ${getEmotionColor(monthlyData.minEmotion)}`}>
                {monthlyData.minEmotion}
              </div>
              <div className="text-xs text-gray-500 mt-1">Toughest Day</div>
            </div>
          </div>

          {/* Most Common Feelings */}
          {monthlyData.mostCommonDescriptions.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Most Common Feelings</h3>
              <div className="space-y-2">
                {monthlyData.mostCommonDescriptions.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-700 text-sm sm:text-base flex-shrink-0">{item.description}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / monthlyData.checkCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{item.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biggest Impacts */}
          {monthlyData.mostCommonImpacts.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Biggest Impacts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {monthlyData.mostCommonImpacts.map((item, idx) => (
                  <div key={idx} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
                    <div className="font-medium text-gray-800 text-sm sm:text-base">{item.impact}</div>
                    <div className="text-xs sm:text-sm text-purple-600">{item.count} times</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-md">
          <div className="text-5xl sm:text-6xl mb-4">📅</div>
          <div className="text-lg sm:text-xl font-medium text-gray-800 mb-2">No data for this month</div>
          <div className="text-sm sm:text-base text-gray-500">Check in regularly to see your monthly insights</div>
        </div>
      )}
    </div>
  );
};

// Combined Export Component
const EmotionReports = ({ treeId }) => {
  const [activeTab, setActiveTab] = useState('daily');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-20 sm:pt-24">
      {activeTab === 'daily' ? (
        <DailyEmotionReport treeId={treeId} activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <MonthlyEmotionReport treeId={treeId} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

export default EmotionReports;
export { DailyEmotionReport, MonthlyEmotionReport };