import { createEmptyState } from './data';
import type { LedgerState } from './data';

const STORAGE_KEY = 'ore_ledger_state';

export const Storage = {
  loadState(): LedgerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && 'transactions' in parsed && Array.isArray((parsed as Record<string, unknown>).transactions)) {
        return parsed as LedgerState;
      }
      console.warn('Ore Ledger: Invalid state in localStorage, resetting to default');
      return createEmptyState();
    } catch (e: unknown) {
      console.warn('Ore Ledger: Failed to load state from localStorage, resetting:', e instanceof Error ? e.message : String(e));
      return createEmptyState();
    }
  },

  saveState(state: LedgerState): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e: unknown) {
      console.error('Ore Ledger: Failed to save state:', e instanceof Error ? e.message : String(e));
      return false;
    }
  },

  exportData(): string {
    return JSON.stringify(this.loadState(), null, 2);
  },

  importData(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr) as unknown;
      if (parsed && typeof parsed === 'object' && 'transactions' in parsed && Array.isArray((parsed as Record<string, unknown>).transactions)) {
        this.saveState(parsed as LedgerState);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
