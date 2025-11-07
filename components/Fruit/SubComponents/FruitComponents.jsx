import { X, TrendingUp, Clock, Search } from 'lucide-react';
import { TABS, SEARCH_FILTERS, EXPIRATION_OPTIONS, FRUIT_TYPES, FRUIT_EMOJI_MAP, REQUEST_TIMEOUT, AUTO_REFRESH_INTERVAL } from '../constants.js'

import { getTimeRemaining, getTradeUsername, getFruitEmoji } from '../fruitUtil.js';

const FruitBadge = ({ name, quantity }) => (
  <div className="fruit-badge">
    <span className="fruit-icon">{getFruitEmoji(name)}</span>
    <span className="fruit-name">{name}</span>
    <span className="fruit-qty">×{quantity}</span>
  </div>
);

const TradeTimer = ({ expiresAt }) => (
  <div className="trade-timer">
    <Clock size={14} />
    <span className="time-remaining">{getTimeRemaining(expiresAt)}</span>
  </div>
);

const SearchBar = ({ searchQuery, onSearchChange, onClear }) => (
  <div className="trade-search">
    <Search size={18} className="search-icon" />
    <input
      type="text"
      placeholder="Search trades..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="search-input"
    />
    {searchQuery && (
      <button className="clear-search" onClick={onClear}>
        <X size={16} />
      </button>
    )}
  </div>
);

const SearchFilters = ({ activeFilter, onFilterChange }) => (
  <div className="search-filters">
    {Object.entries(SEARCH_FILTERS).map(([key, value]) => (
      <button
        key={value}
        className={`filter-btn ${activeFilter === value ? 'active' : ''}`}
        onClick={() => onFilterChange(value)}
      >
        {key.charAt(0) + key.slice(1).toLowerCase()}
      </button>
    ))}
  </div>
);

const TradeCard = ({ trade, onAccept, onCancel, showActions = true, isMyTrade = false }) => (
  <div className={`trade-card ${trade.status}`}>
    <div className="trade-header-row">
      {isMyTrade ? (
        <>
          <div className="trade-status-badge">{trade.status}</div>
          {trade.status === 'open' && <TradeTimer expiresAt={trade.expires_at} />}
        </>
      ) : (
        <>
          <div className="trade-user">
            <span className="user-icon">👤</span>
            <span className="username">{getTradeUsername(trade)}</span>
          </div>
          <TradeTimer expiresAt={trade.expires_at} />
        </>
      )}

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
    
    {showActions && (
      isMyTrade && trade.status === 'open' ? (
        <button className="btn-cancel-trade" onClick={() => onCancel(trade.id)}>
          Cancel Trade
        </button>
      ) : !isMyTrade && (
        <button className="btn-accept-trade" onClick={() => onAccept(trade.id)}>
          Accept Trade
        </button>
      )
    )}
  </div>
);

const EmptyState = ({ searchQuery, onClearSearch }) => (
  <div className="no-trades">
    {searchQuery ? (
      <>
        <p>No trades found matching "{searchQuery}"</p>
        <button className="btn-clear-search" onClick={onClearSearch}>
          Clear Search
        </button>
      </>
    ) : (
      <>
        <p>No active trades available</p>
        <p className="hint">Be the first to create one!</p>
      </>
    )}
  </div>
);

const InventoryGrid = ({ inventory }) => (
  <div className="inventory-grid">
    {inventory.map(item => (
      <div key={item.item_name} className="inventory-item">
        <span className="fruit-icon">{getFruitEmoji(item.item_name)}</span>
        <span className="fruit-name">{item.item_name}</span>
        <span className="fruit-qty">×{item.quantity}</span>
      </div>
    ))}
  </div>
);



const FruitSelector = ({ fruits, values, onChange, maxQuantities = {} }) => (
  <div className="fruit-selection">
    {fruits.map(fruit => {
      const fruitName = typeof fruit === 'string' ? fruit : fruit.item_name;
      const maxQty = maxQuantities[fruitName];
      
      return (
        <div key={fruitName} className="fruit-selector">
          <span className="fruit-icon">{getFruitEmoji(fruitName)}</span>
          <span>{fruitName}</span>
          <input
            type="number"
            min="0"
            max={maxQty}
            placeholder="0"
            value={values[fruitName] || ''}
            onChange={(e) => onChange(fruitName, parseInt(e.target.value) || 0)}
          />
        </div>
      );
    })}
  </div>
);

const ExpirationSelector = ({ value, onChange }) => (
  <div className="expiration-selector">
    {EXPIRATION_OPTIONS.map(hours => (
      <label key={hours}>
        <input
          type="radio"
          name="expiration"
          value={hours}
          checked={value === hours}
          onChange={() => onChange(hours)}
        />
        <span>{hours} hours</span>
      </label>
    ))}
  </div>
);

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, trade, type = 'accept' }) => {
  if (!isOpen || !trade) return null;

  const isAccept = type === 'accept';
  const title = isAccept ? 'Confirm Trade' : 'Cancel Trade';
  const message = isAccept 
    ? 'Are you sure you want to accept this trade?' 
    : 'Are you sure you want to cancel this trade offer?';
  const confirmText = isAccept ? 'Accept Trade' : 'Yes, Cancel Trade';
  const confirmClass = isAccept ? 'btn-confirm-accept' : 'btn-confirm-cancel';

  // Safety checks for trade data
  const offeredFruits = trade.offered_fruits || {};
  const requestedFruits = trade.requested_fruits || {};

  return (
    <div className="confirmation-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <h3>{title}</h3>
          <button className="close-btn-small" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="confirmation-body">
          <p>{message}</p>
          
          <div className="confirmation-trade-preview">
            <div className="preview-section">
              <h4>You'll Give:</h4>
              <div className="fruits-list">
                {Object.entries(isAccept ? requestedFruits : offeredFruits).map(([name, qty]) => (
                  <FruitBadge key={name} name={name} quantity={qty} />
                ))}
              </div>
            </div>
            
            {isAccept && (
              <>
                <div className="preview-arrow">→</div>
                
                <div className="preview-section">
                  <h4>You'll Receive:</h4>
                  <div className="fruits-list">
                    {Object.entries(offeredFruits).map(([name, qty]) => (
                      <FruitBadge key={name} name={name} quantity={qty} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn-cancel-action" onClick={onCancel}>
            Cancel
          </button>
          <button className={confirmClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export { FruitBadge, TradeTimer, TradeCard, SearchBar, SearchFilters, EmptyState, InventoryGrid, FruitSelector, ExpirationSelector, ConfirmationModal }