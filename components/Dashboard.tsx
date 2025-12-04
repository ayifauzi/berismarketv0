
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { analyzeSales } from '../services/geminiService';
import { Transaction, AppConfig } from '../types';
import { TrendingUp, Users, AlertCircle, Sparkles, Loader, Settings, Upload, Save, CheckCircle } from 'lucide-react';

interface DashboardProps {
    onConfigUpdate?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onConfigUpdate }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Settings State
  const [appConfig, setAppConfig] = useState<AppConfig>({ appName: '', appLogo: '' });
  const [appNameInput, setAppNameInput] = useState('');
  const [appLogoInput, setAppLogoInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    setTransactions(StorageService.getTransactions());
    
    // Load config
    const config = StorageService.getAppConfig();
    setAppConfig(config);
    setAppNameInput(config.appName);
    setAppLogoInput(config.appLogo);
  }, []);

  const totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
  const totalTx = transactions.length;

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const result = await analyzeSales(transactions);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 200000) { // 200KB limit
            alert("Logo too large (max 200KB).");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setAppLogoInput(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = { appName: appNameInput, appLogo: appLogoInput };
    StorageService.saveAppConfig(newConfig);
    setAppConfig(newConfig);
    setSaveSuccess(true);
    
    // Notify parent to refresh layout
    if (onConfigUpdate) onConfigUpdate();

    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
             <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">Rp {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
             <TrendingUp size={12} /> +12% from last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-gray-500 text-sm font-medium">Transactions</h3>
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalTx}</p>
          <p className="text-xs text-gray-400 mt-2">Across all branches</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-gray-500 text-sm font-medium">Low Stock Alerts</h3>
             <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-gray-800">3</p>
          <p className="text-xs text-red-500 mt-2 cursor-pointer hover:underline">View Items</p>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-400" /> AI Business Analyst
            </h2>
            <button 
              onClick={handleGenerateInsight}
              disabled={loadingAi}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              {loadingAi ? <Loader className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {aiInsight ? "Regenerate Insight" : "Generate Insight"}
            </button>
          </div>
          
          <div className="bg-white/10 rounded-lg p-6 min-h-[150px]">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center h-full text-brand-200 animate-pulse">
                <Sparkles size={32} className="mb-2" />
                <p>Analyzing sales patterns...</p>
              </div>
            ) : aiInsight ? (
              <div className="prose prose-invert prose-sm max-w-none">
                 {/* Simple formatting for markdown-like text */}
                 {aiInsight.split('\n').map((line, i) => (
                    <p key={i} className="mb-1">{line}</p>
                 ))}
              </div>
            ) : (
              <p className="text-brand-200 italic text-center">
                Click "Generate Insight" to let Gemini analyze your latest sales data and provide actionable strategies.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Transactions & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Branch</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(-5).reverse().map(t => (
                    <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono text-gray-600">{t.id.split('-')[1]}</td>
                      <td className="py-3">{t.branchId}</td>
                      <td className="py-3 text-right font-bold text-brand-600">Rp {t.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                     <tr><td colSpan={3} className="py-4 text-center text-gray-400">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Settings (App Name & Logo) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Settings size={20} className="text-gray-400"/> System Branding
             </h3>
             <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                   <input 
                      type="text" 
                      value={appNameInput}
                      onChange={(e) => setAppNameInput(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Enter App Name"
                   />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Application Logo</label>
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                         {appLogoInput ? (
                            <img src={appLogoInput} alt="Logo Preview" className="w-full h-full object-contain" />
                         ) : (
                            <span className="text-xs text-gray-400">No Logo</span>
                         )}
                      </div>
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition text-sm font-medium text-gray-700">
                         <Upload size={16} /> Upload New
                         <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                   </div>
                </div>

                <div className="pt-2">
                   <button 
                      type="submit" 
                      className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex items-center justify-center gap-2 transition"
                   >
                      {saveSuccess ? <CheckCircle size={18} /> : <Save size={18} />}
                      {saveSuccess ? 'Settings Saved!' : 'Save Changes'}
                   </button>
                </div>
             </form>
          </div>
      </div>
    </div>
  );
};
