import { useState, useMemo } from 'react';
import type { JSX } from 'react';
import type { Transaction, PortfolioEntry } from './data';
import { SectionCard, EmptyState, PageShell, PageHeader } from './components';
import {
  computeOreReturns,
  computeBalanceHistory,
  computePortfolioComposition,
  computeCumulativePnl,
  computePriceDistribution,
  getDateRange,
  filterByDateRange,
} from './analytics';
import {
  NetWorthTrendChart,
  PortfolioCompositionChart,
  OreReturnChart,
  ReturnRateChart,
  PriceDistributionGridChart,
} from './charts';

interface AnalyticsViewProps {
  transactions: Transaction[];
  portfolio: Record<string, PortfolioEntry>;
  theme: string;
}

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: '1 Week', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'This Year', value: 'year' },
];

export function AnalyticsView({ transactions, portfolio, theme }: AnalyticsViewProps): JSX.Element {
  const [dateRange, setDateRange] = useState('all');

  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const filteredTxs = useMemo(
    () => filterByDateRange(transactions, startDate, endDate),
    [transactions, startDate, endDate]
  );

  const balanceHistory = useMemo(() => computeBalanceHistory(filteredTxs), [filteredTxs]);
  const oreReturns = useMemo(() => computeOreReturns(filteredTxs, portfolio), [filteredTxs, portfolio]);
  const composition = useMemo(() => computePortfolioComposition(portfolio), [portfolio]);
  const cumulativePnl = useMemo(() => computeCumulativePnl(filteredTxs), [filteredTxs]);

  const trendData = useMemo(() => {
    let lastPnl = 0;
    const pnlMap = new Map(cumulativePnl.map(p => [p.date, p.total]));
    return balanceHistory.map(point => {
      if (pnlMap.has(point.date)) lastPnl = pnlMap.get(point.date)!;
      return { ...point, cumulativePnl: lastPnl };
    });
  }, [balanceHistory, cumulativePnl]);

  const priceDist = useMemo(() => computePriceDistribution(filteredTxs), [filteredTxs]);

  const noTx = filteredTxs.length === 0;

  return (
    <PageShell>
      <PageHeader title="Analytics" subtitle="Portfolio performance and ore return analysis" />

      {/* Date Range Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {DATE_RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setDateRange(r.value)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: dateRange === r.value ? 600 : 480,
              background: dateRange === r.value
                ? 'var(--accent)'
                : 'var(--surface)',
              color: dateRange === r.value
                ? 'oklch(1 0 0)'
                : 'var(--text-secondary)',
              outline: dateRange === r.value ? 'none' : '1px solid var(--border)',
              transition: 'all var(--transition)',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {noTx ? (
        <EmptyState
          icon="▤"
          title="No transactions"
          message="Add some transactions to see analytics"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Net Worth Trend */}
          <SectionCard title="Net Worth Trend">
            {balanceHistory.length > 1 ? (
              <NetWorthTrendChart data={balanceHistory} trendData={trendData} theme={theme} />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Not enough data points for a trend line
              </div>
            )}
          </SectionCard>

          {/* Portfolio Composition */}
          <SectionCard title="Portfolio Composition">
            <PortfolioCompositionChart data={composition} theme={theme} />
          </SectionCard>

          {/* Ore Return Analysis */}
          <SectionCard title="Ore Return Analysis">
            <OreReturnChart data={oreReturns} theme={theme} />
          </SectionCard>

          {/* Return Rate by Ore */}
          <SectionCard title="Return Rate by Ore">
            <ReturnRateChart data={oreReturns} theme={theme} />
          </SectionCard>

          {/* Ore Price Distribution */}
          <SectionCard title="Ore Price Distribution (Buy vs Sell)">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              * Based on the selected date range
            </p>
            <PriceDistributionGridChart data={priceDist} theme={theme} />
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
