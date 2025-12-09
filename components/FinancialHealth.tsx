import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, TrendingUp, HeartPulse, Loader2, ArrowRight } from 'lucide-react';
import { Transaction, FinancialHealthMetric } from '../types';
import { analyzeFinancialHealth } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  currency: string;
}

const FinancialHealth: React.FC<Props> = ({ transactions, currency }) => {
  const [metric, setMetric] = useState<FinancialHealthMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const analyze = async () => {
      setLoading(true);
      try {
        const result = await analyzeFinancialHealth(transactions, currency);
        if (mounted) setMetric(result);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (transactions.length > 0) {
        analyze();
    } else {
        setLoading(false);
    }
    return () => { mounted = false; };
  }, [transactions, currency]);

  if (transactions.length === 0) {
    return (
        <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="text-lg text-slate-600 dark:text-slate-300">Not enough data</h3>
            <p className="text-slate-400">Add some transactions or scan receipts to get a health check.</p>
        </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" size={40} />
        <p className="text-slate-600 dark:text-slate-300">Generating financial forecast...</p>
      </div>
    );
  }

  if (!metric) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-indigo-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-indigo-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Score Card */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center transition-colors">
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-full">
            <HeartPulse size={32} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-1">Financial Health Score</h3>
        <div className={`text-5xl font-bold mb-4 ${getScoreColor(metric.score)}`}>
          {metric.score}/100
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor(metric.score)}`} 
            style={{ width: `${metric.score}%` }}
          />
        </div>
        <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">{metric.status}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{metric.cashFlowStatus}</p>
      </div>

      {/* Risks & Opportunities */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Projections */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-md text-white">
          <div className="flex items-center gap-4 mb-4">
             <TrendingUp className="text-white/80" />
             <h4 className="text-lg font-semibold">Next Month's Projection</h4>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-end">
             <div>
                <p className="text-indigo-100 text-sm mb-1">Estimated Savings Potential</p>
                <p className="text-3xl font-bold">+{currency} {metric.projectedSavings.toFixed(2)}</p>
             </div>
             <button className="mt-4 sm:mt-0 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors">
                View Detailed Plan
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risks */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 transition-colors">
                <h4 className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} /> Potential Risks
                </h4>
                <ul className="space-y-3">
                    {metric.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                            {risk}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 transition-colors">
                <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 mb-4">
                    <ShieldCheck size={18} /> Action Plan
                </h4>
                 <ul className="space-y-3">
                    {metric.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                             <div className="mt-0.5"><ArrowRight size={14} className="text-emerald-500" /></div>
                            {rec}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialHealth;