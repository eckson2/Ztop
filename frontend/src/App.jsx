import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Shield, LogOut, Zap, Smartphone, FileText, MessageSquare, CreditCard } from 'lucide-react';

import { Login, Register } from './pages/Auth';
import SetupWizard from './pages/SetupWizard';
import Instances from './pages/Instances';
import AdminUsers from './pages/AdminUsers';
import AutoTest from './pages/AutoTest';
import Subscription from './pages/Subscription';
import Integrations from './pages/Integrations';
import PaymentSettings from './pages/PaymentSettings';
import CiabraConfig from './pages/payment/CiabraConfig';
import PaymentLogs from './pages/financial/PaymentLogs'; // [NEW]
import ManualMethods from './pages/financial/ManualMethods'; // [NEW]
import MessageTemplates from './pages/marketing/MessageTemplates'; // [NEW]
import ClientsList from './pages/clients/ClientsList'; // [NEW]
import ClientForm from './pages/clients/ClientForm'; // [NEW]
import BotDashboard from './pages/marketing/BotDashboard'; // [NEW]
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
// ...
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" to="/" />
          <SidebarItem icon={<Users size={20} />} label="Clientes" to="/customers" /> {/* [NEW] */ }
// ...
<Route path="/marketing/templates" element={<MessageTemplates />} /> {/* [NEW] Templates */ }
<Route path="/customers" element={<ClientsList />} /> {/* [NEW] Clients Route */ }
<Route path="/admin" element={<AdminUsers />} />
import api from './api';
import {
  BarChart3, PenTool // [NEW] Icons
} from 'lucide-react';

import Dashboard from './pages/Dashboard'; // [NEW]

// [REMOVED INLINE DASHBOARD AND STATSCARD]

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  // ... (rest of Layout)
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // [NEW] State for mobile menu

  /* New Sidebar Group Component */
  const SidebarGroup = ({ icon, label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between p-3 w-full rounded-xl transition-all text-slate-400 hover:bg-white/5 ${isOpen ? 'bg-white/5 text-white' : ''}`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
          </div>
          <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </button>
        {isOpen && children}
      </div>
    );
  };

  const SidebarItem = ({ icon, label, to, small }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => {
          navigate(to);
          setMobileMenuOpen(false); // Close menu on mobile click
        }}
        className={`flex items-center gap-3 ${small ? 'p-2 text-sm' : 'p-3'} w-full rounded-xl transition-all ${isActive ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-slate-400 hover:bg-white/5'
          }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">

      {/* [NEW] Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-40 border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/ztop-logo.png" alt="ZTop" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">ZTop</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300 hover:bg-white/10 rounded-lg">
          {mobileMenuOpen ? <LogOut className="rotate-180" size={24} /> : <div className="space-y-1.5">
            <span className="block w-6 h-0.5 bg-current"></span>
            <span className="block w-6 h-0.5 bg-current"></span>
            <span className="block w-6 h-0.5 bg-current"></span>
          </div>}
        </button>
      </div>

      {/* [NEW] Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass p-6 overflow-y-auto transition-transform duration-300 ease-in-out
        md:sticky md:top-0 md:h-screen md:translate-x-0 md:block
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <img src="/ztop-logo.png" alt="ZTop" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">ZTop</span>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400">
            <LogOut className="rotate-180" size={20} />
          </button>
        </div>

        <nav className="space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" to="/" />

          {/* Chatbot Group */}
          <SidebarGroup icon={<MessageSquare size={20} />} label="Chatbot">
            <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-3">
              <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard Bot" to="/" small />
              <SidebarItem icon={<Settings size={18} />} label="Configurar" to="/setup" small />
              <SidebarItem icon={<Smartphone size={18} />} label="WhatsApp" to="/instances" small />
              <SidebarItem icon={<FileText size={18} />} label="Teste Auto" to="/autotest" small />
              <SidebarItem icon={<CreditCard size={18} />} label="Renovar Bot" to="/subscription" small />
            </div>
          </SidebarGroup>

          <SidebarItem icon={<Server size={20} />} label="Integrações" to="/integrations" />

          <SidebarGroup icon={<DollarSign size={20} />} label="Pagamentos">
            <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-3">
              <SidebarItem icon={<Settings size={18} />} label="Configuração" to="/payments" small />
              <SidebarItem icon={<BarChart3 size={18} />} label="Logs Financeiros" to="/financial/logs" small />
              <SidebarItem icon={<CreditCard size={18} />} label="Métodos Manuais" to="/financial/methods" small />
            </div>
          </SidebarGroup>

          <SidebarGroup icon={<MessageSquare size={20} />} label="Marketing">
            <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-3">
              <SidebarItem icon={<PenTool size={18} />} label="Templates" to="/marketing/templates" small />
              <SidebarItem icon={<Smartphone size={18} />} label="Disparador" to="#" small />
            </div>
          </SidebarGroup>

          <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
            {user?.role === 'ADMIN' && (
              <SidebarItem icon={<Shield size={20} />} label="Admin" to="/admin" />
            )}
            <button onClick={logout} className="flex items-center gap-3 p-3 w-full text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 min-h-screen bg-slate-900/50 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

import Checkout from './pages/public/Checkout'; // [NEW]

const App = () => {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pay/:id" element={<Checkout />} /> {/* [NEW] Public */}
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/setup" element={<BotDashboard />} /> {/* [UPDATED] */}
                <Route path="/instances" element={<Instances />} />
                <Route path="/autotest" element={<AutoTest />} /> {/* [NEW] Route */}
                <Route path="/subscription" element={<Subscription />} /> {/* [NEW] Subscription Route */}
                <Route path="/integrations" element={<Integrations />} /> {/* [NEW] Integrations Route */}
                <Route path="/payments" element={<PaymentSettings />} /> {/* [NEW] Payment Dashboard */}
                <Route path="/payments/ciabra" element={<CiabraConfig />} /> {/* [NEW] Ciabra Config */}
                <Route path="/financial/logs" element={<PaymentLogs />} /> {/* [NEW] Logs */}
                <Route path="/financial/methods" element={<ManualMethods />} /> {/* [NEW] Manual Methods */}
                <Route path="/marketing/templates" element={<MessageTemplates />} /> {/* [NEW] Templates */}
                <Route path="/customers" element={<ClientsList />} />
                <Route path="/customers/new" element={<ClientForm />} /> {/* [NEW] */}
                <Route path="/customers/edit/:id" element={<ClientForm />} /> {/* [NEW] */}
                <Route path="/admin" element={<AdminUsers />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
};

export default App;
