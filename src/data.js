const { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } = React;

/* ====================================================
   DATA MODEL
   ==================================================== */

/* --- 16 Ore Types --- */
const ORES = [
  // Shallow (7)
  { id: 'shallow_coal',       name: 'Shallow Coal',       category: 'shallow' },
  { id: 'shallow_copper',     name: 'Shallow Copper',     category: 'shallow' },
  { id: 'shallow_iron',       name: 'Shallow Iron',       category: 'shallow' },
  { id: 'shallow_diamond',    name: 'Shallow Diamond',    category: 'shallow' },
  { id: 'shallow_emerald',    name: 'Shallow Emerald',    category: 'shallow' },
  { id: 'shallow_redstone',   name: 'Shallow Redstone',   category: 'shallow' },
  { id: 'shallow_lapis',      name: 'Shallow Lapis Lazuli', category: 'shallow' },
  // Deep (7)
  { id: 'deep_coal',          name: 'Deep Coal',          category: 'deep' },
  { id: 'deep_copper',        name: 'Deep Copper',        category: 'deep' },
  { id: 'deep_iron',          name: 'Deep Iron',          category: 'deep' },
  { id: 'deep_diamond',       name: 'Deep Diamond',       category: 'deep' },
  { id: 'deep_emerald',       name: 'Deep Emerald',       category: 'deep' },
  { id: 'deep_redstone',      name: 'Deep Redstone',      category: 'deep' },
  { id: 'deep_lapis',         name: 'Deep Lapis Lazuli',  category: 'deep' },
  // Nether (2)
  { id: 'nether_quartz',      name: 'Nether Quartz',      category: 'nether' },
  { id: 'nether_gold',        name: 'Nether Gold Ore',    category: 'nether' },
];

/* --- Transaction Types --- */
const TX_TYPES = ['buy', 'sell', 'mine_sell', 'expense', 'balance_adjust'];

const TX_TYPE_CONFIG = {
  buy:     { label: 'Buy',       icon: '↓',   key: 'buy' },
  sell:    { label: 'Sell',      icon: '↑',   key: 'sell' },
  mine_sell: { label: 'Mine Sale', icon: '⛏', key: 'mine_sell' },
  expense: { label: 'Expense',   icon: '✕',   key: 'expense' },
  balance_adjust: { label: 'Adjust', icon: '⟳', key: 'balance_adjust' },
};

/* --- ID Generator --- */
let _idCounter = Date.now();
const generateId = () => `tx_${_idCounter++}_${Math.random().toString(36).slice(2, 6)}`;

/* --- Default State Factory --- */
const createEmptyState = () => ({
  version: 1,
  transactions: [],
  cash: 0,
  portfolio: {}, // { [oreId]: { quantity, totalCost, avgCost } }
  metadata: {
    totalSpeculativeProfit: 0,
    totalMiningIncome: 0,
    totalExpenses: 0,
    totalAdjustments: 0,
  },
});
