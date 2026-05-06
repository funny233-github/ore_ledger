/* ====================================================
   BUSINESS LOGIC ENGINE
   ==================================================== */

const r2 = (n) => Math.round(n * 100) / 100;

const LedgerEngine = {
  /** Process a buy transaction and return updated state */
  processBuy(state, tx) {
    const s = structuredClone(state);
    const assetId = tx.asset;
    const qty = tx.quantity;
    const totalPaid = Math.abs(tx.totalAmount); // totalAmount is negative

    // Initialize portfolio entry if needed
    if (!s.portfolio[assetId]) {
      s.portfolio[assetId] = { quantity: 0, totalCost: 0, avgCost: 0 };
    }

    const p = s.portfolio[assetId];
    p.quantity += qty;
    p.totalCost += totalPaid;
    p.avgCost = r2(p.totalCost / p.quantity);

    s.cash -= totalPaid;
    s.transactions.push({ ...tx, id: generateId(), createdAt: Date.now() });

    return s;
  },

  /** Process a sell transaction and return updated state */
  processSell(state, tx) {
    const s = structuredClone(state);
    const assetId = tx.asset;
    const qty = tx.quantity;
    const received = tx.totalAmount; // positive
    const source = tx.source || 'portfolio';

    // Mined ore sell: no portfolio impact, pure income
    if (source === 'mined') {
      s.cash += received;
      s.metadata.totalMiningIncome += received;
      s.transactions.push({
        ...tx,
        id: generateId(),
        createdAt: Date.now(),
        profit: received, // full amount is profit (mined, no cost basis)
        source: 'mined',
      });
      return s;
    }

    // Portfolio sell: existing speculative logic
    const p = s.portfolio[assetId];
    if (!p || p.quantity < qty) {
      return { error: `Insufficient holdings: have ${p?.quantity || 0}, trying to sell ${qty}` };
    }

    const avgCostBefore = p.avgCost;
    const costOfSold = r2(qty * avgCostBefore);
    const profit = r2(received - costOfSold);

    p.quantity -= qty;
    p.totalCost = r2(p.totalCost - costOfSold);
    if (p.quantity <= 0) {
      p.quantity = 0;
      p.totalCost = 0;
      p.avgCost = 0;
    } else {
      p.avgCost = r2(p.totalCost / p.quantity);
    }

    s.cash += received;
    s.metadata.totalSpeculativeProfit += profit;

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
      profit: profit,
      avgCostAtSale: avgCostBefore,
      costOfSold: costOfSold,
      source: 'portfolio',
    });

    return s;
  },

  /** Process a mine_sell transaction (no portfolio impact) */
  processMineSell(state, tx) {
    const s = structuredClone(state);
    const received = tx.totalAmount; // positive

    s.cash += received;
    s.metadata.totalMiningIncome += received;

    s.transactions.push({ ...tx, id: generateId(), createdAt: Date.now() });

    return s;
  },

  /** Process an expense transaction */
  processExpense(state, tx) {
    const s = structuredClone(state);
    const spent = Math.abs(tx.totalAmount); // totalAmount is negative

    s.cash -= spent;
    s.metadata.totalExpenses += spent;

    s.transactions.push({ ...tx, id: generateId(), createdAt: Date.now() });

    return s;
  },

  /** Process a balance adjustment */
  processBalanceAdjust(state, tx) {
    const s = structuredClone(state);
    const newBalance = tx.newBalance;
    const adjustment = r2(newBalance - s.cash);

    s.cash = newBalance;
    s.metadata.totalAdjustments += adjustment;

    s.transactions.push({
      ...tx,
      id: generateId(),
      createdAt: Date.now(),
      adjustment: adjustment,
      previousBalance: s.cash - adjustment, // will be overwritten by next line but we fix below
    });

    // Fix: compute previous before modifying
    const txIdx = s.transactions.length - 1;
    s.transactions[txIdx].previousBalance = r2(newBalance - adjustment);

    return s;
  },

  /** Compute summary statistics from current state */
  computeSummary(state) {
    const s = state;
    let portfolioValue = 0;
    let totalHoldings = 0;

    Object.entries(s.portfolio).forEach(([id, p]) => {
      if (p.quantity > 0) {
        totalHoldings += p.quantity;
        portfolioValue += r2(p.quantity * p.avgCost);
      }
    });

    return {
      cash: s.cash,
      speculativeProfit: r2(s.metadata.totalSpeculativeProfit),
      miningIncome: r2(s.metadata.totalMiningIncome),
      totalExpenses: r2(s.metadata.totalExpenses),
      totalAdjustments: r2(s.metadata.totalAdjustments),
      portfolioValue: r2(portfolioValue),
      totalHoldings,
      unrealizedPnL: r2(portfolioValue - Object.values(s.portfolio).reduce((sum, p) => sum + p.totalCost, 0)),
    };
  },

  /** Process a transaction: automatically detect type and route */
  process(state, tx) {
    switch (tx.type) {
      case 'buy':           return this.processBuy(state, tx);
      case 'sell':          return this.processSell(state, tx);
      case 'mine_sell':     return this.processMineSell(state, tx);
      case 'expense':       return this.processExpense(state, tx);
      case 'balance_adjust': return this.processBalanceAdjust(state, tx);
      default:              return { error: `Unknown transaction type: ${tx.type}` };
    }
  },
};
