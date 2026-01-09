import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Filter, MoreVertical, Edit, RefreshCw,
    History, Bell, Link as LinkIcon, Archive, Trash2
} from 'lucide-react';
import api from '../../api';
import RenewalModal from '../../components/RenewalModal'; // [NEW]

const ClientsList = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [renewingClient, setRenewingClient] = useState(null); // [NEW]

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data } = await api.get('/customers');
            setClients(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja apagar este cliente?')) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchClients();
        } catch (e) { alert('Erro ao apagar.'); }
    };

    // Placeholder Actions (TODO: Implement these modals)
    // const handleRenew = (client) => { alert(`Abrir Modal de Renovação para ${client.name}`); };
    const handleRenew = (client) => { setRenewingClient(client); };
    const handleNotify = (client) => { alert(`Abrir Modal de Notificação para ${client.name}`); };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Meus Clientes</h1>
                    <p className="text-slate-400">Gerencie sua base de clientes.</p>
                </div>
                <button onClick={() => navigate('/customers/new')} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Novo Cliente
                </button>
            </div>

            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl w-full md:w-96 border border-white/5">
                        <Search size={18} className="text-slate-500" />
                        <input type="text" placeholder="Buscar por nome, whatsapp, CPF..." className="bg-transparent border-none focus:outline-none text-sm text-white w-full" />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${showFilters ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Filter size={18} /> Filtros
                    </button>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                    <div className="p-4 bg-white/5 border-b border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Status</label>
                            <select className="input-field py-1"><option>Todos</option><option>Ativo</option><option>Vencido</option></select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Painel</label>
                            <select className="input-field py-1"><option>Todos</option></select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Vencimento</label>
                            <select className="input-field py-1"><option>Qualquer Data</option><option>Hoje</option><option>Esta Semana</option></select>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-[#0f172a]/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Serviço/Plano</th>
                                <th className="p-4">Vencimento</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-500">Carregando...</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-500">Nenhum cliente encontrado.</td></tr>
                            ) : clients.map(client => (
                                <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-white text-lg">{client.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">{client.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-300 font-medium">{client.product?.name || '-'}</div>
                                        <div className="text-xs text-slate-500">{client.plan?.name || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-white font-mono bg-black/30 px-2 py-1 rounded inline-block">
                                            {client.dueDate ? new Date(client.dueDate).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${new Date(client.dueDate) < new Date() ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-green-500/20 text-green-400 border border-green-500/20'
                                            }`}>
                                            {new Date(client.dueDate) < new Date() ? 'Vencido' : 'Ativo'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ActionBtn icon={<Edit size={16} />} tooltip="Editar" onClick={() => navigate(`/customers/edit/${client.id}`)} />
                                            <ActionBtn icon={<RefreshCw size={16} />} tooltip="Renovar" onClick={() => handleRenew(client)} color="text-green-400 hover:bg-green-500/10" />
                                            <ActionBtn icon={<History size={16} />} tooltip="Histórico" />
                                            <ActionBtn icon={<Bell size={16} />} tooltip="Notificar" onClick={() => handleNotify(client)} color="text-yellow-400 hover:bg-yellow-500/10" />
                                            <ActionBtn icon={<LinkIcon size={16} />} tooltip="Link Pagamento" />

                                            <div className="w-px h-4 bg-white/10 mx-1"></div>

                                            <ActionBtn icon={<Archive size={16} />} tooltip="Arquivar" color="text-slate-500 hover:bg-slate-500/10" />
                                            <ActionBtn icon={<Trash2 size={16} />} tooltip="Apagar" onClick={() => handleDelete(client.id)} color="text-red-400 hover:bg-red-500/10" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer (Placeholder) */}
                <div className="p-4 border-t border-white/10 text-xs text-slate-500 flex justify-between items-center">
                    <span>Total: {clients.length} clientes</span>
                </div>
            </div>

            {renewingClient && (
                <RenewalModal
                    client={renewingClient}
                    onClose={() => setRenewingClient(null)}
                    onSuccess={() => {
                        setRenewingClient(null);
                        fetchClients();
                    }}
                />
            )}
        </div>
    );
};

const ActionBtn = ({ icon, tooltip, onClick, color = "text-slate-300 hover:bg-white/10" }) => (
    <button
        onClick={onClick}
        title={tooltip}
        className={`p-2 rounded-lg transition-colors ${color}`}
    >
        {icon}
    </button>
);

export default ClientsList;
