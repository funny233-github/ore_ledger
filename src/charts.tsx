import type { JSX } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
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
import type { OreReturnData, BalancePoint, CompositionItem, CumulativePnlPoint } from './analytics';

const COLORS = {
  cash: '#3b82f6',
  netWorth: '#10b981',
  realized: '#3b82f6',
  unrealized: '#10b981',
  negative: '#ef4444',
};

const ORE_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#14b8a6', '#d946ef', '#0ea5e9',
  '#e11d48', '#65a30d', '#7c3aed', '#0891b2',
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

export function NetWorthTrendChart({ data, theme }: { data: BalancePoint[] } & ChartThemeProps): JSX.Element {
  const c = chartColors(theme);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data}>
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
        <Legend />
        <Area type="monotone" dataKey="netWorth" stroke={COLORS.netWorth} fill="url(#nwGrad)" name="Net Worth" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="cash" stroke={COLORS.cash} name="Cash Balance" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
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
          formatter={(v: any) => [typeof v === 'number' ? `${v.toFixed(1)}%` : String(v), 'Return Rate']}
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

/* ─── Cumulative P&L ─── */

export function CumulativePnlChart({ data, theme }: { data: CumulativePnlPoint[] } & ChartThemeProps): JSX.Element {
  const c = chartColors(theme);
  if (data.length === 0) {
    return <EmptyChartMessage />;
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: c.text }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11, fill: c.text }} />
        <Tooltip
          contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 13 }}
          formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : String(v), 'Cumulative P&L']}
        />
        <Legend />
        <Line type="monotone" dataKey="total" stroke={COLORS.netWorth} name="Cumulative P&L" strokeWidth={2} dot={false} />
      </LineChart>
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
