import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Transaction, Insight } from '../types';
import { generateSmartInsights } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  currency: string;
}

const SmartInsights: React.FC<Props> = ({ transactions, currency }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
        setLoading(true);
        try {
            const data = await generateSmartInsights(transactions);
            setInsights(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    if (transactions.length) fetchInsights();
    else setLoading(false);
  }, [transactions]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="col-span-full mb-2">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Lightbulb className="text-yellow-500" /> AI Smart Insights
             </h2>
             <p className="text-slate-500 dark:text-slate-400">Automated analysis of your spending habits.</p>
        </div>
        {insights.map((insight, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                    insight.type === 'SAVINGS' ? 'bg-emerald-500' : 
                    insight.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 dark:text-white">{insight.title}</h3>
                    {insight.type === 'SAVINGS' && <TrendingUp className="text-emerald-500" size={20} />}
                    {insight.type === 'ALERT' && <AlertCircle className="text-red-500" size={20} />}
                    {insight.type === 'PATTERN' && <Lightbulb className="text-blue-500" size={20} />}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    {insight.description}
                </p>
                {insight.impactAmount && (
                    <div className="text-lg font-bold text-slate-800 dark:text-white">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(insight.impactAmount)}
                        <span className="text-xs font-normal text-slate-400 ml-1">est. impact</span>
                    </div>
                )}
            </div>
        ))}
        {insights.length === 0 && (
            <div className="col-span-full text-center p-12 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Not enough data to generate insights.
            </div>
        )}
    </div>
  );
};

export default SmartInsights;