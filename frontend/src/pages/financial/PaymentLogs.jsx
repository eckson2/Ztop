import React, { useState, useEffect } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import api from '../../api';

const PaymentLogs = () => {
    const [logs, setLogs] = useState([]);
    const [metrics, setMetrics] = useState({ totalApproved: 0, thisMonth: 0, pendingCount: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [logsRes, metricsRes] = await Promise.all([
                api.get('/financial/logs'),
                api.get('/financial/dashboard')
            ]);
            setLogs(logsRes.data);
            setMetrics(metricsRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Logs de Pagamento</h1>
                    <p className="text-slate-400">Histórico completo de transações.</p>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-green-500/10 to-transparent">
                    <h3 className="text-slate-400 text-sm font-bold uppercase mb-1">Total Aprovado</h3>
                    <p className="text-3xl font-bold text-green-400">R$ {metrics.totalApproved.toFixed(2)}</p>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5">
                    <h3 className="text-slate-400 text-sm font-bold uppercase mb-1">Este Mês</h3>
                    <p className="text-3xl font-bold text-blue-400">R$ {metrics.thisMonth.toFixed(2)}</p>
                </div>
                <div className="glass p-6 rounded-3xl border border-white/5">
                    <h3 className="text-slate-400 text-sm font-bold uppercase mb-1">Pendentes</h3>
                    <p className="text-3xl font-bold text-orange-400">{metrics.pendingCount}</p>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">

                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl w-full md:w-auto border border-white/5">
                        <Search size={18} className="text-slate-500" />
                        <input type="text" placeholder="Buscar por cliente, ID..." className="bg-transparent border-none focus:outline-none text-sm text-white w-full md:w-64" />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        <button className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-bold whitespace-nowrap">Todos</button>
                        <button className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-sm font-bold whitespace-nowrap">Mercado Pago</button>
                        <button className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-sm font-bold whitespace-nowrap">Ciabra</button>
                        <button className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 text-sm font-bold whitespace-nowrap">Manual</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0f172a]/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Método</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{log.customer?.name || 'Desconhecido'} <div className="text-xs text-slate-500">{log.customer?.phone}</div></td>
                                    <td className="p-4">
                                        {log.gateway ? (
                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase">{log.gateway}</span>
                                        ) : (
                                            <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded text-xs font-bold uppercase">Manual</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                            {log.status === 'approved' ? 'Aprovado' : log.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white font-bold">R$ {log.amount.toFixed(2)}</td>
                                    <td className="p-4 text-slate-400 text-sm">{new Date(log.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentLogs;
