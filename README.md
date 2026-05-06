# Ore Ledger

A Minecraft ore stock market bookkeeping app — track your virtual ore trading portfolio, mining income, and expenses in a clean, Claude-inspired dark/light UI.

> Built with React 18 + Babel standalone — no build step required.

## Features

- **Dashboard** — At-a-glance overview of cash balance, speculative P&L, mining income, and portfolio value
- **Transactions** — Full history with type filters (buy/sell/mine sale/expense/adjust)
- **Portfolio** — Holdings table with average cost basis, current value, and unrealized P&L
- **New Entry** — Record buys, sells, mining sales, expenses, and balance adjustments
- **Dark/Light Theme** — Toggle via sidebar; preference saved to localStorage
- **Data Persistence** — All data saved to localStorage automatically
- **Export/Clear** — Export your data as JSON or reset everything

## Quick Start

```bash
npm run serve
```

Or with any static HTTP server:

```bash
python -m http.server 3000
# or
npx serve .
```

Open `http://localhost:3000` in your browser.

> **Note:** The app uses Babel standalone to transpile JSX in the browser. Opening `Ore Ledger.html` directly via `file://` may not work due to browser fetch restrictions — use a local server.

## Project Structure

```
ore_ledger/
├── Ore Ledger.html         # Entry point — loads all modules
├── styles.css              # All CSS (dark/light theme, layout, animations)
├── src/
│   ├── data.js             # Constants: ore types, transaction config, ID generator
│   ├── storage.js          # localStorage read/write, import/export
│   ├── engine.js           # Business logic: buy/sell/expense/adjust processing
│   ├── utils.js            # Formatters, toast notification system, useLedger hook
│   ├── components.js       # Reusable UI components (Sidebar, TopBar, cards, etc.)
│   ├── pages.js            # Page-level components (Dashboard, Transactions, etc.)
│   └── app.js              # App shell + ReactDOM mount
└── package.json
```

Scripts are loaded as `<script type="text/babel" src="...">` in dependency order. Each file defines its exports in the global scope for the next file to consume.

## Ore Types

16 ores across 3 categories:

| Category | Ores |
|---|---|
| Shallow | Coal, Copper, Iron, Diamond, Emerald, Redstone, Lapis Lazuli |
| Deep | Coal, Copper, Iron, Diamond, Emerald, Redstone, Lapis Lazuli |
| Nether | Quartz, Gold Ore |

## Transaction Types

| Type | Description | Cash Impact |
|---|---|---|
| Buy | Purchase ore for portfolio | Decrease |
| Sell | Sell ore from portfolio or mined | Increase |
| Mine Sale | Direct mining income (no cost basis) | Increase |
| Expense | Record spending | Decrease |
| Adjust | Calibrate cash balance to actual amount | Variable |

## Tech Stack

- [React 18](https://reactjs.org/) — UI framework (CDN, UMD build)
- [Babel Standalone](https://babeljs.io/docs/babel-standalone) — In-browser JSX transpilation
- [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) + [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display) — Typography
- OKLCH color space — Theme variables

## License

MIT
