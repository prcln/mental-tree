import React, { useState, useEffect } from 'react';
import { Package, Sparkles } from 'lucide-react';
import { fruitService } from '../../services/fruitService';
import { fruitEmojis, rarityColors } from '../../constants/fruits';
import { useLanguage } from '../../contexts/LanguageContext/LanguageContext';

const FruitInventory = ({ userId , onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('fruits');
  const [inventory, setInventory] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [userCollectibles, setUserCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchanging, setExchanging] = useState(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, coll, userColl] = await Promise.all([
        fruitService.getUserInventory(userId),
        fruitService.getCollectibles(),
        fruitService.getUserCollectibles(userId)
      ]);
      
      setInventory(inv);
      setCollectibles(coll);
      setUserCollectibles(userColl);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async (collectibleId) => {
    setExchanging(collectibleId);
    try {
      await fruitService.exchangeForCollectible(userId, collectibleId);
      await loadData();
      alert('Collectible unlocked! 🎉');
    } catch (error) {
      console.error('Error exchanging:', error);
      alert(error.message || 'Failed to exchange. Please try again.');
    } finally {
      setExchanging(null);
    }
  };

  const canAfford = (exchangeCost) => {
    const inventoryMap = {};
    inventory.forEach(item => {
      inventoryMap[item.item_name] = item.quantity;
    });

    return Object.entries(exchangeCost).every(
      ([fruit, required]) => (inventoryMap[fruit] || 0) >= required
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin text-4xl">🌀</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
    onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Package className="w-6 h-6 sm:w-8 sm:h-8" />
              <h2 className="text-lg sm:text-2xl font-bold">{t('collection.myCollection')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl sm:text-3xl leading-none"
            >
              ×
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('fruits')}
              className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === 'fruits'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t('collection.fruits')}
            </button>
            <button
              onClick={() => setActiveTab('exchange')}
              className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === 'exchange'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t('collection.exchange')}
            </button>
            <button
              onClick={() => setActiveTab('collectibles')}
              className={`flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === 'collectibles'
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t('collection.collectibles')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)]">
          {/* Fruits Tab */}
          {activeTab === 'fruits' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {inventory.length === 0 ? (
                <div className="col-span-full text-center py-8 sm:py-12 text-gray-400">
                  <p className="text-4xl sm:text-6xl mb-2 sm:mb-4">🍎</p>
                  <p className="text-sm sm:text-base">{t('collection.noFruits')}</p>
                  <p className="text-xs sm:text-sm mt-1 sm:mt-2">{t('collection.visitTrees')}</p>
                </div>
              ) : (
                inventory.map(item => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center border-2 border-green-200"
                  >
                    <div className="text-3xl sm:text-5xl mb-1 sm:mb-2">
                      {fruitEmojis[item.item_name] || '🍎'}
                    </div>
                    <div className="font-semibold text-gray-800 capitalize text-xs sm:text-base">
                      {item.item_name}
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                      ×{item.quantity}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Exchange Tab */}
          {activeTab === 'exchange' && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {collectibles.map(collectible => {
                const affordable = canAfford(collectible.exchange_cost);
                const owned = userCollectibles.find(
                  uc => uc.collectible_id === collectible.id
                );

                return (
                  <div
                    key={collectible.id}
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 ${
                      rarityColors[collectible.rarity]
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-4">
                      <div className="text-3xl sm:text-5xl flex-shrink-0">{collectible.image_url}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-lg truncate sm:whitespace-normal">
                          {collectible.display_name}
                        </h3>
                        {/* Hide description on small screens */}
                        <p className="hidden sm:block text-sm opacity-75 mb-2">
                          {collectible.description}
                        </p>
                        
                        {/* Cost */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                          {Object.entries(collectible.exchange_cost).map(
                            ([fruit, cost]) => (
                              <span
                                key={fruit}
                                className="inline-flex items-center gap-1 bg-white/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm"
                              >
                                {fruitEmojis[fruit]} ×{cost}
                              </span>
                            )
                          )}
                        </div>

                        {/* Exchange Button */}
                        <button
                          onClick={() => handleExchange(collectible.id)}
                          disabled={!affordable || exchanging === collectible.id}
                          className={`w-full py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-base ${
                            affordable
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          } ${exchanging === collectible.id ? 'animate-pulse' : ''}`}
                        >
                          {owned
                            ? `Owned (${owned.quantity})`
                            : affordable
                            ? t('collection.exchange.btn')
                            : t('collection.notEnough')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Collectibles Tab */}
          {activeTab === 'collectibles' && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {userCollectibles.length === 0 ? (
                <div className="col-span-full text-center py-8 sm:py-12 text-gray-400">
                  <p className="text-4xl sm:text-6xl mb-2 sm:mb-4">
                    <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
                  </p>
                  <p className="text-sm sm:text-base">{t('collection.noCollectibles')}</p>
                  <p className="text-xs sm:text-sm mt-1 sm:mt-2">
                    {t('collection.exchangeMore')}
                  </p>
                </div>
              ) : (
                userCollectibles.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 ${
                      rarityColors[item.collectible.rarity]
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-3xl sm:text-5xl flex-shrink-0">{item.collectible.image_url}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-lg truncate sm:whitespace-normal">
                          {item.collectible.display_name}
                        </h3>
                        {/* Hide description on small screens */}
                        <p className="hidden sm:block text-sm opacity-75">
                          {item.collectible.description}
                        </p>
                        <div className="mt-1 sm:mt-2 flex items-center gap-2">
                          <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/50 rounded uppercase font-semibold">
                            {item.collectible.rarity}
                          </span>
                          <span className="text-xs sm:text-sm font-bold">
                            ×{item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FruitInventory;