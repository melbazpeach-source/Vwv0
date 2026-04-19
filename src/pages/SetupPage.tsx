import React, { useState } from 'react';
import { useVercel } from '../context/VercelContext';
import { Key, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const SetupPage: React.FC = () => {
  const { setToken } = useVercel();
  const [inputToken, setInputToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim()) {
      setToken(inputToken.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
            <Key className="w-5 h-5" />
          </div>
          <input
            type="password"
            placeholder="Vercel Access Token"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!inputToken.trim()}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-md"
        >
          Manage Projects
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>

      <div className="text-sm text-slate-400 pt-4">
        <p>Don't have a token? Create one in your <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-slate-900 font-bold hover:underline">Vercel settings</a>.</p>
      </div>
    </motion.div>
  );
};
