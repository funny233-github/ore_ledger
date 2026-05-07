/* ====================================================
   DATA MODEL — Types & Constants
   ==================================================== */

/* --- Ore Types --- */

export type OreCategory = 'shallow' | 'deep' | 'nether';

export interface Ore {
  id: string;
  name: string;
  category: OreCategory;
}

export const ORES: Ore[] = [
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

export type TxType = 'buy' | 'sell' | 'mine_sell' | 'expense' | 'balance_adjust' | 'write_off';

export const TX_TYPES: TxType[] = ['buy', 'sell', 'mine_sell', 'expense', 'balance_adjust', 'write_off'];

export interface TxTypeConfig {
  label: string;
  icon: string;
  key: TxType;
}

export const TX_TYPE_CONFIG: Record<TxType, TxTypeConfig> = {
  buy:     { label: 'Buy',       icon: '↓',   key: 'buy' },
  sell:    { label: 'Sell',      icon: '↑',   key: 'sell' },
  mine_sell: { label: 'Mine Sale', icon: '⛏', key: 'mine_sell' },
  expense: { label: 'Expense',   icon: '✕',   key: 'expense' },
  balance_adjust: { label: 'Adjust', icon: '⟳', key: 'balance_adjust' },
  write_off: { label: 'Write-off', icon: '✗',  key: 'write_off' },
};

/* --- Portfolio --- */

export interface PortfolioEntry {
  quantity: number;
  totalCost: number;
  avgCost: number;
}

export interface PortfolioEntryWithMeta extends PortfolioEntry {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  pnl: number;
}

/* --- Metadata --- */

export interface Metadata {
  totalSpeculativeProfit: number;
  totalMiningIncome: number;
  totalExpenses: number;
  totalAdjustments: number;
}

/* --- Ledger State --- */

export interface LedgerState {
  version: number;
  transactions: Transaction[];
  cash: number;
  portfolio: Record<string, PortfolioEntry>;
  metadata: Metadata;
}

/* --- Transactions --- */

/** Fields a user submits when creating a transaction (before engine processes it). */
export interface TransactionInput {
  type: TxType;
  date: string;
  asset?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount: number;
  newBalance?: number;
  description?: string;
  note?: string;
  source?: 'portfolio' | 'mined';
}

/** A full transaction after the engine has processed it (stored in state). */
export interface Transaction {
  id: string;
  createdAt: number;
  type: TxType;
  date: string;
  asset?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount: number;
  newBalance?: number;
  description?: string;
  note?: string;
  source?: 'portfolio' | 'mined';
  // Engine-added — sell
  profit?: number;
  avgCostAtSale?: number;
  costOfSold?: number;
  // Engine-added — balance_adjust
  adjustment?: number;
  previousBalance?: number;
  // Engine-added — write_off
  lossAmount?: number;
  previousQuantity?: number;
}

/* --- Summary --- */

export interface LedgerSummary {
  cash: number;
  speculativeProfit: number;
  miningIncome: number;
  totalExpenses: number;
  totalAdjustments: number;
  portfolioValue: number;
  totalHoldings: number;
  unrealizedPnL: number;
}

/* --- Engine --- */

export interface EngineError {
  error: string;
}

export type EngineResult = LedgerState | EngineError;

/* --- ID Generator --- */

let _idCounter = Date.now();
export const generateId = (): string =>
  `tx_${_idCounter++}_${Math.random().toString(36).slice(2, 6)}`;

/* --- Default State Factory --- */

export const createEmptyState = (): LedgerState => ({
  version: 1,
  transactions: [],
  cash: 0,
  portfolio: {},
  metadata: {
    totalSpeculativeProfit: 0,
    totalMiningIncome: 0,
    totalExpenses: 0,
    totalAdjustments: 0,
  },
});
