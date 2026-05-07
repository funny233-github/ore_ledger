import { NAV_ITEMS, formatDate, formatCurrencyFull } from './utils.jsx';
import { ORES } from './data.js';

/* --- Sidebar — Claude.ai dark sidebar style --- */
export function Sidebar({ activeNav, onNavChange, onExport, onClear, theme, onToggleTheme }) {
  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 10,
      padding: '0',
      userSelect: 'none',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 20px 24px',
        borderBottom: '1px solid var(--border-sidebar)',
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontWeight: 500,
          fontSize: '1.3rem',
          color: 'var(--text-sidebar-active)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>Ore Ledger</div>
        <div className="sidebar-label" style={{
          fontSize: '0.7rem',
          color: 'var(--text-sidebar-muted)',
          fontWeight: 400,
          marginTop: 4,
          letterSpacing: '0.02em',
        }}>Minecraft Stock Tracker</div>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        padding: '12px 10px',
        overflowY: 'auto',
      }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            onClick={() => onNavChange(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeNav === item.id ? 650 : 520,
              color: activeNav === item.id ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
              background: activeNav === item.id ? 'var(--bg-sidebar-active)' : 'transparent',
              border: 'none', textAlign: 'left', width: '100%', lineHeight: 1.4,
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => {
              if (activeNav !== item.id)
                e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
            }}
            onMouseLeave={e => {
              if (activeNav !== item.id)
                e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{
              width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              opacity: activeNav === item.id ? 1 : 0.5,
              color: activeNav === item.id ? 'var(--accent)' : 'var(--text-sidebar)',
              flexShrink: 0,
            }}>{item.icon}</span>
            <span className="sidebar-label" style={{ fontSize: '0.95rem', fontWeight: 520 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-label" style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-sidebar)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-sidebar-muted)',
          letterSpacing: '0.03em',
          marginBottom: 10,
        }}>
          <span>Ore Ledger v0.1</span>
          <button onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none', border: '1px solid var(--border-sidebar)',
              cursor: 'pointer', padding: '3px 8px',
              fontSize: '0.7rem', color: 'var(--text-sidebar-muted)',
              fontFamily: 'inherit', borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sidebar)'; e.currentTarget.style.color = 'var(--text-sidebar-muted)'; }}
          >{theme === 'dark' ? '☀ Light' : '☾ Dark'}</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onExport} title="Export data as JSON"
            style={{
              flex: 1, padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-sidebar)',
              background: 'transparent', cursor: 'pointer',
              fontSize: '0.78rem', color: 'var(--text-sidebar-muted)',
              fontFamily: 'inherit',
              transition: 'all var(--transition)', fontWeight: 480,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sidebar)'; e.currentTarget.style.color = 'var(--text-sidebar-muted)'; }}
          >Export</button>
          <button onClick={onClear} title="Clear all data"
            style={{
              flex: 1, padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-sidebar)',
              background: 'transparent', cursor: 'pointer',
              fontSize: '0.78rem', color: 'var(--text-sidebar-muted)',
              fontFamily: 'inherit',
              transition: 'all var(--transition)', fontWeight: 480,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-sidebar)'; e.currentTarget.style.color = 'var(--text-sidebar-muted)'; }}
          >Clear</button>
        </div>
      </div>
    </aside>
  );
}

/* --- Top Bar — claude.ai minimal header --- */
export function TopBar({ title, cashBalance }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px var(--space-xl)',
      borderBottom: '1px solid var(--border-light)',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 620, fontSize: '1.05rem', color: 'var(--text-secondary)',
        letterSpacing: '0.01em',
      }}>{title}</div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px',
        background: 'var(--accent-glow)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 660, fontSize: '1rem', color: 'var(--accent-dark)',
      }}>
        <span style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontWeight: 560, fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>Cash</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 660 }}>{formatCurrencyFull(cashBalance)}</span>
      </div>
    </div>
  );
}

/* --- Summary Card — clean, minimal card --- */
export function SummaryCard({ label, value, sub, typeVariant = 'neutral' }) {
  const colorMap = { positive: 'var(--green)', negative: 'var(--red)', neutral: 'var(--text)' };
  return (
    <div className="card-enter" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-lg)',
      transition: 'all var(--transition)',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--accent-subtle)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{
        fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-muted)', fontWeight: 650, marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 720, fontSize: '2rem',
        letterSpacing: '-0.03em',
        color: colorMap[typeVariant],
      }}>{value}</div>
      {sub && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 550 }}>{sub}</div>}
    </div>
  );
}

/* --- Transaction Item — refined row --- */
export const TX_VISUAL = {
  buy:           { icon: '↓', cls: 'buy',    color: 'var(--green)' },
  sell:          { icon: '↑', cls: 'sell',   color: 'var(--blue)' },
  mine_sell:     { icon: '⛏', cls: 'mine',   color: 'var(--amber)' },
  expense:       { icon: '✕', cls: 'expense', color: 'var(--red)' },
  balance_adjust: { icon: '⟳', cls: 'adjust', color: 'var(--accent)' },
  write_off:     { icon: '✗', cls: 'write-off', color: 'var(--red)' },
};

export const TX_BG = { buy: 'var(--green-bg)', sell: 'var(--blue-bg)', mine_sell: 'var(--amber-bg)', expense: 'var(--red-bg)', balance_adjust: 'var(--accent-glow)', write_off: 'var(--red-bg)' };

export const TX_LABEL = { buy: 'Buy', sell: 'Sell', mine_sell: 'Mine Sale', expense: 'Expense', balance_adjust: 'Adjust', write_off: 'Write-off' };

export function TransactionItem({ tx, onDelete, showDelete }) {
  const vis = TX_VISUAL[tx.type] || TX_VISUAL.buy;
  const bg = TX_BG[tx.type] || TX_BG.buy;
  const label = TX_LABEL[tx.type] || tx.type;
  const isNegative = tx.totalAmount < 0;
  const displayAmount = tx.type === 'balance_adjust'
    ? (tx.adjustment >= 0 ? `+${formatCurrencyFull(tx.adjustment)}` : formatCurrencyFull(tx.adjustment))
    : tx.type === 'write_off'
      ? `-${formatCurrencyFull(tx.lossAmount || 0)}`
      : (isNegative ? `-${formatCurrencyFull(Math.abs(tx.totalAmount))}` : `+${formatCurrencyFull(tx.totalAmount)}`);
  const isPositiveAmount = tx.type === 'balance_adjust' ? tx.adjustment >= 0 : tx.type === 'write_off' ? false : !isNegative;

  let name = tx.description || tx.asset || label;
  let metaParts = [`${label}`];
  if (tx.quantity) metaParts.push(`${tx.quantity}x`);
  metaParts.push(formatDate(tx.date));
  if (tx.note) metaParts.push(`· ${tx.note}`);
  if (tx.type === 'sell') {
    if (tx.source === 'mined') {
      metaParts.push(`· Mined · +${formatCurrencyFull(tx.profit)}`);
    } else if (tx.profit !== undefined) {
      metaParts.push(`· P&L: ${tx.profit >= 0 ? '+' : ''}${formatCurrencyFull(tx.profit)}`);
    }
  }
  if (tx.type === 'write_off' && tx.lossAmount) {
    metaParts.push(`· Lost: ${formatCurrencyFull(tx.lossAmount)}`);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      borderBottom: '1px solid var(--border-light)',
      transition: 'background var(--transition)',
      borderRadius: 'var(--radius-sm)',
      margin: '0 -4px',
      padding: '10px 4px',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', flexShrink: 0,
        background: bg, color: vis.color,
      }}>{vis.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 620, fontSize: '1rem', color: 'var(--text)' }}>{name}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 520 }}>{metaParts.join(' · ')}</div>
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 650, fontSize: '1.05rem',
        textAlign: 'right', whiteSpace: 'nowrap',
        color: isPositiveAmount ? 'var(--green)' : 'var(--red)',
      }}>{displayAmount}</div>
      {showDelete && onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} title="Delete transaction"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', fontSize: '0.75rem',
            transition: 'all var(--transition)', flexShrink: 0,
            fontFamily: 'inherit', opacity: 0.5,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.opacity = 1; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = 0.5; }}
        >✕</button>
      )}
    </div>
  );
}

/* --- Quick Action Button --- */
export function QuickActionBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 22px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
      transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
      fontSize: '0.95rem', fontWeight: 620, color: 'var(--text-secondary)',
      fontFamily: 'inherit',
      lineHeight: 1,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.color = color;
        e.currentTarget.style.background = `${color}08`;
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: '1rem', color, lineHeight: 1 }}>{icon}</span>
      {label}
    </button>
  );
}

/* --- Section Card — minimal card container --- */
export function SectionCard({ title, children, headerRight }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      transition: 'box-shadow var(--transition)',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{
          fontFamily: "'Instrument Sans', sans-serif",
          fontWeight: 650, fontSize: '1rem', color: 'var(--text)',
          letterSpacing: '0.01em',
        }}>{title}</h2>
        {headerRight}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  );
}

/* ====================================================
   PAGE SHELL — consistent page wrapper
   ==================================================== */

export function PageShell({ children }) {
  return (
    <div className="page">
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-3xl)' }}>
        {children}
      </div>
    </div>
  );
}

/* ====================================================
   PAGE HEADER — h1 + subtitle
   ==================================================== */

export function PageHeader({ title, subtitle, marginBottom }) {
  return (
    <div style={{ marginBottom: marginBottom ?? 'var(--space-xl)' }}>
      <h1 style={{
        fontFamily: "'Instrument Sans', sans-serif",
        fontWeight: 720, fontSize: '1.65rem',
        color: 'var(--text)', letterSpacing: '-0.015em',
      }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
        {subtitle}
      </p>
    </div>
  );
}

/* ====================================================
   EMPTY STATE — icon + heading + message
   ==================================================== */

export function EmptyState({ icon, iconStyle, title, message, messageStyle }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', color: 'var(--text-muted)' }}>
      <div style={{
        fontSize: '1.8rem', marginBottom: 14, opacity: 0.2,
        fontFamily: "'DM Serif Display', serif", color: 'var(--text-secondary)',
        ...iconStyle,
      }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Instrument Sans', sans-serif", fontWeight: 540,
        fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 4,
      }}>{title}</h3>
      <p style={{ fontSize: '0.95rem', ...messageStyle }}>{message}</p>
    </div>
  );
}

/* ====================================================
   FORM FIELD — label + input wrapper
   ==================================================== */

export function FormField({ label, children, labelStyle }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
        fontWeight: 530, marginBottom: 6, ...labelStyle,
      }}>{label}</label>
      {children}
    </div>
  );
}

/* ====================================================
   FILTER CHIPS — pill-style filter buttons
   ==================================================== */

export function FilterChips({ options, value, onChange, labelMap }) {
  return (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
    }}>
      {options.map(type => (
        <button key={type} onClick={() => onChange(type)} style={{
          padding: '5px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid',
          borderColor: value === type ? 'var(--accent)' : 'var(--border)',
          background: value === type ? 'var(--accent-subtle)' : 'transparent',
          color: value === type ? 'var(--accent-dark)' : 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.88rem',
          fontWeight: value === type ? 620 : 500,
          fontFamily: 'inherit', transition: 'all var(--transition)',
        }}>
          {labelMap ? (labelMap[type] || type) : type}
        </button>
      ))}
    </div>
  );
}

/* ====================================================
   CATEGORY CONSTANTS (Ore)
   ==================================================== */

const CATEGORY_ICONS = { shallow: '⬆', deep: '⬇', nether: '🔥' };
const CATEGORY_LABELS = { shallow: 'Shallow', deep: 'Deep', nether: 'Nether' };

/* ====================================================
   ORE SELECTOR — grouped dropdown + holdings info
   ==================================================== */

export function OreSelector({ txType, saleSource, oreId, availableOres, groupedOres, currentHolding, costAnalysis, onOreIdChange, formatCurrencyFull }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
        fontWeight: 530, marginBottom: 6,
      }}>
        Ore {txType === 'sell' ? (saleSource === 'mined' ? '' : '(owned only)') : ''}
      </label>
      {txType === 'sell' && saleSource === 'portfolio' && availableOres.length === 0 ? (
        <div style={{
          padding: '14px 14px',
          background: 'var(--surface-hover)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem', color: 'var(--text-muted)',
          textAlign: 'center', border: '1px dashed var(--border)',
        }}>
          No ores in portfolio. Buy some ores first before selling.
        </div>
      ) : (
        <select value={oreId} onChange={e => onOreIdChange(e.target.value)} style={{
          width: '100%', padding: '9px 14px',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
          outline: 'none', cursor: 'pointer',
          fontFamily: "'Instrument Sans', sans-serif",
        }}>
          <option value="">Select an ore...</option>
          {['shallow', 'deep', 'nether'].map(cat =>
            groupedOres[cat] && groupedOres[cat].length > 0 ? (
              <optgroup key={cat} label={`${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}>
                {groupedOres[cat].map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </optgroup>
            ) : null
          )}
        </select>
      )}
      {txType === 'sell' && oreId && saleSource === 'portfolio' && (
        <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div>Holding: {currentHolding.quantity} units &middot; Avg cost: {formatCurrencyFull(currentHolding.avgCost)}</div>
          {costAnalysis.count > 0 && (
            <div>
              {costAnalysis.count} buy{costAnalysis.count > 1 ? 's' : ''} &middot; Range: {formatCurrencyFull(costAnalysis.minPrice)} ~ {formatCurrencyFull(costAnalysis.maxPrice)}
              &middot; Latest buy: {formatCurrencyFull(costAnalysis.latestPrice)}
            </div>
          )}
        </div>
      )}
      {txType === 'sell' && saleSource === 'mined' && (
        <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--amber)' }}>
          Mined ore sale &mdash; full amount is mining income
        </div>
      )}
    </div>
  );
}

/* ====================================================
   HOLDINGS TABLE — portfolio table with inline editing
   ==================================================== */

export function HoldingsTable({ portfolio, getAnalysis, editOreId, editValue, onStartEdit, onConfirmEdit, onCancelEdit, onEditValueChange, formatCurrencyFull }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Ore', 'Qty', 'Avg Cost', 'Buys', 'Cost Range', 'vs Latest'].map(h => (
              <th key={h} style={{
                textAlign: h === 'Ore' ? 'left' : 'right',
                fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--text-muted)', fontWeight: 650,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {portfolio.map(p => {
            const analysis = getAnalysis(p.id);
            const hasRange = analysis.count > 0;
            const rangeStr = hasRange
              ? `${formatCurrencyFull(analysis.minPrice)} ~ ${formatCurrencyFull(analysis.maxPrice)}`
              : '-';
            return (
              <tr key={p.id}>
                <td style={{ padding: '12px 16px', fontSize: '1rem', fontWeight: 620, borderBottom: '1px solid var(--border-light)' }}>{p.name}</td>
                <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                  onClick={() => onStartEdit(p.id, p.quantity)}
                >
                  {editOreId === p.id ? (
                    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <input type="number" min="0" autoFocus
                        value={editValue}
                        onChange={e => onEditValueChange(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') onConfirmEdit(p.id);
                          if (e.key === 'Escape') onCancelEdit();
                        }}
                        onBlur={() => onConfirmEdit(p.id)}
                        style={{
                          width: 60, padding: '3px 6px',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)',
                          background: 'var(--surface)', color: 'var(--text)',
                          fontSize: '0.9rem', fontFamily: 'inherit',
                          textAlign: 'right', outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        ({p.quantity})
                      </span>
                    </span>
                  ) : (
                    <span title="Click to adjust quantity">{p.quantity}</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{formatCurrencyFull(p.avgCost)}</td>
                <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{hasRange ? analysis.count : '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 520, textAlign: 'right', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>{rangeStr}</td>
                <td style={{
                  padding: '12px 16px', fontSize: '0.9rem',
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 580,
                  textAlign: 'right', borderBottom: '1px solid var(--border-light)',
                  color: hasRange ? (analysis.vsLatest >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)',
                }}>
                  {hasRange ? `${analysis.vsLatest >= 0 ? '+' : ''}${analysis.vsLatest.toFixed(1)}%` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ====================================================
   ORE REFERENCE — categorized ore list
   ==================================================== */

export function OreReference() {
  return (
    <div style={{ fontSize: '0.82rem' }}>
      {['shallow', 'deep', 'nether'].map(cat => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <div style={{
            fontWeight: 620, fontSize: '0.82rem',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--text-muted)', marginBottom: 4,
          }}>
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </div>
          {ORES.filter(o => o.category === cat).map(o => (
            <div key={o.id} style={{ padding: '2px 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{o.name}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ====================================================
   DASHBOARD VIEW — cards + quick actions + recent
   ==================================================== */

export function DashboardView({ summary, recentTransactions, onNavigate, deleteTransaction }) {
  return (
    <PageShell>
      <PageHeader title="Dashboard" subtitle="Overview of your ore stock market activity" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 28,
      }}>
        <SummaryCard label="Cash Balance" value={formatCurrencyFull(summary.cash)} sub="Available funds" />
        <SummaryCard label="Speculative P&L" value={`${summary.speculativeProfit >= 0 ? '+' : ''}${formatCurrencyFull(summary.speculativeProfit)}`} typeVariant={summary.speculativeProfit >= 0 ? 'positive' : 'negative'} sub="Gains from trading" />
        <SummaryCard label="Mining Income" value={`+${formatCurrencyFull(summary.miningIncome)}`} typeVariant="positive" sub="From selling mined ores" />
        <SummaryCard label="Portfolio Value" value={formatCurrencyFull(summary.portfolioValue)} sub={`${summary.totalHoldings} items across ores`} />
      </div>

      <div style={{
        display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap',
      }}>
        <QuickActionBtn icon="↓" label="Buy Ore" color="var(--green)" onClick={() => onNavigate('new-entry', 'buy')} />
        <QuickActionBtn icon="↑" label="Sell Ore" color="var(--blue)" onClick={() => onNavigate('new-entry', 'sell')} />
        <QuickActionBtn icon="⛏" label="Mine Sale" color="var(--amber)" onClick={() => onNavigate('new-entry', 'mine_sell')} />
        <QuickActionBtn icon="✕" label="Expense" color="var(--red)" onClick={() => onNavigate('new-entry', 'expense')} />
      </div>

      <SectionCard title="Recent Transactions" headerRight={
        <button onClick={() => onNavigate('transactions')} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
          fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'inherit', fontWeight: 560,
          transition: 'all var(--transition)',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >View All</button>
      }>
        {recentTransactions.length === 0 ? (
          <EmptyState icon="O" iconStyle={{ fontSize: '2rem', opacity: 0.25 }} title="No transactions yet" message="Record your first transaction to get started" messageStyle={{ fontWeight: 520 }} />
        ) : (
          <div>{recentTransactions.map(tx => (
            <TransactionItem key={tx.id} tx={tx} onDelete={deleteTransaction} showDelete={true} />
          ))}</div>
        )}
      </SectionCard>
    </PageShell>
  );
}

/* ====================================================
   TRANSACTIONS VIEW — filter chips + transaction list
   ==================================================== */

export function TransactionsView({ filtered, filterType, onFilterTypeChange, onNavigate, deleteTransaction }) {
  return (
    <PageShell>
      <PageHeader title="Transactions" subtitle="Complete history of all your financial activities" marginBottom={24} />

      <FilterChips
        options={['all', 'buy', 'sell', 'mine_sell', 'expense', 'balance_adjust', 'write_off']}
        value={filterType}
        onChange={onFilterTypeChange}
        labelMap={TX_LABEL}
      />

      <SectionCard title={`All Transactions${filterType !== 'all' ? ` · ${TX_LABEL[filterType]}` : ''} · ${filtered.length}`} headerRight={
        <button onClick={() => onNavigate('new-entry')} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent)', border: 'none', cursor: 'pointer',
          fontSize: '0.9rem', color: '#fff', fontFamily: 'inherit', fontWeight: 620,
          transition: 'all var(--transition)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
        >+ New Entry</button>
      }>
        {filtered.length === 0 ? (
          <EmptyState icon="∅" title="No transactions found"
            message={filterType === 'all' ? 'Record your first transaction to get started' : `No ${TX_LABEL[filterType]?.toLowerCase()} transactions yet`}
            messageStyle={{ fontSize: '0.82rem' }}
          />
        ) : (
          <div>{filtered.map(tx => (
            <TransactionItem key={tx.id} tx={tx} onDelete={deleteTransaction} showDelete={true} />
          ))}</div>
        )}
      </SectionCard>
    </PageShell>
  );
}

/* ====================================================
   PORTFOLIO VIEW — summary cards + holdings table
   ==================================================== */

export function PortfolioView({ summary, totalCost, activePortfolio, getOreCostAnalysis, editOreId, editValue, onStartEdit, onConfirmEdit, onCancelEdit, onEditValueChange }) {
  return (
    <PageShell>
      <PageHeader title="Portfolio" subtitle="Your current ore holdings and cost basis" marginBottom={24} />

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 'var(--space-md)', marginBottom: 28,
      }}>
        <SummaryCard label="Total Holdings" value={`${summary.totalHoldings} items`} sub="Across all ores" />
        <SummaryCard label="Total Cost Basis" value={formatCurrencyFull(totalCost)} sub="Total amount spent" />
      </div>

      <SectionCard title="Holdings">
        {activePortfolio.length === 0 ? (
          <EmptyState icon="∅" title="No holdings yet" message="Buy some ores to start building your portfolio" messageStyle={{ fontWeight: 520 }} />
        ) : (
          <HoldingsTable
            portfolio={activePortfolio}
            getAnalysis={getOreCostAnalysis}
            editOreId={editOreId}
            editValue={editValue}
            onStartEdit={onStartEdit}
            onConfirmEdit={onConfirmEdit}
            onCancelEdit={onCancelEdit}
            onEditValueChange={onEditValueChange}
            formatCurrencyFull={formatCurrencyFull}
          />
        )}
      </SectionCard>

      {activePortfolio.length > 0 && (
        <div style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div>Click a <strong>Qty</strong> to adjust your actual holdings (e.g. after losing ore).</div>
          <div><strong>vs Latest</strong> compares your average cost to the most recent buy price.</div>
        </div>
      )}
    </PageShell>
  );
}

/* ====================================================
   NEW ENTRY VIEW — transaction form
   ==================================================== */

const INPUT_STYLE = {
  width: '100%', padding: '9px 14px',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
  outline: 'none',
};

const QUICK_QTY = [1, 16, 64];
const TYPE_BTNS = [
  { type: 'buy', icon: '↓', label: 'Buy', color: 'var(--green)' },
  { type: 'sell', icon: '↑', label: 'Sell', color: 'var(--blue)' },
  { type: 'mine_sell', icon: '⛏', label: 'Mine Sale', color: 'var(--amber)' },
  { type: 'expense', icon: '✕', label: 'Expense', color: 'var(--red)' },
  { type: 'balance_adjust', icon: '⟳', label: 'Adjust', color: 'var(--accent)' },
];

export function NewEntryView({
  txType, onTxTypeChange,
  saleSource, onSaleSourceChange,
  date, onDateChange,
  oreId, onOreIdChange,
  quantity, onQuantityChange,
  unitPrice, onUnitPriceChange,
  description, onDescriptionChange,
  newBalance, onNewBalanceChange,
  note, onNoteChange,
  formError,
  calculatedTotal, adjustmentDelta, estimatedProfit,
  availableOres, groupedOres,
  currentHolding, costAnalysis,
  onSubmit, currentCash,
}) {
  return (
    <PageShell>
      <PageHeader title="New Entry" subtitle="Record a new transaction or activity" marginBottom={24} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TYPE_BTNS.map(btn => (
          <button key={btn.type} onClick={() => onTxTypeChange(btn.type)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: txType === btn.type ? btn.color : 'var(--border)',
            background: txType === btn.type ? `${btn.color}12` : 'transparent',
            color: txType === btn.type ? btn.color : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.95rem',
            fontWeight: txType === btn.type ? 580 : 500,
            fontFamily: 'inherit', transition: 'all var(--transition)',
          }}>
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      <SectionCard title={TX_LABEL[txType] || 'Transaction'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Date" labelStyle={{ letterSpacing: '0.01em' }}>
            <input type="date" value={date} onChange={e => onDateChange(e.target.value)} style={{
              ...INPUT_STYLE,
              transition: 'border-color var(--transition)',
              fontFamily: "'Instrument Sans', sans-serif",
            }} />
          </FormField>

          {txType === 'sell' && (
            <div>
              <label style={{
                display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                fontWeight: 530, marginBottom: 6,
              }}>Source of Ore</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onSaleSourceChange('portfolio')} style={{
                  flex: 1, padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid',
                  borderColor: saleSource === 'portfolio' ? 'var(--blue)' : 'var(--border)',
                  background: saleSource === 'portfolio' ? 'var(--blue-bg)' : 'transparent',
                  color: saleSource === 'portfolio' ? 'var(--blue)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: saleSource === 'portfolio' ? 600 : 400,
                  fontFamily: 'inherit', transition: 'all var(--transition)',
                }}>
                  <div style={{ fontWeight: 600 }}>Portfolio</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 1 }}>Sell bought ores</div>
                </button>
                <button onClick={() => onSaleSourceChange('mined')} style={{
                  flex: 1, padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${saleSource === 'mined' ? 'var(--amber)' : 'var(--border)'}`,
                  background: saleSource === 'mined' ? 'var(--amber-bg)' : 'transparent',
                  color: saleSource === 'mined' ? 'var(--amber)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: saleSource === 'mined' ? 600 : 400,
                  fontFamily: 'inherit', transition: 'all var(--transition)',
                }}>
                  <div style={{ fontWeight: 600 }}>Mined</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 1 }}>Sell mined ores</div>
                </button>
              </div>
            </div>
          )}

          {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && (
            <OreSelector
              txType={txType}
              saleSource={saleSource}
              oreId={oreId}
              availableOres={availableOres}
              groupedOres={groupedOres}
              currentHolding={currentHolding}
              costAnalysis={costAnalysis}
              onOreIdChange={onOreIdChange}
              formatCurrencyFull={formatCurrencyFull}
            />
          )}

          {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && (
            <FormField label="Quantity">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" min="1" value={quantity} onChange={e => onQuantityChange(e.target.value)} placeholder="0"
                  style={{ ...INPUT_STYLE, flex: 1 }} />
                {QUICK_QTY.map(q => (
                  <button key={q} onClick={() => onQuantityChange(String(q))} style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--surface)', cursor: 'pointer',
                    fontSize: '0.9rem', fontWeight: 520, color: 'var(--text-muted)',
                    fontFamily: 'inherit', transition: 'all var(--transition)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >{q}</button>
                ))}
                {txType === 'sell' && oreId && (
                  <button onClick={() => onQuantityChange(String(currentHolding.quantity))} style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--blue)',
                    background: 'var(--blue-bg)', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 550, color: 'var(--blue)',
                    fontFamily: 'inherit',
                  }}>ALL</button>
                )}
              </div>
            </FormField>
          )}

          {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && (
            <FormField label="Unit Price">
              <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => onUnitPriceChange(e.target.value)} placeholder="0.00"
                style={INPUT_STYLE} />
            </FormField>
          )}

          {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && quantity && unitPrice && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--surface-hover)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}>
              Total: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 550, color: txType === 'buy' ? 'var(--red)' : 'var(--green)' }}>
                {txType === 'buy' ? '-' : '+'}{formatCurrencyFull(Math.abs(calculatedTotal))}
              </span>
            </div>
          )}

          {txType === 'sell' && estimatedProfit !== null && (
            <div style={{
              padding: '10px 14px',
              background: saleSource === 'mined' ? 'var(--amber-bg)' : 'var(--accent-glow)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: saleSource === 'mined' ? 'var(--amber)' : 'var(--accent-dark)',
            }}>
              {saleSource === 'mined' ? 'Mining Income' : 'Est. P&L'}: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 550, color: estimatedProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {estimatedProfit >= 0 ? '+' : ''}{formatCurrencyFull(estimatedProfit)}
                {saleSource === 'portfolio' && currentHolding.avgCost > 0 && (() => {
                  const costBasis = parseFloat(quantity) * currentHolding.avgCost;
                  const pct = ((estimatedProfit / costBasis) * 100);
                  return <span style={{ fontWeight: 480, opacity: 0.7 }}> ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>;
                })()}
              </span>
            </div>
          )}

          {txType === 'expense' && (
            <FormField label="Description">
              <input type="text" value={description} onChange={e => onDescriptionChange(e.target.value)} placeholder="What did you buy?" style={INPUT_STYLE} />
            </FormField>
          )}

          {txType === 'expense' && (
            <FormField label="Amount Spent">
              <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => onUnitPriceChange(e.target.value)} placeholder="0.00" style={INPUT_STYLE} />
            </FormField>
          )}

          {txType === 'balance_adjust' && (
            <div>
              <div style={{
                padding: '10px 14px',
                background: 'var(--surface-hover)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem', color: 'var(--text-secondary)',
                marginBottom: 14,
              }}>
                Current system balance: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 550 }}>{formatCurrencyFull(currentCash)}</span>
              </div>
              <FormField label="Actual Cash in Pocket">
                <input type="number" step="0.01" value={newBalance} onChange={e => onNewBalanceChange(e.target.value)} placeholder="Enter actual cash amount" style={INPUT_STYLE} />
              </FormField>
              {adjustmentDelta !== null && (
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: adjustmentDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  Adjustment: {adjustmentDelta >= 0 ? '+' : ''}{formatCurrencyFull(adjustmentDelta)}
                </div>
              )}
            </div>
          )}

          <FormField label={<span>Notes <span style={{ fontWeight: 380 }}>(optional)</span></span>}>
            <input type="text" value={note} onChange={e => onNoteChange(e.target.value)} placeholder="Add a note..." style={INPUT_STYLE} />
          </FormField>

          {formError && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--red-bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem', color: 'var(--red)',
              fontWeight: 480,
            }}>{formError}</div>
          )}

          <button onClick={onSubmit} style={{
            width: '100%', padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: '1rem', fontWeight: 640,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all var(--transition)',
            letterSpacing: '0.01em',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Record {TX_LABEL[txType] || 'Transaction'}
          </button>
        </div>
      </SectionCard>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <SectionCard title="Ore Reference">
          <OreReference />
        </SectionCard>
        <SectionCard title="Quick Tips">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div><span style={{ fontWeight: 620, color: 'var(--green)' }}>↓ Buy</span> — Buy ores for portfolio</div>
            <div><span style={{ fontWeight: 620, color: 'var(--blue)' }}>↑ Sell</span> — Sell from portfolio or mined</div>
            <div><span style={{ fontWeight: 620, color: 'var(--amber)' }}>⛏ Mine Sale</span> — Pure mining income</div>
            <div><span style={{ fontWeight: 620, color: 'var(--red)' }}>✕ Expense</span> — Record spending</div>
            <div><span style={{ fontWeight: 620, color: 'var(--accent)' }}>⟳ Adjust</span> — Calibrate cash</div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
