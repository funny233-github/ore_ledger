import { describe, it, expect } from 'vitest';
import {
  ORES,
  TX_TYPES,
  TX_TYPE_CONFIG,
  generateId,
  createEmptyState,
} from '../data';

describe('ORES', () => {
  it('contains 18 ores', () => {
    expect(ORES).toHaveLength(18);
  });

  it('has 8 shallow, 8 deep, 2 nether ores', () => {
    const shallow = ORES.filter(o => o.category === 'shallow');
    const deep = ORES.filter(o => o.category === 'deep');
    const nether = ORES.filter(o => o.category === 'nether');
    expect(shallow).toHaveLength(8);
    expect(deep).toHaveLength(8);
    expect(nether).toHaveLength(2);
  });

  it('every ore has id, name, and category', () => {
    for (const ore of ORES) {
      expect(ore.id).toBeTruthy();
      expect(ore.name).toBeTruthy();
      expect(['shallow', 'deep', 'nether']).toContain(ore.category);
    }
  });

  it('all ore ids are unique', () => {
    const ids = ORES.map(o => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('TX_TYPES', () => {
  it('contains all 6 transaction types', () => {
    expect(TX_TYPES).toEqual([
      'buy', 'sell', 'mine_sell', 'expense', 'balance_adjust', 'write_off',
    ]);
  });
});

describe('TX_TYPE_CONFIG', () => {
  it('has config for every transaction type', () => {
    for (const t of TX_TYPES) {
      expect(TX_TYPE_CONFIG[t]).toBeDefined();
      expect(TX_TYPE_CONFIG[t].key).toBe(t);
      expect(TX_TYPE_CONFIG[t].label).toBeTruthy();
      expect(TX_TYPE_CONFIG[t].icon).toBeTruthy();
    }
  });

  it('has exactly 6 config entries', () => {
    expect(Object.keys(TX_TYPE_CONFIG)).toHaveLength(6);
  });
});

describe('generateId', () => {
  it('returns a string starting with tx_', () => {
    expect(generateId()).toMatch(/^tx_/);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('createEmptyState', () => {
  it('returns version 1', () => {
    expect(createEmptyState().version).toBe(1);
  });

  it('has empty transactions array', () => {
    expect(createEmptyState().transactions).toEqual([]);
  });

  it('has zero cash', () => {
    expect(createEmptyState().cash).toBe(0);
  });

  it('has empty portfolio', () => {
    expect(createEmptyState().portfolio).toEqual({});
  });

  it('has all metadata fields set to 0', () => {
    const m = createEmptyState().metadata;
    expect(m).toEqual({
      totalSpeculativeProfit: 0,
      totalMiningIncome: 0,
      totalExpenses: 0,
      totalAdjustments: 0,
    });
  });
});
