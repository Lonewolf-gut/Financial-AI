import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, Plus, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  currency: string;
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionsList: React.FC<Props> = ({ transactions, currency, onAdd, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    merchant: '',
    category: 'General'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount) return;
    
    onAdd({
      id: crypto.randomUUID(),
      merchant: formData.merchant,
      amount: Number(formData.amount),
      date: formData.date || new Date().toISOString().split('T')[0],
      category: formData.category || 'General',
      type: formData.type || TransactionType.EXPENSE,
      description: 'Manual Entry'
    });
    
    // Reset form
    setFormData({
       type: TransactionType.EXPENSE,
       date: new Date().toISOString().split('T')[0],
       amount: 0,
       merchant: '',
       category: 'General'
    });
    setShowAddForm(false);
  };

  const filteredTransactions = transactions
    .filter(t => activeTab === 'ALL' || t.type === activeTab)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
             >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
             </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
           {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Manual</>}
        </button>
      </div>

      {/* Manual Entry Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div className="col-span-full mb-2">
              <h3 className="font-semibold text-slate-800 dark:text-white">Add New Transaction</h3>
           </div>
           
           <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                 <option value={TransactionType.EXPENSE}>Expense</option>
                 <option value={TransactionType.INCOME}>Income</option>
              </select>
           </div>

           <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount</label>
              <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">{currency === 'USD' ? '$' : currency}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full pl-8 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
              </div>
           </div>

           <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
           </div>

           <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Merchant / Source</label>
              <input 
                type="text"
                required
                placeholder="e.g. Salary, Starbucks"
                value={formData.merchant}
                onChange={e => setFormData({...formData, merchant: e.target.value})}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
           </div>

           <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <input 
                type="text"
                placeholder="e.g. Food, Salary"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
           </div>

           <div className="flex items-end">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-medium">
                  Save Transaction
              </button>
           </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         {filteredTransactions.length === 0 ? (
             <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                 <p>No transactions found.</p>
             </div>
         ) : (
            <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm">
                         <th className="p-4 font-medium">Date</th>
                         <th className="p-4 font-medium">Merchant/Source</th>
                         <th className="p-4 font-medium">Category</th>
                         <th className="p-4 font-medium text-right">Amount</th>
                         <th className="p-4 font-medium text-center">Action</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {filteredTransactions.map(t => (
                         <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                             <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.date}</td>
                             <td className="p-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                                 {t.type === TransactionType.INCOME 
                                    ? <ArrowUpCircle size={16} className="text-emerald-500" /> 
                                    : <ArrowDownCircle size={16} className="text-red-500" />
                                 }
                                 {t.merchant}
                             </td>
                             <td className="p-4">
                                 <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                     {t.category}
                                 </span>
                             </td>
                             <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                 {t.type === TransactionType.INCOME ? '+' : '-'}{currency} {t.amount.toFixed(2)}
                             </td>
                             <td className="p-4 text-center">
                                 <button 
                                    onClick={() => onDelete(t.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
            </div>
         )}
      </div>
    </div>
  );
};

export default TransactionsList;