import { describe, it, expect } from 'vitest';
import {
  computeOreReturns,
  computeBalanceHistory,
  computePortfolioComposition,
  computeCumulativePnl,
  getDateRange,
  filterByDateRange,
} from '../analytics';
import type { Transaction, PortfolioEntry } from '../data';

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx_test',
    createdAt: Date.now(),
    type: 'buy',
    date: '2025-01-15',
    asset: 'shallow_iron',
    quantity: 10,
    unitPrice: 15,
    totalAmount: 150,
    ...overrides,
  };
}

/* -------------------------------------------------- */

describe('computeOreReturns', () => {
  it('returns empty array for no transactions and empty portfolio', () => {
    expect(computeOreReturns([], {})).toEqual([]);
  });

  it('calculates returns for a simple buy + sell cycle', () => {
    const transactions: Transaction[] = [
      tx({ type: 'buy', asset: 'shallow_iron', quantity: 10, totalAmount: 150 }),
      tx({ type: 'sell', asset: 'shallow_iron', quantity: 5, totalAmount: 100, source: 'portfolio', profit: 25 }),
    ];
    const portfolio: Record<string, PortfolioEntry> = {
      shallow_iron: { quantity: 5, totalCost: 75, avgCost: 15 },
    };
    const results = computeOreReturns(transactions, portfolio);
    expect(results).toHaveLength(1);
    expect(results[0].oreId).toBe('shallow_iron');
    expect(results[0].totalCostInvested).toBe(150);
    expect(results[0].realizedPnl).toBe(25);
    expect(results[0].unrealizedPnl).toBe(0);
    expect(results[0].totalReturn).toBe(25);
    expect(results[0].returnRate).toBeCloseTo(16.67, 1);
  });

  it('includes mining income from mined sells', () => {
    const transactions: Transaction[] = [
      tx({ type: 'sell', asset: 'shallow_iron', totalAmount: 200, source: 'mined', profit: 200 }),
    ];
    const results = computeOreReturns(transactions, {});
    expect(results).toHaveLength(1);
    expect(results[0].miningIncome).toBe(200);
  });

  it('includes unrealized P&L for held ore', () => {
    const portfolio: Record<string, PortfolioEntry> = {
      deep_diamond: { quantity: 10, totalCost: 500, avgCost: 60 },
    };
    const results = computeOreReturns([], portfolio);
    expect(results).toHaveLength(1);
    expect(results[0].unrealizedPnl).toBe(100);
    expect(results[0].totalReturn).toBe(100);
  });

  it('sorts results by totalReturn descending', () => {
    const transactions: Transaction[] = [
      tx({ id: 't1', type: 'buy', asset: 'shallow_iron', quantity: 10, totalAmount: 100 }),
      tx({ id: 't2', type: 'sell', asset: 'shallow_iron', quantity: 5, totalAmount: 80, source: 'portfolio', profit: 30 }),
      tx({ id: 't3', type: 'buy', asset: 'deep_copper', quantity: 10, totalAmount: 100 }),
      tx({ id: 't4', type: 'sell', asset: 'deep_copper', quantity: 5, totalAmount: 60, source: 'portfolio', profit: 10 }),
    ];
    const portfolio: Record<string, PortfolioEntry> = {
      shallow_iron: { quantity: 5, totalCost: 50, avgCost: 10 },
      deep_copper: { quantity: 5, totalCost: 50, avgCost: 10 },
    };
    const results = computeOreReturns(transactions, portfolio);
    expect(results[0].oreId).toBe('shallow_iron');
    expect(results[1].oreId).toBe('deep_copper');
  });
});

describe('computeBalanceHistory', () => {
  it('returns initial snapshot for empty transactions', () => {
    const points = computeBalanceHistory([]);
    expect(points).toHaveLength(1);
    expect(points[0].cash).toBe(0);
    expect(points[0].portfolioValue).toBe(0);
    expect(points[0].netWorth).toBe(0);
    expect(points[0].date).toBe('');
  });

  it('replays buy transactions correctly', () => {
    const transactions: Transaction[] = [
      tx({ type: 'buy', asset: 'shallow_iron', quantity: 10, totalAmount: 200 }),
    ];
    const points = computeBalanceHistory(transactions);
    expect(points).toHaveLength(2);
    expect(points[1].cash).toBe(-200);
    expect(points[1].portfolioValue).toBe(200);
    expect(points[1].netWorth).toBe(0);
  });

  it('replays expense transaction', () => {
    const transactions: Transaction[] = [
      tx({ type: 'expense', totalAmount: 100 }),
    ];
    const points = computeBalanceHistory(transactions);
    expect(points).toHaveLength(2);
    expect(points[1].cash).toBe(-100);
  });

  it('replays portfolio sell transaction', () => {
    const transactions: Transaction[] = [
      tx({ type: 'buy', asset: 'shallow_iron', quantity: 10, totalAmount: 150 }),
      tx({ type: 'sell', asset: 'shallow_iron', quantity: 5, totalAmount: 100, source: 'portfolio', costOfSold: 75 }),
    ];
    const points = computeBalanceHistory(transactions);
    expect(points).toHaveLength(3);
    expect(points[2].cash).toBe(-50);
    expect(points[2].portfolioValue).toBe(75);
    expect(points[2].netWorth).toBe(25);
  });

  it('replays mined sell transaction', () => {
    const transactions: Transaction[] = [
      tx({ type: 'sell', asset: 'shallow_iron', totalAmount: 300, source: 'mined' }),
    ];
    const points = computeBalanceHistory(transactions);
    expect(points).toHaveLength(2);
    expect(points[1].cash).toBe(300);
  });

  it('replays balance_adjust transaction', () => {
    const transactions: Transaction[] = [
      tx({ type: 'balance_adjust', newBalance: 1000 }),
    ];
    const points = computeBalanceHistory(transactions);
    expect(points).toHaveLength(2);
    expect(points[1].cash).toBe(1000);
  });

  it('replays write_off transactions', () => {
    const transactions: Transaction[] = [
      tx({ type: 'buy', asset: 'shallow_iron', quantity: 10, totalAmount: 150 }),
      tx({ type: 'write_off', asset: 'shallow_iron', quantity: 4 }),
    ];
    const points = computeBalanceHistory(transactions);
    expect(points).toHaveLength(3);
    expect(points[2].portfolioValue).toBe(90);
  });
});

describe('computePortfolioComposition', () => {
  it('returns empty for empty portfolio', () => {
    expect(computePortfolioComposition({})).toEqual([]);
  });

  it('returns composition items sorted by value descending', () => {
    const portfolio: Record<string, PortfolioEntry> = {
      shallow_iron: { quantity: 10, totalCost: 150, avgCost: 15 },
      deep_diamond: { quantity: 5, totalCost: 500, avgCost: 100 },
    };
    const items = computePortfolioComposition(portfolio);
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Deep Diamond');
    expect(items[0].value).toBe(500);
    expect(items[1].name).toBe('Shallow Iron');
    expect(items[1].value).toBe(150);
  });

  it('filters out zero-quantity entries', () => {
    const portfolio: Record<string, PortfolioEntry> = {
      shallow_iron: { quantity: 0, totalCost: 0, avgCost: 0 },
      deep_diamond: { quantity: 5, totalCost: 500, avgCost: 100 },
    };
    const items = computePortfolioComposition(portfolio);
    expect(items).toHaveLength(1);
  });

  it('assigns correct category from ore map', () => {
    const portfolio: Record<string, PortfolioEntry> = {
      nether_quartz: { quantity: 10, totalCost: 100, avgCost: 10 },
    };
    const items = computePortfolioComposition(portfolio);
    expect(items[0].category).toBe('nether');
  });
});

describe('computeCumulativePnl', () => {
  it('returns empty array when no portfolio sells', () => {
    const transactions: Transaction[] = [
      tx({ type: 'buy', asset: 'shallow_iron', quantity: 10, totalAmount: 150 }),
      tx({ type: 'sell', totalAmount: 100, source: 'mined' }),
    ];
    expect(computeCumulativePnl(transactions)).toEqual([]);
  });

  it('accumulates profit over multiple sells', () => {
    const transactions: Transaction[] = [
      tx({ id: 't1', type: 'sell', asset: 'shallow_iron', totalAmount: 100, source: 'portfolio', profit: 25, date: '2025-01-10' }),
      tx({ id: 't2', type: 'sell', asset: 'deep_copper', totalAmount: 100, source: 'portfolio', profit: 50, date: '2025-01-20' }),
    ];
    const points = computeCumulativePnl(transactions);
    expect(points).toHaveLength(2);
    expect(points[0].total).toBe(25);
    expect(points[1].total).toBe(75);
  });

  it('sorts by date then createdAt', () => {
    const transactions: Transaction[] = [
      tx({ id: 't1', type: 'sell', asset: 'shallow_iron', totalAmount: 100, source: 'portfolio', profit: 10, date: '2025-02-01', createdAt: 200 }),
      tx({ id: 't2', type: 'sell', asset: 'deep_copper', totalAmount: 100, source: 'portfolio', profit: 20, date: '2025-01-01', createdAt: 100 }),
    ];
    const points = computeCumulativePnl(transactions);
    expect(points[0].total).toBe(20);
    expect(points[1].total).toBe(30);
  });
});

describe('getDateRange', () => {
  it('returns empty range for all/default', () => {
    const range = getDateRange('all');
    expect(range.startDate).toBe('');
    expect(range.endDate).toBe('');
  });

  it('returns start date for 7d', () => {
    const range = getDateRange('7d');
    expect(range.startDate).toBeTruthy();
    expect(range.endDate).toBeTruthy();
  });

  it('returns start date for 30d', () => {
    const range = getDateRange('30d');
    expect(range.startDate).toBeTruthy();
    expect(range.endDate).toBeTruthy();
  });

  it('returns start date for 90d', () => {
    const range = getDateRange('90d');
    expect(range.startDate).toBeTruthy();
    expect(range.endDate).toBeTruthy();
  });

  it('returns year start for year', () => {
    const range = getDateRange('year');
    expect(range.startDate).toMatch(/^\d{4}-01-01$/);
  });

  it('returns empty for unknown range', () => {
    const range = getDateRange('unknown' as never);
    expect(range.startDate).toBe('');
    expect(range.endDate).toBe('');
  });
});

describe('filterByDateRange', () => {
  const items = [
    { date: '2025-01-01', value: 1 },
    { date: '2025-01-15', value: 2 },
    { date: '2025-02-01', value: 3 },
  ];

  it('returns all items when no date range', () => {
    expect(filterByDateRange(items, '', '')).toHaveLength(3);
  });

  it('filters by start date', () => {
    const result = filterByDateRange(items, '2025-01-15', '');
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(2);
  });

  it('filters by end date', () => {
    const result = filterByDateRange(items, '', '2025-01-15');
    expect(result).toHaveLength(2);
  });

  it('filters by both dates', () => {
    const result = filterByDateRange(items, '2025-01-10', '2025-01-20');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(2);
  });
});
