import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVercel } from '../context/VercelContext';
import { Loader2, History, ExternalLink, User, Globe, AlertCircle, Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LogsModal } from '../components/LogsModal';

export const DeploymentsPage: React.FC = () => {
  const { service } = useVercel();
  const [selectedLogs, setSelectedLogs] = React.useState<{ id: string, url: string } | null>(null);

  const { data: deployments, isLoading, error } = useQuery({
    queryKey: ['deployments', 'all'],
    queryFn: () => service?.getDeployments(),
    enabled: !!service,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-neutral-400 animate-spin" />
        <p className="text-neutral-500 font-medium">Fetching global deployments...</p>
      </div>
    );
  }

  if (error) {
     return (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-3xl flex flex-col items-center gap-4 text-center">
           <AlertCircle className="w-10 h-10" />
           <div>
              <h3 className="text-lg font-bold">Failed to load deployments</h3>
              <p className="text-sm opacity-80 mt-1">Check your API token permissions.</p>
           </div>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Deployments</h1>
        <p className="text-slate-500">All recent activity across your projects and teams.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <th className="px-6 py-4">Deployment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 hidden md:table-cell">Creator</th>
                <th className="px-6 py-4">Age</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deployments?.map((deploy, idx) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  key={deploy.uid} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-slate-900">
                      <span className="font-bold text-sm">{deploy.name}</span>
                      <span className="text-xs text-slate-400 font-mono truncate max-w-[150px] md:max-w-xs">{deploy.url}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                          "w-2 h-2 rounded-full",
                          deploy.readyState === 'READY' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                          deploy.readyState === 'BUILDING' ? 'bg-blue-500 animate-pulse' :
                          deploy.readyState === 'ERROR' ? 'bg-rose-500' : 'bg-slate-300'
                       )} />
                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">
                          {deploy.readyState}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                     <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <User className="w-3.5 h-3.5" />
                        {deploy.creator.username}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                     {formatDistanceToNow(deploy.createdAt)} ago
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogs({ id: deploy.uid, url: deploy.url });
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                        title="View Logs"
                      >
                        <Terminal className="w-4 h-4" />
                      </button>
                      <a 
                        href={`https://${deploy.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
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
      
      {deployments?.length === 0 && (
         <div className="text-center py-20 border border-dashed border-slate-200 bg-white rounded-3xl">
            <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No deployments found</h3>
            <p className="text-slate-500">Your recent activities will appear here.</p>
         </div>
      )}
    </div>
  );
};
