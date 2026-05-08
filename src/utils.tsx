import { useState, useCallback, useRef, createContext, useContext } from 'react';
import type { ReactNode, JSX } from 'react';
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

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
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
   NAVIGATION
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

/* ====================================================
   Ore Cost Analysis
   ==================================================== */

export interface OreCostAnalysis {
  count: number;
  minPrice: number;
  maxPrice: number;
  latestPrice: number;
  avgCost: number;
  vsLatest: number;
}

/* ====================================================
   LEDGER CONTROLLER
   ==================================================== */

/**
 * Central state controller for the ledger application.
 * Manages all state, computed values, and actions.
 * Instantiated once via useLedger() and passed to PageControllers.
 */
export class LedgerController {
  private _state: LedgerState;
  private _notify!: () => void;
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this._state = Storage.loadState();
  }

  /** Wire up the React re-render callback. Must be called once before use. */
  init(notify: () => void): void {
    this._notify = notify;
  }

  private _scheduleSave(): void {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      Storage.saveState(this._state);
    }, 500);
  }

  /* -- read-only state -- */

  get state(): LedgerState { return this._state; }

  get summary(): LedgerSummary {
    return LedgerEngine.computeSummary(this._state);
  }

  get transactions(): Transaction[] {
    return [...this._state.transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  get recentTransactions(): Transaction[] {
    return this.transactions.slice(0, 5);
  }

  get activePortfolio(): PortfolioEntryWithMeta[] {
    return Object.entries(this._state.portfolio)
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
  }

  getOreHolding(oreId: string): PortfolioEntry {
    return this._state.portfolio[oreId] || { quantity: 0, totalCost: 0, avgCost: 0 };
  }

  getOreCostAnalysis(oreId: string): OreCostAnalysis {
    const buys = this._state.transactions
      .filter((t): t is Transaction & { asset: string; unitPrice: number } =>
        t.type === 'buy' && t.asset === oreId && t.unitPrice !== undefined
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    if (buys.length === 0) {
      return { count: 0, minPrice: 0, maxPrice: 0, latestPrice: 0, avgCost: 0, vsLatest: 0 };
    }
    const prices = buys.map(t => t.unitPrice);
    const latestPrice = prices[prices.length - 1];
    const holding = this._state.portfolio[oreId];
    const avgCost = holding ? holding.avgCost : 0;
    const vsLatest = avgCost > 0 ? r2((latestPrice - avgCost) / avgCost * 100) : 0;
    return { count: buys.length, minPrice: Math.min(...prices), maxPrice: Math.max(...prices), latestPrice, avgCost, vsLatest };
  }

  /* -- stack model -- */

  isLatestTx(txId: string): boolean {
    let latest: Transaction | null = null;
    for (const tx of this._state.transactions) {
      if (!latest || tx.createdAt > latest.createdAt) latest = tx;
    }
    return latest?.id === txId;
  }

  /* -- actions -- */

  addTransaction(tx: TransactionInput): boolean {
    const result = LedgerEngine.process(this._state, tx);
    if ('error' in result) {
      console.warn('Ore Ledger: Transaction rejected:', result.error);
      return false;
    }
    this._state = result;
    this._scheduleSave();
    this._notify();
    return true;
  }

  deleteTransaction(txId: string): void {
    const tx = this._state.transactions.find(t => t.id === txId);
    if (!tx) return;

    const s: LedgerState = structuredClone(this._state);
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
        if (!s.portfolio[assetId]) {
          s.portfolio[assetId] = { quantity: 0, totalCost: 0, avgCost: 0 };
        }
        const wp = s.portfolio[assetId];
        wp.quantity += tx.quantity!;
        wp.avgCost = wp.quantity > 0 ? r2(wp.totalCost / wp.quantity) : 0;
        break;
      }
    }

    this._state = s;
    this._scheduleSave();
    this._notify();
  }

  adjustQuantity(oreId: string, newQuantity: number): boolean {
    const holding = this._state.portfolio[oreId];
    if (!holding || holding.quantity <= 0) return false;
    const diff = holding.quantity - newQuantity;
    if (diff <= 0) return false;

    const result = LedgerEngine.process(this._state, {
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
    this._state = result;
    this._scheduleSave();
    this._notify();
    return true;
  }
}

/* ====================================================
   useLedger HOOK
   ==================================================== */

/**
 * Creates a singleton LedgerController for the app.
 * Returns the same instance across renders. The controller
 * calls notify via init() to trigger re-renders on state change.
 */
export function useLedger(): LedgerController {
  const [, forceUpdate] = useState(0);
  const notify = useCallback(() => forceUpdate(n => n + 1), []);

  const ctrl = useRef<LedgerController>(null);
  if (!ctrl.current) {
    ctrl.current = new LedgerController();
    ctrl.current.init(notify);
  }

  return ctrl.current;
}
