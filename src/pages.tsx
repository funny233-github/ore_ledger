import { useState, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { useToast } from './utils';
import type { ToastFn, OreCostAnalysis, LedgerController } from './utils';
import { ORES } from './data';
import type { Ore, TxType, PortfolioEntry, Transaction } from './data';
import { DashboardView, TransactionsView, PortfolioView, NewEntryView } from './components';

/* ========================================
   DASHBOARD PAGE
   ======================================== */

interface DashboardPageProps {
  ledger: LedgerController;
  onNavigate: (page: string, type?: string) => void;
  onEditTransaction?: (id: string) => void;
}

class DashboardPageController {
  private ledger!: LedgerController;
  private onNavigate!: (page: string, type?: string) => void;

  update(ledger: LedgerController, onNavigate: (page: string, type?: string) => void): void {
    this.ledger = ledger;
    this.onNavigate = onNavigate;
  }

  get summary() { return this.ledger.summary; }
  get recentTransactions() { return this.ledger.recentTransactions; }
  get deleteTransaction() { return this.ledger.deleteTransaction.bind(this.ledger); }
  get isLatestTx() { return this.ledger.isLatestTx.bind(this.ledger); }

  navigate(page: string, type?: string): void { this.onNavigate(page, type); }
}

export function DashboardPage({ ledger, onNavigate, onEditTransaction }: DashboardPageProps): JSX.Element {
  const ctrl = useRef(new DashboardPageController()).current;
  ctrl.update(ledger, onNavigate);

  return (
    <DashboardView
      summary={ctrl.summary}
      recentTransactions={ctrl.recentTransactions}
      onNavigate={(p, t) => ctrl.navigate(p, t)}
      deleteTransaction={ctrl.deleteTransaction}
      onEditTransaction={onEditTransaction}
      isLatestTx={ctrl.isLatestTx}
    />
  );
}

/* ========================================
   TRANSACTIONS PAGE
   ======================================== */

interface TransactionsPageProps {
  ledger: LedgerController;
  onNavigate: (page: string, type?: string) => void;
  onEditTransaction?: (id: string) => void;
}

class TransactionsPageController {
  private ledger!: LedgerController;
  private onNavigate!: (page: string, type?: string) => void;
  private notify!: () => void;
  filterType: string = 'all';

  init(notify: () => void): void {
    this.notify = notify;
  }

  update(ledger: LedgerController, onNavigate: (page: string, type?: string) => void): void {
    this.ledger = ledger;
    this.onNavigate = onNavigate;
  }

  get transactions() { return this.ledger.transactions; }
  get deleteTransaction() { return this.ledger.deleteTransaction.bind(this.ledger); }
  get isLatestTx() { return this.ledger.isLatestTx.bind(this.ledger); }
  get filtered() {
    if (this.filterType === 'all') return this.transactions;
    return this.transactions.filter(tx => tx.type === this.filterType);
  }

  setFilterType(type: string): void {
    this.filterType = type;
    this.notify();
  }

  navigate(page: string, type?: string): void { this.onNavigate(page, type); }
}

export function TransactionsPage({ ledger, onNavigate, onEditTransaction }: TransactionsPageProps): JSX.Element {
  const [, forceUpdate] = useState(0);
  const notify = useCallback(() => forceUpdate(n => n + 1), []);

  const ctrl = useRef<TransactionsPageController>(null);
  if (!ctrl.current) {
    ctrl.current = new TransactionsPageController();
    ctrl.current.init(notify);
  }
  ctrl.current.update(ledger, onNavigate);

  return (
    <TransactionsView
      filtered={ctrl.current.filtered}
      filterType={ctrl.current.filterType}
      onFilterTypeChange={t => ctrl.current!.setFilterType(t)}
      onNavigate={(p, t) => ctrl.current!.navigate(p, t)}
      deleteTransaction={ctrl.current.deleteTransaction}
      onEditTransaction={onEditTransaction}
      isLatestTx={ctrl.current.isLatestTx}
    />
  );
}

/* ========================================
   PORTFOLIO PAGE
   ======================================== */

interface PortfolioPageProps {
  ledger: LedgerController;
}

class PortfolioPageController {
  private ledger!: LedgerController;
  private toast!: ToastFn;
  private notify!: () => void;
  editOreId: string | null = null;
  editValue: string = '';

  init(toast: ToastFn, notify: () => void): void {
    this.toast = toast;
    this.notify = notify;
  }

  update(ledger: LedgerController): void {
    this.ledger = ledger;
  }

  get summary() { return this.ledger.summary; }
  get activePortfolio() { return this.ledger.activePortfolio; }
  get getOreCostAnalysis() { return this.ledger.getOreCostAnalysis.bind(this.ledger); }

  get totalCost(): number {
    return this.activePortfolio.reduce((s, p) => s + p.totalCost, 0);
  }

  startEdit(oreId: string, currentQty: number): void {
    this.editOreId = oreId;
    this.editValue = String(currentQty);
    this.notify();
  }

  confirmEdit(oreId: string): void {
    const newQty = parseInt(this.editValue, 10);
    if (!newQty || newQty < 0) {
      this.toast('Invalid quantity', 'error');
      return;
    }
    if (this.ledger.adjustQuantity(oreId, newQty)) {
      this.toast('Inventory updated', 'success');
    } else {
      this.toast('No change — quantity must be lower than current', 'error');
    }
    this.editOreId = null;
    this.editValue = '';
    this.notify();
  }

  cancelEdit(): void {
    this.editOreId = null;
    this.editValue = '';
    this.notify();
  }
}

export function PortfolioPage({ ledger }: PortfolioPageProps): JSX.Element {
  const toast = useToast();
  const [, forceUpdate] = useState(0);
  const notify = useCallback(() => forceUpdate(n => n + 1), []);

  const ctrl = useRef<PortfolioPageController>(null);
  if (!ctrl.current) {
    ctrl.current = new PortfolioPageController();
    ctrl.current.init(toast, notify);
  }
  ctrl.current.update(ledger);

  return (
    <PortfolioView
      summary={ctrl.current.summary}
      totalCost={ctrl.current.totalCost}
      activePortfolio={ctrl.current.activePortfolio}
      getOreCostAnalysis={ctrl.current.getOreCostAnalysis}
      editOreId={ctrl.current.editOreId}
      editValue={ctrl.current.editValue}
      onStartEdit={(id, q) => ctrl.current!.startEdit(id, q)}
      onConfirmEdit={(id) => ctrl.current!.confirmEdit(id)}
      onCancelEdit={() => ctrl.current!.cancelEdit()}
      onEditValueChange={(v) => { ctrl.current!.editValue = v; notify(); }}
    />
  );
}

/* ========================================
   NEW ENTRY PAGE
   ======================================== */

interface NewEntryPageProps {
  ledger: LedgerController;
  preselectedType?: TxType;
  onNavigate: (page: string, type?: string) => void;
  editTxId?: string;
}

class NewEntryPageController {
  private ledger!: LedgerController;
  private onNavigate!: (page: string, type?: string) => void;
  private toast!: ToastFn;
  private notify!: () => void;
  private editTxId: string | null = null;
  private _loadedEditTxId: string | null = null;

  /* -- form state -- */
  txType: TxType;
  saleSource: 'portfolio' | 'mined' = 'portfolio';
  formError: string = '';
  date: string;
  oreId: string = '';
  quantity: string = '';
  totalPrice: string = '';
  unitPrice: string = '';
  description: string = '';
  newBalance: string = '';
  note: string = '';

  constructor() {
    this.txType = 'buy';
    this.date = new Date().toISOString().split('T')[0];
  }

  init(toast: ToastFn, notify: () => void): void {
    this.toast = toast;
    this.notify = notify;
  }

  update(ledger: LedgerController, onNavigate: (page: string, type?: string) => void, preselectedType?: TxType, editTx?: Transaction): void {
    this.ledger = ledger;
    this.onNavigate = onNavigate;

    if (editTx && editTx.id !== this._loadedEditTxId) {
      this._loadTransaction(editTx);
      this._loadedEditTxId = editTx.id;
    }

    if (preselectedType && preselectedType !== this.txType) {
      this._setTxTypeInternal(preselectedType);
    }
  }

  private _loadTransaction(tx: Transaction): void {
    // Convert legacy mine_sell to sell+mined since Mine Sale is removed from creation UI
    const normalizedType = tx.type === 'mine_sell' ? 'sell' : tx.type;
    const normalizedSource = tx.type === 'mine_sell' ? 'mined' : (tx.source || 'portfolio');
    this._setTxTypeInternal(normalizedType);
    this.editTxId = tx.id;
    this.date = tx.date;
    this.oreId = tx.asset || '';
    this.quantity = tx.quantity ? String(tx.quantity) : '';
    this.totalPrice = (normalizedType === 'buy' || normalizedType === 'sell') && tx.totalAmount ? String(Math.abs(tx.totalAmount)) : '';
    this.unitPrice = tx.unitPrice ? String(tx.unitPrice) : '';
    this.description = tx.description || '';
    this.newBalance = tx.newBalance ? String(tx.newBalance) : '';
    this.note = tx.note || '';
    this.saleSource = normalizedSource;
  }

  /* -- computed -- */

  get availableOres(): Ore[] {
    if (this.txType === 'sell') {
      if (this.saleSource === 'mined') return ORES;
      return ORES.filter(o => this.ledger.getOreHolding(o.id).quantity > 0);
    }
    return ORES;
  }

  get groupedOres(): Record<string, Ore[]> {
    const groups: Record<string, Ore[]> = { shallow: [], deep: [], nether: [] };
    this.availableOres.forEach(o => {
      if (groups[o.category]) groups[o.category].push(o);
    });
    return groups;
  }

  get currentHolding(): PortfolioEntry {
    return this.ledger.getOreHolding(this.oreId);
  }

  get costAnalysis(): OreCostAnalysis {
    return this.ledger.getOreCostAnalysis(this.oreId);
  }

  get calculatedTotal(): number {
    const tp = parseFloat(this.totalPrice) || 0;
    return this.txType === 'buy' ? -tp : tp;
  }

  get avgUnitPrice(): number | null {
    const q = parseFloat(this.quantity) || 0;
    const tp = parseFloat(this.totalPrice) || 0;
    if (!q || !tp) return null;
    return tp / q;
  }

  get adjustmentDelta(): number | null {
    if (this.txType !== 'balance_adjust') return null;
    const nb = parseFloat(this.newBalance);
    if (isNaN(nb)) return null;
    return nb - this.ledger.summary.cash;
  }

  get estimatedProfit(): number | null {
    if (this.txType !== 'sell' || !this.oreId || !this.quantity) return null;
    const q = parseFloat(this.quantity) || 0;
    const m = parseFloat(this.totalPrice) || 0;
    if (!m) return null;
    const p = m / q;
    if (this.saleSource === 'mined') return m;
    const holding = this.currentHolding;
    const portfolioQty = Math.min(q, holding.quantity);
    const minedQty = q - portfolioQty;
    let profit = 0;
    if (portfolioQty > 0) profit += portfolioQty * p - portfolioQty * holding.avgCost;
    if (minedQty > 0) profit += minedQty * p;
    return profit;
  }

  /* -- actions -- */

  setTxType(type: TxType): void {
    this._setTxTypeInternal(type);
    this.notify();
  }

  private _setTxTypeInternal(type: TxType): void {
    this.txType = type;
    this.oreId = '';
    this.quantity = '';
    this.totalPrice = '';
    this.unitPrice = '';
    this.description = '';
    this.newBalance = '';
    this.note = '';
    this.saleSource = 'portfolio';
  }

  handleSubmit(): void {
    this.formError = '';

    if (!this.date) { this.formError = 'Date is required'; this.notify(); return; }

    const q = parseInt(this.quantity, 10);
    const tp = parseFloat(this.totalPrice);
    const ep = parseFloat(this.unitPrice);  // expense amount

    // In edit mode: delete old first so portfolio state is correct for all subsequent calculations
    const wasEditing = !!this.editTxId;
    if (this.editTxId) {
      this.ledger.deleteTransaction(this.editTxId);
      this.editTxId = null;
    }

    if (this.txType === 'buy' || this.txType === 'sell') {
      if (!this.oreId) { this.formError = 'Please select an ore'; this.notify(); return; }
      if (!q || q <= 0) { this.formError = 'Quantity must be greater than 0'; this.notify(); return; }
      if (!tp || tp <= 0) { this.formError = 'Total price must be greater than 0'; this.notify(); return; }

      if (this.txType === 'sell' && this.saleSource === 'portfolio') {
        const holding = this.ledger.getOreHolding(this.oreId);
        const portfolioQty = Math.min(q, holding.quantity);
        const minedQty = q - portfolioQty;
        const unitP = tp / q;

        if (minedQty > 0) {
          if (portfolioQty > 0) {
            const txPortfolio = {
              type: 'sell' as TxType,
              date: this.date,
              asset: this.oreId,
              quantity: portfolioQty,
              unitPrice: unitP,
              totalAmount: portfolioQty * unitP,
              note: this.note.trim() || undefined,
              source: 'portfolio' as const,
            };
            if (this.ledger.addTransaction(txPortfolio) === false) {
              this.formError = 'Failed to record portfolio sale';
              this.notify();
              return;
            }
          }
          const txMined = {
            type: 'sell' as TxType,
            date: this.date,
            asset: this.oreId,
            quantity: minedQty,
            unitPrice: unitP,
            totalAmount: minedQty * unitP,
            note: this.note.trim() || undefined,
            source: 'mined' as const,
          };
          this.ledger.addTransaction(txMined);

          this.toast(wasEditing ? 'Transaction updated' : `Sold ${portfolioQty} from portfolio + ${minedQty} from mining`, 'success');
          this._resetForm();
          this.notify();
          setTimeout(() => this.onNavigate('transactions'), 1000);
          return;
        }
      }
    } else if (this.txType === 'expense') {
      if (!this.description.trim()) { this.formError = 'Description is required'; this.notify(); return; }
      if (!ep || ep <= 0) { this.formError = 'Amount must be greater than 0'; this.notify(); return; }
    } else if (this.txType === 'balance_adjust') {
      const nb = parseFloat(this.newBalance);
      if (isNaN(nb) || nb < 0) { this.formError = 'Please enter a valid cash balance'; this.notify(); return; }
    }

    const unitP = tp > 0 ? tp / q : 0;
    let totalAmount = 0;
    switch (this.txType) {
      case 'buy': totalAmount = -tp; break;
      case 'sell': totalAmount = tp; break;
      case 'expense': totalAmount = -Math.abs(ep); break;
      case 'balance_adjust': totalAmount = 0; break;
    }

    const tx = {
      type: this.txType,
      date: this.date,
      asset: (this.txType === 'buy' || this.txType === 'sell') ? this.oreId : undefined,
      quantity: (this.txType === 'buy' || this.txType === 'sell') ? q : undefined,
      unitPrice: (this.txType === 'buy' || this.txType === 'sell') ? unitP : (this.txType === 'expense' ? ep : undefined),
      totalAmount: this.txType === 'balance_adjust' ? 0 : totalAmount,
      newBalance: this.txType === 'balance_adjust' ? parseFloat(this.newBalance) : undefined,
      description: this.txType === 'expense' ? this.description.trim() : undefined,
      note: this.note.trim() || undefined,
      source: this.txType === 'sell' ? this.saleSource : undefined,
    };

    if (this.ledger.addTransaction(tx) === false) {
      this.formError = 'Failed to record transaction. Check portfolio holdings.';
      this.notify();
      return;
    }

    this.toast(wasEditing ? 'Transaction updated' : 'Transaction recorded successfully', 'success');
    this._resetForm();
    this.notify();
    setTimeout(() => this.onNavigate('transactions'), 1000);
  }

  private _resetForm(): void {
    this.editTxId = null;
    this._loadedEditTxId = null;
    this.oreId = '';
    this.quantity = '';
    this.totalPrice = '';
    this.unitPrice = '';
    this.description = '';
    this.newBalance = '';
    this.note = '';
    this.formError = '';
    this.date = new Date().toISOString().split('T')[0];
  }
}

export function NewEntryPage({ ledger, preselectedType, onNavigate, editTxId }: NewEntryPageProps): JSX.Element {
  const toast = useToast();
  const [, forceUpdate] = useState(0);
  const notify = useCallback(() => forceUpdate(n => n + 1), []);

  const ctrl = useRef<NewEntryPageController>(null);
  if (!ctrl.current) {
    ctrl.current = new NewEntryPageController();
    ctrl.current.init(toast, notify);
  }

  const editTx = editTxId ? ledger.transactions.find(t => t.id === editTxId) : undefined;
  ctrl.current.update(ledger, onNavigate, preselectedType, editTx);

  return (
    <NewEntryView
      isEditing={!!editTx}
      txType={ctrl.current.txType}
      onTxTypeChange={(type) => ctrl.current!.setTxType(type)}
      saleSource={ctrl.current.saleSource}
      onSaleSourceChange={(s) => { ctrl.current!.saleSource = s; notify(); }}
      date={ctrl.current.date}
      onDateChange={(d) => { ctrl.current!.date = d; notify(); }}
      oreId={ctrl.current.oreId}
      onOreIdChange={(id) => { ctrl.current!.oreId = id; notify(); }}
      quantity={ctrl.current.quantity}
      onQuantityChange={(v) => { ctrl.current!.quantity = v; notify(); }}
      totalPrice={ctrl.current.totalPrice}
      onTotalPriceChange={(v) => { ctrl.current!.totalPrice = v; notify(); }}
      unitPrice={ctrl.current.unitPrice}
      onUnitPriceChange={(v) => { ctrl.current!.unitPrice = v; notify(); }}
      avgUnitPrice={ctrl.current.avgUnitPrice}
      description={ctrl.current.description}
      onDescriptionChange={(v) => { ctrl.current!.description = v; notify(); }}
      newBalance={ctrl.current.newBalance}
      onNewBalanceChange={(v) => { ctrl.current!.newBalance = v; notify(); }}
      note={ctrl.current.note}
      onNoteChange={(v) => { ctrl.current!.note = v; notify(); }}
      formError={ctrl.current.formError}
      calculatedTotal={ctrl.current.calculatedTotal}
      adjustmentDelta={ctrl.current.adjustmentDelta}
      estimatedProfit={ctrl.current.estimatedProfit}
      availableOres={ctrl.current.availableOres}
      groupedOres={ctrl.current.groupedOres}
      currentHolding={ctrl.current.currentHolding}
      costAnalysis={ctrl.current.costAnalysis}
      onSubmit={() => ctrl.current!.handleSubmit()}
      currentCash={ledger.summary.cash}
    />
  );
}
