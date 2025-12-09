import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  currency: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, currency }) => {
  
  // Format helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  // Compact format for charts
  const formatCompact = (amount: number) => {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: currency,
      notation: "compact", 
      compactDisplay: "short" 
    }).format(amount);
  };

  // Memoized calculations for performance
  const summary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categories: Record<string, number> = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.keys(categories).map((key, index) => ({
      name: key,
      value: categories[key],
      color: COLORS[index % COLORS.length]
    }));
  }, [transactions]);

  const monthlyFlow = useMemo(() => {
    const flow: Record<string, { income: number; expense: number }> = {};
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(t => {
      const date = t.date; 
      if (!flow[date]) flow[date] = { income: 0, expense: 0 };
      if (t.type === TransactionType.INCOME) flow[date].income += t.amount;
      else flow[date].expense += t.amount;
    });

    return Object.keys(flow).map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Income: flow[date].income,
      Expense: flow[date].expense
    }));
  }, [transactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Balance</p>
            <h3 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>
                {formatCurrency(summary.balance)}
            </h3>
          </div>
          <div className={`p-3 rounded-full ${summary.balance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Income</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(summary.totalIncome)}</h3>
          </div>
          <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</p>
            <h3 className="text-2xl font-bold text-red-500 dark:text-red-400">-{formatCurrency(summary.totalExpense)}</h3>
          </div>
          <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cash Flow */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" /> Cash Flow
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={formatCompact} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Spending Breakdown</h4>
          <div className="h-64 flex flex-col md:flex-row items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {categoryData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                        <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;