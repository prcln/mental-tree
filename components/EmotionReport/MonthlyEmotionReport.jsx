import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { emotionEmojis, getEmotionBg, getEmotionColor } from './emojiService';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';
import { emotionService } from '../../services/emotionService';


export const MonthlyEmotionReport = ({ treeId, activeTab, setActiveTab }) => {
  const { t, timeLang } = useLanguage();
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
      const data = await emotionService.getMonthlyEmotionSummary(treeId, year, month);
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
    return date.toLocaleDateString(`${timeLang}`, { month: 'long', year: 'numeric' });
  };

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
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('reports.monthlyReport')}</h2>
        <button
          onClick={() => setActiveTab('daily')}
          className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          {t('reports.dailyLog')}
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
              <div className="text-xs text-gray-500 mt-1">{t('reports.average')}</div>
            </div>
            
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">📊</div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{monthlyData.checkCount}</div>
              <div className="text-xs text-gray-500 mt-1">{t('reports.checkIns')}</div>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">{emotionEmojis[monthlyData.maxEmotion]}</div>
              <div className={`text-xl sm:text-2xl font-bold ${getEmotionColor(monthlyData.maxEmotion)}`}>
                {monthlyData.maxEmotion}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('reports.bestDay')}</div>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-md text-center">
              <div className="text-2xl sm:text-3xl mb-2">{emotionEmojis[monthlyData.minEmotion]}</div>
              <div className={`text-xl sm:text-2xl font-bold ${getEmotionColor(monthlyData.minEmotion)}`}>
                {monthlyData.minEmotion}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('reports.toughestDay')}</div>
            </div>
          </div>

          {/* Most Common Feelings */}
          {monthlyData.mostCommonDescriptions.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t('reports.mostCommonFeelings')}</h3>
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
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t('reports.biggestImpacts')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {monthlyData.mostCommonImpacts.map((item, idx) => (
                  <div key={idx} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
                    <div className="font-medium text-gray-800 text-sm sm:text-base">{item.impact}</div>
                    <div className="text-xs sm:text-sm text-purple-600">{item.count} {t('reports.biggestImpacts')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-md">
          <div className="text-5xl sm:text-6xl mb-4">📅</div>
          <div className="text-lg sm:text-xl font-medium text-gray-800 mb-2">{t('reports.biggestImpacts')}</div>
          <div className="text-sm sm:text-base text-gray-500">{t('reports.checkInRegularly')}</div>
        </div>
      )}
    </div>
  );
};