import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

import { emotionLabels, descriptions, impacts } from '../../constants/emotionLog';

const HourlyEmotionLog = ({ onSubmit, onClose }) => {
  const [step, setStep] = useState(1);
  const [emotionValue, setEmotionValue] = useState(4);
  const [selectedDescriptions, setSelectedDescriptions] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [context, setContext] = useState('');
  const [showAllDescriptions, setShowAllDescriptions] = useState(false);
  const [showAllImpacts, setShowAllImpacts] = useState(false);

  const getCurrentEmotionLabel = () => {
    return emotionLabels.find(e => e.value === emotionValue);
  };

  const getAvailableDescriptions = () => {
    if (emotionValue <= 3) return descriptions.low;
    if (emotionValue <= 5) return descriptions.medium;
    return descriptions.high;
  };

  const getDisplayedDescriptions = () => {
    const all = getAvailableDescriptions();
    return showAllDescriptions ? all : all.slice(0, 6);
  };

  const getDisplayedImpacts = () => {
    return showAllImpacts ? impacts : impacts.slice(0, 6);
  };

  const toggleDescription = (desc) => {
    setSelectedDescriptions(prev => {
      // Prevent double-toggle by checking if already processing
      if (prev.includes(desc)) {
        return prev.filter(d => d !== desc);
      } else {
        return [...prev, desc];
      }
    });
  };

  const toggleImpact = (impact) => {
    setSelectedImpacts(prev => {
      // Prevent double-toggle by checking if already processing
      if (prev.includes(impact)) {
        return prev.filter(i => i !== impact);
      } else {
        return [...prev, impact];
      }
    });
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const calculateScore = () => {
    let score = 0;
    score += emotionValue;
    if (selectedDescriptions.length > 0) {
      score += Math.min(selectedDescriptions.length * 0.5, 2);
    }
    if (selectedImpacts.length > 0) {
      score += Math.min(selectedImpacts.length * 0.67, 2);
    }
    if (context.trim()) {
      const contextLength = context.trim().length;
      if (contextLength >= 150) score += 3;
      else if (contextLength >= 75) score += 2;
      else if (contextLength >= 25) score += 1;
    }
    return Math.min(Math.round((score / 14) * 10), 10);
  };

  const handleSubmit = () => {
    const calculatedScore = calculateScore();
    
    onSubmit({
      emotion_level: emotionValue,
      descriptions: selectedDescriptions,
      impacts: selectedImpacts,
      context: context.trim(),
      score: calculatedScore
    });
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return selectedDescriptions.length > 0;
    if (step === 3) return selectedImpacts.length > 0;
    return true;
  };

  const currentLabel = getCurrentEmotionLabel();
  const allDescriptions = getAvailableDescriptions();
  const allImpacts = impacts;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Progress Indicator */}
        <div className="flex gap-1 p-4 pb-0 flex-shrink-0">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i === step ? 'bg-blue-500' : i < step ? 'bg-blue-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="p-6 pt-4 flex-1 overflow-y-auto flex flex-col">
          {/* Step 1: Emotion Slider */}
          {step === 1 && (
            <div className="flex flex-col h-full">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">How are you feeling?</h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Move the slider to describe your emotion</p>

              <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8">
                <div className="text-center">
                  <div className="text-5xl sm:text-7xl mb-3 transition-all duration-300 ease-out transform hover:scale-110">
                    {currentLabel.emoji}
                  </div>
                  <div className="text-lg sm:text-xl font-medium text-gray-700 transition-all duration-300">
                    {currentLabel.label}
                  </div>
                </div>

                <div className="w-full px-2 sm:px-4">
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={emotionValue}
                      onChange={(e) => setEmotionValue(Number(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          #ef4444 0%, 
                          #f59e0b 20%, 
                          #eab308 35%, 
                          #84cc16 50%,
                          #22c55e 70%, 
                          #10b981 85%, 
                          #059669 100%)`,
                        WebkitAppearance: 'none',
                        outline: 'none'
                      }}
                    />
                    <style jsx>{`
                      input[type="range"]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: white;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        transition: transform 0.15s ease-out;
                      }
                      input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.2);
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: white;
                        cursor: pointer;
                        border: none;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        transition: transform 0.15s ease-out;
                      }
                      input[type="range"]::-moz-range-thumb:hover {
                        transform: scale(1.2);
                      }
                    `}</style>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Unpleasant</span>
                    <span>Pleasant</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: What best describes */}
          {step === 2 && (
            <div className="flex flex-col h-full">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">What best describes it?</h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">Select all that apply <span className="text-blue-500">+0.5 pts each</span></p>

              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                <div className="grid grid-cols-2 gap-2">
                  {getDisplayedDescriptions().map(desc => (
                    <button
                      key={desc}
                      onClick={() => toggleDescription(desc)}
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${
                        selectedDescriptions.includes(desc)
                          ? 'bg-blue-500 text-white shadow-md scale-95'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {desc}
                    </button>
                  ))}
                </div>
                
                {allDescriptions.length > 6 && (
                  <button
                    onClick={() => setShowAllDescriptions(!showAllDescriptions)}
                    className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    {showAllDescriptions ? (
                      <>Show Less <ChevronUp size={16} /></>
                    ) : (
                      <>Show More ({allDescriptions.length - 6} more) <ChevronDown size={16} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: What's having the biggest impact */}
          {step === 3 && (
            <div className="flex flex-col h-full">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">What's impacting you most?</h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">Select up to 3 factors <span className="text-green-500">+0.67 pts each</span></p>

              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                <div className="grid grid-cols-2 gap-2">
                  {getDisplayedImpacts().map(impact => (
                    <button
                      key={impact}
                      onClick={() => toggleImpact(impact)}
                      disabled={selectedImpacts.length >= 3 && !selectedImpacts.includes(impact)}
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${
                        selectedImpacts.includes(impact)
                          ? 'bg-green-500 text-white shadow-md scale-95'
                          : selectedImpacts.length >= 3
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {impact}
                    </button>
                  ))}
                </div>
                
                {allImpacts.length > 6 && (
                  <button
                    onClick={() => setShowAllImpacts(!showAllImpacts)}
                    className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-sm text-green-500 hover:text-green-600 font-medium transition-colors"
                  >
                    {showAllImpacts ? (
                      <>Show Less <ChevronUp size={16} /></>
                    ) : (
                      <>Show More ({allImpacts.length - 6} more) <ChevronDown size={16} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Additional Context */}
          {step === 4 && (
            <div className="flex flex-col h-full">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Add more context?</h2>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                Optional <span className="text-purple-500">+1-3 pts for detail</span>
              </p>

              <textarea
                placeholder="What's on your mind?..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                maxLength={300}
                className="flex-1 min-h-[100px] p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-blue-400 text-gray-700 text-sm sm:text-base transition-colors duration-200"
              />
              <div className="text-right text-xs text-gray-400 mt-2">
                {context.length}/300
                {context.trim().length >= 25 && (
                  <span className="ml-2 text-purple-500">
                    +{context.trim().length >= 150 ? '3' : context.trim().length >= 75 ? '2' : '1'} bonus pts!
                  </span>
                )}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-2">Your log summary:</p>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{currentLabel.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-700 text-sm break-words">
                      {selectedDescriptions.join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 break-words">
                      Impact: {selectedImpacts.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-blue-600">
                    Estimated Score: {calculateScore()}/10 🌟
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="p-4 pt-0 flex-shrink-0">
          <div className="flex gap-2 sm:gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-full font-medium text-sm sm:text-base hover:bg-gray-200 transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            
            <button
              onClick={step === 4 ? handleSubmit : handleNext}
              disabled={!canProceed()}
              className={`flex-1 flex items-center justify-center gap-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm sm:text-base transition-all duration-200 ${
                canProceed()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {step === 4 ? 'Save Log' : 'Continue'}
              {step < 4 && <ChevronRight size={18} />}
            </button>
          </div>

          {/* Skip button for optional step */}
          {step === 4 && (
            <button
              onClick={handleSubmit}
              className="w-full mt-2 py-2 text-gray-500 text-xs sm:text-sm hover:text-gray-700 transition-colors duration-200"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HourlyEmotionLog;