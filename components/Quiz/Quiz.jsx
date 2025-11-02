import React, { useState } from 'react';
import { Sun, Cloud, Sparkles, Droplets, MessageCircle, Star } from 'lucide-react';

// Quiz Component
const PersonalityQuiz = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 'morning',
      question: "What's your ideal morning routine?",
      options: [
        { value: 'oak', label: '☀️ Early bird - Up with the sun!', emoji: '🌅' },
        { value: 'willow', label: '🌊 Go with the flow - Wake up naturally', emoji: '😌' },
        { value: 'cherry', label: '🌸 Slow and sweet - Coffee & dreams', emoji: '☕' },
        { value: 'pine', label: '🏔️ Consistent - Same time every day', emoji: '⏰' }
      ]
    },
    {
      id: 'social',
      question: 'How do you recharge after a long day?',
      options: [
        { value: 'oak', label: '🎉 Social gathering with friends', emoji: '👥' },
        { value: 'willow', label: '🎨 Creative solo activities', emoji: '🎨' },
        { value: 'cherry', label: '📚 Cozy reading or movie time', emoji: '🛋️' },
        { value: 'pine', label: '🧘 Peaceful meditation or walk', emoji: '🌲' }
      ]
    },
    {
      id: 'challenge',
      question: 'When facing a challenge, you...',
      options: [
        { value: 'oak', label: '💪 Face it head-on with confidence', emoji: '🦁' },
        { value: 'willow', label: '🌊 Adapt and find creative solutions', emoji: '🦋' },
        { value: 'cherry', label: '💕 Seek support from loved ones', emoji: '🤝' },
        { value: 'pine', label: '🧩 Analyze and plan systematically', emoji: '📊' }
      ]
    },
    {
      id: 'weather',
      question: 'Your favorite weather is...',
      options: [
        { value: 'oak', label: '☀️ Bright and sunny', emoji: '🌞' },
        { value: 'willow', label: '🌧️ Rainy and cozy', emoji: '☔' },
        { value: 'cherry', label: '🌸 Spring blossoms', emoji: '🌺' },
        { value: 'pine', label: '❄️ Fresh and crisp', emoji: '🌨️' }
      ]
    }
  ];

  const treeTypes = {
    oak: {
      name: 'Mighty Oak',
      icon: '🌳',
      description: 'Strong, reliable, and a natural leader. You stand tall and provide shelter for others!',
      trait: 'Strength & Leadership'
    },
    willow: {
      name: 'Graceful Willow',
      icon: '🌿',
      description: 'Flexible, creative, and adaptable. You flow with life\'s changes beautifully!',
      trait: 'Adaptability & Creativity'
    },
    cherry: {
      name: 'Cherry Blossom',
      icon: '🌸',
      description: 'Gentle, loving, and nurturing. You bring beauty and warmth to everyone around you!',
      trait: 'Compassion & Beauty'
    },
    pine: {
      name: 'Evergreen Pine',
      icon: '🌲',
      description: 'Consistent, peaceful, and enduring. You\'re the calm in every storm!',
      trait: 'Stability & Wisdom'
    }
  };

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const counts = {};
      Object.values(newAnswers).forEach(answer => {
        counts[answer] = (counts[answer] || 0) + 1;
      });
      const treeType = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      setTimeout(() => onComplete(treeTypes[treeType]), 500);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-100 via-pink-50 to-green-100 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full animate-slideUp">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-2xl">{questions[currentQuestion].options[0].emoji}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          {questions[currentQuestion].question}
        </h2>

        <div className="space-y-4">
          {questions[currentQuestion].options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option.value)}
              className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 transform hover:scale-102 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-lg font-medium text-gray-700">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz