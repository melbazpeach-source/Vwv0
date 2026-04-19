import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVercel } from '../context/VercelContext';
import { Loader2, ArrowLeft, History, Globe, Layout, ExternalLink, MoreVertical, RefreshCw, XCircle, Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LogsModal } from '../components/LogsModal';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { service } = useVercel();
  const [selectedLogs, setSelectedLogs] = React.useState<{ id: string, url: string } | null>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => service?.getProjects() || [],
    enabled: !!service,
  });

  const project = projects?.find(p => p.id === id);

  const { data: deployments, isLoading: loadingDeployments } = useQuery({
     queryKey: ['deployments', id],
     queryFn: () => service?.getDeployments(id),
     enabled: !!service && !!id,
  });

  const { data: domains, isLoading: loadingDomains } = useQuery({
     queryKey: ['domains', id],
     queryFn: () => service?.getProjectDomains(id!),
     enabled: !!service && !!id,
  });

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p>Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Breadcrumbs / Header */}
      <div className="space-y-4">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
           <ArrowLeft className="w-4 h-4" />
           Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border border-slate-200 flex items-center justify-center rounded-2xl shadow-sm">
               <span className="text-black font-black text-2xl">▲</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">{project.framework || 'Other'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`https://vercel.com/project/${project.name}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors text-slate-900 shadow-sm"
            >
               View on Vercel
               <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Deployments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Deploys */}
          <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                   <History className="w-5 h-5 text-slate-400" />
                   Recent Deployments
                </h2>
                <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">View All</button>
             </div>

             <div className="space-y-3">
                {loadingDeployments ? (
                   [1,2,3].map(i => <div key={i} className="h-20 bg-white border border-slate-200 animate-pulse rounded-2xl" />)
                ) : (
                   deployments?.map((deploy) => (
                      <div key={deploy.uid} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-300 transition-all hover:shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className={cn(
                               "w-2 h-2 rounded-full",
                               deploy.readyState === 'READY' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                               deploy.readyState === 'BUILDING' ? 'bg-blue-500 animate-pulse' :
                               deploy.readyState === 'ERROR' ? 'bg-rose-500' : 'bg-slate-300'
                            )} />
                            <div>
                               <p className="font-semibold text-sm text-slate-900 truncate max-w-[200px] md:max-w-xs">{deploy.url}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {deploy.target || 'Preview'} • {formatDistanceToNow(deploy.createdAt)} ago
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                               onClick={() => setSelectedLogs({ id: deploy.uid, url: deploy.url })}
                               className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors" title="View Logs"
                            >
                               <Terminal className="w-4 h-4" />
                            </button>
                            {deploy.readyState === 'READY' && (
                               <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors" title="Promote to Production">
                                  <RefreshCw className="w-4 h-4" />
                               </button>
                            )}
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                               <MoreVertical className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </section>
        </div>

        {/* Right Column: Domains & Metadata */}
        <div className="space-y-8">
           <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                 <Globe className="w-4 h-4 text-slate-400" />
                 <h2 className="font-bold text-sm text-slate-900">Domains</h2>
              </div>
              <div className="p-2">
                 {loadingDomains ? (
                    <div className="p-4 text-center text-slate-400 text-sm italic">Loading domains...</div>
                 ) : domains && domains.length > 0 ? (
                    domains.map(domain => (
                       <div key={domain.name} className="p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between text-sm transition-colors cursor-pointer group">
                          <span className="font-medium truncate flex-1 text-slate-700">{domain.name}</span>
                          <div className={cn(
                             "w-2 h-2 rounded-full",
                             domain.verified ? "bg-emerald-500" : "bg-rose-500"
                          )} />
                       </div>
                    ))
                 ) : (
                    <div className="p-4 text-center text-slate-400 text-sm italic">No domains assigned</div>
                 )}
              </div>
           </section>

           <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
              <div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Build Command</h3>
                 <code className="text-xs bg-slate-50 p-2 rounded block border border-slate-100 font-mono text-slate-600">npm run build</code>
              </div>
              <div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Root Directory</h3>
                 <p className="text-sm text-slate-700 font-medium">/</p>
              </div>
           </section>
        </div>
      </div>

      <AnimatePresence>
        {selectedLogs && (
          <LogsModal 
            deploymentId={selectedLogs.id} 
            deploymentUrl={selectedLogs.url} 
            onClose={() => setSelectedLogs(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
