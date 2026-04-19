import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Github, Plus, X, ExternalLink, ShieldCheck, Check, Loader2, AlertCircle, RefreshCw, Link as LinkIcon, Search, Clock, HelpCircle, Key, Settings, MousePointer2 } from 'lucide-react';
import { GitHubAccount, VercelProject } from '../types';
import { cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVercel } from '../context/VercelContext';
import { formatDistanceToNow } from 'date-fns';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  description: string;
  updated_at: string;
}

export const GitHubAdminPage: React.FC = () => {
  const { service } = useVercel();
  const queryClient = useQueryClient();
  const [accounts, setAccounts] = useState<GitHubAccount[]>(() => {
    const saved = localStorage.getItem('vwv0_github_accounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  
  // Sync state
  const [syncingAccountId, setSyncingAccountId] = useState<number | null>(null);
  const [syncingRepos, setSyncingRepos] = useState<GitHubRepo[]>([]);
  const [linkingRepo, setLinkingRepo] = useState<GitHubRepo | null>(null);
  const [searchRepo, setSearchRepo] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => service?.getProjects() || [],
    enabled: !!service,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ projectId, repo }: { projectId: string, repo: GitHubRepo }) => {
      if (!service) throw new Error('No service');
      return service.linkProjectToRepo(projectId, {
        org: repo.owner.login,
        repo: repo.name,
        repoId: repo.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setLinkingRepo(null);
    },
  });

  useEffect(() => {
    localStorage.setItem('vwv0_github_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;

      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const payload = event.data.payload;
        
        setAccounts(prev => {
          const exists = prev.find(a => a.id === payload.id);
          if (exists) return prev;
          if (prev.length >= 3) {
             setError('Maximum of 3 GitHub accounts reached.');
             return prev;
          }
          return [...prev, { 
            ...payload, 
            connectedAt: new Date().toISOString(),
            syncStatus: 'Out of Sync'
          }];
        });
        setConnecting(false);
        setError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const resp = await fetch('/api/auth/github/url');
      const data = await resp.json();
      
      if (!resp.ok) {
        if (data.error?.includes('not configured')) {
          setShowConfigGuide(true);
          throw new Error('GitHub configuration missing.');
        }
        throw new Error(data.error || 'Failed to get auth URL');
      }

      const { url } = data;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(url, 'github_oauth', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (err: any) {
      setError(err.message);
      setConnecting(false);
    }
  };

  const handleSyncRepos = async (account: GitHubAccount) => {
    // Prevent concurrent syncs for the same account
    if (account.syncStatus === 'Syncing') return;

    setSyncingAccountId(account.id);
    setError(null);
    
    // Update local status to syncing
    setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, syncStatus: 'Syncing' } : a));

    try {
      const resp = await fetch(`/api/github/repos?token=${account.token}`);
      if (!resp.ok) throw new Error('Failed to fetch repositories');
      const data = await resp.json();
      
      setSyncingRepos(data);
      setAccounts(prev => prev.map(a => a.id === account.id ? { 
        ...a, 
        syncStatus: 'Synced', 
        lastSyncedAt: new Date().toISOString() 
      } : a));
    } catch (err: any) {
      setError(`Sync failed: ${err.message}`);
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, syncStatus: 'Error' } : a));
    }
  };

  const removeAccount = (id: number) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (syncingAccountId === id) {
      setSyncingAccountId(null);
      setSyncingRepos([]);
    }
  };

  const filteredRepos = syncingRepos.filter(r => 
    r.name.toLowerCase().includes(searchRepo.toLowerCase()) ||
    r.owner.login.toLowerCase().includes(searchRepo.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 max-w-4xl">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">GitHub Connections</h1>
          <p className="text-slate-500">Manage multiple GitHub accounts for your deployments.</p>
        </div>
        <button 
          onClick={() => setShowConfigGuide(true)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm"
        >
          <HelpCircle className="w-4 h-4" />
          Setup Guide
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Connected Accounts</h2>
              <span className="text-[10px] text-slate-400 font-bold bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                {accounts.length} / 3
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-50 overflow-hidden shadow-sm">
              <AnimatePresence mode="popLayout">
                {accounts.map((account) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={account.id} 
                    className={cn(
                      "p-4 group transition-all cursor-pointer",
                      syncingAccountId === account.id ? "bg-slate-50 shadow-inner" : "hover:bg-slate-50/50"
                    )}
                    onClick={() => handleSyncRepos(account)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={account.avatarUrl} 
                          alt={account.username}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-sm text-slate-900">{account.username}</p>
                            <Check className="w-3 h-3 text-emerald-500" />
                          </div>
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1",
                            account.syncStatus === 'Synced' ? "bg-emerald-50 text-emerald-600" :
                            account.syncStatus === 'Syncing' ? "bg-blue-50 text-blue-600 animate-pulse" :
                            account.syncStatus === 'Error' ? "bg-rose-50 text-rose-600" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            <div className={cn(
                              "w-1 h-1 rounded-full",
                              account.syncStatus === 'Synced' ? "bg-emerald-500" :
                              account.syncStatus === 'Syncing' ? "bg-blue-500" :
                              account.syncStatus === 'Error' ? "bg-rose-500" :
                              "bg-slate-400"
                            )} />
                            {account.syncStatus || 'Pending'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSyncRepos(account); }}
                          disabled={account.syncStatus === 'Syncing'}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-all"
                          title="Sync Now"
                        >
                          <RefreshCw className={cn("w-4 h-4", account.syncStatus === 'Syncing' && "animate-spin")} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeAccount(account.id); }}
                          className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                          title="Remove Account"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {account.lastSyncedAt && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pl-1">
                        <Clock className="w-3 h-3" />
                        Synced {formatDistanceToNow(new Date(account.lastSyncedAt))} ago
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <button 
                onClick={handleConnect}
                disabled={connecting || accounts.length >= 3}
                className="w-full p-5 flex items-center justify-center gap-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all border-dashed border-t border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
                <span className="font-bold text-sm">Add Account</span>
              </button>
            </div>
          </section>

          {error && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium"
             >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
             </motion.div>
          )}

          <section className="bg-white p-6 rounded-3xl border border-slate-200 flex items-start gap-4 shadow-sm">
             <ShieldCheck className="w-8 h-8 text-slate-200 mt-1" />
             <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Zero-Trust Tokens</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vwv0 never stores your GitHub secrets on its servers permanent storage.
                </p>
             </div>
          </section>
        </div>

        <div className="lg:col-span-7">
           <div className="bg-slate-100/50 border border-slate-200 rounded-[2.5rem] p-2 min-h-[500px] flex flex-col">
              <div className="bg-white border border-slate-200 rounded-[2.2rem] flex-1 overflow-hidden flex flex-col shadow-sm">
                 <div className="p-4 border-b border-slate-50 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3 px-2">
                       <RefreshCw className={cn("w-4 h-4 text-slate-400", syncingAccountId && syncingRepos.length === 0 && "animate-spin")} />
                       <span className="text-sm font-bold text-slate-900">
                          {syncingAccountId ? 
                            `Repositories (${syncingRepos.length})` : 
                            'Select an account to sync'
                          }
                       </span>
                    </div>
                    {syncingAccountId && (
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                             type="text"
                             placeholder="Filter..."
                             value={searchRepo}
                             onChange={(e) => setSearchRepo(e.target.value)}
                             className="bg-slate-50 border-none rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-slate-200 w-32 md:w-48"
                          />
                       </div>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto p-2">
                    {!syncingAccountId ? (
                       <div className="flex flex-col items-center justify-center h-full text-center p-10 gap-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                             <Github className="w-8 h-8 text-slate-200" />
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-sm font-bold text-slate-400">No Account Selected</h4>
                             <p className="text-xs text-slate-400">Click a connected account on the left to view and sync its repositories.</p>
                          </div>
                       </div>
                    ) : syncingRepos.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                          <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
                          <p className="text-slate-400 text-sm">Fetching your repositories...</p>
                       </div>
                    ) : (
                       <div className="space-y-1">
                          {filteredRepos.map(repo => (
                             <div key={repo.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-colors group flex items-center justify-between border border-transparent hover:border-slate-100">
                                <div className="space-y-1 flex-1 min-w-0 pr-4">
                                   <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm text-slate-900 truncate">{repo.name}</p>
                                      {repo.description && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md truncate max-w-[150px]">{repo.description}</span>}
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-mono tracking-tight">Updated {new Date(repo.updated_at).toLocaleDateString()}</p>
                                </div>

                                <button 
                                   onClick={() => setLinkingRepo(repo)}
                                   className="opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black flex items-center gap-1.5"
                                >
                                   <LinkIcon className="w-3.5 h-3.5" />
                                   Link
                                </button>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
         {linkingRepo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  onClick={() => setLinkingRepo(null)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
               >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                           <LinkIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-slate-900">Link Repository</h3>
                           <p className="text-xs text-slate-400 font-mono">{linkingRepo.full_name}</p>
                        </div>
                     </div>
                     <button onClick={() => setLinkingRepo(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="p-6 space-y-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Target Vercel Project</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                           {projects?.map(project => (
                              <button
                                 key={project.id}
                                 onClick={() => linkMutation.mutate({ projectId: project.id, repo: linkingRepo })}
                                 disabled={linkMutation.isPending}
                                 className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group disabled:opacity-50"
                              >
                                 <div className="text-left">
                                    <p className="font-bold text-sm text-slate-900">{project.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{project.framework || 'Other'}</p>
                                 </div>
                                 <div className="w-8 h-8 bg-white rounded-xl border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    {linkMutation.isPending && linkingRepo.id === linkingRepo.id ? (
                                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                    ) : (
                                      <Plus className="w-4 h-4 text-slate-400" />
                                    )}
                                 </div>
                              </button>
                           ))}
                           {projects?.length === 0 && (
                              <div className="text-center py-10 text-slate-400 italic text-sm">
                                 No Vercel projects found to link.
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}

         {showConfigGuide && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  onClick={() => setShowConfigGuide(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
               />
               <motion.div 
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 40, scale: 0.95 }}
                  className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col p-8 md:p-12 space-y-8"
               >
                  <button 
                    onClick={() => setShowConfigGuide(false)}
                    className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="space-y-3">
                     <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6">
                        <Key className="w-6 h-6 text-white" />
                     </div>
                     <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Complete Setup</h2>
                     <p className="text-slate-500 leading-relaxed font-medium">To connect your GitHub accounts, you need to provide your OAuth credentials in the AI Studio platform.</p>
                  </div>

                  <div className="space-y-6">
                     <div className="flex gap-5">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">1</div>
                        <div className="space-y-1">
                           <p className="text-sm font-bold text-slate-900">Open AI Studio Settings</p>
                           <p className="text-xs text-slate-500 leading-relaxed">Look for the <Settings className="inline w-3 h-3 mx-0.5" /> gear icon in the **AI Studio UI sidebar** (not in this app).</p>
                        </div>
                     </div>

                     <div className="flex gap-5">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">2</div>
                        <div className="space-y-1">
                           <p className="text-sm font-bold text-slate-900">Enter Secrets</p>
                           <p className="text-xs text-slate-500 leading-relaxed">Add two variables in the Secrets/Settings panel:</p>
                           <div className="mt-2 space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                              <code className="block text-[10px] font-black text-slate-500 tracking-widest uppercase">GITHUB_CLIENT_ID</code>
                              <code className="block text-[10px] font-black text-slate-500 tracking-widest uppercase">GITHUB_CLIENT_SECRET</code>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-5">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">3</div>
                        <div className="space-y-1">
                           <p className="text-sm font-bold text-slate-900">Save & Restart</p>
                           <p className="text-xs text-slate-500 leading-relaxed">Once you add them, the platform will automatically restart your app with the new credentials active.</p>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4">
                     <button 
                        onClick={() => setShowConfigGuide(false)}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200"
                     >
                        Got it, I'll add them now
                        <ArrowRight className="w-5 h-5" />
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
