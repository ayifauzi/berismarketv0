
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { MotoristApp } from './components/MotoristApp';
import { BranchManagement } from './components/BranchManagement';
import { InventoryManager } from './components/InventoryManager';
import { Role, CURRENT_USER, AppConfig } from './types';
import { Store, ShieldCheck, ShoppingCart, Bike, ChevronRight } from 'lucide-react';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [appConfig, setAppConfig] = useState<AppConfig>({ appName: 'OmniMarket', appLogo: '' });

  useEffect(() => {
    // Load config on mount
    const config = StorageService.getAppConfig();
    setAppConfig(config);
  }, []);

  const refreshConfig = () => {
    setAppConfig(StorageService.getAppConfig());
  };

  const handleSetRole = (newRole: Role | null) => {
    setRole(newRole);
    // Set default view based on role
    if (newRole === Role.SUPER_ADMIN) setCurrentView('dashboard');
    else if (newRole === Role.BRANCH_ADMIN) setCurrentView('inventory');
    else if (newRole === Role.CASHIER) setCurrentView('pos');
    else if (newRole === Role.MOTORIST) setCurrentView('visit');
  };

  // View Routing
  const renderView = () => {
    if (role === Role.SUPER_ADMIN) {
      if (currentView === 'branches') return <BranchManagement />;
      return <Dashboard onConfigUpdate={refreshConfig} />;
    }
    if (role === Role.BRANCH_ADMIN) {
      return <InventoryManager branchId={CURRENT_USER.branchId} />;
    }
    if (role === Role.CASHIER) {
      return <POS />;
    }
    if (role === Role.MOTORIST) {
      return <MotoristApp />;
    }
    return <div>Access Denied</div>;
  };

  const getTitle = () => {
    if (role === Role.SUPER_ADMIN) {
      return currentView === 'branches' ? "Branch Management" : "Dashboard Overview";
    }
    if (role === Role.BRANCH_ADMIN) return "Stock Management";
    if (role === Role.CASHIER) return "Point of Sale";
    if (role === Role.MOTORIST) return "Field Operations";
    return appConfig.appName;
  }

  // Role Selection Screen (Login Simulation)
  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-brand-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
             {/* Dynamic Branding */}
             <div className="absolute top-6 left-6 flex items-center gap-2">
                {appConfig.appLogo && <img src={appConfig.appLogo} className="w-8 h-8 rounded bg-white object-contain" />}
                <span className="font-bold opacity-80">{appConfig.appName}</span>
             </div>

            <h1 className="text-4xl font-bold mb-4">{appConfig.appName}</h1>
            <p className="text-brand-100 text-lg mb-8">
              The intelligent platform for multi-branch retail management. 
              Created by SMPN 1 Manonjaya.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</div>
                <span>Real-time POS & Inventory</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</div>
                <span>AI-Driven Sales Insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</div>
                <span>Motorist GPS Tracking</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Access Role</h2>
            <div className="space-y-3">
              <button 
                onClick={() => handleSetRole(Role.SUPER_ADMIN)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><ShieldCheck size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800">Super Admin</h3>
                    <p className="text-xs text-gray-500">Headquarters Control</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-brand-500" />
              </button>

              <button 
                onClick={() => handleSetRole(Role.BRANCH_ADMIN)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Store size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800">Branch Admin</h3>
                    <p className="text-xs text-gray-500">Inventory & Local Reports</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-brand-500" />
              </button>

              <button 
                onClick={() => handleSetRole(Role.CASHIER)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-lg"><ShoppingCart size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800">Cashier / POS</h3>
                    <p className="text-xs text-gray-500">Sales & Checkout</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-brand-500" />
              </button>

              <button 
                onClick={() => handleSetRole(Role.MOTORIST)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Bike size={24} /></div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800">Motorist</h3>
                    <p className="text-xs text-gray-500">Mobile Field App</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-brand-500" />
              </button>
            </div>
            
            <p className="mt-8 text-center text-xs text-gray-400">
              Demo Version v1.0.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentRole={role} 
      setRole={handleSetRole} 
      title={getTitle()} 
      currentView={currentView} 
      setView={setCurrentView}
      appConfig={appConfig}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
