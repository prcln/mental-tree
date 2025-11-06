import React, { useState, useEffect, useCallback } from 'react';
import { X, ShoppingBag, Plus, TrendingUp, Package } from 'lucide-react';
import { fruitService } from '../../services/fruitService';
import './FruitTrade.css';

const FruitTrade = ({ userId, onClose, onTradeComplete }) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'create', 'myTrades'
  const [inventory, setInventory] = useState([]);
  const [trades, setTrades] = useState([]);
  const [myTrades, setMyTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create trade form state
  const [offeredFruits, setOfferedFruits] = useState({});
  const [requestedFruits, setRequestedFruits] = useState({});
  const [availableFruitTypes, setAvailableFruitTypes] = useState([]);

  // Load user inventory and trades
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [inventoryData, tradesData, myTradesData] = await Promise.all([
        fruitService.getUserInventory(userId),
        fruitService.getTradeOffers(userId),
        fruitService.getUserTradeOffers(userId)
      ]);
      
      setInventory(inventoryData);
      setTrades(tradesData);
      setMyTrades(myTradesData);
      
      // Get unique fruit types from inventory
      const fruitTypes = inventoryData.map(item => item.item_name);
      setAvailableFruitTypes(fruitTypes);
    } catch (err) {
      console.error('Error loading trade data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle accepting a trade
  const handleAcceptTrade = async (tradeId) => {
    try {
      await fruitService.acceptTradeOffer(tradeId, userId);
      await loadData(); // Reload all data
      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      alert(err.message || 'Failed to accept trade');
    }
  };

  // Handle canceling a trade
  const handleCancelTrade = async (tradeId) => {
    try {
      await fruitService.cancelTradeOffer(tradeId, userId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to cancel trade');
    }
  };

  // Handle creating a trade
  const handleCreateTrade = async (e) => {
    e.preventDefault();
    
    // Validate offered fruits
    if (Object.keys(offeredFruits).length === 0) {
      alert('Please offer at least one fruit');
      return;
    }
    
    // Validate requested fruits
    if (Object.keys(requestedFruits).length === 0) {
      alert('Please request at least one fruit');
      return;
    }
    
    try {
      await fruitService.createTradeOffer(userId, offeredFruits, requestedFruits);
      setOfferedFruits({});
      setRequestedFruits({});
      setActiveTab('myTrades');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create trade offer');
    }
  };

  // Add fruit to offer/request
  const addFruit = (type, fruitName, quantity) => {
    const setter = type === 'offer' ? setOfferedFruits : setRequestedFruits;
    setter(prev => ({
      ...prev,
      [fruitName]: (prev[fruitName] || 0) + quantity
    }));
  };

  // Remove fruit from offer/request
  const removeFruit = (type, fruitName) => {
    const setter = type === 'offer' ? setOfferedFruits : setRequestedFruits;
    setter(prev => {
      const updated = { ...prev };
      delete updated[fruitName];
      return updated;
    });
  };

  // Render fruit badge
  const FruitBadge = ({ name, quantity }) => (
    <div className="fruit-badge">
      <span className="fruit-icon">{getFruitEmoji(name)}</span>
      <span className="fruit-name">{name}</span>
      <span className="fruit-qty">×{quantity}</span>
    </div>
  );

  // Get emoji for fruit type
  const getFruitEmoji = (fruitName) => {
    const emojiMap = {
      apple: '🍎',
      orange: '🍊',
      pine: '🌲',
      cherry: '🍒',
      plum: '🍑',
      default: '🍇'
    };
    return emojiMap[fruitName?.toLowerCase()] || emojiMap.default;
  };

  if (loading) {
    return (
      <div className="fruit-trade-modal">
        <div className="trade-content">
          <div className="trade-loading">Loading trade market...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fruit-trade-modal" onClick={onClose}>
      <div className="trade-content" onClick={(e) => e.stopPropagation()}>
        <div className="trade-header">
          <h2>🏪 Fruit Trade Market</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="trade-error">{error}</div>
        )}

        {/* Tabs */}
        <div className="trade-tabs">
          <button 
            className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <ShoppingBag size={18} />
            Browse Trades ({trades.length})
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={18} />
            Create Trade
          </button>
          <button 
            className={`tab ${activeTab === 'myTrades' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTrades')}
          >
            <Package size={18} />
            My Trades ({myTrades.filter(t => t.status === 'open').length})
          </button>
        </div>

        <div className="trade-body">
          {/* Browse Trades Tab */}
          {activeTab === 'browse' && (
            <div className="browse-trades">
              {trades.length === 0 ? (
                <div className="no-trades">
                  <p>No active trades available</p>
                  <p className="hint">Be the first to create one!</p>
                </div>
              ) : (
                <div className="trades-list">
                  {trades.map(trade => (
                    <div key={trade.id} className="trade-card">
                      <div className="trade-user">
                        <span className="user-icon">👤</span>
                        <span className="username">{trade.user?.username || 'Anonymous'}</span>
                      </div>
                      
                      <div className="trade-exchange">
                        <div className="trade-side">
                          <h4>Offering:</h4>
                          <div className="fruits-list">
                            {Object.entries(trade.offered_fruits).map(([name, qty]) => (
                              <FruitBadge key={name} name={name} quantity={qty} />
                            ))}
                          </div>
                        </div>
                        
                        <div className="trade-arrow">
                          <TrendingUp size={24} />
                        </div>
                        
                        <div className="trade-side">
                          <h4>Requesting:</h4>
                          <div className="fruits-list">
                            {Object.entries(trade.requested_fruits).map(([name, qty]) => (
                              <FruitBadge key={name} name={name} quantity={qty} />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        className="btn-accept-trade"
                        onClick={() => handleAcceptTrade(trade.id)}
                      >
                        Accept Trade
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Trade Tab */}
          {activeTab === 'create' && (
            <div className="create-trade">
              <form onSubmit={handleCreateTrade}>
                {/* Your Inventory */}
                <div className="section">
                  <h3>Your Inventory</h3>
                  <div className="inventory-grid">
                    {inventory.map(item => (
                      <div key={item.item_name} className="inventory-item">
                        <span className="fruit-icon">{getFruitEmoji(item.item_name)}</span>
                        <span className="fruit-name">{item.item_name}</span>
                        <span className="fruit-qty">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What you're offering */}
                <div className="section">
                  <h3>I'm Offering</h3>
                  <div className="fruit-selection">
                    {inventory.map(item => (
                      <div key={item.item_name} className="fruit-selector">
                        <span className="fruit-icon">{getFruitEmoji(item.item_name)}</span>
                        <span>{item.item_name}</span>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          placeholder="0"
                          value={offeredFruits[item.item_name] || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (val > 0) {
                              setOfferedFruits(prev => ({ ...prev, [item.item_name]: val }));
                            } else {
                              removeFruit('offer', item.item_name);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* What you're requesting */}
                <div className="section">
                  <h3>I'm Requesting</h3>
                  <div className="fruit-selection">
                    {['apple', 'orange', 'pine', 'cherry', 'plum'].map(fruitType => (
                      <div key={fruitType} className="fruit-selector">
                        <span className="fruit-icon">{getFruitEmoji(fruitType)}</span>
                        <span>{fruitType}</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={requestedFruits[fruitType] || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (val > 0) {
                              setRequestedFruits(prev => ({ ...prev, [fruitType]: val }));
                            } else {
                              removeFruit('request', fruitType);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-create-trade">
                  Create Trade Offer
                </button>
              </form>
            </div>
          )}

          {/* My Trades Tab */}
          {activeTab === 'myTrades' && (
            <div className="my-trades">
              {myTrades.length === 0 ? (
                <div className="no-trades">
                  <p>You haven't created any trades yet</p>
                </div>
              ) : (
                <div className="trades-list">
                  {myTrades.map(trade => (
                    <div key={trade.id} className={`trade-card ${trade.status}`}>
                      <div className="trade-status-badge">{trade.status}</div>
                      
                      <div className="trade-exchange">
                        <div className="trade-side">
                          <h4>Offering:</h4>
                          <div className="fruits-list">
                            {Object.entries(trade.offered_fruits).map(([name, qty]) => (
                              <FruitBadge key={name} name={name} quantity={qty} />
                            ))}
                          </div>
                        </div>
                        
                        <div className="trade-arrow">
                          <TrendingUp size={24} />
                        </div>
                        
                        <div className="trade-side">
                          <h4>Requesting:</h4>
                          <div className="fruits-list">
                            {Object.entries(trade.requested_fruits).map(([name, qty]) => (
                              <FruitBadge key={name} name={name} quantity={qty} />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {trade.status === 'open' && (
                        <button 
                          className="btn-cancel-trade"
                          onClick={() => handleCancelTrade(trade.id)}
                        >
                          Cancel Trade
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FruitTrade;