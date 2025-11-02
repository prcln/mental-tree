import React, { useState } from 'react';
import './PersonalityQuiz.css';

// ==================== QUIZ CONFIGURATION ====================
// Easily modify questions, options, and tree types here!

const QUIZ_CONFIG = {
  // Define your tree types here
  treeTypes: {
    oak: {
      name: 'Mighty Oak',
      icon: '🌳',
      description: 'Strong, reliable, and a natural leader. You stand tall and provide shelter for others!',
      trait: 'Strength & Leadership',
      color: '#8B4513'
    },
    willow: {
      name: 'Graceful Willow',
      icon: '🌿',
      description: 'Flexible, creative, and adaptable. You flow with life\'s changes beautifully!',
      trait: 'Adaptability & Creativity',
      color: '#90EE90'
    },
    cherry: {
      name: 'Cherry Blossom',
      icon: '🌸',
      description: 'Gentle, loving, and nurturing. You bring beauty and warmth to everyone around you!',
      trait: 'Compassion & Beauty',
      color: '#FFB6C1'
    },
    pine: {
      name: 'Evergreen Pine',
      icon: '🌲',
      description: 'Consistent, peaceful, and enduring. You\'re the calm in every storm!',
      trait: 'Stability & Wisdom',
      color: '#228B22'
    }
  },

  // Define your questions here
  questions: [
    {
      id: 'morning',
      question: "What's your ideal morning routine?",
      headerEmoji: '🌅',
      options: [
        { 
          treeType: 'oak', 
          label: 'Early bird - Up with the sun!', 
          emoji: '☀️',
          description: 'I wake up energized and ready to conquer the day'
        },
        { 
          treeType: 'willow', 
          label: 'Go with the flow - Wake up naturally', 
          emoji: '🌊',
          description: 'I let my body tell me when it\'s time to rise'
        },
        { 
          treeType: 'cherry', 
          label: 'Slow and sweet - Coffee & dreams', 
          emoji: '🌸',
          description: 'I savor my morning with warmth and comfort'
        },
        { 
          treeType: 'pine', 
          label: 'Consistent - Same time every day', 
          emoji: '🏔️',
          description: 'I value routine and predictability'
        }
      ]
    },
    {
      id: 'social',
      question: 'How do you recharge after a long day?',
      headerEmoji: '🔋',
      options: [
        { 
          treeType: 'oak', 
          label: 'Social gathering with friends', 
          emoji: '🎉',
          description: 'Energy comes from being around others'
        },
        { 
          treeType: 'willow', 
          label: 'Creative solo activities', 
          emoji: '🎨',
          description: 'I express myself through art and creativity'
        },
        { 
          treeType: 'cherry', 
          label: 'Cozy reading or movie time', 
          emoji: '📚',
          description: 'Comfort and relaxation restore my soul'
        },
        { 
          treeType: 'pine', 
          label: 'Peaceful meditation or walk', 
          emoji: '🧘',
          description: 'I find peace in quiet reflection'
        }
      ]
    },
    {
      id: 'challenge',
      question: 'When facing a challenge, you...',
      headerEmoji: '💪',
      options: [
        { 
          treeType: 'oak', 
          label: 'Face it head-on with confidence', 
          emoji: '🦁',
          description: 'I tackle problems directly and boldly'
        },
        { 
          treeType: 'willow', 
          label: 'Adapt and find creative solutions', 
          emoji: '🦋',
          description: 'I bend but never break, finding new paths'
        },
        { 
          treeType: 'cherry', 
          label: 'Seek support from loved ones', 
          emoji: '💕',
          description: 'Together, we can overcome anything'
        },
        { 
          treeType: 'pine', 
          label: 'Analyze and plan systematically', 
          emoji: '🧩',
          description: 'Careful planning leads to success'
        }
      ]
    },
    {
      id: 'weather',
      question: 'Your favorite weather is...',
      headerEmoji: '🌤️',
      options: [
        { 
          treeType: 'oak', 
          label: 'Bright and sunny', 
          emoji: '☀️',
          description: 'Clear skies and warm sunshine'
        },
        { 
          treeType: 'willow', 
          label: 'Rainy and cozy', 
          emoji: '🌧️',
          description: 'The sound of rain is soothing'
        },
        { 
          treeType: 'cherry', 
          label: 'Spring blossoms', 
          emoji: '🌸',
          description: 'New beginnings and fresh blooms'
        },
        { 
          treeType: 'pine', 
          label: 'Fresh and crisp', 
          emoji: '❄️',
          description: 'Clean, cool air that clears the mind'
        }
      ]
    },
    {
      id: 'weekend',
      question: 'Your ideal weekend activity?',
      headerEmoji: '🎯',
      options: [
        { 
          treeType: 'oak', 
          label: 'Outdoor adventure or sports', 
          emoji: '🏃',
          description: 'Active and exciting experiences'
        },
        { 
          treeType: 'willow', 
          label: 'Exploring new places or hobbies', 
          emoji: '🗺️',
          description: 'Discovery and new experiences'
        },
        { 
          treeType: 'cherry', 
          label: 'Quality time with loved ones', 
          emoji: '❤️',
          description: 'Making memories with special people'
        },
        { 
          treeType: 'pine', 
          label: 'Relaxing at home', 
          emoji: '🏡',
          description: 'Peace and tranquility in my space'
        }
      ]
    }
  ],

  // ==================== RESULT CALCULATION METHODS ====================
  // Choose which method to use by setting the 'calculationMethod' below
  
  calculationMethods: {
    // METHOD 1: Most Frequent (Default) - The tree type chosen most often wins
    mostFrequent: (answers) => {
      const counts = {};
      Object.values(answers).forEach(answer => {
        counts[answer] = (counts[answer] || 0) + 1;
      });
      return Object.keys(counts).reduce((a, b) => 
        counts[a] > counts[b] ? a : b
      );
    },

    // METHOD 2: Weighted Score - Each question can have different importance
    weighted: (answers, questionWeights = {}) => {
      const scores = {};
      
      Object.entries(answers).forEach(([questionId, treeType]) => {
        const weight = questionWeights[questionId] || 1; // Default weight is 1
        scores[treeType] = (scores[treeType] || 0) + weight;
      });
      
      return Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
      );
    },

    // METHOD 3: Priority Questions - Some questions matter more than others
    priority: (answers, priorityQuestions = []) => {
      // First check priority questions
      for (const questionId of priorityQuestions) {
        if (answers[questionId]) {
          return answers[questionId];
        }
      }
      
      // If no priority match, use most frequent
      return QUIZ_CONFIG.calculationMethods.mostFrequent(answers);
    },

    // METHOD 4: Custom Scoring - Full control over scoring logic
    custom: (answers) => {
      // Example: Give extra points for certain combinations
      const scores = {};
      
      Object.values(answers).forEach(answer => {
        scores[answer] = (scores[answer] || 0) + 1;
      });
      
      // Bonus logic examples:
      // If user chose 'oak' for both 'morning' and 'challenge', add bonus
      if (answers.morning === 'oak' && answers.challenge === 'oak') {
        scores.oak = (scores.oak || 0) + 2;
      }
      
      // If user chose 'cherry' for 'social' and 'weekend', add bonus
      if (answers.social === 'cherry' && answers.weekend === 'cherry') {
        scores.cherry = (scores.cherry || 0) + 2;
      }
      
      return Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
      );
    },

    // METHOD 5: Threshold-Based - Need minimum answers for a result
    threshold: (answers, minThreshold = 3) => {
      const counts = {};
      Object.values(answers).forEach(answer => {
        counts[answer] = (counts[answer] || 0) + 1;
      });
      
      // Find tree types that meet the threshold
      const qualified = Object.keys(counts).filter(
        tree => counts[tree] >= minThreshold
      );
      
      if (qualified.length > 0) {
        return qualified.reduce((a, b) => 
          counts[a] > counts[b] ? a : b
        );
      }
      
      // If no tree meets threshold, return most frequent
      return Object.keys(counts).reduce((a, b) => 
        counts[a] > counts[b] ? a : b
      );
    }
  },

  // ==================== SELECT YOUR CALCULATION METHOD HERE ====================
  // Options: 'mostFrequent', 'weighted', 'priority', 'custom', 'threshold'
  calculationMethod: 'mostFrequent',

  // Configuration for specific methods (customize as needed)
  methodConfig: {
    // For 'weighted' method: assign weights to questions
    questionWeights: {
      challenge: 2,    // This question is twice as important
      morning: 1.5,    // This question is 1.5x as important
      social: 1,       // Normal weight
      weather: 1,      // Normal weight
      weekend: 1       // Normal weight
    },

    // For 'priority' method: questions in order of importance
    priorityQuestions: ['challenge', 'social', 'morning'],

    // For 'threshold' method: minimum number of same answers needed
    minThreshold: 3
  }
};

// ==================== END CONFIGURATION ====================

const PersonalityQuiz = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);

  const { questions, treeTypes, calculationMethod, calculationMethods, methodConfig } = QUIZ_CONFIG;

  const calculateResult = (finalAnswers) => {
    const method = calculationMethods[calculationMethod];
    
    if (!method) {
      console.error(`Invalid calculation method: ${calculationMethod}`);
      return calculationMethods.mostFrequent(finalAnswers);
    }

    // Call the appropriate method with its config
    switch (calculationMethod) {
      case 'weighted':
        return method(finalAnswers, methodConfig.questionWeights);
      case 'priority':
        return method(finalAnswers, methodConfig.priorityQuestions);
      case 'threshold':
        return method(finalAnswers, methodConfig.minThreshold);
      default:
        return method(finalAnswers);
    }
  };

  const handleAnswer = (treeType) => {
    setIsAnimating(true);
    
    const newAnswers = { 
      ...answers, 
      [questions[currentQuestion].id]: treeType 
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      // Calculate result using the configured method
      const resultTreeType = calculateResult(newAnswers);
      
      // Return result with tree type string for database
      setTimeout(() => {
        onComplete({
          treeType: resultTreeType, // This is the string: 'oak', 'willow', etc.
          treeInfo: treeTypes[resultTreeType], // Full tree information
          answers: newAnswers, // User's answers for reference
          calculationMethod: calculationMethod // Which method was used
        });
      }, 500);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="quiz-container">
      <div className={`quiz-card ${isAnimating ? 'animating' : ''}`}>
        {/* Progress Section */}
        <div className="quiz-header">
          <div className="progress-info">
            <span className="question-counter">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="header-emoji">{currentQ.headerEmoji}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="quiz-question">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="quiz-options">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option.treeType)}
              className="quiz-option"
              style={{
                animationDelay: `${idx * 0.1}s`
              }}
            >
              <div className="option-content">
                <span className="option-emoji">{option.emoji}</span>
                <div className="option-text">
                  <span className="option-label">{option.label}</span>
                  {option.description && (
                    <span className="option-description">{option.description}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="quiz-navigation">
          {currentQuestion > 0 && (
            <button onClick={handlePrevious} className="btn-previous">
              ← Previous
            </button>
          )}
          <div className="quiz-dots">
            {questions.map((_, idx) => (
              <div 
                key={idx}
                className={`dot ${idx === currentQuestion ? 'active' : ''} ${idx < currentQuestion ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;