import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Box, History, Globe, Settings, Users, ArrowRightLeft, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVercel } from '../context/VercelContext';

const NAV_ITEMS = [
  { icon: Box, label: 'Projects', path: '/' },
  { icon: History, label: 'Deployments', path: '/deployments' },
  { icon: Github, label: 'GitHub', path: '/github' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Layout: React.FC = () => {
  const { teamId, isAuthenticated } = useVercel();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-slate-900 flex items-center justify-center rounded-xl overflow-hidden shadow-sm">
               <span className="text-white font-black text-3xl">V</span>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Vwv0</h1>
            <p className="text-slate-500">Your responsive Vercel companion. Connect your account to manage your projects on the go.</p>
          </div>
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-slate-900 flex items-center justify-center rounded-lg">
            <span className="text-white font-black text-xl">V</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Vwv0</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
           <div className="flex items-center gap-3 px-3 py-2">
             <Users className="w-5 h-5 text-slate-400" />
             <div className="flex-1 overflow-hidden">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Workspace</p>
                <p className="truncate text-sm font-medium text-slate-900">{teamId ? 'Team Workspace' : 'Personal Account'}</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
         <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 md:hidden p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-slate-900 flex items-center justify-center rounded">
                  <span className="text-white font-black text-xs">V</span>
               </div>
               <span className="font-bold text-lg text-slate-900">Vwv0</span>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
         </header>
         <div className="max-w-6xl mx-auto p-4 md:p-8">
            <Outlet />
         </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around p-3 z-50">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 transition-colors',
                isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'
              )
            }
          >
            <item.icon className={cn("w-6 h-6", item.label === 'Projects' && 'stroke-[2.5px]')} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
