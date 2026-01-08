import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Shield, LogOut, Zap, Smartphone, FileText, MessageSquare } from 'lucide-react';

import { Login, Register } from './pages/Auth';
import SetupWizard from './pages/SetupWizard';
import Instances from './pages/Instances';
import AdminUsers from './pages/AdminUsers';
import AutoTest from './pages/AutoTest';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import api from './api';
import LiveChat from './pages/LiveChat'; // [NEW] Import

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ total: 0, in: 0, out: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/metrics');
        setMetrics(data);
      } catch (e) {
        console.error('Erro ao carregar métricas:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold gradient-text mb-2">Seu Dashboard</h1>
      <p className="text-slate-400 mb-10">Status de uso mensal (Plano Free)</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-32 glass rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard label="Mensagens Recebidas" value={metrics.in || 0} />
          <StatsCard label="Mensagens Enviadas" value={metrics.out || 0} />
          <StatsCard label="Limite Mensal" value="Ilimitado" color="text-emerald-400" />
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
          <div className="p-1.5 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">BotSaaS</span>
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
            <div className="p-2 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/20">
              <Zap size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">BotSaaS</span>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400">
            <LogOut className="rotate-180" size={20} />
          </button>
        </div>

        <nav className="space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" to="/" />
          <SidebarItem icon={<MessageSquare size={20} />} label="Atendimento" to="/chat" />
          <SidebarItem icon={<Settings size={20} />} label="Configurar BOT" to="/setup" />
          <SidebarItem icon={<Smartphone size={20} />} label="WhatsApp" to="/instances" />

          {/* [NEW] AutoTest Sidebar Item */}
          <SidebarItem icon={<FileText size={20} />} label="Teste Automático" to="/autotest" />

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
                <Route path="/chat" element={<LiveChat />} />
                <Route path="/setup" element={<SetupWizard />} />
                <Route path="/instances" element={<Instances />} />
                <Route path="/autotest" element={<AutoTest />} /> {/* [NEW] Route */}
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
