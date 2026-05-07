import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Storage } from './storage';
import { LedgerEngine, r2 } from './engine';
import { ORES } from './data';
import type {
  TxType,
  Transaction,
  TransactionInput,
  PortfolioEntry,
  PortfolioEntryWithMeta,
  LedgerState,
  LedgerSummary,
} from './data';

/* ====================================================
   UTILITY FUNCTIONS
   ==================================================== */

export const formatDate = (d?: number | string | null): string => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatCurrency = (n?: number | null): string => {
  if (n === undefined || n === null) return '0.0';
  const abs = Math.abs(n).toFixed(1);
  return n < 0 ? `-${abs}` : abs;
};

export const formatCurrencyFull = (n?: number | null): string => {
  if (n === undefined || n === null) return '0.00';
  return n.toFixed(2);
};

/* ====================================================
   TOAST NOTIFICATION SYSTEM
   ==================================================== */

type ToastType = 'success' | 'error' | 'info';

export type ToastFn = (message: string, type?: ToastType, duration?: number) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);
  const toastId = useRef(0);
  const exiting = useRef(new Set<number>());

  const addToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      exiting.current.add(id);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--accent)',
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none', alignItems: 'flex-end',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} onClick={() => removeToast(toast.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'oklch(0.15 0.01 85)',
              color: 'oklch(0.92 0.005 85)',
              fontSize: '0.85rem',
              fontWeight: 480,
              lineHeight: 1.4,
              boxShadow: 'var(--shadow-elevated)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              animation: 'toastSlide 250ms ease-out',
              maxWidth: 380,
              borderLeft: `3px solid ${colorMap[toast.type] || 'var(--accent)'}`,
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}

/* ====================================================
   HOOKS & STATE MANAGEMENT
   ==================================================== */

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '◈' },
  { id: 'transactions',  label: 'Transactions',  icon: '↕' },
  { id: 'portfolio',     label: 'Portfolio',     icon: '⊞' },
  { id: 'new-entry',     label: 'New Entry',     icon: '+'  },
];

export interface OreCostAnalysis {
  count: number;
  minPrice: number;
  maxPrice: number;
  latestPrice: number;
  avgCost: number;
  vsLatest: number;
}

export interface UseLedgerReturn {
  state: LedgerState;
  summary: LedgerSummary;
  transactions: Transaction[];
  recentTransactions: Transaction[];
  activePortfolio: PortfolioEntryWithMeta[];
  addTransaction: (tx: TransactionInput) => boolean;
  deleteTransaction: (txId: string) => void;
  getOreHolding: (oreId: string) => PortfolioEntry;
  getOreCostAnalysis: (oreId: string) => OreCostAnalysis;
  adjustQuantity: (oreId: string, newQuantity: number) => boolean;
}

export function useLedger(): UseLedgerReturn {
  const [state, setState] = useState<LedgerState>(() => Storage.loadState());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      Storage.saveState(state);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  const summary = useMemo(() => LedgerEngine.computeSummary(state), [state]);

  const addTransaction = useCallback((tx: TransactionInput): boolean => {
    const result = LedgerEngine.process(state, tx);
    if ('error' in result) {
      console.warn('Ore Ledger: Transaction rejected:', result.error);
      return false;
    }
    setState(result);
    return true;
  }, [state]);

  const deleteTransaction = useCallback((txId: string) => {
    setState(prev => {
      const tx = prev.transactions.find(t => t.id === txId);
      if (!tx) return prev;

      const s: LedgerState = structuredClone(prev);
      s.transactions = s.transactions.filter(t => t.id !== txId);

      switch (tx.type) {
        case 'buy': {
          const assetId = tx.asset!;
          const totalPaid = Math.abs(tx.totalAmount);
          if (s.portfolio[assetId]) {
            s.portfolio[assetId].quantity -= tx.quantity!;
            s.portfolio[assetId].totalCost -= totalPaid;
            if (s.portfolio[assetId].quantity <= 0) {
              delete s.portfolio[assetId];
            } else {
              s.portfolio[assetId].avgCost = r2(s.portfolio[assetId].totalCost / s.portfolio[assetId].quantity);
            }
          }
          s.cash += totalPaid;
          break;
        }
        case 'sell': {
          const assetId = tx.asset!;
          if (!s.portfolio[assetId]) {
            s.portfolio[assetId] = { quantity: 0, totalCost: 0, avgCost: 0 };
          }
          const p = s.portfolio[assetId];
          p.quantity += tx.quantity!;
          p.totalCost += tx.costOfSold || (tx.quantity! * (tx.avgCostAtSale || 0));
          p.avgCost = p.quantity > 0 ? r2(p.totalCost / p.quantity) : 0;
          s.cash -= tx.totalAmount;
          s.metadata.totalSpeculativeProfit -= (tx.profit || 0);
          break;
        }
        case 'mine_sell': {
          s.cash -= tx.totalAmount;
          s.metadata.totalMiningIncome -= tx.totalAmount;
          break;
        }
        case 'expense': {
          const spent = Math.abs(tx.totalAmount);
          s.cash += spent;
          s.metadata.totalExpenses -= spent;
          break;
        }
        case 'balance_adjust': {
          s.cash = tx.previousBalance || 0;
          s.metadata.totalAdjustments -= (tx.adjustment || 0);
          break;
        }
        case 'write_off': {
          const assetId = tx.asset!;
          const lossAmount = tx.lossAmount || 0;
          if (!s.portfolio[assetId]) {
            s.portfolio[assetId] = { quantity: 0, totalCost: 0, avgCost: 0 };
          }
          const wp = s.portfolio[assetId];
          wp.quantity += tx.quantity!;
          wp.totalCost += lossAmount;
          wp.avgCost = wp.quantity > 0 ? r2(wp.totalCost / wp.quantity) : 0;
          break;
        }
      }
      return s;
    });
  }, []);

  const sortedTransactions = useMemo(() => {
    return [...state.transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [state.transactions]);

  const activePortfolio = useMemo((): PortfolioEntryWithMeta[] => {
    return Object.entries(state.portfolio)
      .filter(([_id, p]) => p.quantity > 0)
      .map(([id, p]) => {
        const ore = ORES.find(o => o.id === id);
        return {
          id,
          name: ore ? ore.name : id,
          category: ore ? ore.category : 'unknown',
          ...p,
          currentValue: r2(p.quantity * p.avgCost),
          pnl: r2((p.quantity * p.avgCost) - p.totalCost),
        };
      });
  }, [state.portfolio]);

  const getOreHolding = useCallback((oreId: string): PortfolioEntry => {
    return state.portfolio[oreId] || { quantity: 0, totalCost: 0, avgCost: 0 };
  }, [state.portfolio]);

  const getOreCostAnalysis = useCallback((oreId: string): OreCostAnalysis => {
    const buys = state.transactions
      .filter(t => t.type === 'buy' && t.asset === oreId)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    if (buys.length === 0) {
      return { count: 0, minPrice: 0, maxPrice: 0, latestPrice: 0, avgCost: 0, vsLatest: 0 };
    }
    const prices = buys.map(t => t.unitPrice!);
    const latestPrice = prices[prices.length - 1];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const holding = state.portfolio[oreId];
    const avgCost = holding ? holding.avgCost : 0;
    const vsLatest = avgCost > 0 ? r2((latestPrice - avgCost) / avgCost * 100) : 0;
    return { count: buys.length, minPrice, maxPrice, latestPrice, avgCost, vsLatest };
  }, [state.transactions, state.portfolio]);

  const adjustQuantity = useCallback((oreId: string, newQuantity: number): boolean => {
    const holding = state.portfolio[oreId];
    if (!holding || holding.quantity <= 0) return false;
    const diff = holding.quantity - newQuantity;
    if (diff <= 0) return false;

    const result = LedgerEngine.process(state, {
      type: 'write_off',
      asset: oreId,
      quantity: diff,
      unitPrice: holding.avgCost,
      totalAmount: 0,
      date: new Date().toISOString().split('T')[0],
      note: `Inventory write-off: reduced from ${holding.quantity} to ${newQuantity}`,
    });
    if ('error' in result) {
      console.warn('Ore Ledger: write-off rejected:', result.error);
      return false;
    }
    setState(result);
    return true;
  }, [state]);

  const recentTransactions = useMemo(() => {
    return sortedTransactions.slice(0, 5);
  }, [sortedTransactions]);

  return {
    state,
    summary,
    transactions: sortedTransactions,
    recentTransactions,
    activePortfolio,
    addTransaction,
    deleteTransaction,
    getOreHolding,
    getOreCostAnalysis,
    adjustQuantity,
  };
}
