import { useState, useCallback, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import { Storage } from './storage.js';
import { LedgerEngine, r2 } from './engine.js';
import { ORES } from './data.js';

/* ====================================================
   UTILITY FUNCTIONS
   ==================================================== */

export const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatCurrency = (n) => {
  if (n === undefined || n === null) return '0.0';
  const abs = Math.abs(n).toFixed(1);
  return n < 0 ? `-${abs}` : abs;
};

export const formatCurrencyFull = (n) => {
  if (n === undefined || n === null) return '0.00';
  return n.toFixed(2);
};

/* ====================================================
   TOAST NOTIFICATION SYSTEM
   ==================================================== */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const exiting = useRef(new Set());

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      exiting.current.add(id);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const colorMap = {
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

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}

/* ====================================================
   HOOKS & STATE MANAGEMENT
   ==================================================== */

export const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '◈' },
  { id: 'transactions',  label: 'Transactions',  icon: '↕' },
  { id: 'portfolio',     label: 'Portfolio',     icon: '⊞' },
  { id: 'new-entry',     label: 'New Entry',     icon: '+'  },
];

export function useLedger() {
  const [state, setState] = useState(() => Storage.loadState());
  const saveTimerRef = useRef(null);

  // Auto-save with debounce
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

  const addTransaction = useCallback((tx) => {
    const result = LedgerEngine.process(state, tx);
    if (result.error) {
      console.warn('Ore Ledger: Transaction rejected:', result.error);
      return false;
    }
    setState(result);
    return true;
  }, [state]);

  const deleteTransaction = useCallback((txId) => {
    setState(prev => {
      const tx = prev.transactions.find(t => t.id === txId);
      if (!tx) return prev;

      const s = structuredClone(prev);
      s.transactions = s.transactions.filter(t => t.id !== txId);

      // Reverse effects
      switch (tx.type) {
        case 'buy': {
          const assetId = tx.asset;
          const totalPaid = Math.abs(tx.totalAmount);
          if (s.portfolio[assetId]) {
            s.portfolio[assetId].quantity -= tx.quantity;
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
          const assetId = tx.asset;
          if (!s.portfolio[assetId]) {
            s.portfolio[assetId] = { quantity: 0, totalCost: 0, avgCost: 0 };
          }
          const p = s.portfolio[assetId];
          p.quantity += tx.quantity;
          p.totalCost += tx.costOfSold || (tx.quantity * (tx.avgCostAtSale || 0));
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
      }
      return s;
    });
  }, []);

  // Get transactions sorted by date DESC
  const sortedTransactions = useMemo(() => {
    return [...state.transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [state.transactions]);

  // Get portfolio items with positive quantity
  const activePortfolio = useMemo(() => {
    return Object.entries(state.portfolio)
      .filter(([id, p]) => p.quantity > 0)
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

  const getOreHolding = useCallback((oreId) => {
    return state.portfolio[oreId] || { quantity: 0, totalCost: 0, avgCost: 0 };
  }, [state.portfolio]);

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
  };
}
