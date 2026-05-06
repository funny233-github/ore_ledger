import { createEmptyState } from './data.js';

/* ====================================================
   LOCALSTORAGE UTILITIES
   ==================================================== */

const STORAGE_KEY = 'ore_ledger_state';

export const Storage = {
  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();
      const parsed = JSON.parse(raw);
      // Basic validation
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.transactions)) {
        return parsed;
      }
      console.warn('Ore Ledger: Invalid state in localStorage, resetting to default');
      return createEmptyState();
    } catch (e) {
      console.warn('Ore Ledger: Failed to load state from localStorage, resetting:', e.message);
      return createEmptyState();
    }
  },

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Ore Ledger: Failed to save state:', e.message);
      return false;
    }
  },

  exportData() {
    return JSON.stringify(this.loadState(), null, 2);
  },

  importData(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.transactions)) {
        this.saveState(parsed);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
