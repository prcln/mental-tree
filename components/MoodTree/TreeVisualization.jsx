import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import MessageDecoration from '../MessageComponents/MessageDecoration';
import './TreeVisualization.css';
import { fruitEmojis } from '../../constants/fruits';
import { pointsUntilNextStage } from '../../services/stageHelper';
import { fruitService } from '../../services/fruitService';
import { positionsFruit, positionsTree } from '../../constants/tree';

import seedImg from '../../src/assets/tree_stages/seed.svg';
import sproutImg from '../../src/assets/tree_stages/sprout.svg';
import saplingImg from '../../src/assets/tree_stages/sapling.svg';
import youngImg from '../../src/assets/tree_stages/young.svg';
import matureImg from '../../src/assets/tree_stages/mature.svg';
import bloomingImg from '../../src/assets/tree_stages/mature.svg';

const stageImages = {
  seed: seedImg,
  sprout: sproutImg,
  sapling: saplingImg,
  young: youngImg,
  mature: matureImg,
  blooming: bloomingImg,
};


// Stage-specific message positions
const getMessagePositions = (stage) => {
  return positionsTree[stage] || [];
};

// Fruit positions on the tree
const getFruitPositions = (stage) => {

  
  return positionsFruit[stage] || [];
};

const TreeVisualization = ({ currentStage, messages, moodScore, treeType, currentUserId, treeId, fruits: externalFruits, onFruitCollect }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [fruits, setFruits] = useState([]);
  const [collecting, setCollecting] = useState(null);
  const [collectionEffect, setCollectionEffect] = useState(null);

  const messagePositions = getMessagePositions(currentStage);
  const fruitPositions = getFruitPositions(currentStage);
  const StageImage = stageImages[currentStage];
  
  // Calculate messages per page based on available positions
  const messagesPerPage = messagePositions.length || 1;
  const totalPages = Math.ceil(messages.length / messagesPerPage);
  
  // Get current page messages
  const startIdx = currentPage * messagesPerPage;
  const endIdx = startIdx + messagesPerPage;
  const currentMessages = messages.slice(startIdx, endIdx);
  
  // Only show messages for which we have positions
  const visibleMessages = currentMessages.slice(0, messagePositions.length);
  const currentPositions = messagePositions.slice(0, visibleMessages.length);

  // Load fruits when treeId changes
  useEffect(() => {
    if (externalFruits) {
      setFruits(externalFruits);
    }
  }, [externalFruits]);

  const loadFruits = async () => {
    if (!treeId) return;
    try {
      const data = await fruitService.getTreeFruits(treeId);
      console.log('Loaded fruits:', data); // Debug log
      setFruits(data);
    } catch (error) {
      console.error('Error loading fruits:', error);
    }
  };

  const handleCollect = async (fruitId, fruitType) => {
    if (!currentUserId) {
      alert('Please sign in to collect fruits');
      return;
    }

    if (collecting) {
      return; // Prevent multiple clicks
    }

    setCollecting(fruitId);
    
    try {
      const result = await fruitService.collectFruit(fruitId, currentUserId);
      
      // Check for either success or collected property
      if (result && (result.success || result.collected)) {
        // Show collection effect
        setCollectionEffect({ type: fruitType, timestamp: Date.now() });
        setTimeout(() => setCollectionEffect(null), 2000);
        
        // Remove fruit from local state immediately
        setFruits(prevFruits => {
          const newFruits = prevFruits.filter(f => f.id !== fruitId);
          console.log('Fruits before:', prevFruits.length, 'Fruits after:', newFruits.length);
          return newFruits;
        });
        
        // Notify parent component with the right structure
        if (onFruitCollect) {
          onFruitCollect({
            fruit_type: result.fruit_type,
            success: true,
            ...result
          });
        }
      } else {
        console.error('Collection failed:', result);
        alert('Failed to collect fruit');
      }
    } catch (error) {
      console.error('Error collecting fruit:', error);
      alert(error.message || 'Failed to collect fruit. Please try again.');
    } finally {
      setCollecting(null);
    }
  };

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
      {/* Tree container */}
      <div className="tree-wrapper">
        <div className={`tree-visual tree-stage-${currentStage}`}>
          <img 
            src={StageImage}
            alt={`Tree at ${currentStage} stage`}
            className="tree-svg"
          />
          
          {currentStage === 'blooming' && (
            <Sparkles className="bloom-sparkle" size={24} />
          )}

          {/* Messages overlay - positioned relative to tree */}
          {currentStage !== 'seed' && currentMessages.length > 0 && (
            <div className="messages-layer">
              {currentMessages.map((message, index) => (
                <MessageDecoration
                  key={message.id || `${currentPage}-${index}`}
                  message={message}
                  position={currentPositions[index]}
                  index={startIdx + index}
                  currentUserId={currentUserId}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          )}

          {/* Fruits overlay - positioned relative to tree */}
          {fruits.length > 0 && currentStage !== 'seed' && (
            <div className="fruits-layer">
              {fruits.slice(0, fruitPositions.length).map((fruit, index) => {
                const position = fruitPositions[index];
                return (
                  <button
                    key={fruit.id}
                    onClick={() => handleCollect(fruit.id, fruit.fruit_type)}
                    disabled={collecting === fruit.id}
                    style={{
                      position: 'absolute',
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      background: 'none',
                      border: 'none',
                      cursor: collecting === fruit.id ? 'not-allowed' : 'pointer',
                      fontSize: '2rem',
                      zIndex: 15,
                      transition: 'all 0.3s ease',
                      animationName: collecting === fruit.id ? 'bounce' : 'sway',
                      animationDuration: collecting === fruit.id ? '0.5s' : '3s',
                      animationTimingFunction: collecting === fruit.id ? 'ease' : 'ease-in-out',
                      animationIterationCount: collecting === fruit.id ? '1' : 'infinite',
                      animationDelay: `${index * 0.2}s`,
                      filter: collecting === fruit.id ? 'brightness(0.7)' : 'brightness(1)',
                      pointerEvents: collecting === fruit.id ? 'none' : 'auto'
                    }}
                    title={`Collect ${fruit.fruit_type}`}
                  >
                    {fruitEmojis[fruit.fruit_type] || '🍎'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ground */}
      <div className="tree-ground">
        <img 
          src="../../src/assets/grassField.svg"
          alt={`Tree at ${currentStage} stage`}
          className="grass-svg"
        />
      </div>

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

      {/* Collection effect notification */}
      {collectionEffect && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '3rem',
            animation: 'float-up 2s ease-out',
            zIndex: 100,
            pointerEvents: 'none'
          }}
        >
          🎉 {fruitEmojis[collectionEffect.type]}!
        </div>
      )}
    </div>
  );
};

export default TreeVisualization;