import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (isLogin) {
        // LOGIN LOGIC
        const storedUsers = localStorage.getItem('elag_users');
        const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const sessionUser = { id: user.id, name: user.name, email: user.email };
          localStorage.setItem('elag_session', JSON.stringify(sessionUser));
          onLogin(sessionUser);
        } else {
          setError('Invalid email or password.');
        }
      } else {
        // SIGNUP LOGIC
        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }

        const storedUsers = localStorage.getItem('elag_users');
        const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];

        if (users.find(u => u.email === email)) {
            setError('Email already exists. Please login.');
            setLoading(false);
            return;
        }

        const newUser = {
            id: crypto.randomUUID(),
            name,
            email,
            password // In a real app, this should be hashed!
        };

        users.push(newUser);
        localStorage.setItem('elag_users', JSON.stringify(users));
        
        const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
        localStorage.setItem('elag_session', JSON.stringify(sessionUser));
        onLogin(sessionUser);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center flex flex-col items-center">
            <Logo className="w-16 h-16 mb-4 drop-shadow-lg" />
            <h1 className="text-2xl font-bold text-white mb-1">ELAG AI</h1>
            <p className="text-indigo-100 text-sm">Your Intelligent Financial Companion</p>
        </div>

        {/* Form */}
        <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>

            {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white transition-all"
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                        type="email" 
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white transition-all"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white transition-all"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            {isLogin ? 'Sign In' : 'Sign Up'}
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;