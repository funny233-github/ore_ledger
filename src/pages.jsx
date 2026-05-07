import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLedger, useToast, formatCurrencyFull } from './utils.jsx';
import { ORES } from './data.js';
import { DashboardView, TransactionsView, PortfolioView, NewEntryView } from './components.jsx';

/* ====================================================
   DASHBOARD PAGE
   ==================================================== */

export function DashboardPage({ ledger, onNavigate }) {
  const { summary, recentTransactions } = ledger;
  return (
    <DashboardView
      summary={summary}
      recentTransactions={recentTransactions}
      onNavigate={onNavigate}
      deleteTransaction={ledger.deleteTransaction}
    />
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
    <TransactionsView
      filtered={filtered}
      filterType={filterType}
      onFilterTypeChange={setFilterType}
      onNavigate={onNavigate}
      deleteTransaction={ledger.deleteTransaction}
    />
  );
}

/* ====================================================
   PORTFOLIO PAGE
   ==================================================== */

export function PortfolioPage({ ledger }) {
  const { summary, activePortfolio, getOreCostAnalysis, adjustQuantity } = ledger;
  const toast = useToast();
  const [editOreId, setEditOreId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const totalCost = activePortfolio.reduce((s, p) => s + p.totalCost, 0);

  const startEdit = (oreId, currentQty) => {
    setEditOreId(oreId);
    setEditValue(String(currentQty));
  };

  const confirmEdit = (oreId) => {
    const newQty = parseInt(editValue, 10);
    if (!newQty || newQty < 0) {
      toast('Invalid quantity', 'error');
      return;
    }
    if (adjustQuantity(oreId, newQty)) {
      toast('Inventory updated', 'success');
    } else {
      toast('No change — quantity must be lower than current', 'error');
    }
    setEditOreId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditOreId(null);
    setEditValue('');
  };

  return (
    <PortfolioView
      summary={summary}
      totalCost={totalCost}
      activePortfolio={activePortfolio}
      getOreCostAnalysis={getOreCostAnalysis}
      editOreId={editOreId}
      editValue={editValue}
      onStartEdit={startEdit}
      onConfirmEdit={confirmEdit}
      onCancelEdit={cancelEdit}
      onEditValueChange={setEditValue}
    />
  );
}

/* ====================================================
   NEW ENTRY PAGE
   ==================================================== */

export function NewEntryPage({ ledger, preselectedType, onNavigate }) {
  const { getOreHolding, getOreCostAnalysis, addTransaction } = ledger;
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

  // Holdings info for sell
  const currentHolding = getOreHolding(oreId);
  const costAnalysis = getOreCostAnalysis(oreId);

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
    <NewEntryView
      txType={txType} onTxTypeChange={setTxType}
      saleSource={saleSource} onSaleSourceChange={setSaleSource}
      date={date} onDateChange={setDate}
      oreId={oreId} onOreIdChange={setOreId}
      quantity={quantity} onQuantityChange={setQuantity}
      unitPrice={unitPrice} onUnitPriceChange={setUnitPrice}
      description={description} onDescriptionChange={setDescription}
      newBalance={newBalance} onNewBalanceChange={setNewBalance}
      note={note} onNoteChange={setNote}
      formError={formError}
      calculatedTotal={calculatedTotal}
      adjustmentDelta={adjustmentDelta}
      estimatedProfit={estimatedProfit}
      availableOres={availableOres}
      groupedOres={groupedOres}
      currentHolding={currentHolding}
      costAnalysis={costAnalysis}
      onSubmit={handleSubmit}
      currentCash={ledger.summary.cash}
    />
  );
}
