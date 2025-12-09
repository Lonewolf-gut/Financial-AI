import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage, Transaction } from '../types';
import { getCoachResponse } from '../services/geminiService';

interface AICoachProps {
  transactions: Transaction[];
  currency: string;
}

const AICoach: React.FC<AICoachProps> = ({ transactions, currency }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hi! I'm ELAG, your personal financial coach. I've analyzed your recent transactions. How are you feeling about your finances today?",
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Get response
      const responseText = await getCoachResponse(input, history, transactions, currency);

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: responseText || "I'm thinking...",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        content: "I'm having a bit of trouble connecting right now. Could you ask that again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-4 bg-indigo-600 dark:bg-indigo-700 text-white flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-full">
          <Sparkles size={20} className="text-yellow-300" />
        </div>
        <div>
          <h3 className="font-semibold">ELAG AI Coach</h3>
          <p className="text-xs text-indigo-100">Powered by Gemini 2.5</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 
                ${msg.role === 'user' ? 'bg-slate-700 text-white' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex max-w-[80%] gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mt-1">
                 <Bot size={16} />
               </div>
               <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                 <Loader2 className="animate-spin text-indigo-500" size={16} />
                 <span className="text-slate-400 dark:text-slate-500 text-sm">ELAG is thinking...</span>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 dark:text-white placeholder-slate-400 py-2"
            placeholder="Ask for advice, savings tips, or budget help..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full transition-all ${
              !input.trim() || isLoading 
                ? 'text-slate-400 bg-slate-200 dark:bg-slate-600 cursor-not-allowed' 
                : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          ELAG gives AI-generated advice. Always verify with a professional.
        </p>
      </div>
    </div>
  );
};

export default AICoach;