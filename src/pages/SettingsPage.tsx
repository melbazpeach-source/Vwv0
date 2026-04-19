import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVercel } from '../context/VercelContext';
import { Settings, Key, Users, LogOut, Check, ChevronRight, ShieldCheck, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const SettingsPage: React.FC = () => {
  const { token, setToken, teamId, setTeamId, service } = useVercel();

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => service?.getTeams(),
    enabled: !!service,
  });

  const handleLogout = () => {
    setToken(null);
    setTeamId(null);
  };

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your Vercel account integration and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <section className="space-y-4">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">Account</h2>
           <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between group">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                       <Key className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-900">API Token</p>
                       <p className="text-xs text-slate-400 font-mono">••••••••••••{token?.slice(-4)}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setToken(null)}
                   className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
                 >
                    Change
                 </button>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full p-4 flex items-center justify-between text-rose-500 hover:bg-rose-50 transition-colors group"
              >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-rose-50 rounded-lg">
                       <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold">Disconnect Account</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
              </button>
           </div>
        </section>

        {/* Team Selection Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Active Workspace</h2>
              {loadingTeams && <span className="text-[10px] text-slate-400 animate-pulse">Loading teams...</span>}
           </div>
           
           <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
              {/* Personal Account Option */}
              <button 
                onClick={() => setTeamId(null)}
                className={cn(
                  "w-full p-4 flex items-center justify-between transition-colors",
                  !teamId ? "bg-slate-50" : "hover:bg-slate-50/50"
                )}
              >
                 <div className="flex items-center gap-3 text-left">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                      !teamId ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-slate-200"
                    )}>
                       PA
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-900">Personal Account</p>
                       <p className="text-xs text-slate-400 uppercase tracking-widest font-black">Hobby</p>
                    </div>
                 </div>
                 {!teamId && <Check className="w-5 h-5 text-slate-900" />}
              </button>

              {/* Team Options */}
              {teams?.map(team => (
                 <button 
                   key={team.id}
                   onClick={() => setTeamId(team.id)}
                   className={cn(
                     "w-full p-4 flex items-center justify-between transition-colors",
                     teamId === team.id ? "bg-slate-50" : "hover:bg-slate-50/50"
                   )}
                 >
                    <div className="flex items-center gap-3 text-left">
                       <div className={cn(
                         "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                         teamId === team.id ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-400 border-slate-200"
                       )}>
                          {team.name.slice(0, 2).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{team.name}</p>
                          <p className="text-xs text-slate-400 font-mono tracking-widest">{team.slug}</p>
                       </div>
                    </div>
                    {teamId === team.id && <Check className="w-5 h-5 text-slate-900" />}
                 </button>
              ))}
           </div>
        </section>

        {/* Info Section */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 flex items-start gap-4 shadow-sm">
           <ShieldCheck className="w-8 h-8 text-slate-300 mt-1" />
           <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Privacy & Security</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tokens are stored locally in your browser's <code>localStorage</code>. 
                They never leave this application except to communicate directly with Vercel's official API.
              </p>
           </div>
        </section>

        <div className="flex justify-center pt-10">
           <a 
             href="https://github.com/melbazpeach-source/vwv0" 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors"
           >
              <Github className="w-4 h-4" />
              Source on GitHub
           </a>
        </div>
      </div>
    </div>
  );
};
