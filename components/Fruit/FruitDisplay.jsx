import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fruitService } from '../../services/fruitService';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

// Import fruit images
import greenappleImg from '../../assets/fruits/greenapple.png';
import pineappleImg from '../../assets/fruits/pineapple.png';
import strawberryImg from '../../assets/fruits/strawberry.png';
import cherryImg from '../../assets/fruits/cherry.png';
import peachImg from '../../assets/fruits/peach.png';
import mangoImg from '../../assets/fruits/mango.png';

// Map fruit types to images
const fruitImages = {
  greenapple: greenappleImg,
  pineapple: pineappleImg,
  strawberry: strawberryImg,
  cherry: cherryImg,
  peach: peachImg,
  mango: mangoImg
};

// Fallback emojis if images fail to load
const fruitEmojis = {
  greenapple: '🍏',
  pineapple: '🍍',
  strawberry: '🍓',
  cherry: '🍒',
  peach: '🍑',
  mango: '🥭'
};

const FruitDisplay = ({ treeId, currentUserId, onCollect }) => {
  const [fruits, setFruits] = useState([]);
  const [collecting, setCollecting] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // Track failed image loads
  const { t } = useLanguage();
  
  const { fruitSpawnTrigger } = useAuth();

  // Check interval ref
  const spawnCheckIntervalRef = useRef(null);

  const loadFruits = useCallback(async () => {
    if (!treeId) return;
    try {
      const data = await fruitService.getTreeFruits(treeId);
      setFruits(data);
    } catch (error) {
      console.error('Error loading fruits:', error);
    }
  }, [treeId]);

  const checkAndSpawnFruits = useCallback(async () => {
    try {
      const shouldSpawn = await fruitService.shouldSpawnFruits(treeId);
      if (shouldSpawn) {
        await fruitService.spawnFruits(treeId);
        await loadFruits();
      }
    } catch (error) {
      console.error('Error spawning fruits:', error);
    }
  }, [treeId, loadFruits]);

  useEffect(() => {
    if (!treeId) return;

    loadFruits();
    checkAndSpawnFruits();

    // Set up periodic checking (every 5 minutes)
    spawnCheckIntervalRef.current = setInterval(() => {
      checkAndSpawnFruits();
    }, 5 * 60 * 1000);

    // Cleanup
    return () => {
      if (spawnCheckIntervalRef.current) {
        clearInterval(spawnCheckIntervalRef.current);
      }
    };
  }, [treeId, loadFruits, checkAndSpawnFruits]);

  // Effect to reload fruits when spawn trigger changes
  useEffect(() => {
    if (fruitSpawnTrigger > 0) {
      console.log('[FRUIT_DISPLAY] Fruit spawn detected, reloading...');
      loadFruits();
    }
  }, [fruitSpawnTrigger, loadFruits]);

  const handleCollect = async (fruitId, fruitType) => {
    if (!currentUserId) {
      alert(t('fruitdisplay.signIn'));
      return;
    }

    setCollecting(fruitId);
    try {
      const result = await fruitService.collectFruit(fruitId, currentUserId);
      
      if (result.success) {
        // Remove from display
        setFruits(fruits.filter(f => f.id !== fruitId));
        
        // Show collection animation
        showCollectionEffect(fruitType);
        
        if (onCollect) {
          onCollect(result);
        }
      }
    } catch (error) {
      console.error('Error collecting fruit:', error);
      alert(t('fruitdisplay.collectFail'));
    } finally {
      setCollecting(null);
    }
  };

  const showCollectionEffect = (fruitType) => {
    // You can implement a toast notification or animation here
    console.log(`${t('fruitdisplay.collected')} ${fruitType}! 🎉`);
  };

  const handleImageError = (fruitType) => {
    setImageErrors(prev => ({ ...prev, [fruitType]: true }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fruits.map(fruit => {
        const useEmoji = imageErrors[fruit.fruit_type];
        
        return (
          <div
            key={fruit.id}
            className="absolute pointer-events-auto"
            style={{
              left: `${fruit.position_x}%`,
              top: `${fruit.position_y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <button
              onClick={() => handleCollect(fruit.id, fruit.fruit_type)}
              disabled={collecting === fruit.id}
              className={`
                transition-all duration-300 hover:scale-125
                ${collecting === fruit.id ? 'animate-bounce' : 'animate-sway'}
                cursor-pointer hover:drop-shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                rounded-full
              `}
              title={`Collect ${fruit.fruit_type}`}
              aria-label={`Collect ${fruit.fruit_type} fruit`}
            >
              {useEmoji ? (
                // Fallback to emoji if image fails
                <span className="text-4xl block">
                  {fruitEmojis[fruit.fruit_type] || '🍎'}
                </span>
              ) : (
                // Use image
                <img
                  src={fruitImages[fruit.fruit_type]}
                  alt={fruit.fruit_type}
                  onError={() => handleImageError(fruit.fruit_type)}
                  className="w-16 h-16 object-contain drop-shadow-md"
                  style={{
                    filter: collecting === fruit.id ? 'brightness(1.2)' : 'none'
                  }}
                />
              )}
            </button>
          </div>
        );
      })}
      
      <style jsx>{`
        @keyframes sway {
          0%, 100% { transform: translate(-50%, -50%) rotate(-5deg); }
          50% { transform: translate(-50%, -50%) rotate(5deg); }
        }
        .animate-sway {
          animation: sway 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FruitDisplay;