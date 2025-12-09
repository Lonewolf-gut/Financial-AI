import React, { useState } from 'react';
import { LayoutDashboard, Wallet, Receipt, MessageSquareText, Activity, Menu, X, Plus } from 'lucide-react';
import { Transaction, TransactionType, AppView } from './types';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import AICoach from './components/AICoach';
import FinancialHealth from './components/FinancialHealth';

// Seed Data for Demo
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
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
    setCurrentView(AppView.DASHBOARD);
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
          : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 text-indigo-700">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Wallet className="text-white" size={18}/>
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinPath AI</h1>
          </div>

          <nav className="space-y-2">
            <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={AppView.FORECAST} icon={Activity} label="Risk Forecast" />
            <NavItem view={AppView.RECEIPT_SCANNER} icon={Receipt} label="Scan Receipt" />
            <NavItem view={AppView.COACH} icon={MessageSquareText} label="AI Coach" />
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
             <div className="bg-slate-900 rounded-xl p-4 text-white">
                <p className="text-xs text-slate-400 mb-1">Current Balance</p>
                <p className="text-xl font-bold">$3,425.80</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                    <Activity size={12} />
                    <span>+12% this month</span>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Wallet className="text-indigo-600" size={24} />
            <span>FinPath</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {currentView === AppView.DASHBOARD && 'Financial Overview'}
                        {currentView === AppView.RECEIPT_SCANNER && 'Upload Receipt'}
                        {currentView === AppView.COACH && 'Your AI Financial Coach'}
                        {currentView === AppView.FORECAST && 'Predictive Health Check'}
                    </h2>
                    <p className="text-slate-500">
                        {currentView === AppView.DASHBOARD && 'Track your cash flow and spending patterns.'}
                        {currentView === AppView.RECEIPT_SCANNER && 'Digitize your paper trail instantly.'}
                        {currentView === AppView.COACH && 'Chat with Fin to get personalized advice.'}
                        {currentView === AppView.FORECAST && 'Identify risks before they become problems.'}
                    </p>
                </div>
                
                {currentView !== AppView.RECEIPT_SCANNER && (
                    <button 
                        onClick={() => setCurrentView(AppView.RECEIPT_SCANNER)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} />
                        <span>Add Transaction</span>
                    </button>
                )}
            </div>

            {/* View Content */}
            <div className="min-h-[500px]">
                {currentView === AppView.DASHBOARD && <Dashboard transactions={transactions} />}
                {currentView === AppView.RECEIPT_SCANNER && <Scanner onAddTransaction={addTransaction} />}
                {currentView === AppView.COACH && <AICoach transactions={transactions} />}
                {currentView === AppView.FORECAST && <FinancialHealth transactions={transactions} />}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;