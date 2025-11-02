import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Sparkles } from 'lucide-react';
import MessageDecoration from './MessageDecoration';
import './TreeVisualization.css';

const TreeVisualization = ({ stage, messages, moodScore }) => {
  const [currentStage, setCurrentStage] = useState('seed');

  // Calculate stage based on mood score
  useEffect(() => {
    if (moodScore < 10) setCurrentStage('seed');
    else if (moodScore < 30) setCurrentStage('sprout');
    else if (moodScore < 60) setCurrentStage('sapling');
    else if (moodScore < 100) setCurrentStage('young');
    else if (moodScore < 150) setCurrentStage('mature');
    else setCurrentStage('blooming');
  }, [moodScore]);

  // Message positions on tree
  const messagePositions = [
    { x: 45, y: 25 }, { x: 65, y: 30 }, { x: 35, y: 35 },
    { x: 70, y: 45 }, { x: 30, y: 50 }, { x: 55, y: 40 },
    { x: 40, y: 55 }, { x: 60, y: 60 }, { x: 50, y: 20 }
  ];

  return (
    <div className="tree-scene">
      <div className="tree-sky">
        <Sun className="tree-sun" size={40} />
        {currentStage === 'blooming' && (
          <>
            <Cloud className="tree-cloud cloud-1" size={30} />
            <Cloud className="tree-cloud cloud-2" size={25} />
          </>
        )}
      </div>
      
      <div className="tree-wrapper">
        <div className={`tree-visual tree-stage-${currentStage}`}>
          <img 
            src={`/assets/trees/${currentStage}.svg`}
            alt={`Tree at ${currentStage} stage`}
            className="tree-svg"
          />
          
          {currentStage === 'blooming' && (
            <Sparkles className="bloom-sparkle" size={24} />
          )}
        </div>
        
        {/* Messages overlay */}
        {currentStage !== 'seed' && (
          <div className="messages-layer">
            {messages.slice(0, messagePositions.length).map((message, index) => (
              <MessageDecoration
                key={message.id}
                message={message}
                position={messagePositions[index]}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      <div className="tree-ground"></div>
    </div>
  );
};

export default TreeVisualization;