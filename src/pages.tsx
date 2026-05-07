import { useState, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { useToast } from './utils';
import type { ToastFn, OreCostAnalysis, LedgerController } from './utils';
import { ORES } from './data';
import type { Ore, TxType, PortfolioEntry } from './data';
import { DashboardView, TransactionsView, PortfolioView, NewEntryView } from './components';

/* ========================================
   DASHBOARD PAGE
   ======================================== */

interface DashboardPageProps {
  ledger: LedgerController;
  onNavigate: (page: string, type?: string) => void;
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

  navigate(page: string, type?: string): void { this.onNavigate(page, type); }
}

export function DashboardPage({ ledger, onNavigate }: DashboardPageProps): JSX.Element {
  const ctrl = useRef(new DashboardPageController()).current;
  ctrl.update(ledger, onNavigate);

  return (
    <DashboardView
      summary={ctrl.summary}
      recentTransactions={ctrl.recentTransactions}
      onNavigate={(p, t) => ctrl.navigate(p, t)}
      deleteTransaction={ctrl.deleteTransaction}
    />
  );
}

/* ========================================
   TRANSACTIONS PAGE
   ======================================== */

interface TransactionsPageProps {
  ledger: LedgerController;
  onNavigate: (page: string, type?: string) => void;
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

export function TransactionsPage({ ledger, onNavigate }: TransactionsPageProps): JSX.Element {
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
}

class NewEntryPageController {
  private ledger!: LedgerController;
  private onNavigate!: (page: string, type?: string) => void;
  private toast!: ToastFn;
  private notify!: () => void;

  /* -- form state -- */
  txType: TxType;
  saleSource: 'portfolio' | 'mined' = 'portfolio';
  formError: string = '';
  date: string;
  oreId: string = '';
  quantity: string = '';
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

  update(ledger: LedgerController, onNavigate: (page: string, type?: string) => void, preselectedType?: TxType): void {
    this.ledger = ledger;
    this.onNavigate = onNavigate;
    if (preselectedType && preselectedType !== this.txType) {
      this._setTxTypeInternal(preselectedType);
    }
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
    const q = parseFloat(this.quantity) || 0;
    const p = parseFloat(this.unitPrice) || 0;
    const total = q * p;
    return this.txType === 'buy' ? -total : total;
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
    const p = parseFloat(this.unitPrice) || 0;
    const received = q * p;
    if (this.saleSource === 'mined') return received;
    const cost = q * this.currentHolding.avgCost;
    return received - cost;
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
    const p = parseFloat(this.unitPrice);

    if (this.txType === 'buy' || this.txType === 'sell' || this.txType === 'mine_sell') {
      if (!this.oreId) { this.formError = 'Please select an ore'; this.notify(); return; }
      if (!q || q <= 0) { this.formError = 'Quantity must be greater than 0'; this.notify(); return; }
      if (!p || p <= 0) { this.formError = 'Unit price must be greater than 0'; this.notify(); return; }

      if (this.txType === 'sell' && this.saleSource === 'portfolio') {
        const holding = this.ledger.getOreHolding(this.oreId);
        if (q > holding.quantity) {
          this.formError = `Cannot sell ${q} units — only ${holding.quantity} held`;
          this.notify();
          return;
        }
      }
    } else if (this.txType === 'expense') {
      if (!this.description.trim()) { this.formError = 'Description is required'; this.notify(); return; }
      if (!p || p <= 0) { this.formError = 'Amount must be greater than 0'; this.notify(); return; }
    } else if (this.txType === 'balance_adjust') {
      const nb = parseFloat(this.newBalance);
      if (isNaN(nb) || nb < 0) { this.formError = 'Please enter a valid cash balance'; this.notify(); return; }
    }

    let totalAmount = 0;
    switch (this.txType) {
      case 'buy':          totalAmount = -(q * p); break;
      case 'sell':
      case 'mine_sell':    totalAmount = q * p; break;
      case 'expense':      totalAmount = -Math.abs(p); break;
      case 'balance_adjust': totalAmount = 0; break;
    }

    const tx = {
      type: this.txType,
      date: this.date,
      asset: (this.txType === 'buy' || this.txType === 'sell' || this.txType === 'mine_sell') ? this.oreId : undefined,
      quantity: (this.txType === 'buy' || this.txType === 'sell' || this.txType === 'mine_sell') ? q : undefined,
      unitPrice: (this.txType === 'buy' || this.txType === 'sell' || this.txType === 'mine_sell') ? p : (this.txType === 'expense' ? p : undefined),
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

    this.toast('Transaction recorded successfully', 'success');
    this._resetForm();
    this.notify();
    setTimeout(() => this.onNavigate('transactions'), 1000);
  }

  private _resetForm(): void {
    this.oreId = '';
    this.quantity = '';
    this.unitPrice = '';
    this.description = '';
    this.newBalance = '';
    this.note = '';
    this.formError = '';
    this.date = new Date().toISOString().split('T')[0];
  }
}

export function NewEntryPage({ ledger, preselectedType, onNavigate }: NewEntryPageProps): JSX.Element {
  const toast = useToast();
  const [, forceUpdate] = useState(0);
  const notify = useCallback(() => forceUpdate(n => n + 1), []);

  const ctrl = useRef<NewEntryPageController>(null);
  if (!ctrl.current) {
    ctrl.current = new NewEntryPageController();
    ctrl.current.init(toast, notify);
  }
  ctrl.current.update(ledger, onNavigate, preselectedType);

  return (
    <NewEntryView
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
      unitPrice={ctrl.current.unitPrice}
      onUnitPriceChange={(v) => { ctrl.current!.unitPrice = v; notify(); }}
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
