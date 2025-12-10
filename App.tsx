import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Receipt, MessageSquareText, Activity, Menu, X, Plus, List, Moon, Sun, LogOut, PieChart, Lightbulb, ShieldAlert, Briefcase } from 'lucide-react';
import { Transaction, TransactionType, AppView, User } from './types';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import AICoach from './components/AICoach';
import FinancialHealth from './components/FinancialHealth';
import TransactionsList from './components/TransactionsList';
import BudgetStatement from './components/BudgetStatement';
import SmartInsights from './components/SmartInsights';
import AnomalyDetector from './components/AnomalyDetector';
import CashFlowTimeline from './components/CashFlowTimeline';
import Auth from './components/Auth';
import { Logo } from './components/Logo';

// Seed Data for Demo (used if no data exists for user)
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2023-10-01', merchant: 'TechCorp Salary', amount: 4500, category: 'Income', type: TransactionType.INCOME },
  { id: '2', date: '2023-10-02', merchant: 'Starbucks', amount: 12.50, category: 'Food & Drink', type: TransactionType.EXPENSE },
  { id: '3', date: '2023-10-05', merchant: 'Whole Foods', amount: 145.20, category: 'Groceries', type: TransactionType.EXPENSE },
  { id: '4', date: '2023-10-08', merchant: 'Netflix', amount: 15.99, category: 'Entertainment', type: TransactionType.EXPENSE },
  { id: '5', date: '2023-10-10', merchant: 'Uber', amount: 24.00, category: 'Transport', type: TransactionType.EXPENSE },
  { id: '6', date: '2023-10-15', merchant: 'Electric Bill', amount: 120.00, category: 'Utilities', type: TransactionType.EXPENSE },
  { id: '7', date: '2023-10-20', merchant: 'Amazon', amount: 65.50, category: 'Shopping', type: TransactionType.EXPENSE },
  { id: '8', date: '2023-10-22', merchant: 'Local Bistro', amount: 85.00, category: 'Food & Drink', type: TransactionType.EXPENSE },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(false);
  
  // Currency State
  const [currency, setCurrency] = useState('USD');

  // 1. Check for active session on load
  useEffect(() => {
    const session = localStorage.getItem('elag_session');
    if (session) {
        setUser(JSON.parse(session));
    }
    setIsLoading(false);
  }, []);

  // 2. Load User Data when user state changes
  useEffect(() => {
    if (user) {
        const storedData = localStorage.getItem(`elag_transactions_${user.id}`);
        if (storedData) {
            setTransactions(JSON.parse(storedData));
        } else {
            setTransactions(INITIAL_TRANSACTIONS);
        }
    } else {
        setTransactions([]);
    }
  }, [user]);

  // 3. Save User Data whenever transactions change
  useEffect(() => {
    if (user && transactions.length > 0) {
        localStorage.setItem(`elag_transactions_${user.id}`, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  // Detect Currency on mount
  useEffect(() => {
     try {
         const locale = navigator.language || 'en-US';
         if (locale.includes('GB')) setCurrency('GBP');
         else if (locale.includes('EU') || locale.includes('DE') || locale.includes('FR') || locale.includes('ES') || locale.includes('IT')) setCurrency('EUR');
         else if (locale.includes('JP')) setCurrency('JPY');
         else if (locale.includes('IN')) setCurrency('INR');
         else if (locale.includes('CA')) setCurrency('CAD');
         else if (locale.includes('AU')) setCurrency('AUD');
     } catch (e) {
         console.warn("Could not detect currency automatically.");
     }
  }, []);

  // Apply Dark Mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('elag_session');
    setUser(null);
  };

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const currentBalance = useMemo(() => {
     const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
     const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
     return income - expense;
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        currentView === view
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  if (isLoading) return null;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-30 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <Logo className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">ELAG AI</h1>
          </div>

          <div className="mb-6 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
             <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Signed in as</p>
             <p className="font-semibold text-slate-800 dark:text-white truncate">{user.name}</p>
          </div>

          <nav className="space-y-1 flex-1">
            <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={AppView.INSIGHTS} icon={Lightbulb} label="Smart Insights" />
            <NavItem view={AppView.BUDGETS} icon={PieChart} label="Budget Statement" />
            <NavItem view={AppView.CASHFLOW} icon={Activity} label="Cash Flow Timeline" />
            <NavItem view={AppView.FORECAST} icon={Briefcase} label="Business Health" />
            <NavItem view={AppView.ANOMALIES} icon={ShieldAlert} label="Fraud Detector" />
            <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tools</p>
            </div>
            <NavItem view={AppView.TRANSACTIONS} icon={List} label="Transactions" />
            <NavItem view={AppView.RECEIPT_SCANNER} icon={Receipt} label="Scan / Camera" />
            <NavItem view={AppView.COACH} icon={MessageSquareText} label="ELAG Coach" />
          </nav>

          <div className="mt-6 space-y-4">
             <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
             >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
             </button>

             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
             >
                <LogOut size={20} />
                <span>Sign Out</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <Logo className="w-8 h-8" />
            <span>ELAG AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-slate-300">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 dark:text-slate-300">
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {currentView === AppView.DASHBOARD && 'Financial Overview'}
                        {currentView === AppView.TRANSACTIONS && 'Transaction History'}
                        {currentView === AppView.RECEIPT_SCANNER && 'Add Document or Photo'}
                        {currentView === AppView.COACH && 'Your ELAG AI Coach'}
                        {currentView === AppView.FORECAST && 'Business Health Score'}
                        {currentView === AppView.BUDGETS && 'Budget Generator'}
                        {currentView === AppView.INSIGHTS && 'AI Smart Insights'}
                        {currentView === AppView.ANOMALIES && 'Fraud & Anomaly Detector'}
                        {currentView === AppView.CASHFLOW && 'Cash Flow Predictions'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {currentView === AppView.DASHBOARD && 'Track your cash flow and spending patterns.'}
                        {currentView === AppView.TRANSACTIONS && 'Manage income and expenses manually.'}
                        {currentView === AppView.RECEIPT_SCANNER && 'Digitize receipts, PDFs, or take photos.'}
                        {currentView === AppView.COACH && 'Chat with ELAG to get personalized advice.'}
                        {currentView === AppView.FORECAST && 'Business health metrics and risk analysis.'}
                        {currentView === AppView.BUDGETS && 'Auto-generate budgets using AI.'}
                        {currentView === AppView.INSIGHTS && 'Discover patterns and savings opportunities.'}
                        {currentView === AppView.ANOMALIES && 'Identify suspicious activity.'}
                        {currentView === AppView.CASHFLOW && 'Project future balances.'}
                    </p>
                </div>
                
                {currentView !== AppView.RECEIPT_SCANNER && currentView !== AppView.TRANSACTIONS && (
                    <button 
                        onClick={() => setCurrentView(AppView.TRANSACTIONS)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} />
                        <span>Manage Transactions</span>
                    </button>
                )}
            </div>

            {/* View Content */}
            <div className="min-h-[500px]">
                {currentView === AppView.DASHBOARD && <Dashboard transactions={transactions} currency={currency} />}
                {currentView === AppView.TRANSACTIONS && <TransactionsList transactions={transactions} currency={currency} onAdd={addTransaction} onDelete={deleteTransaction} />}
                {currentView === AppView.RECEIPT_SCANNER && <Scanner onAddTransaction={addTransaction} />}
                {currentView === AppView.COACH && <AICoach transactions={transactions} currency={currency} />}
                {currentView === AppView.FORECAST && <FinancialHealth transactions={transactions} currency={currency} />}
                {currentView === AppView.BUDGETS && <BudgetStatement transactions={transactions} currency={currency} />}
                {currentView === AppView.INSIGHTS && <SmartInsights transactions={transactions} currency={currency} />}
                {currentView === AppView.ANOMALIES && <AnomalyDetector transactions={transactions} currency={currency} />}
                {currentView === AppView.CASHFLOW && <CashFlowTimeline transactions={transactions} currency={currency} />}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;