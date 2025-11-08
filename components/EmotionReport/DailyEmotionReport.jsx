import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { emotionEmojis, getEmotionBg, getEmotionColor } from './emojiService';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

import { CalendarPicker } from "./CalendarPicker";
import { emotionService } from '../../services/emotionService';

export const DailyEmotionReport = ({ treeId, activeTab, setActiveTab }) => {
  const { t, timeLang } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [cachedData, setCachedData] = useState({}); // Cache by date string

  // Load data for entire month on mount
  useEffect(() => {
    loadMonthData();
  }, [treeId]);

  // Update displayed data when date changes
  useEffect(() => {
    updateDisplayedData();
  }, [selectedDate, cachedData]);

  // Load entire month of data at once
  const loadMonthData = async () => {
    try {
      setLoading(true);
      
      // Get start of current month
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      
      // Get end of current month
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      const data = await emotionService.getDailyEmotionSummary(treeId, start, end);
      
      // Cache all days by date string
      const cache = {};
      data.forEach(day => {
        cache[day.date] = day;
      });
      
      setCachedData(cache);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update displayed data from cache when date changes
  const updateDisplayedData = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayData = cachedData[dateStr] || null;
    setDailyData(dayData);
    
    // Calculate week data from cache
    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (cachedData[dateStr]) {
        weekDays.push(cachedData[dateStr]);
      }
    }
    setWeekData(weekDays);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Check if we need to load a new month
    if (newDate.getMonth() !== selectedDate.getMonth()) {
      setSelectedDate(newDate);
      // Reload data for the new month
      setTimeout(() => loadMonthData(), 0);
    } else {
      setSelectedDate(newDate);
    }
  };

  const formatDate = (date, timeLang, isMobile = false) => {
    if (isMobile) {
      return date.toLocaleDateString(`${timeLang}`, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    return date.toLocaleDateString(`${timeLang}`, { 
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

  // Helper function to translate description keys
  const translateDescription = (descKey) => {
    // Description keys are stored as lowercase in DB (e.g., "sad", "happy")
    return t(`description.${descKey}`) || descKey;
  };

  // Helper function to translate impact keys
  const translateImpact = (impactKey) => {
    // Impact keys are stored as camelCase in DB (e.g., "family", "socialMedia")
    return t(`impact.${impactKey}`) || impactKey;
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('reports.dailyEmotionLog')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('monthly')}
            className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-600 transition-colors whitespace-nowrap"
          >
            {t('reports.monthly')}
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
            <span className="hidden sm:inline">{formatDate(selectedDate, timeLang)}</span>
            <span className="sm:hidden">{formatDate(selectedDate, timeLang, true)}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {selectedDate.toDateString() === new Date().toDateString() && t('reports.today')}
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
                <div className="text-xs sm:text-sm text-gray-500 mb-1">{t('reports.averageEmotion')}</div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl sm:text-5xl">{emotionEmojis[Math.round(dailyData.avgEmotion)]}</span>
                  <span className={`text-2xl sm:text-3xl font-bold ${getEmotionColor(dailyData.avgEmotion)}`}>
                    {dailyData.avgEmotion.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">{t('reports.checkIns')}</div>
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
                  {trend > 0 ? t('reports.trendUp').replace('{value}', trend.toFixed(1)) :
                   trend < 0 ? t('reports.trendDown').replace('{value}', Math.abs(trend).toFixed(1)) :
                   t('reports.trendStable')}
                </span>
              </div>
            )}
          </div>

          {/* Individual Check-ins */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{t('reports.checkInsToday')}</h3>
            {dailyData.checkIns.map((checkIn) => (
              <div key={checkIn.id} className={`border-2 rounded-2xl p-3 sm:p-4 ${getEmotionBg(checkIn.emotion_level)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">{emotionEmojis[checkIn.emotion_level]}</span>
                    <div>
                      <div className={`text-base sm:text-lg font-semibold ${getEmotionColor(checkIn.emotion_level)}`}>
                        {`${t('reports.level')} ${checkIn.emotion_level}`}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {new Date(checkIn.created_at).toLocaleTimeString(`${timeLang}`, { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {checkIn.descriptions && checkIn.descriptions.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">{t('reports.feeling')}:</div>
                    <div className="flex flex-wrap gap-1">
                      {checkIn.descriptions.map((desc, i) => (
                        <span key={i} className="px-2 py-1 bg-white bg-opacity-50 rounded-lg text-xs font-medium">
                          {t(`${desc}`) || desc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {checkIn.impacts && checkIn.impacts.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">{t('reports.impact')}:</div>
                    <div className="flex flex-wrap gap-1">
                      {checkIn.impacts.map((impact, i) => (
                        <span key={i} className="px-2 py-1 bg-white bg-opacity-50 rounded-lg text-xs font-medium">
                          {t(`${impact}`) || impact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {checkIn.context && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">{t('reports.note')}:</div>
                    <div className="text-xs sm:text-sm text-gray-800 break-words">{checkIn.context}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Week Overview */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md overflow-x-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t('reports.weekOverview')}</h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-max">
              {weekData.map((day, idx) => (
                <div key={idx} className="text-center min-w-[60px]">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString(`${timeLang}`, { weekday: 'short' })}
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
          <div className="text-lg sm:text-xl font-medium text-gray-800 mb-2">{t('reports.noCheckInsYet')}</div>
          <div className="text-sm sm:text-base text-gray-500">{t('reports.startLogging')}</div>
        </div>
      )}
    </div>
  );
};