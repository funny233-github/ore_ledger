import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLedger, useToast, formatCurrencyFull } from './utils';
import type { UseLedgerReturn } from './utils';
import { ORES } from './data';
import type { Ore, TxType } from './data';
import { DashboardView, TransactionsView, PortfolioView, NewEntryView } from './components';

/* ====================================================
   DASHBOARD PAGE
   ==================================================== */

interface DashboardPageProps {
  ledger: UseLedgerReturn;
  onNavigate: (page: string, type?: string) => void;
}

export function DashboardPage({ ledger, onNavigate }: DashboardPageProps) {
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

interface TransactionsPageProps {
  ledger: UseLedgerReturn;
  onNavigate: (page: string, type?: string) => void;
}

export function TransactionsPage({ ledger, onNavigate }: TransactionsPageProps) {
  const { transactions } = ledger;
  const [filterType, setFilterType] = useState<string>('all');

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

interface PortfolioPageProps {
  ledger: UseLedgerReturn;
}

export function PortfolioPage({ ledger }: PortfolioPageProps) {
  const { summary, activePortfolio, getOreCostAnalysis, adjustQuantity } = ledger;
  const toast = useToast();
  const [editOreId, setEditOreId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalCost = activePortfolio.reduce((s, p) => s + p.totalCost, 0);

  const startEdit = (oreId: string, currentQty: number) => {
    setEditOreId(oreId);
    setEditValue(String(currentQty));
  };

  const confirmEdit = (oreId: string) => {
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

interface NewEntryPageProps {
  ledger: UseLedgerReturn;
  preselectedType?: TxType;
  onNavigate: (page: string, type?: string) => void;
}

export function NewEntryPage({ ledger, preselectedType, onNavigate }: NewEntryPageProps) {
  const { getOreHolding, getOreCostAnalysis, addTransaction } = ledger;
  const toast = useToast();
  const [txType, setTxType] = useState<TxType>(preselectedType || 'buy');
  const [saleSource, setSaleSource] = useState<'portfolio' | 'mined'>('portfolio');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (preselectedType && preselectedType !== txType) {
      setTxType(preselectedType);
    }
  }, [preselectedType]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [oreId, setOreId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setOreId('');
    setQuantity('');
    setUnitPrice('');
    setDescription('');
    setNewBalance('');
    setNote('');
    setSaleSource('portfolio');
  }, [txType]);

  const availableOres = useMemo((): Ore[] => {
    if (txType === 'sell') {
      if (saleSource === 'mined') return ORES;
      return ORES.filter(o => {
        const h = getOreHolding(o.id);
        return h.quantity > 0;
      });
    }
    return ORES;
  }, [txType, saleSource, getOreHolding]);

  const groupedOres = useMemo((): Record<string, Ore[]> => {
    const groups: Record<string, Ore[]> = { shallow: [], deep: [], nether: [] };
    availableOres.forEach(o => {
      if (groups[o.category]) groups[o.category].push(o);
    });
    return groups;
  }, [availableOres]);

  const currentHolding = getOreHolding(oreId);
  const costAnalysis = getOreCostAnalysis(oreId);

  const calculatedTotal = useMemo((): number => {
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(unitPrice) || 0;
    const total = q * p;
    if (txType === 'buy') return -total;
    return total;
  }, [quantity, unitPrice, txType]);

  const adjustmentDelta = useMemo((): number | null => {
    if (txType !== 'balance_adjust') return null;
    const nb = parseFloat(newBalance);
    if (isNaN(nb)) return null;
    return nb - ledger.summary.cash;
  }, [newBalance, txType, ledger.summary.cash]);

  const estimatedProfit = useMemo((): number | null => {
    if (txType !== 'sell' || !oreId || !quantity) return null;
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(unitPrice) || 0;
    const received = q * p;
    if (saleSource === 'mined') return received;
    const cost = q * currentHolding.avgCost;
    return received - cost;
  }, [txType, saleSource, oreId, quantity, unitPrice, currentHolding]);

  const QUICK_QTY = [1, 16, 64];

  const handleSubmit = useCallback(() => {
    setFormError('');

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
        totalAmount = 0;
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
    if (success === false) {
      setFormError('Failed to record transaction. Check portfolio holdings.');
      return;
    }

    toast('Transaction recorded successfully', 'success');

    setOreId(''); setQuantity(''); setUnitPrice(''); setDescription('');
    setNewBalance(''); setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError('');

    setTimeout(() => onNavigate('transactions'), 1000);
  }, [txType, date, oreId, quantity, unitPrice, description, newBalance, note, addTransaction, getOreHolding, toast, onNavigate, saleSource]);

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
