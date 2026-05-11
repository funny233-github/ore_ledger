import { useState, useCallback, useEffect } from 'react';
import type { JSX } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { OreReturnData, BalancePoint, CompositionItem } from './analytics';

const COLORS = {
  cash: '#3b82f6',
  portfolioValue: '#f59e0b',
  netWorth: '#10b981',
  cumulativePnl: '#8b5cf6',
  realized: '#3b82f6',
  unrealized: '#10b981',
  negative: '#ef4444',
};

const ORE_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#14b8a6', '#d946ef', '#0ea5e9',
  '#e11d48', '#65a30d', '#7c3aed', '#0891b2',
  '#fbbf24', '#92400e',
];

function chartColors(theme: string) {
  const isDark = theme === 'dark';
  return {
    text: isDark ? '#d1d5db' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  };
}

interface ChartThemeProps {
  theme: string;
}

/* ─── Net Worth Trend ─── */

interface TrendLine {
  key: string;
  label: string;
  color: string;
}

const TREND_LINES: TrendLine[] = [
  { key: 'netWorth', label: 'Net Worth', color: COLORS.netWorth },
  { key: 'portfolioValue', label: 'Portfolio Value', color: COLORS.portfolioValue },
  { key: 'cash', label: 'Cash Balance', color: COLORS.cash },
  { key: 'cumulativePnl', label: 'Cumulative P&L', color: COLORS.cumulativePnl },
];

function ToggleSwitch({ on, color }: { on: boolean; color: string }): JSX.Element {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 'var(--radius-sm)',
      border: on ? `2px solid ${color}` : '1.5px solid var(--border)',
      background: on ? color : 'transparent',
      transition: 'all 150ms',
      flexShrink: 0,
    }} />
  );
}

interface NetWorthTrendChartProps extends ChartThemeProps {
  data: BalancePoint[];
  trendData: (BalancePoint & { cumulativePnl: number })[];
}

export function NetWorthTrendChart({ data, trendData, theme }: NetWorthTrendChartProps): JSX.Element {
  const c = chartColors(theme);
  const [lineState, setLineState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ore_ledger_chart_toggles');
      if (saved) return { netWorth: true, portfolioValue: false, cash: false, cumulativePnl: false, ...JSON.parse(saved) };
    } catch {}
    return { netWorth: true, portfolioValue: false, cash: false, cumulativePnl: false };
  });

  useEffect(() => {
    try { localStorage.setItem('ore_ledger_chart_toggles', JSON.stringify(lineState)); }
    catch {}
  }, [lineState]);

  const toggle = useCallback((key: string) => {
    setLineState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const chartData = trendData.length > 0 ? trendData : data;

  return (
    <div>
      {/* Toggle switches (redstone levers) */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 12,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {TREND_LINES.map(line => (
          <div
            key={line.key}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggle(line.key); }}
            onClick={() => toggle(line.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', userSelect: 'none',
              fontSize: '0.82rem', color: 'var(--text-secondary)',
              opacity: lineState[line.key] ? 1 : 0.45,
              transition: 'opacity 150ms',
            }}
          >
            <ToggleSwitch
              on={lineState[line.key]}
              color={line.color}
            />
            <span style={{
              color: lineState[line.key] ? line.color : 'var(--text-secondary)',
              fontWeight: lineState[line.key] ? 550 : 400,
              transition: 'color 150ms',
            }}>
              {line.label}
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.netWorth} stopOpacity={0.12} />
              <stop offset="100%" stopColor={COLORS.netWorth} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.text }} minTickGap={40} />
          <YAxis tick={{ fontSize: 11, fill: c.text }} />
          <Tooltip
            contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 13 }}
            formatter={(v: any) => (typeof v === "number" ? v.toFixed(1) : String(v))}
          />
          {lineState.netWorth && (
            <Area type="monotone" dataKey="netWorth" stroke={COLORS.netWorth} fill="url(#nwGrad)" name="Net Worth" strokeWidth={2} dot={false} />
          )}
          {lineState.portfolioValue && (
            <Line type="monotone" dataKey="portfolioValue" stroke={COLORS.portfolioValue} name="Portfolio Value" strokeWidth={2} dot={false} />
          )}
          {lineState.cash && (
            <Line type="monotone" dataKey="cash" stroke={COLORS.cash} name="Cash Balance" strokeWidth={2} dot={false} />
          )}
          {lineState.cumulativePnl && (
            <Line type="monotone" dataKey="cumulativePnl" stroke={COLORS.cumulativePnl} name="Cumulative P&L" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Portfolio Composition ─── */

export function PortfolioCompositionChart({ data, theme }: { data: CompositionItem[] } & ChartThemeProps): JSX.Element {
  const c = chartColors(theme);
  if (data.length === 0) {
    return <EmptyChartMessage />;
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={110}
          innerRadius={60}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={ORE_PALETTE[i % ORE_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 13 }}
          formatter={(v: any) => (typeof v === "number" ? v.toFixed(1) : String(v))}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: c.text }}
          formatter={(value: string) => (
            <span style={{ color: c.text }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ─── Ore Return (Total P&L by Ore) ─── */

export function OreReturnChart({ data, theme }: { data: OreReturnData[] } & ChartThemeProps): JSX.Element {
  const c = chartColors(theme);
  if (data.length === 0) {
    return <EmptyChartMessage />;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 100, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: c.text }} />
        <YAxis type="category" dataKey="oreName" tick={{ fontSize: 12, fill: c.text }} width={90} />
        <Tooltip
          contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 13 }}
          formatter={(v: any, name: any) => {
            const label = name === 'realizedPnl' ? 'Realized P&L' : 'Unrealized P&L';
            return [typeof v === 'number' ? v.toFixed(1) : String(v), label];
          }}
        />
        <Legend />
        <Bar dataKey="realizedPnl" name="Realized P&L" stackId="a" fill={COLORS.realized} />
        <Bar dataKey="unrealizedPnl" name="Unrealized P&L" stackId="a" fill={COLORS.unrealized} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Return Rate by Ore ─── */

export function ReturnRateChart({ data, theme }: { data: OreReturnData[] } & ChartThemeProps): JSX.Element {
  const c = chartColors(theme);
  const sorted = [...data].filter(d => d.totalCostInvested > 0).sort((a, b) => b.returnRate - a.returnRate);
  if (sorted.length === 0) {
    return <EmptyChartMessage />;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, sorted.length * 36)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 100, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: c.text }} unit="%" />
        <YAxis type="category" dataKey="oreName" tick={{ fontSize: 12, fill: c.text }} width={90} />
        <Tooltip
          contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 13 }}
          formatter={(v: any, name: any) => [typeof v === "number" ? v.toFixed(1) : String(v), name]}
        />
        <Legend />
        <Bar dataKey="returnRate" name="Return Rate" minPointSize={2}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={entry.returnRate >= 0 ? COLORS.unrealized : COLORS.negative} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Empty State ─── */

function EmptyChartMessage(): JSX.Element {
  return (
    <div style={{
      height: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
    }}>
      No data available yet
    </div>
  );
}
