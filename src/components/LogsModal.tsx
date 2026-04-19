import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVercel } from '../context/VercelContext';
import { X, Loader2, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LogsModalProps {
  deploymentId: string;
  deploymentUrl: string;
  onClose: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ deploymentId, deploymentUrl, onClose }) => {
  const { service } = useVercel();

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['logs', deploymentId],
    queryFn: () => service?.getDeploymentLogs(deploymentId),
    enabled: !!service && !!deploymentId,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                <Terminal className="w-4 h-4 text-slate-400" />
             </div>
             <div>
                <h3 className="text-sm font-bold truncate max-w-[200px] md:max-w-md text-slate-900">{deploymentUrl}</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">Logs for {deploymentId}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-900 p-4 font-mono text-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
               <p className="text-slate-600">Retrieving logs from Vercel...</p>
            </div>
          ) : error ? (
            <div className="text-rose-400 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
               Failed to load logs. Deployment may be too old or token lacks permissions.
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-1">
               {logs.map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-4 group">
                     <span className="text-slate-700 select-none text-[10px] w-6 text-right">{(idx + 1).toString().padStart(3, '0')}</span>
                     <span className={cn(
                        "whitespace-pre-wrap break-all",
                        log.type === 'stderr' ? 'text-rose-400' : 'text-slate-300'
                     )}>
                        {log.text}
                     </span>
                  </div>
               ))}
            </div>
          ) : (
            <div className="text-slate-600 italic py-10 text-center">No logs recorded for this deployment</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
