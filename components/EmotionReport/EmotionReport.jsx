import React, { useState, useEffect } from 'react';
import { DailyEmotionReport } from './DailyEmotionReport';
import { MonthlyEmotionReport } from './MonthlyEmotionReport';

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