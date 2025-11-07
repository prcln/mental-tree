import { useState, useCallback, useEffect, useMemo } from "react";
import { fruitService } from "../../services/fruitService";
import { AUTO_REFRESH_INTERVAL, REQUEST_TIMEOUT, TABS, SEARCH_FILTERS } from "./constants";
import { getTradeUsername } from "./fruitUtil";

// Custom Hooks
const useTradeData = (userId, activeTab) => {
  const [state, setState] = useState({
    inventory: [],
    trades: [],
    myTrades: [],
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await fruitService.cleanupExpiredTrades();

      const withTimeout = (promise) => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
          )
        ]);

      const [inventoryData, tradesData, myTradesData] = await Promise.all([
        withTimeout(fruitService.getUserInventory(userId)),
        withTimeout(fruitService.getTradeOffers(userId)),
        withTimeout(fruitService.getUserTradeOffers(userId))
      ]);
      
      setState({
        inventory: inventoryData,
        trades: tradesData,
        myTrades: myTradesData,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error loading trade data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message === 'Request timeout' 
          ? 'Request timed out. Please try again.' 
          : err.message
      }));
    }
  }, [userId]);

  // Separate load functions for each tab
  const loadBrowseTrades = useCallback(async () => {
    try {
      await fruitService.cleanupExpiredTrades();
      const tradesData = await fruitService.getTradeOffers(userId);
      setState(prev => ({ ...prev, trades: tradesData }));
    } catch (err) {
      console.error('Error loading browse trades:', err);
    }
  }, [userId]);

  const loadMyTrades = useCallback(async () => {
    try {
      await fruitService.cleanupExpiredTrades();
      const myTradesData = await fruitService.getUserTradeOffers(userId);
      setState(prev => ({ ...prev, myTrades: myTradesData }));
    } catch (err) {
      console.error('Error loading my trades:', err);
    }
  }, [userId]);

  const refreshCurrentView = useCallback(async () => {
    try {
      await fruitService.cleanupExpiredTrades();
      
      if (activeTab === TABS.BROWSE) {
        const tradesData = await fruitService.getTradeOffers(userId);
        setState(prev => ({ ...prev, trades: tradesData }));
      } else if (activeTab === TABS.MY_TRADES) {
        const myTradesData = await fruitService.getUserTradeOffers(userId);
        setState(prev => ({ ...prev, myTrades: myTradesData }));
      }
      // No refresh needed for CREATE tab
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      // Only refresh based on active tab
      if (activeTab === TABS.BROWSE) {
        loadBrowseTrades();
      } else if (activeTab === TABS.MY_TRADES) {
        loadMyTrades();
      }
      // Skip refresh on CREATE tab
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [loadData, activeTab, loadBrowseTrades, loadMyTrades]);

  return { ...state, loadData, refreshCurrentView };
};

const useTradeSearch = (trades, searchQuery, searchFilter) => {
  return useMemo(() => {
    if (!searchQuery.trim()) return trades;

    const query = searchQuery.toLowerCase();
    
    return trades.filter(trade => {
      const username = getTradeUsername(trade).toLowerCase();
      const offeredFruits = Object.keys(trade.offered_fruits || {}).join(' ').toLowerCase();
      const requestedFruits = Object.keys(trade.requested_fruits || {}).join(' ').toLowerCase();

      switch (searchFilter) {
        case SEARCH_FILTERS.USER:
          return username.includes(query);
        case SEARCH_FILTERS.OFFERING:
          return offeredFruits.includes(query);
        case SEARCH_FILTERS.REQUESTING:
          return requestedFruits.includes(query);
        default:
          return username.includes(query) ||
                 offeredFruits.includes(query) ||
                 requestedFruits.includes(query);
      }
    });
  }, [trades, searchQuery, searchFilter]);
};

const useTradeForm = (inventory) => {
  const [offeredFruits, setOfferedFruits] = useState({});
  const [requestedFruits, setRequestedFruits] = useState({});
  const [expirationHours, setExpirationHours] = useState(24);

  const updateFruits = useCallback((type, fruitName, quantity) => {
    const setter = type === 'offer' ? setOfferedFruits : setRequestedFruits;
    
    setter(prev => {
      if (quantity > 0) {
        return { ...prev, [fruitName]: quantity };
      } else {
        const updated = { ...prev };
        delete updated[fruitName];
        return updated;
      }
    });
  }, []);

  const resetForm = useCallback(() => {
    setOfferedFruits({});
    setRequestedFruits({});
    setExpirationHours(24);
  }, []);

  const maxQuantities = useMemo(() => {
    return inventory.reduce((acc, item) => {
      acc[item.item_name] = item.quantity;
      return acc;
    }, {});
  }, [inventory]);

  return {
    offeredFruits,
    requestedFruits,
    expirationHours,
    setExpirationHours,
    updateFruits,
    resetForm,
    maxQuantities
  };
};

const useTradeActions = (userId, loadData, onTradeComplete) => {
  const acceptTrade = useCallback(async (tradeId) => {
    try {
      await fruitService.acceptTradeOffer(tradeId, userId);
      await loadData();
      onTradeComplete?.();
    } catch (err) {
      throw new Error(err.message || 'Failed to accept trade');
    }
  }, [userId, loadData, onTradeComplete]);

  const cancelTrade = useCallback(async (tradeId) => {
    try {
      await fruitService.cancelTradeOffer(tradeId, userId);
      await loadData();
    } catch (err) {
      throw new Error(err.message || 'Failed to cancel trade');
    }
  }, [userId, loadData]);

  const createTrade = useCallback(async (offeredFruits, requestedFruits, expirationHours) => {
    try {
      await fruitService.createTradeOffer(
        userId,
        offeredFruits,
        requestedFruits,
        expirationHours
      );
      await loadData();
    } catch (err) {
      throw new Error(err.message || 'Failed to create trade offer');
    }
  }, [userId, loadData]);

  return { acceptTrade, cancelTrade, createTrade };
};

export { useTradeData, useTradeForm, useTradeSearch, useTradeActions };