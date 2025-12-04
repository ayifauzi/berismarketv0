
import React from 'react';
import { Role, AppConfig } from '../types';
import { LayoutDashboard, Store, ShoppingCart, Bike, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentRole: Role;
  setRole: (role: Role | null) => void;
  title: string;
  currentView: string;
  setView: (view: string) => void;
  appConfig: AppConfig;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentRole, setRole, title, currentView, setView, appConfig }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Nav items based on Role
  const getNavItems = () => {
    switch (currentRole) {
      case Role.SUPER_ADMIN:
        return [
          { icon: LayoutDashboard, label: 'Dashboard Pusat', id: 'dashboard' },
          { icon: Store, label: 'Kelola Cabang', id: 'branches' },
        ];
      case Role.BRANCH_ADMIN:
        return [
          { icon: Store, label: 'Stok Produk', id: 'inventory' },
          { icon: LayoutDashboard, label: 'Laporan', id: 'reports' },
        ];
      case Role.CASHIER:
        return [
          { icon: ShoppingCart, label: 'POS Kasir', id: 'pos' },
          { icon: Store, label: 'Riwayat', id: 'history' },
        ];
      case Role.MOTORIST:
        return [
          { icon: Bike, label: 'Kunjungan', id: 'visit' },
          { icon: LayoutDashboard, label: 'Aktivitas', id: 'activity' },
        ];
      default: return [];
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center space-x-2 p-4 border-b border-slate-700 h-16">
          {appConfig.appLogo ? (
             <img src={appConfig.appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          ) : (
             <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                {appConfig.appName.charAt(0)}
             </div>
          )}
          <span className="text-lg font-bold truncate">{appConfig.appName}</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {currentRole.replace('_', ' ')}
          </div>
          {getNavItems().map((item, idx) => {
            const isActive = currentView === item.id;
            return (
              <div 
                key={idx} 
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-colors
                  ${isActive ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-700">
          <button 
            onClick={() => setRole(null)}
            className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium">Demo User</span>
                <span className="text-xs text-slate-500">{currentRole}</span>
             </div>
             <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold">
               U
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
