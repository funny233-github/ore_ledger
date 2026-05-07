import { generateId } from './data';
import type { LedgerState, TransactionInput, Transaction, PortfolioEntry, EngineResult, LedgerSummary } from './data';

export const r2 = (n: number): number => Math.round(n * 100) / 100;

export const LedgerEngine = {
  processBuy(state: LedgerState, tx: TransactionInput): LedgerState {
    const s = structuredClone(state);
    const assetId = tx.asset!;
    const qty = tx.quantity!;
    const totalPaid = Math.abs(tx.totalAmount);

    if (!s.portfolio[assetId]) {
      s.portfolio[assetId] = { quantity: 0, totalCost: 0, avgCost: 0 };
    }

    const p = s.portfolio[assetId];
    p.quantity += qty;
    p.totalCost += totalPaid;
    p.avgCost = r2(p.totalCost / p.quantity);

    s.cash -= totalPaid;
    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
    } as Transaction);

    return s;
  },

  processSell(state: LedgerState, tx: TransactionInput): EngineResult {
    const s = structuredClone(state);
    const assetId = tx.asset!;
    const qty = tx.quantity!;
    const received = tx.totalAmount;
    const source = tx.source || 'portfolio';

    if (source === 'mined') {
      s.cash += received;
      s.metadata.totalMiningIncome += received;
      s.transactions.push({
        ...tx,
        id: generateId(),
        createdAt: Date.now(),
        profit: received,
        source: 'mined',
      } as Transaction);
      return s;
    }

    const p = s.portfolio[assetId];
    if (!p || p.quantity < qty) {
      return { error: `Insufficient holdings: have ${p?.quantity || 0}, trying to sell ${qty}` };
    }

    const avgCostBefore = p.avgCost;
    const costOfSold = r2(qty * avgCostBefore);
    const profit = r2(received - costOfSold);

    p.quantity -= qty;
    p.totalCost = r2(p.totalCost - costOfSold);
    if (p.quantity <= 0) {
      p.quantity = 0;
      p.totalCost = 0;
      p.avgCost = 0;
    } else {
      p.avgCost = r2(p.totalCost / p.quantity);
    }

    s.cash += received;
    s.metadata.totalSpeculativeProfit += profit;

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
      profit,
      avgCostAtSale: avgCostBefore,
      costOfSold,
      source: 'portfolio',
    } as Transaction);

    return s;
  },

  processMineSell(state: LedgerState, tx: TransactionInput): LedgerState {
    const s = structuredClone(state);
    const received = tx.totalAmount;

    s.cash += received;
    s.metadata.totalMiningIncome += received;

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
    } as Transaction);

    return s;
  },

  processExpense(state: LedgerState, tx: TransactionInput): LedgerState {
    const s = structuredClone(state);
    const spent = Math.abs(tx.totalAmount);

    s.cash -= spent;
    s.metadata.totalExpenses += spent;

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
    } as Transaction);

    return s;
  },

  processBalanceAdjust(state: LedgerState, tx: TransactionInput): LedgerState {
    const s = structuredClone(state);
    const newBalance = tx.newBalance!;
    const adjustment = r2(newBalance - s.cash);

    s.cash = newBalance;
    s.metadata.totalAdjustments += adjustment;

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
      adjustment,
      previousBalance: s.cash - adjustment,
    } as Transaction);

    return s;
  },

  processWriteOff(state: LedgerState, tx: TransactionInput): EngineResult {
    const s = structuredClone(state);
    const assetId = tx.asset!;
    const qty = tx.quantity!;
    const p = s.portfolio[assetId];
    if (!p || p.quantity < qty) {
      return { error: `Insufficient holdings: have ${p?.quantity || 0}, trying to write off ${qty}` };
    }

    const lossAmount = r2(qty * p.avgCost);
    p.quantity -= qty;
    if (p.quantity <= 0) {
      p.quantity = 0;
      p.totalCost = 0;
      p.avgCost = 0;
    } else {
      p.avgCost = r2(p.totalCost / p.quantity);
    }

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
      lossAmount,
      previousQuantity: p.quantity + qty,
    } as Transaction);

    return s;
  },

  computeSummary(state: LedgerState): LedgerSummary {
    const s = state;
    let portfolioValue = 0;
    let totalHoldings = 0;

    Object.entries(s.portfolio).forEach(([_id, p]: [string, PortfolioEntry]) => {
      if (p.quantity > 0) {
        totalHoldings += p.quantity;
        portfolioValue += r2(p.quantity * p.avgCost);
      }
    });

    return {
      cash: s.cash,
      speculativeProfit: r2(s.metadata.totalSpeculativeProfit),
      miningIncome: r2(s.metadata.totalMiningIncome),
      totalExpenses: r2(s.metadata.totalExpenses),
      totalAdjustments: r2(s.metadata.totalAdjustments),
      portfolioValue: r2(portfolioValue),
      totalHoldings,
      unrealizedPnL: r2(portfolioValue - Object.values(s.portfolio).reduce((sum: number, p: PortfolioEntry) => sum + p.totalCost, 0)),
    };
  },

  process(state: LedgerState, tx: TransactionInput): EngineResult {
    switch (tx.type) {
      case 'buy':           return this.processBuy(state, tx);
      case 'sell':          return this.processSell(state, tx);
      case 'mine_sell':     return this.processMineSell(state, tx);
      case 'expense':       return this.processExpense(state, tx);
      case 'balance_adjust': return this.processBalanceAdjust(state, tx);
      case 'write_off':     return this.processWriteOff(state, tx);
      default:              return { error: `Unknown transaction type: ${(tx as TransactionInput).type}` };
    }
  },
};
