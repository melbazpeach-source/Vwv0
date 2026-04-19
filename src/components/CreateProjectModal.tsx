import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Loader2, Rocket } from 'lucide-react';
import { useVercel } from '../context/VercelContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../lib/utils';

interface CreateProjectModalProps {
  onClose: () => void;
}

const FRAMEWORKS = [
  { id: 'nextjs', name: 'Next.js' },
  { id: 'react', name: 'React' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'svelte', name: 'Svelte' },
  { id: 'nuxt', name: 'Nuxt.js' },
  { id: 'gatsby', name: 'Gatsby' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose }) => {
  const { service } = useVercel();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [framework, setFramework] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!service) throw new Error('No service');
      return service.createProject(name, framework || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      mutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
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
             <div className="p-2 bg-slate-900 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">New Project</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Project Name</label>
            <input 
              type="text"
              placeholder="my-awesome-app"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            <p className="text-[10px] text-slate-400 px-1 italic">Only lowercase, numbers, and hyphens.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Framework (Optional)</label>
            <div className="grid grid-cols-2 gap-2">
               {FRAMEWORKS.map(f => (
                 <button
                   key={f.id}
                   type="button"
                   onClick={() => setFramework(framework === f.id ? '' : f.id)}
                   className={cn(
                     "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                     framework === f.id 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                   )}
                 >
                   {f.name}
                 </button>
               ))}
            </div>
          </div>

          {mutation.isError && (
             <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium">
                {(mutation.error as Error).message}
             </div>
          )}

          <div className="pt-2">
             <button
                type="submit"
                disabled={!name.trim() || mutation.isPending}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
             >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Create Project
                  </>
                )}
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
