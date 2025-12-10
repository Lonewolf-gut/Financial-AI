import React, { useEffect, useState, useMemo } from 'react';
import { Activity, TrendingUp, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, CashFlowPoint, TransactionType } from '../types';
import { predictCashFlow } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  currency: string;
}

const CashFlowTimeline: React.FC<Props> = ({ transactions, currency }) => {
  const [predictionData, setPredictionData] = useState<CashFlowPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const currentBalance = useMemo(() => {
     const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
     const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
     return income - expense;
  }, [transactions]);

  useEffect(() => {
    const fetchPredictions = async () => {
        setLoading(true);
        try {
            const data = await predictCashFlow(transactions, currentBalance);
            setPredictionData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    if (transactions.length) fetchPredictions();
    else setLoading(false);
  }, [transactions, currentBalance]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Activity className="text-blue-500" /> Cash Flow Timeline (30 Days)
             </h2>
             <p className="text-slate-500 dark:text-slate-400">AI-predicted future balance based on recurring transactions.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-96">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictionData}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} tickFormatter={(val) => new Intl.NumberFormat(undefined, { notation: 'compact' }).format(val)} />
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)} />
                    <Area type="monotone" dataKey="balance" stroke="#8884d8" fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default CashFlowTimeline;