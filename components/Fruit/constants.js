const TABS = {
  BROWSE: 'browse',
  CREATE: 'create',
  MY_TRADES: 'myTrades'
};

const SEARCH_FILTERS = {
  ALL: 'all',
  USER: 'user',
  OFFERING: 'offering',
  REQUESTING: 'requesting'
};

const EXPIRATION_OPTIONS = [6, 12, 24, 48];

const FRUIT_TYPES = ['apple', 'orange', 'pine', 'cherry', 'plum'];

const FRUIT_EMOJI_MAP = {
  apple: '🍎',
  orange: '🍊',
  pine: '🌲',
  cherry: '🍒',
  plum: '🍑',
  default: '🍇'
};

const REQUEST_TIMEOUT = 15000;
const AUTO_REFRESH_INTERVAL = 30000;

export { TABS, SEARCH_FILTERS, EXPIRATION_OPTIONS, FRUIT_TYPES, FRUIT_EMOJI_MAP, REQUEST_TIMEOUT, AUTO_REFRESH_INTERVAL }