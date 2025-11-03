import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

import { emotionLabels, descriptions, impacts } from '../../constants/emotionLog';

const HourlyEmotionLog = ({ onSubmit, onClose }) => {
  const [step, setStep] = useState(1);
  const [emotionValue, setEmotionValue] = useState(4);
  const [selectedDescriptions, setSelectedDescriptions] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [context, setContext] = useState('');


  const getCurrentEmotionLabel = () => {
    return emotionLabels.find(e => e.value === emotionValue);
  };

  const getAvailableDescriptions = () => {
    if (emotionValue <= 3) return descriptions.low;
    if (emotionValue <= 5) return descriptions.medium;
    return descriptions.high;
  };

  const toggleDescription = (desc) => {
    setSelectedDescriptions(prev =>
      prev.includes(desc) ? prev.filter(d => d !== desc) : [...prev, desc]
    );
  };

  const toggleImpact = (impact) => {
    setSelectedImpacts(prev =>
      prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact]
    );
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Calculate score based on completion
  const calculateScore = () => {
    let score = 0;
    
    // Base score from emotion level (1-7 points)
    score += emotionValue;
    
    // Bonus for selecting descriptions (up to 2 points)
    if (selectedDescriptions.length > 0) {
      score += Math.min(selectedDescriptions.length * 0.5, 2);
    }
    
    // Bonus for identifying impacts (up to 2 points)
    if (selectedImpacts.length > 0) {
      score += Math.min(selectedImpacts.length * 0.67, 2);
    }
    
    // Bonus for adding context (up to 3 points)
    if (context.trim()) {
      const contextLength = context.trim().length;
      if (contextLength >= 150) score += 3;
      else if (contextLength >= 75) score += 2;
      else if (contextLength >= 25) score += 1;
    }
    
    // Total possible: 14 points (7 + 2 + 2 + 3)
    // Normalize to 0-10 scale
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Progress Indicator */}
        <div className="flex gap-1 p-4 pb-0">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i === step ? 'bg-blue-500' : i < step ? 'bg-blue-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="p-6 pt-4 min-h-[400px] flex flex-col">
          {/* Step 1: Emotion Slider */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">How are you feeling?</h2>
              <p className="text-sm text-gray-500 mb-8">Move the slider to describe your emotion</p>

              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="text-center">
                  <div className="text-7xl mb-3 transition-all duration-300 ease-out transform hover:scale-110">
                    {currentLabel.emoji}
                  </div>
                  <div className="text-xl font-medium text-gray-700 transition-all duration-300">
                    {currentLabel.label}
                  </div>
                </div>

                <div className="w-full px-4">
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
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">What best describes it?</h2>
              <p className="text-sm text-gray-500 mb-4">Select all that apply <span className="text-blue-500">+0.5 pts each</span></p>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {getAvailableDescriptions().map(desc => (
                    <button
                      key={desc}
                      onClick={() => toggleDescription(desc)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                        selectedDescriptions.includes(desc)
                          ? 'bg-blue-500 text-white shadow-md scale-95'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {desc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: What's having the biggest impact */}
          {step === 3 && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">What's impacting you most?</h2>
              <p className="text-sm text-gray-500 mb-4">Select up to 3 factors <span className="text-green-500">+0.67 pts each</span></p>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {impacts.map(impact => (
                    <button
                      key={impact}
                      onClick={() => toggleImpact(impact)}
                      disabled={selectedImpacts.length >= 3 && !selectedImpacts.includes(impact)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
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
              </div>
            </div>
          )}

          {/* Step 4: Additional Context */}
          {step === 4 && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Add more context?</h2>
              <p className="text-sm text-gray-500 mb-4">
                Optional <span className="text-purple-500">+1-3 pts for detail</span>
              </p>

              <textarea
                placeholder="What's on your mind?..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                maxLength={300}
                className="flex-1 p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-blue-400 text-gray-700 transition-colors duration-200"
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
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-2">Your log summary:</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">{currentLabel.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-700">
                      {selectedDescriptions.join(', ')}
                    </div>
                    <div className="text-xs text-gray-500">
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

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}
            
            <button
              onClick={step === 4 ? handleSubmit : handleNext}
              disabled={!canProceed()}
              className={`flex-1 flex items-center justify-center gap-1 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                canProceed()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {step === 4 ? 'Save Log' : 'Continue'}
              {step < 4 && <ChevronRight size={20} />}
            </button>
          </div>

          {/* Skip button for optional step */}
          {step === 4 && (
            <button
              onClick={handleSubmit}
              className="w-full mt-2 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors duration-200"
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