import { describe, it, expect } from 'vitest';
import { r2, LedgerEngine } from '../engine';
import { createEmptyState } from '../data';
import type { LedgerState, TransactionInput } from '../data';

function empty(): LedgerState {
  return createEmptyState();
}

function buyTx(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'buy',
    date: '2025-01-15',
    asset: 'shallow_iron',
    quantity: 10,
    unitPrice: 15,
    totalAmount: 150,
    ...overrides,
  };
}

function sellTx(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'sell',
    date: '2025-01-20',
    asset: 'shallow_iron',
    quantity: 5,
    totalAmount: 100,
    source: 'portfolio',
    ...overrides,
  };
}

function mineSellTx(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'mine_sell',
    date: '2025-01-20',
    totalAmount: 200,
    ...overrides,
  };
}

function expenseTx(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'expense',
    date: '2025-01-20',
    totalAmount: 50,
    description: 'Pickaxe repair',
    ...overrides,
  };
}

function balanceAdjustTx(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'balance_adjust',
    date: '2025-01-20',
    totalAmount: 0,
    newBalance: 500,
    ...overrides,
  };
}

function writeOffTx(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'write_off',
    date: '2025-01-20',
    asset: 'shallow_iron',
    quantity: 3,
    totalAmount: 0,
    ...overrides,
  };
}

/* -------------------------------------------------- */

describe('r2', () => {
  it('rounds to 2 decimal places', () => {
    expect(r2(1.234)).toBe(1.23);
    expect(r2(1.235)).toBe(1.24);
    expect(r2(0)).toBe(0);
    expect(r2(-1.236)).toBe(-1.24);
  });

  it('preserves integer values', () => {
    expect(r2(5)).toBe(5);
    expect(r2(100)).toBe(100);
  });
});

describe('LedgerEngine.processBuy', () => {
  it('adds quantity to portfolio and subtracts cash', () => {
    const state = empty();
    const result = LedgerEngine.processBuy(state, buyTx());
    expect(result.portfolio['shallow_iron'].quantity).toBe(10);
    expect(result.portfolio['shallow_iron'].totalCost).toBe(150);
    expect(result.portfolio['shallow_iron'].avgCost).toBe(15);
    expect(result.cash).toBe(-150);
  });

  it('accumulates multiple buys of the same ore', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 150 }));
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 5, totalAmount: 100 }));
    expect(state.portfolio['shallow_iron'].quantity).toBe(15);
    expect(state.portfolio['shallow_iron'].totalCost).toBe(250);
    expect(state.portfolio['shallow_iron'].avgCost).toBeCloseTo(16.67, 1);
  });

  it('uses absolute totalAmount for cost', () => {
    const state = empty();
    const result = LedgerEngine.processBuy(state, buyTx({ totalAmount: -150 }));
    expect(result.portfolio['shallow_iron'].totalCost).toBe(150);
    expect(result.cash).toBe(-150);
  });

  it('adds a transaction record', () => {
    const state = empty();
    const result = LedgerEngine.processBuy(state, buyTx());
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe('buy');
    expect(result.transactions[0].id).toMatch(/^tx_/);
  });
});

describe('LedgerEngine.processSell (portfolio)', () => {
  it('reduces portfolio quantity and adds cash', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 150 }));
    const result = LedgerEngine.processSell(state, sellTx({ quantity: 4, totalAmount: 80 })) as LedgerState;
    expect(result.portfolio['shallow_iron'].quantity).toBe(6);
    expect(result.portfolio['shallow_iron'].totalCost).toBeCloseTo(90, 2);
    expect(result.cash).toBe(-150 + 80);
  });

  it('calculates correct profit', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 150 }));
    const result = LedgerEngine.processSell(state, sellTx({ quantity: 5, totalAmount: 100 })) as LedgerState;
    const tx = result.transactions.find(t => t.type === 'sell')!;
    expect(tx.costOfSold).toBe(75);
    expect(tx.profit).toBe(25);
    expect(result.metadata.totalSpeculativeProfit).toBe(25);
  });

  it('zeroes out portfolio entry when fully sold', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 5, totalAmount: 75 }));
    const result = LedgerEngine.processSell(state, sellTx({ quantity: 5, totalAmount: 100 })) as LedgerState;
    expect(result.portfolio['shallow_iron'].quantity).toBe(0);
    expect(result.portfolio['shallow_iron'].totalCost).toBe(0);
    expect(result.portfolio['shallow_iron'].avgCost).toBe(0);
  });

  it('returns error when insufficient holdings', () => {
    const state = empty();
    const result = LedgerEngine.processSell(state, sellTx({ quantity: 1 }));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Insufficient holdings');
    }
  });
});

describe('LedgerEngine.processSell (mined)', () => {
  it('adds cash and mining income', () => {
    const state = empty();
    const result = LedgerEngine.processSell(state, sellTx({ source: 'mined', totalAmount: 500 })) as LedgerState;
    expect(result.cash).toBe(500);
    expect(result.metadata.totalMiningIncome).toBe(500);
  });

  it('does not affect portfolio', () => {
    const state = empty();
    const result = LedgerEngine.processSell(state, sellTx({ source: 'mined', totalAmount: 500 })) as LedgerState;
    expect(result.portfolio).toEqual({});
  });

  it('records profit field on transaction', () => {
    const state = empty();
    const result = LedgerEngine.processSell(state, sellTx({ source: 'mined', totalAmount: 300 })) as LedgerState;
    const tx = result.transactions.find(t => t.type === 'sell')!;
    expect(tx.profit).toBe(300);
    expect(tx.source).toBe('mined');
  });
});

describe('LedgerEngine.processMineSell', () => {
  it('adds cash and mining income', () => {
    const state = empty();
    const result = LedgerEngine.processMineSell(state, mineSellTx({ totalAmount: 250 }));
    expect(result.cash).toBe(250);
    expect(result.metadata.totalMiningIncome).toBe(250);
  });

  it('does not modify portfolio', () => {
    const state = empty();
    const result = LedgerEngine.processMineSell(state, mineSellTx());
    expect(result.portfolio).toEqual({});
  });
});

describe('LedgerEngine.processExpense', () => {
  it('subtracts absolute amount from cash', () => {
    const state = empty();
    const result = LedgerEngine.processExpense(state, expenseTx({ totalAmount: -75 }));
    expect(result.cash).toBe(-75);
  });

  it('accumulates totalExpenses', () => {
    let state = empty();
    state = LedgerEngine.processExpense(state, expenseTx({ totalAmount: 50 }));
    state = LedgerEngine.processExpense(state, expenseTx({ totalAmount: 30 }));
    expect(state.metadata.totalExpenses).toBe(80);
  });

  it('uses absolute value of totalAmount', () => {
    const state = empty();
    const result = LedgerEngine.processExpense(state, expenseTx({ totalAmount: 100 }));
    expect(result.cash).toBe(-100);
  });
});

describe('LedgerEngine.processBalanceAdjust', () => {
  it('sets cash to new balance', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 1, totalAmount: 50 }));
    const result = LedgerEngine.processBalanceAdjust(state, balanceAdjustTx({ newBalance: 200 }));
    expect(result.cash).toBe(200);
  });

  it('records adjustment and previous balance on transaction', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 1, totalAmount: 50 }));
    const result = LedgerEngine.processBalanceAdjust(state, balanceAdjustTx({ newBalance: 300 }));
    const tx = result.transactions.find(t => t.type === 'balance_adjust')!;
    expect(tx.adjustment).toBe(350);
    expect(tx.previousBalance).toBe(-50);
  });

  it('accumulates totalAdjustments in metadata', () => {
    let state = empty();
    state = LedgerEngine.processBalanceAdjust(state, balanceAdjustTx({ newBalance: 100 }));
    expect(state.metadata.totalAdjustments).toBe(100);
    state = LedgerEngine.processBalanceAdjust(state, balanceAdjustTx({ newBalance: 200 }));
    expect(state.metadata.totalAdjustments).toBe(200);
  });
});

describe('LedgerEngine.processWriteOff', () => {
  it('removes quantity from portfolio without affecting cash', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 150 }));
    const result = LedgerEngine.processWriteOff(state, writeOffTx({ quantity: 3 })) as LedgerState;
    expect(result.portfolio['shallow_iron'].quantity).toBe(7);
    expect(result.cash).toBe(-150);
  });

  it('records lossAmount and previousQuantity on transaction', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 150 }));
    const result = LedgerEngine.processWriteOff(state, writeOffTx({ quantity: 4 })) as LedgerState;
    const tx = result.transactions.find(t => t.type === 'write_off')!;
    expect(tx.lossAmount).toBe(60);
    expect(tx.previousQuantity).toBe(10);
  });

  it('zeroes out entry when fully written off', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 5, totalAmount: 75 }));
    const result = LedgerEngine.processWriteOff(state, writeOffTx({ quantity: 5 })) as LedgerState;
    expect(result.portfolio['shallow_iron'].quantity).toBe(0);
    expect(result.portfolio['shallow_iron'].totalCost).toBe(0);
    expect(result.portfolio['shallow_iron'].avgCost).toBe(0);
  });

  it('returns error when insufficient holdings', () => {
    const state = empty();
    const result = LedgerEngine.processWriteOff(state, writeOffTx({ quantity: 1 }));
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Insufficient holdings');
    }
  });
});

describe('LedgerEngine.computeSummary', () => {
  it('returns zero summary for empty state', () => {
    const s = LedgerEngine.computeSummary(empty());
    expect(s.cash).toBe(0);
    expect(s.speculativeProfit).toBe(0);
    expect(s.miningIncome).toBe(0);
    expect(s.totalExpenses).toBe(0);
    expect(s.portfolioValue).toBe(0);
    expect(s.totalHoldings).toBe(0);
    expect(s.unrealizedPnL).toBe(0);
  });

  it('reflects portfolio value from avgCost', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 200 }));
    const s = LedgerEngine.computeSummary(state);
    expect(s.portfolioValue).toBe(200);
    expect(s.totalHoldings).toBe(10);
    expect(s.cash).toBe(-200);
  });

  it('aggregates metadata into summary', () => {
    let state = empty();
    state = LedgerEngine.processBuy(state, buyTx({ quantity: 5, totalAmount: 100 }));
    state = LedgerEngine.processSell(state, sellTx({ quantity: 5, totalAmount: 150, source: 'portfolio' })) as LedgerState;
    state = LedgerEngine.processMineSell(state, mineSellTx({ totalAmount: 300 }));
    state = LedgerEngine.processExpense(state, expenseTx({ totalAmount: 50 }));
    const s = LedgerEngine.computeSummary(state);
    expect(s.speculativeProfit).toBe(50);
    expect(s.miningIncome).toBe(300);
    expect(s.totalExpenses).toBe(50);
  });
});

describe('LedgerEngine.process (router)', () => {
  it('dispatches buy correctly', () => {
    const state = empty();
    const result = LedgerEngine.process(state, buyTx());
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.portfolio['shallow_iron'].quantity).toBe(10);
    }
  });

  it('dispatches sell correctly', () => {
    let state = empty();
    state = LedgerEngine.process(state, buyTx({ quantity: 5, totalAmount: 50 })) as LedgerState;
    const result = LedgerEngine.process(state, sellTx({ quantity: 5, totalAmount: 60 }));
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.portfolio['shallow_iron'].quantity).toBe(0);
    }
  });

  it('dispatches mine_sell correctly', () => {
    const result = LedgerEngine.process(empty(), mineSellTx({ totalAmount: 100 }));
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.cash).toBe(100);
    }
  });

  it('dispatches expense correctly', () => {
    const result = LedgerEngine.process(empty(), expenseTx({ totalAmount: 25 }));
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.cash).toBe(-25);
    }
  });

  it('dispatches balance_adjust correctly', () => {
    const result = LedgerEngine.process(empty(), balanceAdjustTx({ newBalance: 1000 }));
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.cash).toBe(1000);
    }
  });

  it('dispatches write_off correctly', () => {
    let state = empty();
    state = LedgerEngine.process(state, buyTx({ quantity: 5, totalAmount: 50 })) as LedgerState;
    const result = LedgerEngine.process(state, writeOffTx({ quantity: 2 }));
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.portfolio['shallow_iron'].quantity).toBe(3);
    }
  });

  it('returns error for unknown type', () => {
    const result = LedgerEngine.process(empty(), { type: 'unknown' as never, date: '', totalAmount: 0 });
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Unknown transaction type');
    }
  });
});

describe('LedgerEngine — idempotency / immutability', () => {
  it('does not mutate the input state', () => {
    const state = empty();
    const copy = { ...state, cash: 0, portfolio: { ...state.portfolio } };
    LedgerEngine.processBuy(state, buyTx({ quantity: 10, totalAmount: 150 }));
    expect(state.cash).toBe(0);
    expect(state.portfolio).toEqual({});
  });
});
