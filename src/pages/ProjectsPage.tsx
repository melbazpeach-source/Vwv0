import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVercel } from '../context/VercelContext';
import { Search, Loader2, Rocket, Globe, ExternalLink, ChevronRight, Box, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CreateProjectModal } from '../components/CreateProjectModal';

export const ProjectsPage: React.FC = () => {
  const { service } = useVercel();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => service?.getProjects() || [],
    enabled: !!service,
  });

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
        <p className="text-slate-500 font-medium">Fetching projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/10 text-red-600 p-6 rounded-2xl flex flex-col items-center gap-4">
        <p className="font-bold">Error loading projects</p>
        <p className="text-sm opacity-80">{(error as Error).message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Projects</h1>
            <p className="text-slate-500">Overview of all your Vercel deployments and products.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
               />
            </div>
            <button 
               onClick={() => setIsCreateModalOpen(true)}
               className="bg-slate-900 hover:bg-black text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center group"
               title="New Project"
            >
               <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects?.map((project, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              key={project.id}
            >
              <Link 
                to={`/projects/${project.id}`}
                className="group block bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 transition-all hover:shadow-sm relative overflow-hidden"
              >
                 <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1">
                       <h3 className="font-bold text-lg text-slate-900 group-hover:text-black transition-colors">{project.name}</h3>
                       <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">{project.framework || 'Other'}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-slate-100 transition-colors">
                       <Rocket className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Globe className="w-4 h-4 text-slate-400" />
                       <span className="truncate flex-1">{project.targets?.production?.alias[0] || 'No domain'}</span>
                       {project.targets?.production?.readyState && (
                          <div className={cn(
                             "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap",
                             project.targets.production.readyState === 'READY' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                             project.targets.production.readyState === 'BUILDING' ? "bg-blue-50 text-blue-600 border border-blue-100 animate-pulse" :
                             project.targets.production.readyState === 'ERROR' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                             "bg-slate-50 text-slate-500 border border-slate-100"
                          )}>
                             <div className={cn(
                                "w-1 h-1 rounded-full",
                                project.targets.production.readyState === 'READY' ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" :
                                project.targets.production.readyState === 'BUILDING' ? "bg-blue-500" :
                                project.targets.production.readyState === 'ERROR' ? "bg-rose-500" :
                                "bg-slate-400"
                             )} />
                             {project.targets.production.readyState.toLowerCase()}
                          </div>
                       )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                          Updated {formatDistanceToNow(project.updatedAt)} ago
                       </span>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                    </div>
                 </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {filteredProjects?.length === 0 && (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
           <Box className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <h3 className="text-lg font-bold text-slate-900">No projects found</h3>
           <p className="text-slate-500">Try searching for something else or connect a team.</p>
        </div>
      )}
    </div>
  );
};
