import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

export const CalendarPicker = ({ selectedDate, onDateSelect, onClose }) => {
  const { t, timeLang } = useLanguage();
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
            {currentMonth.toLocaleDateString(`${timeLang}`, { month: 'long', year: 'numeric' })}
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
          {[t('reports.sun'), t('reports.mon'), t('reports.tue'), t('reports.wed'), t('reports.thu'), t('reports.fri'), t('reports.sat')].map(day => (
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
            {t('reports.jumpToToday')}
          </button>
        </div>
      </div>
    </div>
  );
};