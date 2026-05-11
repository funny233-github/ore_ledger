import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatCurrencyFull, NAV_ITEMS } from '../utils';

describe('formatDate', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('formats a date string', () => {
    const result = formatDate('2025-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('formats a timestamp number', () => {
    const result = formatDate(1736899200000);
    expect(result).toBeTruthy();
  });
});

describe('formatCurrency', () => {
  it('returns 0.0 for null/undefined', () => {
    expect(formatCurrency(null)).toBe('0.0');
    expect(formatCurrency(undefined)).toBe('0.0');
  });

  it('formats positive numbers to 1 decimal', () => {
    expect(formatCurrency(100)).toBe('100.0');
    expect(formatCurrency(12.34)).toBe('12.3');
    expect(formatCurrency(0.5)).toBe('0.5');
  });

  it('formats negative numbers with minus prefix', () => {
    expect(formatCurrency(-50)).toBe('-50.0');
    expect(formatCurrency(-12.34)).toBe('-12.3');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('0.0');
  });
});

describe('formatCurrencyFull', () => {
  it('returns 0.00 for null/undefined', () => {
    expect(formatCurrencyFull(null)).toBe('0.00');
    expect(formatCurrencyFull(undefined)).toBe('0.00');
  });

  it('formats to 2 decimal places', () => {
    expect(formatCurrencyFull(100)).toBe('100.00');
    expect(formatCurrencyFull(12.345)).toBe('12.35');
    expect(formatCurrencyFull(0.1)).toBe('0.10');
  });

  it('handles negative numbers', () => {
    expect(formatCurrencyFull(-50.5)).toBe('-50.50');
  });

  it('handles zero', () => {
    expect(formatCurrencyFull(0)).toBe('0.00');
  });
});

describe('NAV_ITEMS', () => {
  it('has 5 navigation items', () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it('contains all required pages', () => {
    const ids = NAV_ITEMS.map(n => n.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('transactions');
    expect(ids).toContain('portfolio');
    expect(ids).toContain('analytics');
    expect(ids).toContain('new-entry');
  });

  it('each item has id, label, and icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });
});
