import { useState, useCallback, useMemo, useEffect } from 'react';
import type { JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { useLedger, NAV_ITEMS, ToastProvider } from './utils';
import type { NavItem } from './utils';
import type { TxType } from './data';
import { Storage } from './storage';
import { Sidebar, TopBar } from './components';
import { DashboardPage, TransactionsPage, PortfolioPage, NewEntryPage } from './pages';

/* ====================================================
   APP COMPONENT
   ==================================================== */

function App(): JSX.Element {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [preselectedType, setPreselectedType] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem('ore_ledger_theme') || 'dark'; }
    catch { return 'dark'; }
  });
  const ledger = useLedger();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('ore_ledger_theme', theme); }
    catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleNavigate = useCallback((page: string, type?: string) => {
    setPreselectedType(type || null);
    setActiveNav(page);
  }, []);

  const handleExport = useCallback(() => {
    const json = Storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ore_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear ALL data? This cannot be undone.')) {
      Storage.clearAll();
      window.location.reload();
    }
  }, []);

  const pageTitle = useMemo(() => {
    const item = NAV_ITEMS.find((n: NavItem) => n.id === activeNav);
    return item ? item.label : 'Dashboard';
  }, [activeNav]);

  const renderPage = (): JSX.Element => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardPage ledger={ledger} onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionsPage ledger={ledger} onNavigate={handleNavigate} />;
      case 'portfolio':
        return <PortfolioPage ledger={ledger} />;
      case 'new-entry':
        return <NewEntryPage ledger={ledger} preselectedType={(preselectedType ?? undefined) as TxType | undefined} onNavigate={handleNavigate} />;
      default:
        return <DashboardPage ledger={ledger} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeNav={activeNav} onNavChange={(page: string) => handleNavigate(page)} onExport={handleExport} onClear={handleClear} theme={theme} onToggleTheme={toggleTheme} />
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar title={pageTitle} cashBalance={ledger.summary.cash} />
        {renderPage()}
      </div>
    </div>
  );
}

/* ====================================================
   MOUNT
   ==================================================== */

const root = createRoot(document.getElementById('root')!);
root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
