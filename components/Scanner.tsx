import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Check, Loader2, AlertCircle, X } from 'lucide-react';
import { fileToGenerativePart, parseReceiptImage } from '../services/geminiService';
import { Transaction, TransactionType } from '../types';

interface ScannerProps {
  onAddTransaction: (t: Transaction) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onAddTransaction }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up stream when camera closes or component unmounts
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      // Wait for render
      setTimeout(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg');
        // Remove header
        const data = base64Image.split(',')[1];
        stopCamera();
        processReceipt(data, 'image/jpeg');
      }
    }
  };

  const processReceipt = async (base64Data: string, mimeType: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const extractedData = await parseReceiptImage(base64Data, mimeType);

      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: extractedData.date || new Date().toISOString().split('T')[0],
        merchant: extractedData.merchant || 'Unknown Merchant',
        amount: extractedData.amount || 0,
        category: extractedData.category || 'Uncategorized',
        type: (extractedData.type as TransactionType) || TransactionType.EXPENSE,
        description: extractedData.description
      };

      onAddTransaction(newTransaction);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error(err);
      setError("Failed to analyze document. Please try again or enter manually.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const { data, mimeType } = await fileToGenerativePart(file);
      processReceipt(data, mimeType);
    } catch (e) {
      setError("Failed to process file.");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center transition-colors">
        
        {isCameraOpen ? (
          <div className="relative bg-black rounded-xl overflow-hidden mb-6 aspect-video flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <button 
              onClick={stopCamera}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X size={20} />
            </button>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-all"
              />
            </div>
          </div>
        ) : (
          <>
             <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Scan Receipt or Document</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Upload a photo or PDF of your receipt, invoice, or bank statement. We also support direct camera capture.
            </p>
          </>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" size={48} />
            <p className="text-slate-600 dark:text-slate-300 font-medium">Analyzing document...</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Extracting merchant, date, and amount</p>
          </div>
        ) : !isCameraOpen && (
          <div className="flex flex-col gap-4">
             {/* File Upload Area */}
            <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-8 transition-all bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10">
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <div className="flex flex-col items-center">
                <Upload className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-4 transition-colors" size={32} />
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">Click to upload image or PDF</span>
              </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or</span>
                </div>
            </div>

            {/* Camera Button */}
            <button 
                onClick={startCamera}
                className="w-full py-4 rounded-xl border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
                <Camera size={20} />
                Use Camera
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 justify-center animate-pulse">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-2 justify-center animate-fade-in">
            <Check size={20} />
            <span>Document analyzed successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;