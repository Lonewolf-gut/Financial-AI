import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Transaction, Anomaly } from '../types';
import { detectAnomalies } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  currency: string;
}

const AnomalyDetector: React.FC<Props> = ({ transactions, currency }) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
        setLoading(true);
        try {
            const data = await detectAnomalies(transactions);
            setAnomalies(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    if (transactions.length) fetchAnomalies();
    else setLoading(false);
  }, [transactions]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <ShieldAlert className="text-red-500" /> Fraud & Anomaly Detector
             </h2>
             <p className="text-slate-500 dark:text-slate-400">AI-detected suspicious transactions.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            {anomalies.length === 0 ? (
                <div className="p-12 text-center">
                    <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white">All clear!</h3>
                    <p className="text-slate-500">No anomalies detected in your recent transactions.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {anomalies.map((anomaly, idx) => {
                        const tx = transactions.find(t => t.id === anomaly.transactionId);
                        if (!tx) return null;
                        return (
                            <div key={idx} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${anomaly.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800 dark:text-white">{tx.merchant}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">{tx.date}</span>
                                        </div>
                                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{anomaly.reason}</p>
                                        <p className="text-xs text-slate-500 mt-1">Amount: {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(tx.amount)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                                        Mark Safe
                                    </button>
                                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                                        Flag Fraud
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default AnomalyDetector;