export const QUIZ_CONFIG = {
  backgrounds: {
    start: 'start',
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  // Animation timing configuration
  animations: {
    cardDelay: 300,
    stageInDuration: 800,
    stageOutDuration: 600,
    backgroundDim: 400,
    whiteOverlayDuration: 800,
    narrativeDisplay: 3500,
    narrativeTransition: 400,
    optionStagger: 80
  },

  questions: [
    {
      id: 'q1',
      question: 'How do you approach the mysterious glowing doorway?',
      headerEmoji: '🚪',
      narratives: [
        {
          text: "Last night, before going to sleep, a portal appeared in your bedroom...",
          emoji: "",
          duration: 2500
        },
        {
          text: "Traveler, Fruitville needs a new champion. Enter the portal before sunrise… if you are brave enough...",
          emoji: "🌟",
          duration: 2500
        },
      ],
      background: 'question1',
      options: [
        {
          emoji: '🏃',
          label: 'Jump right in, no time to waste',
          description: 'Bold entrance',
          points: { bold: 5 }
        },
        {
          emoji: '👀',
          label: 'Look carefully first, then step in',
          description: 'Measured approach',
          points: { balanced: 3 }
        },
        {
          emoji: '🧘',
          label: 'Take a deep breath before going through',
          description: 'Centered and calm',
          points: { balanced: 3 }
        },
        {
          emoji: '🤔',
          label: 'Stare at it for a while, uncertain',
          description: 'Hesitant steps',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q2',
      question: 'The portal opens into floating orchards and shimmering fruit-creatures watching you. How do you take your first steps?',
      headerEmoji: '🌳',
      narrative: {
        text: "Colors swirl around you as reality shifts. You emerge into a world where fruits have consciousness and orchards float among clouds...",
        emoji: "🌈",
        duration: 3500
      },
      background: 'question2',
      options: [
        {
          emoji: '💪',
          label: 'Bold and confident — new world, new you',
          description: 'Own the moment',
          points: { bold: 5 }
        },
        {
          emoji: '👁️',
          label: 'Calm and observant',
          description: 'Taking it all in',
          points: { balanced: 3 }
        },
        {
          emoji: '🤫',
          label: 'Quiet and careful',
          description: 'Treading lightly',
          points: { cautious: 1 }
        },
        {
          emoji: '😶',
          label: 'Trying not to be noticed',
          description: 'Staying invisible',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q3',
      question: 'How do you move through the shining crowd?',
      headerEmoji: '✨',
      narrative: {
        text: "Luminescent beings gather around, their forms shifting between fruit and humanoid shapes. They part to create a path...",
        emoji: "👥",
        duration: 3500
      },
      background: 'question3',
      options: [
        {
          emoji: '👑',
          label: 'Strong strides: front of the line',
          description: 'Lead the way',
          points: { bold: 5 }
        },
        {
          emoji: '🦶',
          label: 'Small but excited steps',
          description: 'Eager energy',
          points: { balanced: 3 }
        },
        {
          emoji: '🚶',
          label: 'Smooth and steady',
          description: 'Even pace',
          points: { balanced: 3 }
        },
        {
          emoji: '🐌',
          label: 'Slow and cautious',
          description: 'No rush',
          points: { cautious: 1 }
        },
        {
          emoji: '👤',
          label: 'Trying to blend in',
          description: 'Part of the crowd',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q4',
      question: 'How do you present yourself before the ancient Fruit Council?',
      headerEmoji: '🏛️',
      narrative: {
        text: "The grand hall opens before you. Seven ancient fruit beings sit on crystalline thrones, their eyes fixed upon you with timeless wisdom...",
        emoji: "⚖️",
        duration: 4000
      },
      background: 'question4',
      options: [
        {
          emoji: '🛡️',
          label: 'Arms crossed — protective',
          description: 'Guarded stance',
          points: { balanced: 3 }
        },
        {
          emoji: '🙏',
          label: 'Hands clasped — respectful',
          description: 'Showing respect',
          points: { balanced: 3 }
        },
        {
          emoji: '💁',
          label: 'Hands on hips — confident',
          description: 'Power pose',
          points: { bold: 5 }
        },
        {
          emoji: '😊',
          label: 'Relaxed and friendly',
          description: 'Open approach',
          points: { balanced: 3 }
        },
        {
          emoji: '😰',
          label: 'Nervously fidgeting',
          description: 'Anxious energy',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q5',
      question: 'How do you rest on the giant leaf-couch?',
      headerEmoji: '🍃',
      narrative: {
        text: "After the council's blessing, you're led to a chamber of rest. A massive leaf, soft as silk, awaits you...",
        emoji: "💤",
        duration: 3000
      },
      background: 'question5',
      options: [
        {
          emoji: '🪑',
          label: 'Perfect posture, legs together',
          description: 'Proper form',
          points: { balanced: 3 }
        },
        {
          emoji: '🧘',
          label: 'Legs crossed',
          description: 'Comfortable sit',
          points: { balanced: 3 }
        },
        {
          emoji: '🛋️',
          label: 'Legs stretched out',
          description: 'Fully relaxed',
          points: { bold: 5 }
        },
        {
          emoji: '🐱',
          label: 'One leg tucked beneath you',
          description: 'Cozy position',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q6',
      question: 'How do you enter the Grand Fruit Ball?',
      headerEmoji: '💃',
      narratives: [
        {
          text: "Evening falls over the fruit kingdom. The Grand Ball begins, and music fills the crystalline halls... You must enter the Grand Fruit Ball alone.",
          emoji: "🎵",
          duration: 3500
        },
        {
          text: "Thousands of fruit-beings dance in swirling patterns. All eyes turn to the entrance as you arrive...",
          emoji: "👀",
          duration: 2500
        }
      ],
      background: 'question6',
      options: [
        {
          emoji: '🌟',
          label: 'Bold — everyone sees you',
          description: 'Grand entrance',
          points: { bold: 5 }
        },
        {
          emoji: '🚶',
          label: 'Calm and measured',
          description: 'Steady arrival',
          points: { balanced: 3 }
        },
        {
          emoji: '🤐',
          label: 'As quietly as possible',
          description: 'Slip in unnoticed',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q7',
      question: 'When the crystal interrupts your focus, you feel:',
      headerEmoji: '🔮',
      narrative: {
        text: "You’re studying ancient scrolls when a floating crystal interrupts...",
        emoji: "⚡",
        duration: 2500
      },
      background: 'question7',
      options: [
        {
          emoji: '😌',
          label: 'Relieved for the break',
          description: 'Welcome pause',
          points: { balanced: 3 }
        },
        {
          emoji: '😤',
          label: 'Low-key annoyed',
          description: 'Don\'t interrupt me',
          points: { bold: 5 }
        },
        {
          emoji: '😐',
          label: 'Neutral, a little thrown off',
          description: 'Slightly jarred',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q8',
      question: 'Which appears?',
      headerEmoji: '🎨',
      narrative: {
        text: "The Oracle Crystal shows you colors beyond the human spectrum. One color resonates with your very essence...",
        emoji: "🌟",
        duration: 3500
      },
      background: 'question8',
      options: [
        {
          emoji: '🔥',
          label: 'Fiery red or orange',
          description: 'Intense energy',
          points: { bold: 5 }
        },
        {
          emoji: '⬛',
          label: 'Black',
          description: 'Deep mystery',
          points: { bold: 5 }
        },
        {
          emoji: '☀️',
          label: 'Yellow or sky blue',
          description: 'Bright and clear',
          points: { balanced: 3 }
        },
        {
          emoji: '🌿',
          label: 'Leafy green',
          description: 'Natural calm',
          points: { balanced: 3 }
        },
        {
          emoji: '🌊',
          label: 'Deep blue or purple',
          description: 'Thoughtful depth',
          points: { balanced: 3 }
        },
        {
          emoji: '⚪',
          label: 'Pure white',
          description: 'Clean clarity',
          points: { cautious: 1 }
        },
        {
          emoji: '🪨',
          label: 'Earthy brown or gray',
          description: 'Grounded tone',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q9',
      question: 'Your sleeping posture reveals:',
      headerEmoji: '😴',
      narrative: {
        text: "After studying the scrolls and crystal for a while, you sleep inside a giant flowering fruit shell. The way you sleep reveals truths about your deepest self...",
        emoji: "🌙",
        duration: 3500
      },
      background: 'question9',
      options: [
        {
          emoji: '🧍',
          label: 'On your back, fully stretched',
          description: 'Starfish position',
          points: { bold: 5 }
        },
        {
          emoji: '🙇',
          label: 'Face down',
          description: 'Full commitment',
          points: { bold: 5 }
        },
        {
          emoji: '🌙',
          label: 'On your side, curled slightly',
          description: 'Gentle curve',
          points: { balanced: 3 }
        },
        {
          emoji: '💤',
          label: 'One arm under your head',
          description: 'Relaxed pose',
          points: { balanced: 3 }
        },
        {
          emoji: '🛏️',
          label: 'Completely under covers',
          description: 'Cocooned safely',
          points: { cautious: 1 }
        }
      ]
    },
    {
      id: 'q10',
      question: 'What do you dream of most often?',
      headerEmoji: '💭',
      narratives: [
        {
          text: "In the realm of dreams, the fruit spirits watch over you. Your subconscious reveals its secrets...",
          emoji: "✨",
          duration: 3000
        },
        {
          text: "The final truth emerges from the depths of sleep. What appears in your mind's eye?",
          emoji: "🌌",
          duration: 3500
        }
      ],
      background: 'question10',
      options: [
        {
          emoji: '🪂',
          label: 'Falling',
          description: 'Losing control',
          points: { balanced: 3 }
        },
        {
          emoji: '⚔️',
          label: 'Fighting or struggling',
          description: 'Inner battle',
          points: { bold: 5 }
        },
        {
          emoji: '🔍',
          label: 'Searching for something',
          description: 'On a quest',
          points: { balanced: 3 }
        },
        {
          emoji: '🕊️',
          label: 'Flying or floating',
          description: 'Pure freedom',
          points: { bold: 5 }
        },
        {
          emoji: '⚫',
          label: 'No dream at all',
          description: 'Blank slate',
          points: { cautious: 1 }
        },
        {
          emoji: '🌈',
          label: 'Pleasant dream worlds',
          description: 'Sweet escape',
          points: { cautious: 1 }
        }
      ]
    }
  ],

  fruitTypes: {
    peach: {
      name: 'The Peach',
      emoji: '🍑',
      description: 'Warm, soft, thoughtful',
      traits: ['Gentle', 'Considerate', 'Empathetic', 'Nurturing'],
      scoreRange: '0-21'
    },
    greenApple: {
      name: 'The Green Apple',
      emoji: '🍏',
      description: 'Reliable, structured, grounded',
      traits: ['Dependable', 'Organized', 'Practical', 'Steady'],
      scoreRange: '21-30'
    },
    mango: {
      name: 'The Mango',
      emoji: '🥭',
      description: 'Warm, friendly, refreshing, steady',
      traits: ['Balanced', 'Approachable', 'Refreshing', 'Harmonious'],
      scoreRange: '31-40'
    },
    strawberry: {
      name: 'The Strawberry',
      emoji: '🍓',
      description: 'Charming, sweet, main-character energy',
      traits: ['Charismatic', 'Delightful', 'Magnetic', 'Vibrant'],
      scoreRange: '41-50'
    },
    pineapple: {
      name: 'The Pineapple',
      emoji: '🍍',
      description: 'Adventurous, exciting, a spark everywhere you go',
      traits: ['Bold', 'Adventurous', 'Energetic', 'Inspiring'],
      scoreRange: '51-60'
    },
    grapes: {
      name: 'The Grapes',
      emoji: '🍇',
      description: 'Powerful presence, dramatic flair, natural leader energy',
      traits: ['Commanding', 'Dramatic', 'Influential', 'Confident'],
      scoreRange: '60+'
    }
  }
};