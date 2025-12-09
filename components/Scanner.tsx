import React, { useState, useRef } from 'react';
import { Upload, Camera, Check, Loader2, AlertCircle } from 'lucide-react';
import { fileToGenerativePart, parseReceiptImage } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';

interface ScannerProps {
  onAddTransaction: (t: Transaction) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onAddTransaction }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Convert to Base64
      const base64Data = await fileToGenerativePart(file);

      // 2. Send to Gemini
      const extractedData = await parseReceiptImage(base64Data);

      // 3. Create Transaction Object
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: extractedData.date || new Date().toISOString().split('T')[0],
        merchant: extractedData.merchant || 'Unknown Merchant',
        amount: extractedData.amount || 0,
        category: extractedData.category || 'Uncategorized',
        type: TransactionType.EXPENSE, // Receipts are usually expenses
        description: extractedData.description
      };

      // 4. Update Parent
      onAddTransaction(newTransaction);
      setSuccess(true);
      
      // Reset after delay
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error(err);
      setError("Failed to analyze receipt. Please try again or enter manually.");
    } finally {
      setLoading(false);
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan Your Receipt</h2>
        <p className="text-slate-500 mb-8">
          Upload a photo of your receipt. Our AI will automatically extract the merchant, date, amount, and category.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-slate-600 font-medium">Analyzing receipt details...</p>
            <p className="text-slate-400 text-sm mt-2">This usually takes about 3-5 seconds</p>
          </div>
        ) : (
          <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-12 transition-all bg-slate-50 hover:bg-indigo-50">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <div className="flex flex-col items-center">
              <Upload className="text-slate-400 group-hover:text-indigo-500 mb-4 transition-colors" size={40} />
              <span className="font-semibold text-slate-700 group-hover:text-indigo-700">Click to upload</span>
              <span className="text-sm text-slate-500 mt-1">or drag and drop here</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 justify-center animate-pulse">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-lg flex items-center gap-2 justify-center animate-fade-in">
            <Check size={20} />
            <span>Receipt analyzed and added successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;