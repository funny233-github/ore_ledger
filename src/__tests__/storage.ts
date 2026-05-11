import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Storage } from '../storage';
import { createEmptyState } from '../data';
import type { LedgerState } from '../data';

const STORAGE_KEY = 'ore_ledger_state';
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    get length() { return store.size; },
    key: vi.fn((i: number) => [...store.keys()][i] ?? null),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Storage.loadState', () => {
  it('returns empty state when nothing in localStorage', () => {
    const state = Storage.loadState();
    expect(state).toEqual(createEmptyState());
  });

  it('returns parsed state from localStorage', () => {
    const mockState: LedgerState = {
      version: 1,
      transactions: [],
      cash: 500,
      portfolio: {},
      metadata: {
        totalSpeculativeProfit: 0,
        totalMiningIncome: 0,
        totalExpenses: 0,
        totalAdjustments: 0,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
    const state = Storage.loadState();
    expect(state.cash).toBe(500);
  });

  it('returns empty state on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json');
    const state = Storage.loadState();
    expect(state).toEqual(createEmptyState());
  });

  it('returns empty state when data lacks transactions array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cash: 100 }));
    const state = Storage.loadState();
    expect(state).toEqual(createEmptyState());
  });
});

describe('Storage.saveState', () => {
  it('saves state to localStorage', () => {
    const state = createEmptyState();
    state.cash = 1000;
    const result = Storage.saveState(state);
    expect(result).toBe(true);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.cash).toBe(1000);
  });

  it('serializes and deserializes correctly', () => {
    const state: LedgerState = {
      version: 1,
      transactions: [],
      cash: 123.45,
      portfolio: {
        shallow_iron: { quantity: 10, totalCost: 150, avgCost: 15 },
      },
      metadata: {
        totalSpeculativeProfit: 50,
        totalMiningIncome: 200,
        totalExpenses: 30,
        totalAdjustments: 0,
      },
    };
    Storage.saveState(state);
    const loaded = Storage.loadState();
    expect(loaded.cash).toBeCloseTo(123.45);
    expect(loaded.portfolio['shallow_iron'].quantity).toBe(10);
    expect(loaded.metadata.totalSpeculativeProfit).toBe(50);
  });
});

describe('Storage.exportData', () => {
  it('returns pretty-printed JSON', () => {
    const state = createEmptyState();
    state.cash = 100;
    Storage.saveState(state);
    const exported = Storage.exportData();
    const parsed = JSON.parse(exported);
    expect(parsed.cash).toBe(100);
    expect(exported).toContain('\n  ');
  });
});

describe('Storage.importData', () => {
  it('imports valid JSON data', () => {
    const data: LedgerState = {
      version: 1,
      transactions: [],
      cash: 999,
      portfolio: {},
      metadata: {
        totalSpeculativeProfit: 0,
        totalMiningIncome: 0,
        totalExpenses: 0,
        totalAdjustments: 0,
      },
    };
    const result = Storage.importData(JSON.stringify(data));
    expect(result).toBe(true);
    const loaded = Storage.loadState();
    expect(loaded.cash).toBe(999);
  });

  it('rejects invalid JSON', () => {
    const result = Storage.importData('not json');
    expect(result).toBe(false);
  });

  it('rejects data without transactions array', () => {
    const result = Storage.importData(JSON.stringify({ cash: 100 }));
    expect(result).toBe(false);
  });
});

describe('Storage.clearAll', () => {
  it('removes state from localStorage', () => {
    Storage.saveState(createEmptyState());
    Storage.clearAll();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
