import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import MessageDecoration from '../MessageComponents/MessageDecoration';
import './TreeVisualization.css';
import { fruitEmojis } from '../../constants/fruits';

import seed from "../../src/assets/trees/seed.svg";
import sprout from "../../src/assets/trees/sprout.svg";
import sapling from "../../src/assets/trees/sapling.svg";
import young from "../../src/assets/trees/young.svg";
import mature from "../../src/assets/trees/mature.svg";
import blooming from "../../src/assets/trees/blooming.svg";
import { pointsUntilNextStage } from '../../services/stageHelper';
import { fruitService } from '../../services/fruitService';

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
    seed: [],
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

// Fruit positions on the tree
const getFruitPositions = (stage) => {
  const positions = {
    seed: [],
    sprout: [],
    sapling: [
      { x: 48, y: 32 },
      { x: 52, y: 32 }
    ],
    young: [
      { x: 38, y: 28 },
      { x: 50, y: 25 },
      { x: 62, y: 28 },
      { x: 45, y: 38 }
    ],
    mature: [
      { x: 33, y: 22 },
      { x: 48, y: 18 },
      { x: 58, y: 18 },
      { x: 67, y: 22 },
      { x: 38, y: 33 },
      { x: 62, y: 33 }
    ],
    blooming: [
      { x: 28, y: 20 },
      { x: 42, y: 15 },
      { x: 50, y: 13 },
      { x: 58, y: 15 },
      { x: 72, y: 20 },
      { x: 35, y: 30 },
      { x: 50, y: 28 },
      { x: 65, y: 30 },
      { x: 43, y: 42 },
      { x: 57, y: 42 }
    ]
  };
  
  return positions[stage] || [];
};

const TreeVisualization = ({ currentStage, messages, moodScore, treeType, currentUserId, treeId, fruits: externalFruits, onFruitCollect }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [fruits, setFruits] = useState([]);
  const [collecting, setCollecting] = useState(null);
  const [collectionEffect, setCollectionEffect] = useState(null);

  const messagePositions = getMessagePositions(currentStage);
  const fruitPositions = getFruitPositions(currentStage);
  
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
              currentUserId={currentUserId}
              onUpdate={() => {}}
            />
          ))}
        </div>
      )}

      {/* Fruits overlay */}
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