import React, { useState } from 'react';
import { Sun, Cloud, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import MessageDecoration from './MessageDecoration';
import './TreeVisualization.css';

import seed from "../../src/assets/trees/seed.svg";
import sprout from "../../src/assets/trees/sprout.svg";
import sapling from "../../src/assets/trees/sapling.svg";
import young from "../../src/assets/trees/young.svg";
import mature from "../../src/assets/trees/mature.svg";
import blooming from "../../src/assets/trees/blooming.svg";
import { pointsUntilNextStage } from '../../services/stageHelper';

const stageImages = {
  seed,
  sprout,
  sapling,
  young,
  mature,
  blooming,
};

// Stage-specific message positions
const getMessagePositions = (stage) => {
  const positions = {
    seed: [], // No messages for seed
    sprout: [
      { x: 50, y: 30 },
      { x: 55, y: 25 },
    ],
    sapling: [
      { x: 45, y: 25 }, 
      { x: 55, y: 25 }, 
      { x: 50, y: 35 }
    ],
    young: [
      { x: 35, y: 20 }, 
      { x: 50, y: 15 }, 
      { x: 65, y: 20 },
      { x: 40, y: 35 }, 
      { x: 60, y: 35 }
    ],
    mature: [
      { x: 30, y: 15 }, 
      { x: 45, y: 10 }, 
      { x: 55, y: 10 }, 
      { x: 70, y: 15 },
      { x: 35, y: 30 }, 
      { x: 50, y: 25 }, 
      { x: 65, y: 30 },
      { x: 40, y: 45 }, 
      { x: 60, y: 45 }
    ],
    blooming: [
      { x: 25, y: 15 }, 
      { x: 38, y: 10 }, 
      { x: 50, y: 8 }, 
      { x: 62, y: 10 }, 
      { x: 75, y: 15 },
      { x: 30, y: 25 }, 
      { x: 45, y: 22 }, 
      { x: 55, y: 22 }, 
      { x: 70, y: 25 },
      { x: 35, y: 38 }, 
      { x: 50, y: 35 }, 
      { x: 65, y: 38 },
      { x: 40, y: 50 }, 
      { x: 55, y: 52 }, 
      { x: 70, y: 50 }
    ]
  };
  
  return positions[stage] || [];
};

const TreeVisualization = ({ currentStage, messages, moodScore, treeType }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const messagePositions = getMessagePositions(currentStage);
  
  // Calculate messages per page based on available positions
  const messagesPerPage = messagePositions.length || 1; // Show as many as we have positions
  const totalPages = Math.ceil(messages.length / messagesPerPage);
  
  // Get current page messages
  const startIdx = currentPage * messagesPerPage;
  const endIdx = startIdx + messagesPerPage;
  const currentMessages = messages.slice(startIdx, endIdx);
  
  // Only show messages for which we have positions
  const visibleMessages = currentMessages.slice(0, messagePositions.length);
  const currentPositions = messagePositions.slice(0, visibleMessages.length);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="tree-scene">
      {/* Sky */}
      <div className="tree-sky">
        <Sun className="tree-sun" size={40} />
        {currentStage === 'blooming' && (
          <>
            <Cloud className="tree-cloud cloud-1" size={30} />
            <Cloud className="tree-cloud cloud-2" size={25} />
          </>
        )}
      </div>
      
      {/* Tree container */}
      <div className="tree-wrapper">
        <div className={`tree-visual tree-stage-${currentStage}`}>
          <img 
            src={stageImages[currentStage]}
            alt={`Tree at ${currentStage} stage`}
            className="tree-svg"
          />
          
          {currentStage === 'blooming' && (
            <Sparkles className="bloom-sparkle" size={24} />
          )}
        </div>
      </div>

      {/* Ground */}
      <div className="tree-ground"></div>

      {/* Stage Info */}
      <div className="tree-stage-info">
        <div className="stage-label">Stage</div>
        <div className="stage-name">{currentStage}</div>
        <div className="stage-levelup">{pointsUntilNextStage(moodScore)} pts until next stage</div>
      </div>

      {/* Pagination Controls */}
      {messages.length > messagesPerPage && currentStage !== 'seed' && (
        <div className="pagination-controls">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`pagination-btn ${currentPage === 0 ? 'disabled' : ''}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="pagination-info">
            <span className="page-number">
              Page {currentPage + 1} of {totalPages}
            </span>
            <span className="message-range">
              ({startIdx + 1}-{Math.min(endIdx, messages.length)} of {messages.length})
            </span>
          </div>
          
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
            className={`pagination-btn ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Messages overlay */}
        {currentStage !== 'seed' && currentMessages.length > 0 && (
          <div className="messages-layer">
            {currentMessages.map((message, index) => (
              <MessageDecoration
                key={message.id || `${currentPage}-${index}`}
                message={message}
                position={currentPositions[index]}
                index={startIdx + index}
              />
            ))}
          </div>
        )}
    </div>
  );
};

export default TreeVisualization;