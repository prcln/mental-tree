import React, { useState, useEffect, useRef } from 'react';
import { fruitService } from '../../services/fruitService';
import { fruitEmojis } from '../../constants/fruits';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';

const FruitDisplay = ({ treeId, currentUserId, onCollect }) => {
  const [fruits, setFruits] = useState([]);
  const [collecting, setCollecting] = useState(null);
  const { t } = useLanguage();
  
  const { fruitSpawnTrigger } = useAuth();

  // Check interval ref
  const spawnCheckIntervalRef = useRef(null);

  useEffect(() => {
    if (treeId) return;

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

  }, [treeId]);

  const loadFruit = useCallback(async () => {
    if (!treeId) return;
    try {
      const data = await fruitService.getTreeFruits(treeId);
      setFruits(data);
    } catch (error) {
      console.error('Error loading fruits:', error);
    }
  }, [treeId]);

    // Effect to reload fruits when spawn trigger changes
  useEffect(() => {
    if (fruitSpawnTrigger > 0) {
      console.log('[MOOD_TREE] Fruit spawn detected, reloading...');
      loadFruits();
      checkSpawnTimer(); // Also update the spawn timer
    }
  }, [fruitSpawnTrigger, loadFruits, checkSpawnTimer]);

  const checkAndSpawnFruits = async () => {
    try {
      const shouldSpawn = await fruitService.shouldSpawnFruits(treeId);
      if (shouldSpawn) {
        await fruitService.spawnFruits(treeId);
        await loadFruits();
      }
    } catch (error) {
      console.error('Error spawning fruits:', error);
    }
  };

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

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fruits.map(fruit => (
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
              text-4xl transition-all duration-300 hover:scale-125
              ${collecting === fruit.id ? 'animate-bounce' : 'animate-sway'}
              cursor-pointer hover:drop-shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={`Collect ${fruit.fruit_type}`}
          >
            {fruitEmojis[fruit.fruit_type] || '🍎'}
          </button>
        </div>
      ))}
      
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