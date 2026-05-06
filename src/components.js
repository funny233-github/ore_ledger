/* --- Sidebar — Claude.ai dark sidebar style --- */
function Sidebar({ activeNav, onNavChange, onExport, onClear, theme, onToggleTheme }) {
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
function TopBar({ title, cashBalance }) {
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
function SummaryCard({ label, value, sub, typeVariant = 'neutral' }) {
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
const TX_VISUAL = {
  buy:           { icon: '↓', cls: 'buy',    color: 'var(--green)' },
  sell:          { icon: '↑', cls: 'sell',   color: 'var(--blue)' },
  mine_sell:     { icon: '⛏', cls: 'mine',   color: 'var(--amber)' },
  expense:       { icon: '✕', cls: 'expense', color: 'var(--red)' },
  balance_adjust: { icon: '⟳', cls: 'adjust', color: 'var(--accent)' },
};

const TX_BG = { buy: 'var(--green-bg)', sell: 'var(--blue-bg)', mine_sell: 'var(--amber-bg)', expense: 'var(--red-bg)', balance_adjust: 'var(--accent-glow)' };

const TX_LABEL = { buy: 'Buy', sell: 'Sell', mine_sell: 'Mine Sale', expense: 'Expense', balance_adjust: 'Adjust' };

function TransactionItem({ tx, onDelete, showDelete }) {
  const vis = TX_VISUAL[tx.type] || TX_VISUAL.buy;
  const bg = TX_BG[tx.type] || TX_BG.buy;
  const label = TX_LABEL[tx.type] || tx.type;
  const isNegative = tx.totalAmount < 0;
  const displayAmount = tx.type === 'balance_adjust'
    ? (tx.adjustment >= 0 ? `+${formatCurrencyFull(tx.adjustment)}` : formatCurrencyFull(tx.adjustment))
    : (isNegative ? `-${formatCurrencyFull(Math.abs(tx.totalAmount))}` : `+${formatCurrencyFull(tx.totalAmount)}`);
  const isPositiveAmount = tx.type === 'balance_adjust' ? tx.adjustment >= 0 : !isNegative;

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

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '12px 0',
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
function QuickActionBtn({ icon, label, color, onClick }) {
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
function SectionCard({ title, children, headerRight }) {
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
