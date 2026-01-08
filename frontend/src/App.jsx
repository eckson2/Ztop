import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Shield, LogOut, Zap, Smartphone, FileText, MessageSquare, CreditCard } from 'lucide-react';

import { Login, Register } from './pages/Auth';
import SetupWizard from './pages/SetupWizard';
import Instances from './pages/Instances';
import AdminUsers from './pages/AdminUsers';
import AutoTest from './pages/AutoTest';
import Subscription from './pages/Subscription';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import api from './api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ total: 0, in: 0, out: 0 });
  const [autoTestMetrics, setAutoTestMetrics] = useState({ generated: 0, failed: 0 });
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, provider: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/metrics');
        setMetrics(data);
      } catch (e) {
        console.error('Erro ao carregar métricas:', e);
      }
    };

    const fetchAutoTestMetrics = async () => {
      try {
        const { data } = await api.get('/autotest');
        setAutoTestMetrics({ generated: data.generatedCount || 0, failed: data.failedCount || 0 });
      } catch (e) {
        console.error('Erro ao carregar métricas AutoTest:', e);
      }
    };

    const fetchWhatsAppStatus = async () => {
      try {
        const { data } = await api.get('/whatsapp');
        const instance = data.instance || data;
        setWhatsappStatus({
          connected: instance?.status === 'connected',
          provider: instance?.provider || 'Nenhuma'
        });
      } catch (e) {
        console.error('Erro ao carregar status WhatsApp:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    fetchAutoTestMetrics();
    fetchWhatsAppStatus();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchAutoTestMetrics();
      fetchWhatsAppStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold gradient-text mb-2">Seu Dashboard</h1>
      <p className="text-slate-400 mb-6">Visão geral do sistema</p>

      {/* WhatsApp Status */}
      <div className="mb-6 glass p-6 rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${whatsappStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div>
              <p className="text-sm font-medium text-slate-400">Status WhatsApp</p>
              <p className={`text-lg font-bold ${whatsappStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                {whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
          {whatsappStatus.provider && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Provedor</p>
              <p className="text-sm font-medium text-white">{whatsappStatus.provider === 'evolution' ? 'Api Premium' : whatsappStatus.provider === 'uazapi' ? 'Api Secundaria' : whatsappStatus.provider}</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard label="Testes Gerados" value={autoTestMetrics.generated} color="text-blue-400" />
          <StatsCard label="Falhas" value={autoTestMetrics.failed} color="text-red-400" />
          <StatsCard label="Mensagens Recebidas" value={metrics.in || 0} />
          <StatsCard label="Mensagens Enviadas" value={metrics.out || 0} />
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ label, value, color = "text-white" }) => (
  <div className="glass p-6 rounded-3xl">
    <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
    <div className="flex items-end gap-3">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
    </div>
  </div>
);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // [NEW] State for mobile menu

  const SidebarItem = ({ icon, label, to }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => {
          navigate(to);
          setMobileMenuOpen(false); // Close menu on mobile click
        }}
        className={`flex items-center gap-3 p-3 w-full rounded-xl transition-all ${isActive ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-slate-400 hover:bg-white/5'
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
          <SidebarItem icon={<Settings size={20} />} label="Configurar BOT" to="/setup" />
          <SidebarItem icon={<Smartphone size={20} />} label="WhatsApp" to="/instances" />

          {/* [NEW] AutoTest Sidebar Item */}
          <SidebarItem icon={<FileText size={20} />} label="Teste Automático" to="/autotest" />

          {/* [NEW] Subscription Sidebar Item */}
          <SidebarItem icon={<CreditCard size={20} />} label="Renovar Assinatura" to="/subscription" />

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

const App = () => {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/setup" element={<SetupWizard />} />
                <Route path="/instances" element={<Instances />} />
                <Route path="/autotest" element={<AutoTest />} /> {/* [NEW] Route */}
                <Route path="/subscription" element={<Subscription />} /> {/* [NEW] Subscription Route */}
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
