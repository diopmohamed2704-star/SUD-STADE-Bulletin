
import React from 'react';
import { GraduationCap, LayoutDashboard, Settings, Database, Wifi, WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: 'DASHBOARD' | 'CLASS_DETAIL' | 'REPORT_CARDS' | 'SETTINGS') => void;
  isOnline?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isOnline = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-900 text-white shadow-lg no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('DASHBOARD')}>
            <div className="bg-white p-1 rounded-lg">
              <GraduationCap size={28} className="text-indigo-900" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SUD STADE <span className="text-indigo-200 font-light">Bulletin</span></h1>
          </div>
          
          <nav className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hidden md:inline">{isOnline ? 'MySQL Connecté' : 'Mode Local'}</span>
            </div>

            <button 
              onClick={() => onNavigate('DASHBOARD')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeView === 'DASHBOARD' || activeView === 'CLASS_DETAIL' ? 'bg-indigo-700 shadow-inner' : 'hover:bg-indigo-800'}`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Classes</span>
            </button>
            <button 
              onClick={() => onNavigate('SETTINGS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeView === 'SETTINGS' ? 'bg-indigo-700 shadow-inner' : 'hover:bg-indigo-800'}`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Configuration</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-50 border-t py-8 no-print">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} />
            <span>SUD STADE THIES - Système de Gestion MySQL</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Database size={14} /> MySQL v8.0 Compatible</span>
            <span>&copy; {new Date().getFullYear()} - Plateforme Numérique</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
