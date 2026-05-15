import { r2 } from './engine';
import type { Transaction, PortfolioEntry } from './data';
import { ORES } from './data';

const ORE_MAP = new Map(ORES.map(o => [o.id, o]));

export interface OreReturnData {
  oreId: string;
  oreName: string;
  category: string;
  totalCostInvested: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalReturn: number;
  returnRate: number;
  miningIncome: number;
}

export interface BalancePoint {
  date: string;
  cash: number;
  portfolioValue: number;
  netWorth: number;
}

export interface CompositionItem {
  name: string;
  value: number;
  category: string;
}

export interface CumulativePnlPoint {
  date: string;
  total: number;
}

export function computeOreReturns(
  transactions: Transaction[],
  portfolio: Record<string, PortfolioEntry>
): OreReturnData[] {
  const costByOre: Record<string, number> = {};
  const realizedPnlByOre: Record<string, number> = {};
  const miningIncomeByOre: Record<string, number> = {};
  const allOreIds = new Set<string>();

  for (const tx of transactions) {
    if (!tx.asset) continue;
    allOreIds.add(tx.asset);

    switch (tx.type) {
      case 'buy':
        costByOre[tx.asset] = (costByOre[tx.asset] || 0) + Math.abs(tx.totalAmount);
        break;
      case 'sell':
        if (tx.source === 'portfolio') {
          realizedPnlByOre[tx.asset] = (realizedPnlByOre[tx.asset] || 0) + (tx.profit || 0);
        } else if (tx.source === 'mined') {
          miningIncomeByOre[tx.asset] = (miningIncomeByOre[tx.asset] || 0) + tx.totalAmount;
        }
        break;
    }
  }

  Object.keys(portfolio).forEach(id => allOreIds.add(id));

  const results: OreReturnData[] = [];

  for (const oreId of allOreIds) {
    const ore = ORE_MAP.get(oreId);
    const entry = portfolio[oreId];
    const totalCostInvested = costByOre[oreId] || 0;
    const realizedPnl = realizedPnlByOre[oreId] || 0;

    let unrealizedPnl = 0;
    if (entry && entry.quantity > 0) {
      const currentValue = r2(entry.quantity * entry.avgCost);
      unrealizedPnl = r2(currentValue - entry.totalCost);
    }

    const totalReturn = r2(realizedPnl + unrealizedPnl);
    const returnRate = totalCostInvested > 0
      ? r2((totalReturn / totalCostInvested) * 100)
      : 0;
    const miningIncome = r2(miningIncomeByOre[oreId] || 0);

    results.push({
      oreId,
      oreName: ore?.name || oreId,
      category: ore?.category || 'unknown',
      totalCostInvested: r2(totalCostInvested),
      realizedPnl: r2(realizedPnl),
      unrealizedPnl,
      totalReturn,
      returnRate,
      miningIncome,
    });
  }

  return results.sort((a, b) => b.totalReturn - a.totalReturn);
}

class PortfolioState {
  cash = 0;
  holdings: Record<string, PortfolioEntry> = {};

  buy(asset: string, quantity: number, amount: number) {
    const paid = Math.abs(amount);
    if (!this.holdings[asset]) {
      this.holdings[asset] = { quantity: 0, totalCost: 0, avgCost: 0 };
    }
    const h = this.holdings[asset];
    h.quantity += quantity;
    h.totalCost += paid;
    h.avgCost = r2(h.totalCost / h.quantity);
    this.cash -= paid;
  }

  sell(asset: string, quantity: number, amount: number, costOfSold?: number) {
    const h = this.holdings[asset];
    if (h) {
      h.quantity -= quantity;
      h.totalCost -= costOfSold || 0;
      if (h.quantity <= 0) {
        delete this.holdings[asset];
      } else {
        h.avgCost = r2(h.totalCost / h.quantity);
      }
    }
    this.cash += amount;
  }

  mineSell(amount: number) {
    this.cash += amount;
  }

  expense(amount: number) {
    this.cash -= Math.abs(amount);
  }

  adjustBalance(newBalance: number) {
    this.cash = newBalance;
  }

  writeOff(asset: string, quantity: number) {
    const h = this.holdings[asset];
    if (h) {
      h.quantity -= quantity;
      if (h.quantity <= 0) {
        delete this.holdings[asset];
      }
    }
  }

  get portfolioValue(): number {
    return r2(
      Object.values(this.holdings).reduce(
        (s, p) => s + r2(p.quantity * p.avgCost), 0
      )
    );
  }

  snapshot(date: string): BalancePoint {
    const pv = this.portfolioValue;
    return {
      date,
      cash: r2(this.cash),
      portfolioValue: pv,
      netWorth: r2(this.cash + pv),
    };
  }
}

export function computeBalanceHistory(
  transactions: Transaction[]
): BalancePoint[] {
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  const state = new PortfolioState();
  const points: BalancePoint[] = [state.snapshot('')];

  for (const tx of sorted) {
    switch (tx.type) {
      case 'buy':
        state.buy(tx.asset!, tx.quantity!, tx.totalAmount);
        break;
      case 'sell':
        if (tx.source === 'portfolio' && tx.asset) {
          state.sell(tx.asset, tx.quantity!, tx.totalAmount, tx.costOfSold);
        } else {
          state.mineSell(tx.totalAmount);
        }
        break;
      case 'mine_sell':
        state.mineSell(tx.totalAmount);
        break;
      case 'expense':
        state.expense(tx.totalAmount);
        break;
      case 'balance_adjust':
        state.adjustBalance(tx.newBalance!);
        break;
      case 'write_off':
        if (tx.asset) state.writeOff(tx.asset, tx.quantity!);
        break;
    }

    points.push(state.snapshot(tx.date));
  }

  return points;
}

export function computePortfolioComposition(
  portfolio: Record<string, PortfolioEntry>
): CompositionItem[] {
  return Object.entries(portfolio)
    .filter(([_, p]) => p.quantity > 0)
    .map(([id, p]) => {
      const ore = ORE_MAP.get(id);
      return {
        name: ore?.name || id,
        value: r2(p.quantity * p.avgCost),
        category: ore?.category || 'unknown',
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function computeCumulativePnl(transactions: Transaction[]): CumulativePnlPoint[] {
  const sorted = [...transactions]
    .filter(t => t.type === 'sell' && t.source === 'portfolio')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

  let cumulative = 0;
  const points: CumulativePnlPoint[] = [];

  for (const tx of sorted) {
    cumulative += tx.profit || 0;
    points.push({ date: tx.date, total: r2(cumulative) });
  }

  return points;
}

/* ─── Price Distribution (Box Plot) ─── */

export interface PriceStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
}

export interface OrePriceDistribution {
  oreId: string;
  oreName: string;
  category: string;
  buy: PriceStats | null;
  sell: PriceStats | null;
}

function percentile(sorted: number[], p: number): number {
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return r2(sorted[lower]);
  return r2(sorted[lower] * (upper - index) + sorted[upper] * (index - lower));
}

function computeStats(prices: number[]): PriceStats | null {
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  return {
    min: sorted[0],
    q1: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    q3: percentile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

export function computePriceDistribution(
  transactions: Transaction[]
): OrePriceDistribution[] {
  const buyPrices: Record<string, number[]> = {};
  const sellPrices: Record<string, number[]> = {};
  const oreIds = new Set<string>();

  for (const tx of transactions) {
    if (!tx.asset || tx.unitPrice == null) continue;
    oreIds.add(tx.asset);
    if (tx.type === 'buy') {
      (buyPrices[tx.asset] ??= []).push(tx.unitPrice);
    } else if (tx.type === 'sell') {
      (sellPrices[tx.asset] ??= []).push(tx.unitPrice);
    }
  }

  return Array.from(oreIds)
    .sort()
    .map(id => {
      const ore = ORE_MAP.get(id);
      return {
        oreId: id,
        oreName: ore?.name || id,
        category: ore?.category || 'unknown',
        buy: computeStats(buyPrices[id] || []),
        sell: computeStats(sellPrices[id] || []),
      };
    })
    .filter(d => d.buy || d.sell);
}

export function getDateRange(
  range: string,
): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  switch (range) {
    case '7d': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString().split('T')[0], endDate };
    }
    case '30d': {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { startDate: d.toISOString().split('T')[0], endDate };
    }
    case '90d': {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      return { startDate: d.toISOString().split('T')[0], endDate };
    }
    case 'year': {
      return { startDate: `${today.getFullYear()}-01-01`, endDate };
    }
    default:
      return { startDate: '', endDate: '' };
  }
}

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  startDate: string,
  endDate: string
): T[] {
  if (!startDate && !endDate) return items;
  return items.filter(item =>
    (!startDate || item.date >= startDate) &&
    (!endDate || item.date <= endDate)
  );
}
