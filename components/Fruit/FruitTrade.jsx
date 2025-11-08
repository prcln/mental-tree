import React, { useState, useCallback, useEffect } from "react";
import { fruitService } from '../../services/fruitService';
import { useTradeForm, useTradeSearch } from "./fruitHook";
import { 
  SearchBar, 
  SearchFilters, 
  EmptyState, 
  TradeCard, 
  InventoryGrid, 
  FruitSelector, 
  ExpirationSelector, 
  ConfirmationModal 
} from "./SubComponents/FruitComponents.jsx";
import { TABS, SEARCH_FILTERS, FRUIT_TYPES } from './constants.js';
import { X, ShoppingBag, Plus, Package } from 'lucide-react';
import './FruitTrade.css';

const FruitTrade = ({ userId, onClose, onTradeComplete }) => {
  const [activeTab, setActiveTab] = useState(TABS.BROWSE);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState(SEARCH_FILTERS.ALL);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    trade: null,
    type: null
  });

  // Separate state for each data type - load once and keep in memory
  const [inventory, setInventory] = useState([]);
  const [trades, setTrades] = useState([]);
  const [myTrades, setMyTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filteredTrades = useTradeSearch(trades, searchQuery, searchFilter);
  const {
    offeredFruits,
    requestedFruits,
    expirationHours,
    setExpirationHours,
    updateFruits,
    resetForm,
    maxQuantities
  } = useTradeForm(inventory);

  // Load all data once on mount
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
    } catch (err) {
      console.error('Error loading trade data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load data only once when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcceptTrade = useCallback(async (tradeId) => {
    try {
      await fruitService.acceptTradeOffer(tradeId, userId);
      setConfirmModal({ isOpen: false, trade: null, type: null });
      await loadData(); // Reload to get fresh data
      onTradeComplete?.();
    } catch (err) {
      alert(err.message || 'Failed to accept trade');
    }
  }, [userId, loadData, onTradeComplete]);

  const handleCancelTrade = useCallback(async (tradeId) => {
    try {
      await fruitService.cancelTradeOffer(tradeId, userId);
      setConfirmModal({ isOpen: false, trade: null, type: null });
      await loadData(); // Reload to get fresh data
    } catch (err) {
      alert(err.message || 'Failed to cancel trade');
    }
  }, [userId, loadData]);

  const handleCreateTrade = useCallback(async (e) => {
    e.preventDefault();
    
    if (Object.keys(offeredFruits).length === 0) {
      alert('Please offer at least one fruit');
      return;
    }
    
    if (Object.keys(requestedFruits).length === 0) {
      alert('Please request at least one fruit');
      return;
    }
    
    try {
      await fruitService.createTradeOffer(
        userId, 
        offeredFruits, 
        requestedFruits, 
        expirationHours
      );
      resetForm();
      setActiveTab(TABS.MY_TRADES);
      await loadData(); // Reload to get fresh data
    } catch (err) {
      alert(err.message || 'Failed to create trade offer');
    }
  }, [userId, offeredFruits, requestedFruits, expirationHours, loadData, resetForm]);

  const openAcceptConfirmation = useCallback((trade) => {
    setConfirmModal({ isOpen: true, trade, type: 'accept' });
  }, []);

  const openCancelConfirmation = useCallback((trade) => {
    setConfirmModal({ isOpen: true, trade, type: 'cancel' });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmModal({ isOpen: false, trade: null, type: null });
  }, []);

  if (loading) {
    return (
      <div className="fruit-trade-modal">
        <div className="trade-content">
          <div className="trade-loading">Loading trade market...</div>
        </div>
      </div>
    );
  }

  const openMyTradesCount = myTrades.filter(t => t.status === 'open').length;

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
          <div className="trade-error">
            {error}
            <button onClick={loadData} className="retry-btn">Retry</button>
          </div>
        )}

        <div className="trade-tabs">
          <button 
            className={`tab ${activeTab === TABS.BROWSE ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.BROWSE)}
          >
            <ShoppingBag size={18} />
            Browse ({filteredTrades.length})
          </button>
          <button 
            className={`tab ${activeTab === TABS.CREATE ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.CREATE)}
          >
            <Plus size={18} />
            Create
          </button>
          <button 
            className={`tab ${activeTab === TABS.MY_TRADES ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.MY_TRADES)}
          >
            <Package size={18} />
            My Trades ({openMyTradesCount})
          </button>
        </div>

        <div className="trade-body">
          {activeTab === TABS.BROWSE && (
            <div className="browse-trades">
              <div className="trade-search-container">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onClear={() => setSearchQuery('')}
                />
                <SearchFilters
                  activeFilter={searchFilter}
                  onFilterChange={setSearchFilter}
                />
              </div>

              {filteredTrades.length === 0 ? (
                <EmptyState
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />
              ) : (
                <div className="trades-list">
                  {filteredTrades.map(trade => (
                    <TradeCard
                      key={trade.id}
                      trade={trade}
                      onAccept={openAcceptConfirmation}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === TABS.CREATE && (
            <div className="create-trade">
              <form onSubmit={handleCreateTrade}>
                <div className="section">
                  <h3>Trade Duration</h3>
                  <ExpirationSelector
                    value={expirationHours}
                    onChange={setExpirationHours}
                  />
                </div>

                <div className="section">
                  <h3>Your Inventory</h3>
                  <InventoryGrid inventory={inventory} />
                </div>

                <div className="section">
                  <h3>I'm Offering</h3>
                  <FruitSelector
                    fruits={inventory}
                    values={offeredFruits}
                    onChange={(name, qty) => updateFruits('offer', name, qty)}
                    maxQuantities={maxQuantities}
                  />
                </div>

                <div className="section">
                  <h3>I'm Requesting</h3>
                  <FruitSelector
                    fruits={FRUIT_TYPES}
                    values={requestedFruits}
                    onChange={(name, qty) => updateFruits('request', name, qty)}
                  />
                </div>

                <button type="submit" className="btn-create-trade">
                  Create Trade Offer
                </button>
              </form>
            </div>
          )}

          {activeTab === TABS.MY_TRADES && (
            <div className="my-trades">
              {myTrades.length === 0 ? (
                <div className="no-trades">
                  <p>You haven't created any trades yet</p>
                </div>
              ) : (
                <div className="trades-list">
                  {myTrades.map(trade => (
                    <TradeCard
                      key={trade.id}
                      trade={trade}
                      onCancel={openCancelConfirmation}
                      isMyTrade
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        trade={confirmModal.trade}
        type={confirmModal.type}
        onConfirm={() => {
          if (confirmModal.type === 'accept') {
            handleAcceptTrade(confirmModal.trade);
          } else {
            handleCancelTrade(confirmModal.trade);
          }
        }}
        onCancel={closeConfirmation}
      />
    </div>
  );
};

export default FruitTrade;