import React, { useState, useEffect } from 'react';
import {
    Users, DollarSign, AlertCircle, TrendingUp, Server,
    MoreVertical, Clock
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const { data } = await api.get('/metrics');
            setData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Carregando Dashboard...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Erro ao carregar dados.</div>;

    const { kpi, charts, lists } = data;
    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold gradient-text">Visão Geral</h1>
                <p className="text-slate-400">Bem-vindo de volta ao seu painel de controle.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    icon={<DollarSign size={24} className="text-green-400" />}
                    label="Faturamento (Mês)"
                    value={`R$ ${kpi.revenue.month.toFixed(2)}`}
                    sub={`Hoje: R$ ${kpi.revenue.today.toFixed(2)}`}
                    bg="bg-gradient-to-br from-green-500/10 to-transparent"
                />
                <KPICard
                    icon={<Users size={24} className="text-blue-400" />}
                    label="Clientes Ativos"
                    value={kpi.active}
                    sub={`${kpi.total} Total`}
                    bg="bg-gradient-to-br from-blue-500/10 to-transparent"
                />
                <KPICard
                    icon={<AlertCircle size={24} className="text-red-400" />}
                    label="Vencidos"
                    value={kpi.expired}
                    sub="Requer atenção"
                    bg="bg-gradient-to-br from-red-500/10 to-transparent"
                />
                <KPICard
                    icon={<TrendingUp size={24} className="text-purple-400" />}
                    label="Receita Total"
                    value={`R$ ${kpi.revenue.total.toFixed(0)}`}
                    sub="Histórico completo"
                    bg="bg-gradient-to-br from-purple-500/10 to-transparent"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart (Area) */}
                <div className="lg:col-span-2 glass p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary-400" /> Fluxo de Caixa (30 dias)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.sales}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart (Pie) */}
                <div className="glass p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Server size={18} className="text-purple-400" /> Por Servidor
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.servers}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {charts.servers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lists Section */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock size={18} className="text-orange-400" /> Próximos Vencimentos
                    </h3>
                    <button className="text-sm text-primary-400 hover:text-primary-300 font-medium">Ver Todos</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0f172a]/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Serviço</th>
                                <th className="p-4">Vencimento</th>
                                <th className="p-4 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {lists.expiring.length === 0 ? (
                                <tr><td colSpan="4" className="p-6 text-center text-slate-500">Nenhum vencimento próximo.</td></tr>
                            ) : lists.expiring.map(c => (
                                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{c.name}</td>
                                    <td className="p-4 text-slate-400 text-sm">{c.product?.name}</td>
                                    <td className="p-4 text-orange-400 font-bold text-sm">
                                        {new Date(c.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30">
                                            RENOVAR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ icon, label, value, sub, bg }) => (
    <div className={`glass p-6 rounded-3xl border border-white/5 ${bg}`}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-black/20 rounded-xl">{icon}</div>
            <button className="text-slate-500 hover:text-white"><MoreVertical size={18} /></button>
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-xs text-slate-500 font-medium">{sub}</p>
        </div>
    </div>
);

export default Dashboard;
