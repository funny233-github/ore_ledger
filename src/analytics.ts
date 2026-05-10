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

export function computeBalanceHistory(
  transactions: Transaction[]
): BalancePoint[] {
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  let cash = 0;
  const port: Record<string, PortfolioEntry> = {};
  const points: BalancePoint[] = [];

  points.push({ date: '', cash: 0, portfolioValue: 0, netWorth: 0 });

  for (const tx of sorted) {
    switch (tx.type) {
      case 'buy': {
        const id = tx.asset!;
        const paid = Math.abs(tx.totalAmount);
        if (!port[id]) port[id] = { quantity: 0, totalCost: 0, avgCost: 0 };
        port[id].quantity += tx.quantity!;
        port[id].totalCost += paid;
        port[id].avgCost = r2(port[id].totalCost / port[id].quantity);
        cash -= paid;
        break;
      }
      case 'sell': {
        if (tx.source === 'portfolio' && tx.asset) {
          const id = tx.asset;
          if (port[id]) {
            port[id].quantity -= tx.quantity!;
            port[id].totalCost -= tx.costOfSold || 0;
            if (port[id].quantity <= 0) {
              delete port[id];
            } else {
              port[id].avgCost = r2(port[id].totalCost / port[id].quantity);
            }
          }
          cash += tx.totalAmount;
        } else {
          cash += tx.totalAmount;
        }
        break;
      }
      case 'mine_sell': {
        cash += tx.totalAmount;
        break;
      }
      case 'expense': {
        cash -= Math.abs(tx.totalAmount);
        break;
      }
      case 'balance_adjust': {
        cash = tx.newBalance ?? cash;
        break;
      }
      case 'write_off': {
        if (tx.asset && port[tx.asset]) {
          port[tx.asset].quantity -= tx.quantity!;
          if (port[tx.asset].quantity <= 0) {
            delete port[tx.asset];
          }
        }
        break;
      }
    }

    const portfolioValue = r2(
      Object.values(port).reduce((s, p) => s + r2(p.quantity * p.avgCost), 0)
    );

    points.push({
      date: tx.date,
      cash: r2(cash),
      portfolioValue,
      netWorth: r2(cash + portfolioValue),
    });
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

export function getDateRange(
  range: string,
): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  switch (range) {
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
