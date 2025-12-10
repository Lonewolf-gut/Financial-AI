import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Save, Edit2, AlertCircle, CheckCircle, Wallet, TrendingDown, Target, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { generateBudgetPlan } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  currency: string;
}

const BudgetStatement: React.FC<Props> = ({ transactions, currency }) => {
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Load budgets from local storage
  useEffect(() => {
    const userSession = localStorage.getItem('elag_session');
    if (userSession) {
      const user = JSON.parse(userSession);
      const storedBudgets = localStorage.getItem(`elag_budgets_${user.id}`);
      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      } else {
        // Default budgets for common categories
        setBudgets({
          'Food & Drink': 500,
          'Groceries': 400,
          'Transport': 200,
          'Utilities': 300,
          'Entertainment': 150,
          'Shopping': 200,
          'Rent/Mortgage': 1500
        });
      }
    }
  }, []);

  // Save budgets
  const saveBudget = (category: string, amount: number) => {
    const newBudgets = { ...budgets, [category]: amount };
    updateBudgets(newBudgets);
    setIsEditing(null);
  };
  
  const updateBudgets = (newBudgets: Record<string, number>) => {
    setBudgets(newBudgets);
    const userSession = localStorage.getItem('elag_session');
    if (userSession) {
      const user = JSON.parse(userSession);
      localStorage.setItem(`elag_budgets_${user.id}`, JSON.stringify(newBudgets));
    }
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    try {
        const generated = await generateBudgetPlan(transactions, currency);
        updateBudgets({...budgets, ...generated});
    } catch (e) {
        console.error("AI Budget Failed");
    } finally {
        setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  // Calculate stats
  const stats = useMemo(() => {
    // Robust date filtering: compare YYYY-MM strings to avoid timezone offsets
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0'); // 01 to 12
    const currentMonthPrefix = `${year}-${month}`;

    const monthlyTransactions = transactions.filter(t => {
      // Transaction date is YYYY-MM-DD
      return t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthPrefix);
    });

    const spendingByCategory: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
    });

    // Merge categories from transactions and defined budgets
    const allCategories = Array.from(new Set([
      ...Object.keys(budgets),
      ...Object.keys(spendingByCategory)
    ])).sort();

    const categoryStats = allCategories.map(cat => {
      const spent = spendingByCategory[cat] || 0;
      const budget = budgets[cat] || 0;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0;
      
      return { category: cat, spent, budget, remaining, percentage };
    });

    const totalBudget = categoryStats.reduce((acc, curr) => acc + curr.budget, 0);
    const totalSpent = categoryStats.reduce((acc, curr) => acc + curr.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return { categoryStats, totalBudget, totalSpent, totalRemaining, totalPercentage };
  }, [transactions, budgets, currentMonth]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500 text-red-500';
    if (percentage >= 80) return 'bg-orange-400 text-orange-400';
    return 'bg-emerald-500 text-emerald-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month Selector & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Target className="text-indigo-500" /> Monthly Budget Statement
           </h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">
             {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
           </p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-md disabled:opacity-70"
            >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                <span>AI Budget Generator</span>
            </button>

            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300"
            >
                ←
            </button>
            <span className="px-4 py-1 font-medium text-slate-800 dark:text-white">
                {currentMonth.toLocaleDateString(undefined, { month: 'long' })}
            </span>
            <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300"
            >
                →
            </button>
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Budget</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(stats.totalBudget)}</h3>
                </div>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                    <Wallet className="text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Spent</p>
                    <h3 className={`text-2xl font-bold ${stats.totalSpent > stats.totalBudget ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                        {formatCurrency(stats.totalSpent)}
                    </h3>
                </div>
                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <TrendingDown className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${getStatusColor(stats.totalPercentage).split(' ')[0]}`} 
                    style={{ width: `${Math.min(stats.totalPercentage, 100)}%` }}
                ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">{stats.totalPercentage.toFixed(1)}% used</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Remaining</p>
                    <h3 className={`text-2xl font-bold ${stats.totalRemaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {formatCurrency(stats.totalRemaining)}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg ${stats.totalRemaining < 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                    {stats.totalRemaining < 0 
                        ? <AlertTriangle className="text-red-500" size={20} />
                        : <CheckCircle className="text-emerald-500" size={20} />
                    }
                </div>
            </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {stats.totalRemaining >= 0 ? "You are within budget." : "You have exceeded your budget."}
             </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white">Category Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {stats.categoryStats.map((stat) => (
                <div key={stat.category} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(stat.percentage).split(' ')[0]}`}></div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{stat.category}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                                <span className="text-slate-500 dark:text-slate-400 block text-xs">Spent</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(stat.spent)}</span>
                            </div>
                            
                            <div className="text-right">
                                <span className="text-slate-500 dark:text-slate-400 block text-xs">Budget</span>
                                {isEditing === stat.category ? (
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            className="w-20 p-1 text-right text-sm border rounded bg-slate-50 dark:bg-slate-800 border-indigo-500 outline-none text-slate-800 dark:text-white"
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveBudget(stat.category, Number(editValue));
                                                if (e.key === 'Escape') setIsEditing(null);
                                            }}
                                            onBlur={() => {
                                                // Optional: save on blur or cancel
                                                // setIsEditing(null);
                                            }}
                                        />
                                        <button onClick={() => saveBudget(stat.category, Number(editValue))} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded">
                                            <Save size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 justify-end group cursor-pointer" onClick={() => { setIsEditing(stat.category); setEditValue(stat.budget.toString()); }}>
                                        <span className="font-semibold text-slate-800 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400">{formatCurrency(stat.budget)}</span>
                                        <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getStatusColor(stat.percentage).split(' ')[0]}`}
                            style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                        <span className="text-slate-400">{stat.percentage.toFixed(0)}%</span>
                        <span className={`${stat.remaining < 0 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            {stat.remaining < 0 ? `Over by ${formatCurrency(Math.abs(stat.remaining))}` : `${formatCurrency(stat.remaining)} left`}
                        </span>
                    </div>
                </div>
            ))}
            
            {stats.categoryStats.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                    No transactions found for this month.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BudgetStatement;