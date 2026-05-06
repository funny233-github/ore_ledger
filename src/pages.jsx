import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLedger, useToast, formatCurrencyFull } from './utils.jsx';
import { ORES } from './data.js';
import { SummaryCard, QuickActionBtn, SectionCard, TransactionItem, TX_LABEL } from './components.jsx';

/* ====================================================
   DASHBOARD PAGE
   ==================================================== */

export function DashboardPage({ ledger, onNavigate }) {
  const { summary, recentTransactions } = ledger;

  return (
    <div className="page">
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-3xl)' }}>
        {/* Page header */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 720, fontSize: '1.65rem',
            color: 'var(--text)', letterSpacing: '-0.015em',
          }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Overview of your ore stock market activity
          </p>
        </div>

        {/* Summary Cards */}
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

        {/* Quick Actions */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap',
        }}>
          <QuickActionBtn icon="↓" label="Buy Ore" color="var(--green)" onClick={() => onNavigate('new-entry', 'buy')} />
          <QuickActionBtn icon="↑" label="Sell Ore" color="var(--blue)" onClick={() => onNavigate('new-entry', 'sell')} />
          <QuickActionBtn icon="⛏" label="Mine Sale" color="var(--amber)" onClick={() => onNavigate('new-entry', 'mine_sell')} />
          <QuickActionBtn icon="✕" label="Expense" color="var(--red)" onClick={() => onNavigate('new-entry', 'expense')} />
        </div>

        {/* Recent Transactions */}
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
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 14, opacity: 0.25, fontFamily: "'DM Serif Display', serif", color: 'var(--text-secondary)' }}>O</div>
              <h3 style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 540, fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 4 }}>No transactions yet</h3>
              <p style={{ fontSize: '0.95rem', fontWeight: 520 }}>Record your first transaction to get started</p>
            </div>
          ) : (
            <div>{recentTransactions.map(tx => (
              <TransactionItem key={tx.id} tx={tx} onDelete={ledger.deleteTransaction} showDelete={true} />
            ))}</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ====================================================
   TRANSACTIONS PAGE
   ==================================================== */

export function TransactionsPage({ ledger, onNavigate }) {
  const { transactions } = ledger;
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter(tx => tx.type === filterType);
  }, [transactions, filterType]);

  return (
    <div className="page">
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-3xl)' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 720, fontSize: '1.65rem',
            color: 'var(--text)', letterSpacing: '-0.015em',
          }}>Transactions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Complete history of all your financial activities
          </p>
        </div>

        {/* Filter chips */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {['all', 'buy', 'sell', 'mine_sell', 'expense', 'balance_adjust'].map(type => (
            <button key={type} onClick={() => setFilterType(type)} style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: filterType === type ? 'var(--accent)' : 'var(--border)',
              background: filterType === type ? 'var(--accent-subtle)' : 'transparent',
              color: filterType === type ? 'var(--accent-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',                 fontSize: '0.88rem', fontWeight: filterType === type ? 620 : 500,
              fontFamily: 'inherit', transition: 'all var(--transition)',
            }}>
              {TX_LABEL[type] || type}
            </button>
          ))}
        </div>

        {/* Transaction List */}
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
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', color: 'var(--text-muted)' }}>
              <div style={{
                fontSize: '1.8rem', marginBottom: 14, opacity: 0.2,
                fontFamily: "'DM Serif Display', serif", color: 'var(--text-secondary)',
              }}>∅</div>
              <h3 style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 540, fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 4 }}>No transactions found</h3>
              <p style={{ fontSize: '0.82rem' }}>
                {filterType === 'all' ? 'Record your first transaction to get started' : `No ${TX_LABEL[filterType]?.toLowerCase()} transactions yet`}
              </p>
            </div>
          ) : (
            <div>{filtered.map(tx => (
              <TransactionItem key={tx.id} tx={tx} onDelete={ledger.deleteTransaction} showDelete={true} />
            ))}</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ====================================================
   PORTFOLIO PAGE
   ==================================================== */

export function PortfolioPage({ ledger }) {
  const { summary, activePortfolio } = ledger;

  const totalValue = activePortfolio.reduce((s, p) => s + p.currentValue, 0);
  const totalCost = activePortfolio.reduce((s, p) => s + p.totalCost, 0);
  const unrealizedPnL = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (unrealizedPnL / totalCost * 100) : 0;

  return (
    <div className="page">
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-3xl)' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 720, fontSize: '1.65rem',
            color: 'var(--text)', letterSpacing: '-0.015em',
          }}>Portfolio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Your current ore holdings and cost basis
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--space-md)', marginBottom: 28 }}>
          <SummaryCard label="Total Holdings" value={`${summary.totalHoldings} items`} sub="Across all ores" />
          <SummaryCard label="Portfolio Value" value={formatCurrencyFull(totalValue)} sub={`Cost basis: ${formatCurrencyFull(totalCost)}`} />
          <SummaryCard
            label="Unrealized P&L"
            value={`${unrealizedPnL >= 0 ? '+' : ''}${formatCurrencyFull(unrealizedPnL)}`}
            typeVariant={unrealizedPnL >= 0 ? 'positive' : 'negative'}
            sub={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
          />
        </div>

        {/* Holdings Table */}
        <SectionCard title="Holdings">
          {activePortfolio.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', color: 'var(--text-muted)' }}>
              <div style={{
                fontSize: '1.8rem', marginBottom: 14, opacity: 0.2,
                fontFamily: "'DM Serif Display', serif", color: 'var(--text-secondary)',
              }}>∅</div>
              <h3 style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 540, fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 4 }}>No holdings yet</h3>
              <p style={{ fontSize: '0.95rem', fontWeight: 520 }}>Buy some ores to start building your portfolio</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Ore', 'Quantity', 'Avg Cost', 'Total Cost', 'Value', 'P&L'].map(h => (
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
                  {activePortfolio.map(p => {
                    const pnl = p.currentValue - p.totalCost;
                    return (
                      <tr key={p.id}>
                        <td style={{ padding: '12px 16px', fontSize: '1rem', fontWeight: 620, borderBottom: '1px solid var(--border-light)' }}>{p.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{p.quantity}</td>
                        <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{formatCurrencyFull(p.avgCost)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{formatCurrencyFull(p.totalCost)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 580, textAlign: 'right', borderBottom: '1px solid var(--border-light)' }}>{formatCurrencyFull(p.currentValue)}</td>
                        <td style={{
                          padding: '12px 16px', fontSize: '1rem',
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 580,
                          textAlign: 'right', borderBottom: '1px solid var(--border-light)',
                          color: pnl >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>{pnl >= 0 ? '+' : ''}{formatCurrencyFull(pnl)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {activePortfolio.length > 0 && (
          <div style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            * Current values shown at average cost (no real-time pricing).
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================
   NEW ENTRY PAGE
   ==================================================== */

export function NewEntryPage({ ledger, preselectedType, onNavigate }) {
  const { getOreHolding, addTransaction } = ledger;
  const toast = useToast();
  const [txType, setTxType] = useState(preselectedType || 'buy');
  const [saleSource, setSaleSource] = useState('portfolio');
  const [formError, setFormError] = useState('');

  // Sync txType when preselectedType changes (e.g., quick action from Dashboard)
  useEffect(() => {
    if (preselectedType && preselectedType !== txType) {
      setTxType(preselectedType);
    }
  }, [preselectedType]);

  // Form fields (shared)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [oreId, setOreId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [note, setNote] = useState('');

  // Reset form when type changes
  useEffect(() => {
    setOreId('');
    setQuantity('');
    setUnitPrice('');
    setDescription('');
    setNewBalance('');
    setNote('');
    setSaleSource('portfolio');
  }, [txType]);

  // Filter ores for sell: only owned ores for portfolio, all ores for mined
  const availableOres = useMemo(() => {
    if (txType === 'sell') {
      if (saleSource === 'mined') return ORES;
      return ORES.filter(o => {
        const h = getOreHolding(o.id);
        return h.quantity > 0;
      });
    }
    return ORES;
  }, [txType, saleSource, getOreHolding]);

  // Group ores by category
  const groupedOres = useMemo(() => {
    const groups = { shallow: [], deep: [], nether: [] };
    availableOres.forEach(o => {
      if (groups[o.category]) groups[o.category].push(o);
    });
    return groups;
  }, [availableOres]);

  // Category labels
  const CATEGORY_LABELS = { shallow: 'Shallow', deep: 'Deep', nether: 'Nether' };

  // Holdings info for sell
  const currentHolding = getOreHolding(oreId);

  // Auto-calculated total
  const calculatedTotal = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(unitPrice) || 0;
    const total = q * p;
    if (txType === 'buy') return -total;
    return total;
  }, [quantity, unitPrice, txType]);

  // Balance adjust auto-delta
  const adjustmentDelta = useMemo(() => {
    if (txType !== 'balance_adjust') return null;
    const nb = parseFloat(newBalance);
    if (isNaN(nb)) return null;
    return nb - ledger.summary.cash;
  }, [newBalance, txType, ledger.summary.cash]);

  // Estimated profit for sell
  const estimatedProfit = useMemo(() => {
    if (txType !== 'sell' || !oreId || !quantity) return null;
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(unitPrice) || 0;
    const received = q * p;
    if (saleSource === 'mined') return received; // Full amount is profit (mined)
    const cost = q * currentHolding.avgCost;
    return received - cost;
  }, [txType, saleSource, oreId, quantity, unitPrice, currentHolding]);

  // Quick quantity buttons
  const QUICK_QTY = [1, 16, 64];

  // Ore category icons
  const CATEGORY_ICONS = { shallow: '⬆', deep: '⬇', nether: '🔥' };

  // Form submission handler
  const handleSubmit = useCallback(() => {
    setFormError('');

    // Validate
    if (!date) { setFormError('Date is required'); return; }

    if (txType === 'buy' || txType === 'sell' || txType === 'mine_sell') {
      if (!oreId) { setFormError('Please select an ore'); return; }
      const q = parseInt(quantity, 10);
      if (!q || q <= 0) { setFormError('Quantity must be greater than 0'); return; }
      const p = parseFloat(unitPrice);
      if (!p || p <= 0) { setFormError('Unit price must be greater than 0'); return; }

      if (txType === 'sell' && saleSource === 'portfolio') {
        const holding = getOreHolding(oreId);
        if (q > holding.quantity) {
          setFormError(`Cannot sell ${q} units — only ${holding.quantity} held`);
          return;
        }
      }
    } else if (txType === 'expense') {
      if (!description.trim()) { setFormError('Description is required'); return; }
      const amt = parseFloat(unitPrice);
      if (!amt || amt <= 0) { setFormError('Amount must be greater than 0'); return; }
    } else if (txType === 'balance_adjust') {
      const nb = parseFloat(newBalance);
      if (isNaN(nb) || nb < 0) { setFormError('Please enter a valid cash balance'); return; }
    }

    // Build transaction object
    let totalAmount = 0;
    const q = parseInt(quantity, 10);
    const p = parseFloat(unitPrice);

    switch (txType) {
      case 'buy':
        totalAmount = -(q * p);
        break;
      case 'sell':
      case 'mine_sell':
        totalAmount = q * p;
        break;
      case 'expense':
        totalAmount = -Math.abs(parseFloat(unitPrice));
        break;
      case 'balance_adjust':
        totalAmount = 0; // not used for adjust
        break;
    }

    const tx = {
      type: txType,
      date,
      asset: (txType === 'buy' || txType === 'sell' || txType === 'mine_sell') ? oreId : undefined,
      quantity: (txType === 'buy' || txType === 'sell' || txType === 'mine_sell') ? q : undefined,
      unitPrice: (txType === 'buy' || txType === 'sell' || txType === 'mine_sell') ? p : (txType === 'expense' ? parseFloat(unitPrice) : undefined),
      totalAmount: txType === 'balance_adjust' ? 0 : totalAmount,
      newBalance: txType === 'balance_adjust' ? parseFloat(newBalance) : undefined,
      description: txType === 'expense' ? description.trim() : undefined,
      note: note.trim() || undefined,
      source: txType === 'sell' ? saleSource : undefined,
    };

    const success = addTransaction(tx);
    if (success === false || success === undefined) {
      setFormError('Failed to record transaction. Check portfolio holdings.');
      return;
    }

    toast('Transaction recorded successfully', 'success');

    // Reset form
    setOreId(''); setQuantity(''); setUnitPrice(''); setDescription('');
    setNewBalance(''); setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError('');

    // Navigate to transactions page
    setTimeout(() => onNavigate('transactions'), 1000);
  }, [txType, date, oreId, quantity, unitPrice, description, newBalance, note, addTransaction, getOreHolding, toast, onNavigate]);

  return (
    <div className="page">
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-xl) var(--space-xl) var(--space-3xl)' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 720, fontSize: '1.65rem',
            color: 'var(--text)', letterSpacing: '-0.015em',
          }}>New Entry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
            Record a new transaction or activity
          </p>
        </div>

        {/* Type selector — pill-style */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { type: 'buy', icon: '↓', label: 'Buy', color: 'var(--green)' },
            { type: 'sell', icon: '↑', label: 'Sell', color: 'var(--blue)' },
            { type: 'mine_sell', icon: '⛏', label: 'Mine Sale', color: 'var(--amber)' },
            { type: 'expense', icon: '✕', label: 'Expense', color: 'var(--red)' },
            { type: 'balance_adjust', icon: '⟳', label: 'Adjust', color: 'var(--accent)' },
          ].map(btn => (
            <button key={btn.type} onClick={() => setTxType(btn.type)} style={{
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

        {/* Form */}
        <SectionCard title={TX_LABEL[txType] || 'Transaction'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Date */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                fontWeight: 530, marginBottom: 6, letterSpacing: '0.01em',
              }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
                width: '100%', padding: '9px 14px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                outline: 'none', transition: 'border-color var(--transition)',
                fontFamily: "'Instrument Sans', sans-serif",
              }} />
            </div>

            {/* Source toggle (sell only) */}
            {txType === 'sell' && (
              <div>
                <label style={{
                  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontWeight: 530, marginBottom: 6,
                }}>Source of Ore</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSaleSource('portfolio')} style={{
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
                  <button onClick={() => setSaleSource('mined')} style={{
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

            {/* Ore selector (for buy/sell/mine_sell) */}
            {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && (
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
                  <select value={oreId} onChange={e => setOreId(e.target.value)} style={{
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
                  <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Holding: {currentHolding.quantity} units · Avg cost: {formatCurrencyFull(currentHolding.avgCost)}
                  </div>
                )}
                {txType === 'sell' && saleSource === 'mined' && (
                  <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--amber)' }}>
                    Mined ore sale — full amount is mining income
                  </div>
                )}
              </div>
            )}

            {/* Quantity (for buy/sell/mine_sell) */}
            {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && (
              <div>
                <label style={{
                  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontWeight: 530, marginBottom: 6,
                }}>Quantity</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0"
                    style={{
                      flex: 1, padding: '9px 14px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                      outline: 'none',
                    }} />
                  {QUICK_QTY.map(q => (
                    <button key={q} onClick={() => setQuantity(String(q))} style={{
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
                    <button onClick={() => setQuantity(String(currentHolding.quantity))} style={{
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--blue)',
                      background: 'var(--blue-bg)', cursor: 'pointer',
                      fontSize: '0.78rem', fontWeight: 550, color: 'var(--blue)',
                      fontFamily: 'inherit',
                    }}>ALL</button>
                  )}
                </div>
              </div>
            )}

            {/* Unit Price (for buy/sell/mine_sell) */}
            {(txType === 'buy' || txType === 'sell' || txType === 'mine_sell') && (
              <div>
                <label style={{
                  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontWeight: 530, marginBottom: 6,
                }}>Unit Price</label>
                <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                    outline: 'none',
                  }} />
              </div>
            )}

            {/* Auto-calculated total */}
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

            {/* Estimated profit (sell) */}
            {txType === 'sell' && estimatedProfit !== null && (
              <div style={{
                padding: '10px 14px',
                background: saleSource === 'mined' ? 'var(--amber-bg)' : 'var(--accent-glow)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: saleSource === 'mined' ? 'var(--amber)' : 'var(--accent-dark)',
              }}>
                {saleSource === 'mined' ? 'Mining Income' : 'Estimated P&L'}: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 550, color: estimatedProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  +{formatCurrencyFull(estimatedProfit)}
                </span>
              </div>
            )}

            {/* Description (for expense) */}
            {txType === 'expense' && (
              <div>
                <label style={{
                  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontWeight: 530, marginBottom: 6,
                }}>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What did you buy?"
                  style={{
                    width: '100%', padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                    outline: 'none',
                  }} />
              </div>
            )}

            {/* Expense amount */}
            {txType === 'expense' && (
              <div>
                <label style={{
                  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontWeight: 530, marginBottom: 6,
                }}>Amount Spent</label>
                <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00"
                  style={{
                    width: '100%', padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                    outline: 'none',
                  }} />
              </div>
            )}

            {/* Balance Adjust: new balance */}
            {txType === 'balance_adjust' && (
              <div>
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--surface-hover)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem', color: 'var(--text-secondary)',
                  marginBottom: 14,
                }}>
                  Current system balance: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 550 }}>{formatCurrencyFull(ledger.summary.cash)}</span>
                </div>
                <label style={{
                  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                  fontWeight: 530, marginBottom: 6,
                }}>Actual Cash in Pocket</label>
                <input type="number" step="0.01" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="Enter actual cash amount"
                  style={{
                    width: '100%', padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                    outline: 'none',
                  }} />
                {adjustmentDelta !== null && (
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: adjustmentDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    Adjustment: {adjustmentDelta >= 0 ? '+' : ''}{formatCurrencyFull(adjustmentDelta)}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)',
                fontWeight: 530, marginBottom: 6,
              }}>Notes <span style={{               fontWeight: 380 }}>(optional)</span></label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..."
                style={{
                  width: '100%', padding: '9px 14px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem',
                  outline: 'none',
                }} />
            </div>

            {/* Form error message */}
            {formError && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--red-bg)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem', color: 'var(--red)',
                fontWeight: 480,
              }}>{formError}</div>
            )}

            {/* Submit button */}
            <button onClick={handleSubmit} style={{
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

        {/* Ore Reference & Quick Tips */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <SectionCard title="Ore Reference">
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
      </div>
    </div>
  );
}
